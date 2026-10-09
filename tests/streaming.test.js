import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { readSSE } from '../src/utils/sse.js';
import { fetchChatReply } from '../src/services/chat-stream.js';
import { openAIProxy } from '../server/openai-proxy.js';
import { hookHarness } from './hook-harness.js';

const encode = text => new TextEncoder().encode(text);
const frame = text => `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`;
const stream = chunks => new ReadableStream({ start(controller) { chunks.forEach(chunk => controller.enqueue(chunk)); controller.close(); } });

test('SSE preserves UTF-8 and CRLF even when every byte arrives separately', async () => {
  const bytes = encode('data: {"text":"বাংলা 🙂"}\r\n\r\ndata: [DONE]\r\n\r\n');
  const events = [];
  for await (const event of readSSE(stream(Array.from(bytes, byte => Uint8Array.of(byte))))) events.push(event);
  assert.deepEqual(events, ['{"text":"বাংলা 🙂"}', '[DONE]']);
});

test('client publishes partial text before completion and rejects truncated streams without retry', async () => {
  const originalFetch = globalThis.fetch;
  let controller;
  let calls = 0;
  const texts = [];
  try {
    globalThis.fetch = async (url, init) => {
      calls++;
      assert.equal(JSON.parse(init.body).stream, true);
      return new Response(new ReadableStream({ start(value) { controller = value; } }), { headers: { 'Content-Type': 'text/event-stream' } });
    };
    const reply = fetchChatReply('/mock', {}, { onText: text => texts.push(text) });
    await new Promise(resolve => setImmediate(resolve));
    controller.enqueue(encode(frame('Hello')));
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(texts, ['Hello']);
    controller.enqueue(encode(frame(' there') + 'data: [DONE]\n\n')); controller.close();
    assert.equal((await reply).choices[0].message.content, 'Hello there');
    globalThis.fetch = async () => { calls++; return new Response(stream([encode(frame('Partial'))]), { headers: { 'Content-Type': 'text/event-stream' } }); };
    await assert.rejects(fetchChatReply('/mock', {}), /interrupted/);
    assert.equal(calls, 2);
  } finally { globalThis.fetch = originalFetch; }
});

