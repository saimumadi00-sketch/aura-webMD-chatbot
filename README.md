# Aura

Aura is a supportive AI chat companion built with React and Vite. It includes
guest chat, Firebase email/password authentication, conversation management,
AI preferences, PDF summaries, and optional links to a separately hosted PHP doctors portal.

Aura is a non-clinical companion. The billing page is a prototype; it does not
process payments or provide the services advertised on its pricing cards.

## Local setup

Use Node.js 22.12 or newer and npm. From the project directory:

```powershell
npm.cmd ci
Copy-Item .env.example .env
```

If `.env` already exists, keep it and update its values instead of copying over it.
Set `OPENAI_API_KEY` to enable AI replies. Without it, chat returns fallback text.
Firebase is optional for guest use; configure the `VITE_FB_*` values and enable
email/password authentication in Firebase to use accounts.

```powershell
npm.cmd run dev
```

Open the URL printed by Vite. Its development server includes the OpenAI API
middleware, so a separate API process is unnecessary during development.
On other shells, `npm` can be used in place of `npm.cmd`.

## Configuration

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Private server credential for AI requests |
| `OPENAI_PROJECT_ID` | Optional server-side OpenAI project identifier |
| `VITE_FB_*` | Browser Firebase configuration; names are listed in `.env.example` |
| `VITE_DOCTORS_PORTAL_URL` | Optional external portal URL; leave blank until the PHP website is hosted |
| `APP_ORIGIN` | Exact website origin in production, such as `https://example.com` |
| `API_PORT` | Standalone API port; defaults to `3001` |

Keep `.env` private. Git ignores it, generated builds, dependencies, and private files. Variables prefixed with `VITE_` are public browser configuration: never
use that prefix for private API keys. The frontend calls `/api/openai/...`; the
server attaches the OpenAI credential and uses fixed upstream endpoints.

## Commands

| Command | Purpose |
| --- | --- |
| `npm.cmd run dev` | Development frontend and API middleware |
| `npm.cmd test` | Run isolated regression tests |
| `npm.cmd run test:ui` | Check responsive layouts in a separate debugging browser |
| `npm.cmd run test:ui:polish` | Check chat scrolling, reply formatting, and pricing alignment in the same debugging browser |
| `npm.cmd run test:ui:preferences` | Check keyboard sliders, draft preservation, and guest preference save/retry behavior |
| `npm.cmd run test:ui:navigation` | Check page Back buttons, browser history, direct-link fallbacks, and guest session preservation |
| `npm.cmd run test:ui:streaming` | Check partial replies, Stop, draft preservation, and scrolling during generation |
| `npm.cmd run lint` | ESLint checks for `src` |
| `npm.cmd run build` | Build the React frontend into `dist` |
| `npm.cmd run preview` | Local build preview with API middleware |
| `npm.cmd run start:api` | Standalone production API, bound to `127.0.0.1` |

## Separate doctors website

The PHP doctors website is an independent project beside this one at
`../Aura_doctors_portal`. Its README covers PHP/MySQL setup, administrator
provisioning, private uploads, migrations, and portal tests. Its public document
root is `public/`. Main-site builds contain no PHP files or portal sources.

The main app owns `src/styles/tokens.css`; the PHP website has its own palette
copy. To enable doctor links, set `VITE_DOCTORS_PORTAL_URL` to the external
HTTP(S) portal URL and restart/rebuild the frontend. Until it is configured,
doctor links are unavailable and chat does not claim to book appointments.
Set `AURA_APP_URL` on the PHP host to enable its link back to the main site.

## Production deployment

1. Run `npm.cmd run build`.
2. Serve `dist` with your web server. Deploy the doctors website separately.
3. Start the API with `npm.cmd run start:api`, providing private credentials
   through server environment variables or a private root `.env`.
4. Set `APP_ORIGIN` to the exact public origin, including the scheme and any port.
5. Reverse-proxy `/api/openai/` to `http://127.0.0.1:3001`, preserving the path.

Static-only hosting cannot execute the AI API. The proxy limits
requests and concurrent upstream calls, caps output tokens, rejects other
origins, and hides upstream errors. These process-wide limits preserve guest
access; they do not authenticate users or enforce individual billing quotas.

## Code map

