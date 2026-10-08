import { useState, useEffect } from "react";
import FirebaseService, { isFirebaseEnabled } from "../services/firebase";
import OpenAIService from "../services/openai-api";

const doctorsPortalUrl =
  import.meta.env.VITE_DOCTORS_PORTAL_URL || "/doctors_portal/index.php";

const HUMAN_INTENT_REGEX =
  /(talk to (a )?(human|person|therapist|doctor)|human help|human support|real person|book( a)? doctor|doctor appointment|need (a )?therapist|speak to (a )?therapist|can i talk to a human)/i;
const CANCEL_REGEX = /(cancel|stop|never mind|nevermind|no thanks|not now)/i;
const CONFIRM_REGEX = /(confirm|yes|yeah|yep|sure|ok|okay|do it|go ahead|book)/i;

const extractContact = (text) => {
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if (email) return email[0];
  const phone = text.match(/\+?\d[\d\s().-]{7,}/);
  if (phone) return phone[0].trim();
  return "";
};

const extractSlot = (text) => {
  const isoDate = text.match(/\b\d{4}-\d{1,2}-\d{1,2}(?:\s+\d{1,2}:\d{2}\s*(am|pm)?)?/i);
  if (isoDate) return isoDate[0];
  const mdDate = text.match(/\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?(?:\s+\d{1,2}:\d{2}\s*(am|pm)?)?/i);
  if (mdDate) return mdDate[0];
  const dayWord = text.match(
    /\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next (week|monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/i
  );
  const time = text.match(/\b\d{1,2}(:\d{2})?\s*(am|pm)?\b/i);
  if (dayWord && time) return `${dayWord[0]} ${time[0]}`.trim();
  if (dayWord) return dayWord[0];
  return "";
};

export const useChat = (user, userId, isGuest, preferences) => {
  const buildStorageKey = (uid, guest) => `aura-conversations-${uid || (guest ? "guest" : "anon")}`;
  const loadConversations = (key) => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const storageKey = buildStorageKey(userId, isGuest);

  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isBotLoading, setIsBotLoading] = useState(false);
  const [conversations, setConversations] = useState(() => loadConversations(storageKey));
  const [conversationReady, setConversationReady] = useState(false);
  const [appointmentState, setAppointmentState] = useState({
    stage: "idle",
    contact: "",
    slot: "",
  });

  useEffect(() => {
    setConversations(loadConversations(storageKey));
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(conversations));
    } catch {
      /* noop */
    }
  }, [conversations, storageKey]);

  useEffect(() => {
    if (!userId || isGuest || !isFirebaseEnabled) {
      setMessages([]);
      setConversationReady(false);
      return;
    }

    const unsubMsgs = FirebaseService.firestore.subscribeToMessages(userId, (snapshot) => {
      const loaded = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMessages(loaded);
      setConversationReady(loaded.length > 0);
    });

    return () => unsubMsgs?.();
  }, [userId, isGuest]);

  const handleAppointmentFlow = async (text, { useLocal }) => {
    const lower = text.toLowerCase();
    const contactFromMsg = extractContact(text);
    const slotFromMsg = extractSlot(text);

    const sendBot = async (botText) => {
      const botMessage = {
        text: botText,
        sender: "bot",
        createdAt: useLocal ? Date.now() : FirebaseService.serverTimestamp(),
      };
      if (useLocal) {
        setMessages((m) => [...m, { id: `b-${Date.now()}`, ...botMessage }]);
      } else {
        await FirebaseService.firestore.addMessage(userId, botMessage);
      }
      setIsBotLoading(false);
    };

    const reset = () => setAppointmentState({ stage: "idle", contact: "", slot: "" });

    if (CANCEL_REGEX.test(lower) && appointmentState.stage !== "idle") {
      reset();
      await sendBot("Okay, I won't schedule anything. If you want help booking later, just let me know.");
      return true;
    }

    if (appointmentState.stage === "idle" && !HUMAN_INTENT_REGEX.test(text)) {
      return false;
    }

    const nextContact = appointmentState.contact || contactFromMsg;
    const nextSlot = appointmentState.slot || slotFromMsg;

    if (appointmentState.stage === "idle" && HUMAN_INTENT_REGEX.test(text)) {
      setAppointmentState({ stage: "collecting", contact: nextContact, slot: nextSlot });
      await sendBot(
        "I can set up a doctor/therapist appointment with our partners. Please share your contact info (email or phone) and your preferred date/time, and confirm you want me to book it."
      );
      return true;
    }

    if (appointmentState.stage === "collecting") {
      if (!nextContact) {
        setAppointmentState({ stage: "collecting", contact: "", slot: nextSlot });
        await sendBot(
          "Got it. To book, I need your contact info (email or phone). Please share that and your preferred date/time."
        );
        return true;
      }
      if (!nextSlot) {
        setAppointmentState({ stage: "collecting", contact: nextContact, slot: "" });
        await sendBot(
          "Thanks. What date and time works for you? Include a day and time (e.g., tomorrow 2pm or 2025-12-11 15:00)."
        );
        return true;
      }
      setAppointmentState({ stage: "ready", contact: nextContact, slot: nextSlot });
      await sendBot(
        `I can book this: contact ${nextContact}, preferred time ${nextSlot}. Reply "yes" to confirm and I'll open the booking portal.`
      );
      return true;
    }

    if (appointmentState.stage === "ready") {
      const confirm = CONFIRM_REGEX.test(lower);
      if (confirm) {
        reset();
        await sendBot(`Booking confirmed. I'm sending you to our partners to finalize: ${doctorsPortalUrl}`);
        try {
          if (typeof window !== "undefined") {
            window.open(doctorsPortalUrl, "_blank", "noopener");
          }
        } catch (err) {
          console.error("Portal redirect failed", err);
        }
        return true;
      }

      setAppointmentState({ stage: "ready", contact: nextContact, slot: nextSlot });
      await sendBot(
        `I have contact ${nextContact} and time ${nextSlot}. Reply "yes" to confirm, or share updates if you want to change anything.`
      );
      return true;
    }

    return false;
  };

  const handleSendMessage = async (messageText) => {
    const trimmed = messageText?.trim();
    if (!trimmed || isBotLoading) return;

    const userMessage = {
      text: trimmed,
      sender: "user",
      createdAt: Date.now(),
    };
    const history = [...messages, userMessage];
    const useLocal = isGuest || !isFirebaseEnabled || !userId;

    setCurrentMessage("");
    setIsBotLoading(true);

    try {
      if (useLocal) {
        setMessages((m) => [...m, { id: `u-${Date.now()}`, ...userMessage }]);
      } else {
        await FirebaseService.firestore.addMessage(userId, {
          ...userMessage,
          createdAt: FirebaseService.serverTimestamp(),
        });
      }

      const handled = await handleAppointmentFlow(trimmed, { useLocal });
      if (handled) return;

      if (useLocal) {
        const result = await OpenAIService.sendChatMessage(history, preferences);
        const text = result.choices?.[0]?.message?.content || "I'm here to listen. Could you share more?";
        setMessages((m) => [
          ...m,
          { id: `b-${Date.now()}`, text, sender: "bot", createdAt: Date.now() },
        ]);
      } else {
        const result = await OpenAIService.sendChatMessage(history, preferences);
        const botText = result.choices?.[0]?.message?.content;
        const botMsg = {
          text: botText || "I'm here to listen. Could you share more?",
          sender: "bot",
          createdAt: FirebaseService.serverTimestamp(),
        };
        await FirebaseService.firestore.addMessage(userId, botMsg);
      }
    } catch (e) {
      console.error("sendMessage error:", e);
      const fallback = {
        text: "I'm having trouble reaching the service right now, but I'm still here with you. Let's try again in a moment.",
        sender: "bot",
        createdAt: Date.now(),
      };
      if (useLocal) {
        setMessages((m) => [...m, { id: `err-${Date.now()}`, ...fallback }]);
      } else {
        await FirebaseService.firestore.addMessage(userId, {
          ...fallback,
          createdAt: FirebaseService.serverTimestamp(),
        });
      }
    }

    setIsBotLoading(false);
  };

  const handleClearHistory = async () => {
    if (!userId || !isFirebaseEnabled || isGuest) {
      setMessages([]);
      setConversationReady(false);
      return;
    }
    try {
      await FirebaseService.firestore.clearMessages(userId);
      setMessages([]);
    } catch (e) {
      console.error("Error clearing history:", e);
    }
    setConversationReady(false);
  };

  const archiveCurrentConversation = () => {
    if (isGuest || !messages?.length) return;
    const firstUserMessage = messages.find((m) => m.sender === "user");
    const fallbackTitle = firstUserMessage?.text?.slice(0, 40) || `Session ${new Date().toLocaleString()}`;
    const newConversation = {
      id: `conv-${Date.now()}`,
      title: fallbackTitle,
      messages: messages.slice(),
      createdAt: Date.now(),
    };
    setConversations((prev) => [newConversation, ...prev]);
  };

  const handleStartNewConversation = async () => {
    archiveCurrentConversation();
    await handleClearHistory();
    setCurrentMessage("");
    setConversationReady(false);
  };

  const handleOpenConversation = (conversationId) => {
    const convo = conversations.find((c) => c.id === conversationId);
    if (!convo) return;
    setMessages(convo.messages || []);
    setCurrentMessage("");
    setConversationReady(true);
  };

  const handleRenameConversation = (conversationId) => {
    const convo = conversations.find((c) => c.id === conversationId);
    if (!convo) return;
    const nextTitle = window.prompt("Rename conversation", convo.title);
    if (!nextTitle) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, title: nextTitle } : c))
    );
  };

  const handleDeleteConversation = (conversationId) => {
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
  };

  return {
    messages,
    currentMessage,
    setCurrentMessage,
    isBotLoading,
    conversations,
    conversationReady,
    handleSendMessage,
    handleClearHistory,
    archiveCurrentConversation,
    handleStartNewConversation,
    handleOpenConversation,
    handleRenameConversation,
    handleDeleteConversation,
    setMessages,
    setConversationReady,
    setIsBotLoading,
  };
};
