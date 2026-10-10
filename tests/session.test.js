import test from 'node:test';
import assert from 'node:assert/strict';
import { hookHarness } from './hook-harness.js';

const firestore = () => ({
  subscribeToMessages: () => () => {}, subscribeToPreferences: () => () => {},
  clearMessages: async () => {}, addMessage: async () => {},
});

test('failed login stays unauthenticated; successful login and reset use real adapters', async () => {
  let fail = true;
  let resetEmail;
  const user = { uid: 'account', displayName: 'User' };
  const harness = hookHarness('src/hooks/useAuth.js', 'useAuth', {
    auth: {}, isFirebaseEnabled: true, onAuthStateChanged: () => () => {},
    FirebaseService: { auth: {
      signIn: async () => { if (fail) throw new Error('Invalid credentials'); return { user }; },
      signOut: async () => { if (fail) throw new Error('Offline'); },
      resetPassword: async email => { resetEmail = email; },
    } },
  });
  let session = harness.render();
  assert.equal(await session.handleLogin('user@example.com', 'wrong'), false);
  session = harness.render();
  assert.equal(session.user, null);
  assert.equal(session.view, 'welcome');
  assert.equal(session.error, 'Invalid credentials');
  fail = false;
  assert.equal(await session.handleLogin('user@example.com', 'correct'), true);
  session = harness.render();
  assert.equal(session.userId, 'account');
  assert.equal(session.view, 'chat');
  assert.equal(await session.handleResetPassword(' user@example.com '), true);
  assert.equal(resetEmail, 'user@example.com');
  fail = true;
  assert.equal(await session.handleLogout(), false);
  assert.equal(harness.render().userId, 'account');
  fail = false;
  assert.equal(await session.handleLogout(), true);
  assert.equal(harness.render().user, null);
});

test('archive continuation retains history, persists replies, and isolates account storage', async () => {
  let subscription;
  let unsubscribed = false;
  let writes = 0;
  let receivedHistory;
  const harness = hookHarness('src/hooks/useChat.js', 'useChat', {
    isFirebaseEnabled: true,
    FirebaseService: { firestore: { ...firestore(),
      subscribeToMessages: (uid, callback) => { subscription = callback; return () => { unsubscribed = true; }; },
      addMessage: async () => { writes++; },
    } },
    OpenAIService: { sendChatMessage: async history => { receivedHistory = history; return { choices: [{ message: { content: 'New reply' } }] }; } },
  }, [{ uid: 'alice' }, 'alice', false, {}]);
  harness.storage.set('aura-conversations-alice', JSON.stringify([{ id: 'archive', title: 'Old', messages: [{ id: 'old', text: 'Earlier question', sender: 'user' }] }]));
  harness.storage.set('aura-conversations-bob', JSON.stringify([{ id: 'bob-thread', title: 'Bob', messages: [] }]));
  let chat = harness.render();
  subscription({ docs: [{ id: 'live', data: () => ({ text: 'Live question', sender: 'user' }) }] });
  chat = harness.render();
  chat.handleOpenConversation('archive');
  chat = harness.render();
  assert.equal(unsubscribed, true);
  await chat.handleSendMessage('Continue this');
  chat = harness.render();
  assert.deepEqual(Array.from(receivedHistory, m => m.text), ['Earlier question', 'Continue this']);
  assert.deepEqual(Array.from(chat.messages, m => m.text), ['Earlier question', 'Continue this', 'New reply']);
  assert.equal(writes, 0);
  const saved = JSON.parse(harness.storage.get('aura-conversations-alice'));
  assert.equal(saved.find(c => c.id === 'archive').messages.length, 3);
  assert.ok(saved.some(c => c.messages.some(m => m.text === 'Live question')));
  chat = harness.render([{ uid: 'bob' }, 'bob', false, {}]);
  assert.equal(chat.conversations[0].id, 'bob-thread');
  assert.equal(chat.messages.length, 0);
  assert.equal(JSON.parse(harness.storage.get('aura-conversations-bob'))[0].id, 'bob-thread');
});

test('booking provides a portal link without confirmation or unnecessary contact collection', async () => {
  let modelCalls = 0;
  const harness = hookHarness('src/hooks/useChat.js', 'useChat', {
    DOCTORS_PORTAL_URL: 'https://doctors.example.com/index.php',
    isFirebaseEnabled: false, FirebaseService: { firestore: firestore() },
    OpenAIService: { sendChatMessage: async () => { modelCalls++; } },
  }, [{ isGuest: true }, 'guest', true, {}]);
  await harness.render().handleSendMessage('Can I talk to a human?');
  const reply = harness.render().messages.at(-1).text;
  assert.match(reply, /https:\/\/doctors\.example\.com\/index.php/);
  assert.match(reply, /no appointment has been booked/);
  assert.doesNotMatch(reply, /Booking confirmed|share your contact/);
  assert.equal(modelCalls, 0);
});

test('an unconfigured external doctor directory provides no broken local PHP link', async () => {
  const harness = hookHarness('src/hooks/useChat.js', 'useChat', {
    isFirebaseEnabled: false, FirebaseService: {},
    OpenAIService: { sendChatMessage: async () => { throw new Error('Unexpected model call'); } },
  }, [{ isGuest: true }, 'guest', true, {}]);
  await harness.render().handleSendMessage('Can I talk to a human?');
  const reply = harness.render().messages.at(-1).text;
  assert.match(reply, /doctor directory is currently unavailable/);
  assert.doesNotMatch(reply, /\.php|Booking confirmed/);
});