The dependency tree uses Firebase 12.19 or newer in the 12.x series. A scoped
`package.json` override upgrades Firestore's pinned `@grpc/grpc-js` dependency
to the patched 1.14.6 series. This addresses the
[gRPC certificate-validation advisory](https://github.com/advisories/GHSA-m9gg-hp2v-232j)
without downgrading Firebase. Revisit the override when Firebase updates its
gRPC requirement. Review `npm.cmd audit` before choosing targeted upgrades;
`npm.cmd audit fix --force` can downgrade direct dependencies or change majors.

| Path | Responsibility |
| --- | --- |
| `src/components/App.jsx` | Hash routes and page composition |
| `src/hooks/useAuth.js` | Account and guest state |
| `src/hooks/useAura.js` | Preferences, theme, AI tools, and PDF export |
| `src/hooks/useChat.js` | Message lifecycle, archives, and portal handoff |
| `src/services/firebase.js` | Firebase initialization and persistence adapters |
| `src/services/openai-api.js` | Streamed chat requests and JSON tool requests |
| `src/services/chat-stream.js` | Incremental reply decoding and request cancellation |
| `src/utils/sse.js` | Shared SSE decoding for the browser and private proxy |
| `src/services/openai-sdk.js` | Browser helpers for the server Responses endpoint |
| `src/utils/helpers.js` | Chat formatting, image parsing, prompts, and retries |
| `server/openai-proxy.js` | Server-only credentials and upstream request boundary |
| `server/index.js` | Standalone API entry point |
| `scripts/` | Portal copying and optional fine-tuning data preparation |

## Current behavior and remaining integrations

Signed-in active messages are ordered by creation time in Firestore.
Preferences use `users/{uid}/preferences/settings`. Deploy the updated
`firestore.rules` in the Firebase console before using signed-in persistence;
changing a local rules file does not update your Firebase project.

Chat replies appear as text arrives from the provider. Stop cancels generation
and retains the partial answer. Failed chat requests are not automatically
retried; interrupted replies remain visible with an error message. User messages
appear immediately and database writes run alongside generation. Final replies
are saved once, and archived conversations are updated after generation ends.
For production streaming, disable response buffering on the reverse proxy for
`/api/openai/chat/completions`; the API also sends `X-Accel-Buffering: no`.

Password recovery sends Firebase reset emails. Failed login attempts remain on
the form, and settings logout signs out of Firebase. Social sign-in is visibly
unavailable until a provider integration is added.

Archived conversations are account-specific, device-local copies. Reopening and
continuing an archive updates that local copy without changing the live server
thread. Archives survive logout on this browser. Clear Current Chat deletes the
selected thread's messages; deleting an archive removes its local copy.

Booking chat provides a clickable portal link. Users choose a doctor and submit
the portal form themselves; chat does not claim to reserve an appointment.

Paid plans, web browsing, code execution, cross-conversation memory, notification
delivery, automatic retention, and account deletion are visibly unavailable.
AI preference controls, device-local guest saves, current-chat clearing, JSON
export of loaded data, and PDF summaries are implemented. Profile fields are
read-only. AI requests include the current conversation, and PDF exports can
include the full thread. Treat exports and portal uploads as private data.

Run `npm.cmd test` for isolated auth/chat/save regression checks and
`npm.cmd run lint` for source checks. These do not establish that live Firebase,
OpenAI, or MySQL are configured correctly. Historical notes are in
[README_FIXES.md](README_FIXES.md); this README describes the current setup.

## Portal storage and development server

PHP/MySQL deployment and patient upload instructions live in the separate
doctors website README.

The browser accepts PNG/JPEG/WebP/GIF attachments up to 512 KB. Recent AI
context is bounded to avoid oversized requests; long chats may omit older
messages from the model context while retaining them in the UI/export.

## Browser layout checks

Start Vite, then launch a separate Edge profile with remote debugging in another
PowerShell terminal:

```powershell
$uiProfile = Join-Path $env:TEMP 'aura-ui-check'
& 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe' --headless=new --remote-debugging-port=9223 "--user-data-dir=$uiProfile" about:blank
```

Run `npm.cmd run test:ui` in a third terminal. The check covers landing, login,
registration, welcome, billing, chat, settings, and dialogs at 320, 390, 768,
and 1366 pixels. It blocks account-service and AI requests while testing guest
interactions. It also compares light/dark element dimensions, spacing, border
geometry, typography, and shadow shape, and checks that switching themes keeps
the settings draft. Motion is reduced during these deterministic comparisons.
Set `UI_BASE_URL` if Vite uses a different port and `UI_DEBUG_URL`
if your browser debugging endpoint differs. Close the test browser afterward.
