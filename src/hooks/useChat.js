/*
 * Conversation lifecycle: signed-in active threads sync with Firestore.
 * Reopened archives continue locally and persist to the same account's device archive.
 */
import { useState, useEffect, useRef } from 'react';
import FirebaseService, { isFirebaseEnabled } from '../services/firebase';
import OpenAIService from '../services/openai-api';
import { DOCTORS_PORTAL_URL } from '../config/constants';

const HUMAN_INTENT_REGEX = /(talk to (a )?(human|person|therapist|doctor)|human help|human support|real person|book( a)? doctor|doctor appointment|need (a )?therapist|speak to (a )?therapist|can i talk to a human)/i;

const loadConversations = (key) => {
  try {
    const stored = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(stored) ? stored.filter(c => c && typeof c.id === 'string' && Array.isArray(c.messages)) : [];
  } catch { return []; }
};

export const useChat = (user, userId, isGuest, preferences) => {
  const storageKey = `aura-conversations-${userId || (isGuest ? 'guest' : 'anon')}`;
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isBotLoading, setIsBotLoading] = useState(false);
  const [conversations, setConversations] = useState(() => loadConversations(storageKey));
  const [loadedStorageKey, setLoadedStorageKey] = useState(storageKey);
  const [activeArchiveId, setActiveArchiveId] = useState(null);
  const [conversationReady, setConversationReady] = useState(false);
  const [chatError, setChatError] = useState(null);
  const busyRef = useRef(false);
  const replyController = useRef(null);
  const pendingMessages = useRef(new Map());
  const [canStopReply, setCanStopReply] = useState(false);
  const sessionRef = useRef({ key: storageKey, generation: 0 });
  if (sessionRef.current.key !== storageKey) {
    sessionRef.current = { key: storageKey, generation: sessionRef.current.generation + 1 };
    busyRef.current = false;
  }
  const useLocalMessages = isGuest || !isFirebaseEnabled || !userId || !!activeArchiveId;

  useEffect(() => {
    replyController.current?.abort();
    pendingMessages.current.clear();
    setCanStopReply(false);
    setConversations(loadConversations(storageKey));
    setLoadedStorageKey(storageKey);
    setActiveArchiveId(null);
    setMessages([]);
    setCurrentMessage('');
    setChatError(null);
    setConversationReady(false);
    setIsBotLoading(false);
  }, [storageKey]);

  useEffect(() => {
    // Skip the identity-change render: its archive state still belongs to the previous account.
    if (loadedStorageKey !== storageKey) return;
    try { localStorage.setItem(storageKey, JSON.stringify(conversations)); }
    catch { setChatError('Conversation archives could not be saved on this device.'); }
  }, [conversations, storageKey, loadedStorageKey]);

  useEffect(() => {
    if (useLocalMessages || loadedStorageKey !== storageKey) return;
    let alive = true;
    const unsubscribe = FirebaseService.firestore.subscribeToMessages(userId, snapshot => {
      if (!alive) return;
      const loaded = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      for (const message of loaded) pendingMessages.current.delete(message.id);
      setMessages([...loaded, ...pendingMessages.current.values()]);
      setConversationReady(loaded.length > 0);
    }, () => { if (alive) setChatError('Could not sync messages. Check your connection and Firestore permissions.'); });
    return () => { alive = false; unsubscribe?.(); };
  }, [userId, useLocalMessages, loadedStorageKey, storageKey]);

  useEffect(() => {
    // An archive is a separate local thread: Firestore cannot replace it after a new reply.
    if (!activeArchiveId || loadedStorageKey !== storageKey || isBotLoading) return;
    setConversations(prev => prev.map(c => c.id === activeArchiveId ? { ...c, messages, updatedAt: Date.now() } : c));
  }, [activeArchiveId, messages, loadedStorageKey, storageKey, isBotLoading]);

  // Share one synchronous operation lock with tools and PDF summaries.
  const beginOperation = () => {
    if (busyRef.current || isBotLoading) return null;
    busyRef.current = true;
    setIsBotLoading(true);
    return sessionRef.current;
  };
  const isCurrentOperation = token => token === sessionRef.current;
  const finishOperation = token => {
    if (!isCurrentOperation(token)) return;
    busyRef.current = false;
    setIsBotLoading(false);
  };

  useEffect(() => () => replyController.current?.abort(), []);
  const handleStopReply = () => replyController.current?.abort();

  const handleSendMessage = async (messageText) => {
    const text = messageText?.trim();
    if (!text || busyRef.current || isBotLoading) return;
    const operation = beginOperation();
    if (!operation) return;
    const controller = new AbortController();
    replyController.current = controller;
    setCanStopReply(true);
    setChatError(null);
    setCurrentMessage('');
    const userMessage = { id: crypto.randomUUID(), text, sender: 'user', createdAt: Date.now() };
    const botId = crypto.randomUUID();
    const history = [...messages, userMessage];
    let replyText = '';
    let generated = false;
    let refreshTimer;
    let userWrite = Promise.resolve(null);
    const publish = (message) => {
      if (!isCurrentOperation(operation)) return;
      if (!useLocalMessages) pendingMessages.current.set(message.id, message);
      setMessages(previous => previous.some(item => item.id === message.id)
        ? previous.map(item => item.id === message.id ? message : item)
        : [...previous, message]);
    };
    const persistReply = async (text) => {
      const botMessage = { id: botId, text, sender: 'bot', createdAt: Date.now(), streaming: false };
      publish(botMessage);
      const writeError = await userWrite;
      if (!isCurrentOperation(operation)) return;
      if (writeError) throw writeError;
      if (!useLocalMessages) await FirebaseService.firestore.addMessage(userId, { text, sender: 'bot', createdAt: FirebaseService.serverTimestamp() }, botId);
    };
    // Show the user's message immediately, including while Firestore is acknowledging it.
    publish(userMessage);
    try {
      // Database acknowledgement runs alongside generation; it cannot delay the first token.
      if (!useLocalMessages) userWrite = Promise.resolve().then(() => FirebaseService.firestore.addMessage(userId, { text, sender: 'user', createdAt: FirebaseService.serverTimestamp() }, userMessage.id)).then(() => null, error => error);
      if (!isCurrentOperation(operation) || controller.signal.aborted) return;
      const result = HUMAN_INTENT_REGEX.test(text)
        ? { choices: [{ message: { content: DOCTORS_PORTAL_URL
          ? `You can browse doctors and request an appointment here: ${DOCTORS_PORTAL_URL}. Choose a doctor and submit the booking form; no appointment has been booked through this chat.`
          : 'The doctor directory is currently unavailable. No appointment has been booked through this chat.' } }] }
        : await OpenAIService.sendChatMessage(history, preferences, {
          signal: controller.signal,
          onText: (text) => {
            if (!isCurrentOperation(operation) || controller.signal.aborted) return;
            const first = !replyText;
            replyText = text;
            // Batch frequent tokens into small updates, without introducing a typing delay.
            if (first) publish({ id: botId, text: replyText, sender: 'bot', createdAt: Date.now(), streaming: true });
            else if (!refreshTimer) refreshTimer = setTimeout(() => {
              refreshTimer = null;
              publish({ id: botId, text: replyText, sender: 'bot', createdAt: Date.now(), streaming: true });
            }, 32);
          },
        });
      clearTimeout(refreshTimer);
      if (!isCurrentOperation(operation)) return;
      if (controller.signal.aborted) { if (replyText) await persistReply(replyText); return; }
      replyText = result.choices?.[0]?.message?.content || replyText;
      if (!replyText.trim()) throw new Error('Empty reply');
      generated = true;
      await persistReply(replyText);
    } catch {
      clearTimeout(refreshTimer);
      if (isCurrentOperation(operation)) {
        let saveFailed = generated;
        if (replyText && !generated) {
          try { await persistReply(replyText); }
          catch { saveFailed = true; }
        }
        if (saveFailed) setChatError('The reply is visible but could not be saved. Check your connection.');
        else if (!controller.signal.aborted) {
          setChatError(replyText ? 'The response was interrupted. You can continue from here.' : 'Your message could not be completed. Check your connection and try again.');
          if (!replyText) setCurrentMessage(draft => draft || text);
        }
      }
    } finally {
      clearTimeout(refreshTimer);
      // Finish the in-flight user write before allowing a clear/new conversation to race it.
      if (isCurrentOperation(operation)) await userWrite;
      if (isCurrentOperation(operation)) { replyController.current = null; setCanStopReply(false); }
      finishOperation(operation);
    }
  };

  const handleClearHistory = async () => {
    if (busyRef.current || isBotLoading) return false;
    const operation = beginOperation();
    if (!operation) return false;
    try {
      if (!useLocalMessages) await FirebaseService.firestore.clearMessages(userId);
      if (!isCurrentOperation(operation)) return false;
      pendingMessages.current.clear();
      setMessages([]);
      setConversationReady(false);
      return true;
    } catch { if (isCurrentOperation(operation)) setChatError('Could not clear the conversation. Please try again.'); return false; }
    finally { finishOperation(operation); }
  };

  const archiveCurrentConversation = () => {
    if (isGuest || activeArchiveId || !messages.length) return true;
    const next = [{
      id: crypto.randomUUID(),
      title: messages.find(m => m.sender === 'user')?.text?.slice(0, 40) || `Session ${new Date().toLocaleString()}`,
      messages: messages.slice(), createdAt: Date.now(),
    }, ...conversations];
    // Do not clear server history until its device archive has actually been saved.
    try { localStorage.setItem(storageKey, JSON.stringify(next)); }
    catch { setChatError('Could not archive this conversation. Free device storage before starting another.'); return false; }
    setConversations(next);
    return true;
  };

  const handleStartNewConversation = async () => {
    if (busyRef.current || isBotLoading) return;
    setChatError(null);
    if (activeArchiveId) {
      // Preserve the continued archive and return to a fresh active server thread.
      const operation = beginOperation();
      if (!operation) return;
      try { if (!isGuest && isFirebaseEnabled && userId) await FirebaseService.firestore.clearMessages(userId); }
      catch { if (isCurrentOperation(operation)) setChatError('Could not start a new conversation. Please try again.'); return; }
      finally { finishOperation(operation); }
      if (!isCurrentOperation(operation)) return;
      setActiveArchiveId(null);
      setMessages([]);
    } else {
      if (!archiveCurrentConversation()) return;
      if (!await handleClearHistory()) return;
    }
    setCurrentMessage('');
    setConversationReady(false);
  };

  const handleOpenConversation = (id) => {
    if (busyRef.current || isBotLoading) return;
    const conversation = conversations.find(c => c.id === id);
    if (!conversation) return;
    if (!archiveCurrentConversation()) return;
    pendingMessages.current.clear();
    setActiveArchiveId(id);
    setMessages(conversation.messages);
    setCurrentMessage('');
    setConversationReady(true);
    setChatError(null);
  };
  const handleRenameConversation = (id) => {
    const conversation = conversations.find(c => c.id === id);
    if (!conversation) return;
    const title = window.prompt('Rename conversation', conversation.title)?.trim();
    if (title) setConversations(prev => prev.map(c => c.id === id ? { ...c, title } : c));
  };
  const handleDeleteConversation = (id) => {
    if (busyRef.current || isBotLoading) return;
    setConversations(prev => prev.filter(c => c.id !== id));
    if (id === activeArchiveId) { setActiveArchiveId(null); setMessages([]); setConversationReady(false); }
  };

  return { messages: loadedStorageKey === storageKey ? messages : [], setMessages, currentMessage, setCurrentMessage, isBotLoading, setIsBotLoading,
    conversations: loadedStorageKey === storageKey ? conversations : [], conversationReady, setConversationReady,
    chatError, canStopReply, handleStopReply, useLocalMessages, beginOperation, finishOperation, isCurrentOperation, activeArchiveId, handleSendMessage, handleClearHistory, archiveCurrentConversation,
    handleStartNewConversation, handleOpenConversation, handleRenameConversation, handleDeleteConversation };
};
