# Historical implementation notes

See [README.md](README.md) for current setup and behavior. Earlier descriptions below may describe superseded code.

# Aura Project

AI companion built with Vite + React. Aura chats through OpenAI, syncs conversations to Firebase when configured, and falls back to a safe guest/local mode when keys are missing.

## How the app works
- Routing lives in `src/components/App.jsx`: landing -> welcome/login -> chat/preferences/billing. The `useAura` hook centralizes state, navigation helpers, and side effects.
- Auth (`src/hooks/useAuth.js`, `src/services/firebase.js`): email/password via Firebase when `VITE_FB_*` is present. Without Firebase, login/register are disabled and the app runs as a guest using local storage for lightweight profile data.
- Chat loop (`src/hooks/useChat.js`, `src/services/openai-api.js`): user messages are sent to OpenAI with a system prompt derived from preferences (`tone`, `brevity`).
  - Signed-in users: messages are written to Firestore and read back via live subscriptions.
  - Guests / missing Firebase: messages stay in memory; OpenAI still responds if an API key exists.
  - Missing OpenAI key: the UI stays usable and returns a supportive fallback message.
- Quick tools & summaries (`useAura.callOpenAITool`, `handleSummarizeChat`): one-click breathing, journaling, and goal-setting prompts plus PDF chat summaries via `jspdf`. Summaries run the conversation through OpenAI, then download a PDF.
- Conversation management (`Chat` + `Sidebar`): start/rename/delete/open threads. Archives are kept in `localStorage` (`aura-conversations`) for signed-in users; guests only keep the current thread.
- Preferences & theme (`useAura.handleSavePreferences`, `src/components/Preferences.jsx`): theme toggles persist to `localStorage` (`aura-theme`). Preference saves go to Firestore when signed in, otherwise to `localStorage`. The Preferences screen is a rich UI shell; wire its controls to `onSavePreferences` if you want live updates to the persona that drives OpenAI responses.
- Billing screen (`src/components/Billing.jsx`): UI-only pricing selector. `handlePlanSelect` is stubbed so you can drop in a billing provider.
- Safety (`src/config/constants.js`): the system prompt injects a crisis disclaimer; no PHI is stored client-side unless you enable Firebase.

## Environment
Create `.env` next to `package.json` (see `.env.example`):
```env
VITE_FB_API_KEY=...
VITE_FB_AUTH_DOMAIN=...
VITE_FB_PROJECT_ID=...
VITE_FB_STORAGE_BUCKET=...
VITE_FB_MESSAGING_SENDER_ID=...
VITE_FB_APP_ID=...
VITE_FB_MEASUREMENT_ID=...
OPENAI_API_KEY=...
VITE_DOCTORS_PORTAL_URL=/doctors_portal/index.php
```

## Running locally
```bash
npm install
npm run dev
```

The build script copies `doctors_portal` into `dist` so the "Seek human help" link resolves in production. If the portal is hosted elsewhere, set `VITE_DOCTORS_PORTAL_URL` to that full URL.

## Firebase & OpenAI notes
- Enable Authentication -> Email/Password in Firebase for full auth. Anonymous sign-in is optional; guest mode already works without Firebase.
- Firestore collections used: `users/{uid}/messages` and `users/{uid}/preferences`.
- OpenAI endpoint defaults to `gpt-4o`/`gpt-4o-mini` chat completions. OpenAI calls now go through the server API; credentials are never read by the browser. If the key is missing or placeholder, the app returns a friendly fallback so the UI remains usable.

## Key files to skim
- `src/components/App.jsx` - router + page composition.
- `src/hooks/useAura.js` - orchestrates auth, chat, preferences, theme, tools, summaries.
- `src/hooks/useChat.js` - message sending, Firestore sync, conversation archiving.
- `src/services/openai-api.js` - OpenAI client with backoff and safe fallback.
- `src/services/firebase.js` - guarded Firebase init so local/guest runs without keys.
- `src/components/Chat.jsx` - chat shell with sidebar, quick tools, summaries.
- `src/components/Preferences.jsx` - visual settings experience (connect to `onSavePreferences` as needed).

## Private server credentials and production hosting

Use `OPENAI_API_KEY` and optional `OPENAI_PROJECT_ID` in your ignored `.env`.
Never use a `VITE_` prefix for private credentials. Existing local values were
migrated to the server-only names. `npm run dev` and `npm run preview` include
the API middleware, so guest chat and summaries continue to work.

In production run `npm run start:api` with server environment variables, serve
`dist` from your web server, and reverse-proxy `/api/openai/` to
`http://127.0.0.1:3001`. Set `APP_ORIGIN` to the exact public site origin
(e.g. `https://your-domain.example`). Static-only hosting cannot run this API.
The proxy has fixed upstream endpoints/models, request limits, concurrency
limits, a timeout, and sanitized errors. Guest access remains enabled; origin
checks and process-wide limits are not user authentication. Add user-level
quotas before offering unrestricted public usage.

Create administrators only from the server command line. Set the environment
variable `AURA_ADMIN_PASSWORD` to a strong password (at least 12 characters),
then run `php doctors_portal/admin/create_admin.php YOUR_USERNAME` and clear
that variable afterward. The existing MySQL database/tables must be configured.
Web access to this script always returns 403, even before the first admin exists.

If the previous OpenAI key was served to visitors, revoke it and replace it.
Rebuild/redeploy the site and remove previously deployed bundles/cached copies.
