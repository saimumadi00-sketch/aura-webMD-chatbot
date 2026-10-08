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
    "I hear that you're in a lot of pain, and I want you to get the help you deserve. I'm not equipped to help with this, but please reach out to the 988 Suicide & Crisis Lifeline by calling or texting 988. They are available 24/7, free, and confidential.",
  DISCLAIMER:
    'This is an AI, not a therapist. If you are in a crisis, please call or text 988 immediately.',
};