test('proxy sends sanitized deltas before the upstream finishes and hides stream errors', async () => {
  let upstream;
  const server = createServer(openAIProxy({ env: { OPENAI_API_KEY: 'private-secret', APP_ORIGIN: 'http://local' }, fetchImpl: async (url, init) => {
    const payload = JSON.parse(init.body);
    assert.equal(payload.stream, true); assert.equal(payload.max_tokens, 512);
    return new Response(new ReadableStream({ start(controller) { upstream = controller; } }), { headers: { 'Content-Type': 'text/event-stream' } });
  } }));
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/openai/chat/completions`, { method: 'POST', headers: { origin: 'http://local', 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'gpt-4o-mini', stream: true, messages: [{ role: 'user', content: 'Hello' }] }) });
    assert.equal(response.headers.get('x-accel-buffering'), 'no');
    const events = readSSE(response.body);
    upstream.enqueue(encode('data: '+JSON.stringify({ secret: 'private-secret', choices: [{ delta: { content: 'First words', private: 'private-secret' } }] })+'\n\n'));
    const first = await events.next();
    assert.deepEqual(JSON.parse(first.value), { choices: [{ delta: { content: 'First words' } }] });
    upstream.enqueue(encode('data: {"error":{"message":"private-secret"}}\n\n')); upstream.close();
    const failure = await events.next();
    assert.deepEqual(JSON.parse(failure.value), { error: 'AI response interrupted' });
    await events.return();
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});

test('Stop preserves the partial reply and releases sending without erasing a new draft', async () => {
  let deliver;
  const harness = hookHarness('src/hooks/useChat.js', 'useChat', {
    isFirebaseEnabled: false, FirebaseService: {},
    OpenAIService: { sendChatMessage: (history, preferences, options) => {
      deliver = options.onText;
      return new Promise((resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error('Aborted')), { once: true }));
    } },
  }, [{ isGuest: true }, 'guest', true, {}]);
  const pending = harness.render().handleSendMessage('Hello');
  deliver('First words');
  let chat = harness.render();
  assert.equal(chat.messages.at(-1).text, 'First words');
  assert.equal(chat.messages.at(-1).streaming, true);
  chat.setCurrentMessage('Next question'); chat.handleStopReply(); await pending;
  chat = harness.render();
  assert.equal(chat.messages.at(-1).text, 'First words');
  assert.equal(chat.messages.at(-1).streaming, false);
  assert.equal(chat.currentMessage, 'Next question');
  assert.equal(chat.chatError, null); assert.equal(chat.canStopReply, false); assert.equal(chat.isBotLoading, false);
});

test('signed-in subscriptions retain optimistic and streaming messages without duplicating saved replies', async () => {
  let subscription, deliver, finish;
  const writes = [];
  const harness = hookHarness('src/hooks/useChat.js', 'useChat', {
    isFirebaseEnabled: true,
    FirebaseService: { serverTimestamp: () => 123, firestore: {
      subscribeToMessages: (uid, callback) => { subscription = callback; return () => {}; },
      addMessage: async (uid, message, id) => { writes.push({ id, ...message }); },
    } },
    OpenAIService: { sendChatMessage: (history, preferences, options) => { deliver = options.onText; return new Promise(resolve => { finish = resolve; }); } },
  }, [{ uid: 'alice' }, 'alice', false, {}]);
  const pending = harness.render().handleSendMessage('Hello');
  assert.equal(harness.render().messages[0].text, 'Hello');
  await new Promise(resolve => setImmediate(resolve));
  deliver('Partial'); subscription({ docs: [] });
  assert.equal(harness.render().messages.at(-1).text, 'Partial');
  finish({ choices: [{ message: { content: 'Complete' } }] }); await pending;
  assert.equal(writes.length, 2);
  subscription({ docs: writes.map(message => ({ id: message.id, data: () => message })) });
  const chat = harness.render();
  assert.equal(chat.messages.length, 2); assert.equal(chat.messages.at(-1).text, 'Complete');
});

test('database acknowledgement does not block first-token delivery', async () => {
  let acknowledge, deliver, finish;
  const harness = hookHarness('src/hooks/useChat.js', 'useChat', {
    isFirebaseEnabled: true,
    FirebaseService: { serverTimestamp: () => 123, firestore: {
      subscribeToMessages: () => () => {},
      addMessage: (uid, message) => message.sender === 'user' ? new Promise(resolve => { acknowledge = resolve; }) : Promise.resolve(),
    } },
    OpenAIService: { sendChatMessage: (history, preferences, options) => { deliver = options.onText; return new Promise(resolve => { finish = resolve; }); } },
  }, [{ uid: 'alice' }, 'alice', false, {}]);
  const pending = harness.render().handleSendMessage('Hello');
  await new Promise(resolve => setImmediate(resolve));
  deliver('Already responding');
  assert.equal(harness.render().messages.at(-1).text, 'Already responding');
  acknowledge(); finish({ choices: [{ message: { content: 'Already responding' } }] }); await pending;
});

test('late stream chunks cannot enter a different account', async () => {
  let deliver, finish;
  const harness = hookHarness('src/hooks/useChat.js', 'useChat', {
    isFirebaseEnabled: false, FirebaseService: {},
    OpenAIService: { sendChatMessage: (history, preferences, options) => { deliver = options.onText; return new Promise(resolve => { finish = resolve; }); } },
  }, [{ uid: 'alice' }, 'alice', false, {}]);
  const pending = harness.render().handleSendMessage('Alice message');
  deliver('Alice reply');
  harness.render([{ uid: 'bob' }, 'bob', false, {}]);
  deliver('Late Alice reply');
  finish({ choices: [{ message: { content: 'Late Alice reply' } }] }); await pending;
  assert.equal(harness.render().messages.length, 0);
});

test('disconnecting the streaming client cancels the upstream request', async () => {
  let observeAbort;
  const aborted = new Promise(resolve => { observeAbort = resolve; });
  const server = createServer(openAIProxy({ env: { OPENAI_API_KEY: 'test-only', APP_ORIGIN: 'http://local' }, fetchImpl: async (url, init) =>
    new Response(new ReadableStream({ start(controller) {
      init.signal.addEventListener('abort', () => { observeAbort(); controller.error(new Error('Aborted')); }, { once: true });
    } }), { headers: { 'Content-Type': 'text/event-stream' } }),
  }));
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/openai/chat/completions`, { method: 'POST', headers: { origin: 'http://local', 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'gpt-4o-mini', stream: true, messages: [{ role: 'user', content: 'Hello' }] }) });
    await response.body.cancel();
    await Promise.race([aborted, new Promise((resolve, reject) => { const timeout = setTimeout(() => reject(new Error('Upstream was not cancelled')), 1500); timeout.unref(); })]);
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});

test('an interrupted reply retains usable text and clears its streaming state', async () => {
  const harness = hookHarness('src/hooks/useChat.js', 'useChat', {
    isFirebaseEnabled: false, FirebaseService: {},
    OpenAIService: { sendChatMessage: async (history, preferences, options) => { options.onText('Useful partial answer'); throw new Error('Disconnected'); } },
  }, [{ isGuest: true }, 'guest', true, {}]);
  await harness.render().handleSendMessage('Hello');
  const chat = harness.render();
  assert.equal(chat.messages.at(-1).text, 'Useful partial answer');
  assert.equal(chat.messages.at(-1).streaming, false);
  assert.match(chat.chatError, /interrupted/); assert.equal(chat.isBotLoading, false);
});

test('a database save failure keeps the reply visible and clearing removes optimistic messages', async () => {
  let subscription;
  const harness = hookHarness('src/hooks/useChat.js', 'useChat', {
    isFirebaseEnabled: true,
    FirebaseService: { serverTimestamp: () => 123, firestore: {
      subscribeToMessages: (uid, callback) => { subscription = callback; return () => {}; },
      addMessage: async () => { throw new Error('Storage failure'); }, clearMessages: async () => {},
    } },
    OpenAIService: { sendChatMessage: async (history, preferences, options) => { options.onText('Visible reply'); return { choices: [{ message: { content: 'Visible reply' } }] }; } },
  }, [{ uid: 'alice' }, 'alice', false, {}]);
  await harness.render().handleSendMessage('Hello');
  let chat = harness.render();
  assert.equal(chat.messages.at(-1).streaming, false);
  assert.match(chat.chatError, /could not be saved/); assert.equal(chat.isBotLoading, false);
  await chat.handleClearHistory(); subscription({ docs: [] });
  chat = harness.render(); assert.equal(chat.messages.length, 0);
});
