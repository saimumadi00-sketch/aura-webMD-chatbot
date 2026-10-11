/*
 * Shared public configuration: Firebase browser identifiers, server-relative AI URL, model mappings, retry settings, and safety text.
 */

// VITE_ values are bundled into browser JavaScript and must contain no private secrets.
import { externalPortalUrl } from '../utils/portal-url';

export const DOCTORS_PORTAL_URL = externalPortalUrl(import.meta.env.VITE_DOCTORS_PORTAL_URL, import.meta.env.PROD);

export const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FB_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FB_APP_ID,
  measurementId: import.meta.env.VITE_FB_MEASUREMENT_ID,
};

export const OPENAI_CONFIG = {
  API_URL: '/api/openai/chat/completions',
  MODELS: {
    // Keep the UI-friendly keys, but map them to real, generally available models.
    fast: 'gpt-4o-mini',
    balanced: 'gpt-4o',
    reasoning: 'gpt-4o',
  },
  DEFAULT_MODEL: 'gpt-4o-mini',
};

export const APP_CONFIG = {
  APP_ID: 'personal-issues-local',
  MAX_RETRIES: 5,
  BASE_DELAY: 1000,
  MESSAGE_LIMIT: 50,
};

export const SAFETY_MESSAGES = {
  CRISIS_RESPONSE:
    "If you are in immediate danger, contact local emergency services and a trusted person nearby. Aura does not provide emergency support.",
  DISCLAIMER:
    'Aura is an AI companion, not a therapist or emergency service. In immediate danger, contact local emergency services.',
};
