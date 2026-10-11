import React from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import AnalyticsConsent from './AnalyticsConsent';
import '../styles/public-info.css';

const operator = import.meta.env.VITE_OPERATOR_NAME?.trim();
const support = import.meta.env.VITE_SUPPORT_EMAIL?.trim();
const privacy = import.meta.env.VITE_PRIVACY_EMAIL?.trim();
const validEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || '');
const email = value => validEmail(value) ? <a href={`mailto:${value}`}>{value}</a> : 'Contact details have not been configured for public launch.';

export default function PublicInfo({ page, theme = 'dark', onToggleTheme }) {
  return <div className="public-info"><header><Link to="/">Aura</Link><ThemeToggle theme={theme} onToggleTheme={onToggleTheme} /></header><main>
    <nav aria-label="Information pages"><Link to="/privacy">Privacy</Link><Link to="/terms">Usage</Link><Link to="/contact">Contact</Link></nav>
    {page === 'privacy' && <><h1>Privacy information</h1><p>This describes the current app. A complete operator-specific privacy policy is required before public launch.</p>
      <h2>Conversations and images</h2><p>When AI is enabled and you send a message, the recent conversation and attached images go through our server to OpenAI. Do not share information you are uncomfortable sending. Images are resized and re-encoded in your browser to remove source metadata before sending.</p>
      <h2>Account and device storage</h2><p>Firebase handles account authentication and signed-in active chat storage. Guest chats stay in memory. Saved conversations and guest preferences use your browser’s local storage. Saved conversations can remain on this device after logout; use the conversation menu to delete them, or clear this site’s browser data. Preferences provides an export of currently loaded data and a control to clear the active chat.</p>
      <h2>Retention and providers</h2><p>Automatic deletion and account deletion are not implemented. Active messages remain until you clear them, and device archives remain until you delete them or clear browser data. Provider-side retention and the operator’s deletion process must be confirmed before launch. Setting API response storage off does not eliminate all provider retention.</p>
      <h2>Usage controls</h2><p>The API stores daily quota counts and budget reservations with a keyed hash of the network IP address. It does not store message content in its usage ledger. Server event logs contain status, route and a random request ID; hosting services may have separate access logs.</p>
      <h2>Optional analytics</h2><p>Analytics is off until you opt in on this browser. When configured, consented analytics uses Google Analytics. Google Fonts is currently requested for the interface font. You can withdraw analytics consent below.</p><AnalyticsConsent />
      <h2>Privacy contact</h2><p>{email(privacy)}</p></>}
    {page === 'terms' && <><h1>Usage information</h1><p>Aura is an AI companion for everyday reflection. It is not a clinician, diagnosis service, or emergency service. Responses can be inaccurate; seek qualified professional advice for decisions about your health.</p><p>In immediate danger, contact local emergency services. Aura cannot arrange emergency help.</p><h2>Available features</h2><p>Guests can use the app. AI requests are paused until the operator configures a daily budget. Once enabled, there is a shared limit of 3 requests per minute and 10 per day per IP address, resetting at midnight UTC; people using the same network share these limits. A global budget can stop requests earlier.</p><p>Paid subscriptions, appointment booking, cross-conversation AI memory, web search, and code execution are not available. Doctor profiles are demonstration data.</p><p>Operator-specific terms and applicable jurisdictions must be finalized before public launch.</p></>}
    {page === 'contact' && <><h1>Contact</h1><h2>Operator</h2><p>{operator || 'Operator information has not been configured for public launch.'}</p><h2>Support</h2><p>{email(support)}</p><h2>Privacy requests</h2><p>{email(privacy)}</p><p>Aura does not provide emergency support. In immediate danger, contact local emergency services.</p></>}
    <p><Link to="/">Back to Aura</Link></p>
  </main></div>;
}
