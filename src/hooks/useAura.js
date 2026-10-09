/*
 * Application orchestration: compose auth/chat hooks with theme, preferences, AI tools, and conversation PDF export.
 */

import { useEffect, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import FirebaseService, { isFirebaseEnabled } from "../services/firebase";
import OpenAIService from "../services/openai-api";
import { useAuth } from "./useAuth";
import { useChat } from "./useChat";
import { parseImageFromMessage } from "../utils/helpers";

const GUEST_PREF_KEY = "aura-guest-preferences";
const THEME_STORAGE_KEY = "aura-theme";
const DEFAULT_PREFERENCES = {
  persona: "supportive",
  tone: "empathetic",
  brevity: "concise",
  model: "balanced",
  creativity: 50,
  verbosity: 50,
  memoryEnabled: false,
  webAccess: false,
  codeExecution: false,
  dataSharing: false,
  historyRetention: 0,
  customInstructions: "",
  notifications: { email: false, push: false, productUpdates: false },
};

const detectSystemTheme = () => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
};

const getStoredJSON = (key, fallback) => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const getStoredString = (key, fallback) => {
  if (typeof window === "undefined") return fallback;
  try {
    return window.localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
};

export const useAura = () => {
  // Compose account and chat state here so pages share one session and preferences.
  const auth = useAuth();
  const { user, userId, isGuest } = auth;
  const preferenceKey = `${isGuest ? "guest" : "account"}:${userId || "anonymous"}`;
  const preferenceSession = useRef({ key: preferenceKey });
  // Replace the identity even when returning to an account, invalidating old callbacks.
  if (preferenceSession.current.key !== preferenceKey) preferenceSession.current = { key: preferenceKey };

  // Device-local guest settings initialize the session before any signed-in subscription arrives.
  const [preferences, setPreferences] = useState(() => {
    const stored = getStoredJSON(GUEST_PREF_KEY, null);
    return { ...DEFAULT_PREFERENCES, ...(stored || {}) };
  });
  const [preferencesError, setPreferencesError] = useState(null);
  const [theme, setTheme] = useState(() =>
    getStoredString(THEME_STORAGE_KEY, getStoredString("aura_theme", detectSystemTheme()))
  );

  const chat = useChat(user, userId, isGuest, preferences);
  const { messages } = chat;

  useEffect(() => {
    if (typeof document === "undefined") return;
    const body = document.body;
    if (!body) return;
    const root = document.documentElement;

    // Keep custom theme selectors and Tailwind's dark marker aligned with one theme value.
    body.classList.toggle("theme-light", theme === "light");
    body.classList.toggle("theme-dark", theme !== "light");
    root.classList.toggle("dark", theme !== "light");
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* noop */
    }
  }, [theme]);

  useEffect(() => {
    // A portal tab on the same origin can change the shared device preference.
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return;
    const syncTheme = event => {
      if (event.key === THEME_STORAGE_KEY && (event.newValue === 'light' || event.newValue === 'dark')) setTheme(event.newValue);
    };
    window.addEventListener('storage', syncTheme);
    return () => window.removeEventListener('storage', syncTheme);
  }, []);

  useEffect(() => {
    setPreferencesError(null);
    if (!isGuest && userId) { setPreferences(DEFAULT_PREFERENCES); return; }
    const stored = getStoredJSON(GUEST_PREF_KEY, null);
    setPreferences(stored ? { ...DEFAULT_PREFERENCES, ...stored } : DEFAULT_PREFERENCES);
  }, [isGuest, userId]);
  
  // --- Firestore subscriptions (prefs) for non-guest ---
  useEffect(() => {
    if (!auth.isAuthReady || !userId || isGuest) return;
    const session = preferenceSession.current;
    let active = true;

    const unsubPrefs = FirebaseService.firestore.subscribeToPreferences(
      userId,
      (doc) => {
        if (!active || session !== preferenceSession.current) return;
        setPreferences(doc.exists() ? { ...DEFAULT_PREFERENCES, ...doc.data() } : DEFAULT_PREFERENCES);
      },
      () => {
        if (active && session === preferenceSession.current) setPreferencesError("Could not load preferences. Check your connection and Firestore permissions.");
      }
    );

    return () => {
      active = false;
      unsubPrefs?.();
    };
  }, [auth.isAuthReady, userId, isGuest]);

  // Persist before applying edits so failed writes reach the UI's error handler.
  const handleSavePreferences = async (newPrefs = {}) => {
    const session = preferenceSession.current;
    const updated = { ...DEFAULT_PREFERENCES, ...preferences, ...newPrefs };
    if (isGuest || !userId || !isFirebaseEnabled) localStorage.setItem(GUEST_PREF_KEY, JSON.stringify(updated));
    else await FirebaseService.firestore.savePreferences(userId, updated);
    if (session !== preferenceSession.current) return;
    setPreferences(updated);
    setPreferencesError(null);
  };

  const handlePlanSelect = () => auth.goChat();

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // --- Tools & messaging ---
  // Insert a placeholder and replace it when the tool reply arrives, preserving message position.
  const callOpenAITool = async (userPrompt, systemPrompt) => {
    const operation = chat.beginOperation();
    if (!operation) return;

    let botMsgRef = null;
    const placeholderId = `tool-${Date.now()}`;
    const placeholder = {
      id: placeholderId,
      text: "...",
      sender: "bot",
      createdAt: Date.now(),
    };

    try {
      if (chat.useLocalMessages) {
        chat.setMessages((m) => [...m, placeholder]);
      } else {
        botMsgRef = await FirebaseService.firestore.addMessage(userId, {
          text: placeholder.text,
          sender: placeholder.sender,
          createdAt: FirebaseService.serverTimestamp(),
        });
      }

      if (!chat.isCurrentOperation(operation)) return;
      const result = await OpenAIService.callTool(userPrompt, systemPrompt, preferences);
      if (!chat.isCurrentOperation(operation)) return;
      const text = result.choices?.[0]?.message?.content || "Sorry, I had trouble with that request.";

      if (chat.useLocalMessages) {
        chat.setMessages((prev) => {
          const idx = prev.findIndex((msg) => msg.id === placeholderId);
          if (idx === -1) return [...prev, { id: placeholderId, text, sender: "bot", createdAt: Date.now() }];
          const next = [...prev];
          next[idx] = { ...next[idx], text };
          return next;
        });
      } else if (botMsgRef) {
        await FirebaseService.firestore.updateMessage(botMsgRef, {
          text,
          sender: "bot",
          createdAt: FirebaseService.serverTimestamp(),
        });
      }
    } catch (e) {
      if (!chat.isCurrentOperation(operation)) return;
      console.error("OpenAI tool error:", e);
      const text = "Sorry, I had trouble with that request.";

      if (chat.useLocalMessages) {
        chat.setMessages((prev) => {
          const idx = prev.findIndex((msg) => msg.id === placeholderId);
          if (idx === -1) return [...prev, { id: placeholderId, text, sender: "bot", createdAt: Date.now() }];
          const next = [...prev];
          next[idx] = { ...next[idx], text };
          return next;
        });
      } else if (botMsgRef) {
        await FirebaseService.firestore.updateMessage(botMsgRef, {
          text,
          sender: "bot",
          createdAt: FirebaseService.serverTimestamp(),
        });
      }
    } finally {
      chat.finishOperation(operation);
    }
  };

  const getJsPdf = () => jsPDF;

  const generateSummaryPdf = (summaryText, convoMessages = []) => {
    // Export includes the summary and conversation, including supported image attachments.
    const JsPdfCtor = getJsPdf();
    if (!JsPdfCtor) return;

    const doc = new JsPdfCtor({
      unit: "mm",
      format: "a4",
    });
    const margin = 15;
    let cursorY = 20;

    // Add a page when the next text/image block would cross the bottom margin.
    const ensureSpace = (height = 6) => {
      if (cursorY + height > 280) {
        doc.addPage();
        cursorY = 20;
      }
    };

    const toImageType = (dataUrl) => {
      const mime = dataUrl?.slice(5, dataUrl.indexOf(";"))?.toLowerCase() || "";
      if (mime.includes("png")) return "PNG";
      if (mime.includes("jpeg") || mime.includes("jpg")) return "JPEG";
      if (mime.includes("webp")) return "WEBP";
      return "PNG";
    };

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Aura Chat Summary", margin, cursorY);
    cursorY += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, cursorY);
    cursorY += 10;

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Summary", margin, cursorY);
    cursorY += 6;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const summaryLines = doc.splitTextToSize(summaryText || "No summary available.", 180);
    summaryLines.forEach((line) => {
      ensureSpace();
      doc.text(line, margin, cursorY);
      cursorY += 6;
    });

    ensureSpace(12);
    const addMessageBlock = (msg) => {
      const speaker = msg.sender === "user" ? "User" : "Aura";
      const { dataUrl, cleanText, label } = parseImageFromMessage(msg.text || "");
      const labelText = dataUrl
        ? `${speaker}: [image attached${label ? `: ${label}` : ""}]`
        : `${speaker}: ${cleanText || "(no text)"}`;

      const lines = doc.splitTextToSize(labelText, 180);
      lines.forEach((line) => {
        ensureSpace();
        doc.text(line, margin, cursorY);
        cursorY += 6;
      });

      if (dataUrl) {
        try {
          const { width, height } = doc.getImageProperties(dataUrl);
          const scale = Math.min(120 / width, 230 / height);
          const maxWidth = width * scale;
          const scaledHeight = height * scale;
          ensureSpace(scaledHeight + 4);
          const imageType = toImageType(dataUrl);
          doc.addImage(dataUrl, imageType, margin, cursorY, maxWidth, scaledHeight);
          cursorY += scaledHeight + 4;
        } catch (e) {
          ensureSpace();
          doc.text(`${speaker}: [image could not be rendered]`, margin, cursorY);
          cursorY += 6;
        }
      }

      cursorY += 2;
    };

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Conversation Highlights", margin, cursorY);
    cursorY += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    if (!convoMessages.length) {
      ensureSpace();
      doc.text("No conversation history captured.", margin, cursorY);
      cursorY += 6;
    } else {
      convoMessages.forEach(addMessageBlock);
    }

    doc.save(`aura-summary-${Date.now()}.pdf`);
  };

  // Send a text transcript for summarization, then export it with the original conversation.
  const handleSummarizeChat = async () => {
    if (!messages.length) return;
    const operation = chat.beginOperation();
    if (!operation) return;
    try {
      const chatContent = messages
        .map((m) => {
          const { dataUrl, cleanText, label } = parseImageFromMessage(m.text || "");
          const baseText = cleanText || "(no text)";
          const imageNote = dataUrl ? `[image attached${label ? `: ${label}` : ""}]` : "";
          const combined = [baseText, imageNote].filter(Boolean).join(" ");
          return `${m.sender === "user" ? "User" : "Aura"}: ${combined}`;
        })
        .join("\n");
      let summaryText = "Summary unavailable.";
      try {
        const result = await OpenAIService.callTool(
          `Please provide a concise yet warm summary (3-5 sentences) of the following conversation, focusing on the main themes, emotions, and any next steps mentioned:\n\n${chatContent}`,
          "You are a helpful assistant who distills the provided conversation into a short, empathetic summary.",
          preferences
        );
        summaryText = result.choices?.[0]?.message?.content || summaryText;
      } catch (err) {
        console.error("Summary generation error:", err);
      }

      if (chat.isCurrentOperation(operation)) generateSummaryPdf(summaryText, messages);
    } catch (err) {
      console.error("Summary PDF error:", err);
    } finally {
      chat.finishOperation(operation);
    }
  };

  const handleQuickTool = (tool) => {
    const tools = {
      breath: {
        prompt: "Generate a short, 1-minute guided breathing exercise. Format it with new lines.",
        system: "You are a wellness coach. Provide a simple, calming breathing exercise.",
      },
      journal: {
        prompt: "Generate one thoughtful journal prompt for self-reflection.",
        system: "You are a journal guide. Provide a single, insightful prompt.",
      },
      goal: {
        prompt: "Help me set one small, achievable wellness goal for today.",
        system: "You are a supportive coach. Help the user create a simple, positive goal.",
      },
    };
    if (tools[tool]) callOpenAITool(tools[tool].prompt, tools[tool].system);
  };

  return {
    ...auth,
    ...chat,
    preferences,
    preferencesError,
    theme,
    handleSavePreferences,
    handlePlanSelect,
    handleToggleTheme,
    callOpenAITool,
    getJsPdf,
    generateSummaryPdf,
    handleSummarizeChat,
    handleQuickTool,
  };
};
