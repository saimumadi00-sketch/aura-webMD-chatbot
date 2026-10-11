import React, { useEffect, useState } from 'react';
import { readAnalyticsConsent, saveAnalyticsConsent } from '../services/analytics-consent';

export default function AnalyticsConsent() {
  const [granted, setGranted] = useState(readAnalyticsConsent);
  useEffect(() => {
    const sync = () => setGranted(readAnalyticsConsent());
    window.addEventListener('storage', sync);
    window.addEventListener('aura-analytics-consent', sync);
    return () => { window.removeEventListener('storage', sync); window.removeEventListener('aura-analytics-consent', sync); };
  }, []);
  const choose = value => { saveAnalyticsConsent(value); setGranted(value); };
  return <details className="analytics-consent">
    <summary>Analytics preferences</summary>
    <p>Optional analytics helps us understand how Aura is used. It is off until you choose to allow it. Changing this choice does not affect chat.</p>
    <p role="status">Analytics is {granted ? 'allowed' : 'off'} on this browser.</p>
    <div><button type="button" onClick={() => choose(false)} aria-pressed={!granted}>Keep analytics off</button><button type="button" onClick={() => choose(true)} aria-pressed={granted}>Allow analytics</button></div>
  </details>;
}
