/*
 * Shared transformations and effects: parse image markers, format model history, build persona prompts, retry requests, and scroll.
 */

import { APP_CONFIG } from '../config/constants';
import { SAFETY_MESSAGES } from '../config/constants';
import { useEffect, useRef } from 'react';

// Split the historical attachment serialization into image data, label, and clean visible text.
export const parseImageFromMessage = (text = '') => {
  const imageMatch = text.match(/data:image[^;]+;base64,[^\s)]+/i);
  const labelMatch = text.match(/Image uploaded: ([^\n]+)\.(?=\n|$)/i);

  const dataUrl = imageMatch?.[0] || null;
  let cleanText = text;
  if (dataUrl) cleanText = cleanText.replace(dataUrl, '');
  if (labelMatch?.[0]) cleanText = cleanText.replace(labelMatch[0], '');

  return {
    dataUrl,
    label: labelMatch?.[1]?.trim() || null,
    cleanText: cleanText.trim(),
  };
};

/**
 * Transform local chat messages to OpenAI chat format
 * Local: [{ sender: 'user'|'bot', text, createdAt? }]
 * OpenAI: [{ role, content }, ...]
 */
export const formatChatHistory = (messages = []) => {
  const out = [];
  // Keep recent context within the proxy payload limit, including base64 image attachments.
  for (const msg of messages.slice(-(APP_CONFIG.MESSAGE_LIMIT || 50))) {
    const role = msg.sender === 'user' ? 'user' : 'assistant';
    const text = String(msg.text ?? '');

    // If the user attached an image, send it as a proper image part instead of raw base64 text.
    if (role === 'user') {
      const { dataUrl, cleanText } = parseImageFromMessage(text);
      if (dataUrl) {
        const parts = [];
        if (cleanText) parts.push({ type: 'text', text: cleanText });
        parts.push({ type: 'image_url', image_url: { url: dataUrl } });
        out.push({ role, content: parts });
        continue;
      }
    }

    out.push({
      role,
      content: text,
    });
  }
  while (out.length > 1 && new TextEncoder().encode(JSON.stringify(out)).length > 1800000) out.shift();
  return out;
};

/**
 * Build a system prompt from user preferences
 */
export const getSystemPrompt = (preferences = {}) => {
  const { tone = 'empathetic', brevity = 'concise', persona = 'supportive', customInstructions = '' } = preferences;
  const lines = [
    'You are Aura, a supportive, non-clinical companion.',
    'Be warm, validating, and helpful.',
    `Persona focus: ${persona}.`,
    `Tone: ${tone}.`,
    `Style: ${brevity}.`,
    'Avoid medical advice; suggest professional help when needed.',
    'Do not generate images, image URLs, or base64 data. Respond with text only.',
    `If the user expresses crisis, include this resource: ${SAFETY_MESSAGES.CRISIS_RESPONSE}`,
  ];

  if (customInstructions?.trim()) {
    lines.push(`User instructions: ${customInstructions.trim()}`);
  }

  return lines.join('\n');
};

/**
 * Simple exponential backoff wrapper around fetch.
 * Returns parsed JSON or throws with the last error.
 */
export const exponentialBackoffFetch = async (url, init = {}) => {
  const max = APP_CONFIG?.MAX_RETRIES ?? 5;
  const base = APP_CONFIG?.BASE_DELAY ?? 1000;
  let attempt = 0;
  let lastErr;

  while (attempt < max) {
    try {
      const res = await fetch(url, { ...init, signal: init.signal || AbortSignal.timeout(35000) });
      if (!res.ok) {
        const txt = await res.text();
        const err = new Error(`HTTP ${res.status}: ${txt}`);
        err.status = res.status;
        throw err;
      }
      // Some Google endpoints return JSON with big objects
      return await res.json();
    } catch (err) {
      lastErr = err;
      attempt += 1;
      const status = err?.status;
      // Retry transient network/server/rate-limit errors, but stop on other HTTP failures.
      const retryable = status === undefined || status >= 500 || status === 429;
      if (!retryable || attempt >= max) break;
      // Double the wait after each failure, with an eight-second ceiling.
      const delay = Math.min(base * 2 ** (attempt - 1), 8000);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr ?? new Error('Request failed');
};

/**
 * Auto-scroll helper for chat windows
 */
export const useAutoScroll = (dependencies = []) => {
  const ref = useRef(null);
  const previous = useRef([]);
  useEffect(() => {
    const changed = dependencies.some((value, index) => value !== previous.current[index]);
    previous.current = dependencies;
    const container = ref.current?.closest('.chat-active-messages, .chat-messages');
    if (!container || !changed) return;
    // Scroll only the message panel: scrollIntoView also moves the page and starter screen.
    container.scrollTo({ top: container.scrollHeight, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }, [dependencies]);
  return ref;
};