test('a failed send preserves a new draft written while the reply was pending', async () => {
  let rejectReply;
  const harness = hookHarness('src/hooks/useChat.js', 'useChat', {
    isFirebaseEnabled: false, FirebaseService: { firestore: firestore() },
    OpenAIService: { sendChatMessage: () => new Promise((resolve, reject) => { rejectReply = reject; }) },
  }, [{ isGuest: true }, 'guest', true, {}]);
  const pendingReply = harness.render().handleSendMessage('First message');
  harness.render().setCurrentMessage('My next thought');
  rejectReply(new Error('Offline'));
  await pendingReply;
  const chat = harness.render();
  assert.equal(chat.currentMessage, 'My next thought');
  assert.equal(chat.isBotLoading, false);
  assert.ok(chat.chatError);
});

test('failed send releases loading state and allows retry', async () => {
  let fail = true;
  const harness = hookHarness('src/hooks/useChat.js', 'useChat', {
    isFirebaseEnabled: false, FirebaseService: { firestore: firestore() },
    OpenAIService: { sendChatMessage: async () => { if (fail) throw new Error('Offline'); return { choices: [{ message: { content: 'Recovered' } }] }; } },
  }, [{ isGuest: true }, 'guest', true, {}]);
  await harness.render().handleSendMessage('Hello');
  let chat = harness.render();
  assert.equal(chat.isBotLoading, false);
  assert.ok(chat.chatError);
  fail = false;
  await chat.handleSendMessage('Retry');
  chat = harness.render();
  assert.equal(chat.messages.at(-1).text, 'Recovered');
  assert.equal(chat.chatError, null);
});

test('preference persistence errors reach the UI and do not apply unsaved edits', async () => {
  const harness = hookHarness('src/hooks/useAura.js', 'useAura', {
    isFirebaseEnabled: true, jsPDF: function () {}, parseImageFromMessage: () => ({}),
    useAuth: () => ({ user: { uid: 'alice' }, userId: 'alice', isGuest: false, isAuthReady: true }),
    useChat: () => ({ messages: [], setIsBotLoading: () => {}, isBotLoading: false }),
    OpenAIService: {},
    FirebaseService: { firestore: { ...firestore(), savePreferences: async () => { throw new Error('Permission denied'); } } },
  });
  const aura = harness.render();
  await assert.rejects(aura.handleSavePreferences({ tone: 'unsaved' }), /Permission denied/);
  assert.equal(harness.render().preferences.tone, 'empathetic');
});

test('a late reply cannot enter a different account or an abandoned session of the same account', async () => {
  let resolve;
  const harness = hookHarness('src/hooks/useChat.js', 'useChat', {
    isFirebaseEnabled: false, FirebaseService: { firestore: firestore() },
    OpenAIService: { sendChatMessage: () => new Promise(done => { resolve = done; }) },
  }, [{ uid: 'alice' }, 'alice', false, {}]);
  const pending = harness.render().handleSendMessage('Old session');
  harness.render([{ uid: 'bob' }, 'bob', false, {}]);
  harness.render([{ uid: 'alice' }, 'alice', false, {}]);
  resolve({ choices: [{ message: { content: 'Stale reply' } }] });
  await pending;
  assert.equal(harness.render().messages.length, 0);
});

test('late preference saves and subscriptions cannot alter a subsequent account session', async () => {
  let uid = 'alice';
  let finishSave;
  const subscriptions = [];
  const harness = hookHarness('src/hooks/useAura.js', 'useAura', {
    isFirebaseEnabled: true, jsPDF: function () {}, parseImageFromMessage: () => ({}),
    useAuth: () => ({ user: { uid }, userId: uid, isGuest: false, isAuthReady: true }),
    useChat: () => ({ messages: [] }), OpenAIService: {},
    FirebaseService: { firestore: { ...firestore(),
      subscribeToPreferences: (id, callback) => { subscriptions.push(callback); return () => {}; },
      savePreferences: () => new Promise(resolve => { finishSave = resolve; }),
    } },
  });
  const save = harness.render().handleSavePreferences({ tone: 'old account' });
  uid = 'bob'; harness.render();
  uid = 'alice'; harness.render();
  subscriptions[0]({ exists: () => true, data: () => ({ tone: 'stale subscription' }) });
  finishSave(); await save;
  assert.equal(harness.render().preferences.tone, 'empathetic');
});

test('archive failure preserves the server conversation instead of clearing it', async () => {
  let subscription;
  let clears = 0;
  const harness = hookHarness('src/hooks/useChat.js', 'useChat', {
    isFirebaseEnabled: true,
    FirebaseService: { firestore: { ...firestore(), subscribeToMessages: (uid, callback) => { subscription = callback; return () => {}; }, clearMessages: async () => { clears++; } } },
    OpenAIService: {},
  }, [{ uid: 'alice' }, 'alice', false, {}]);
  harness.render();
  subscription({ docs: [{ id: 'live', data: () => ({ text: 'Keep me', sender: 'user' }) }] });
  const chat = harness.render();
  harness.storage.set = () => { throw new Error('Storage full'); };
  await chat.handleStartNewConversation();
  assert.equal(clears, 0);
  assert.equal(harness.render().messages[0].text, 'Keep me');
});
