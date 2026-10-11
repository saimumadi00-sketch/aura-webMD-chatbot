const key = 'aura-analytics-consent';
export const readAnalyticsConsent = () => {
  try { return localStorage.getItem(key) === 'granted'; } catch { return false; }
};
export function saveAnalyticsConsent(granted) {
  try { localStorage.setItem(key, granted ? 'granted' : 'denied'); } catch { /* Keep this tab's choice. */ }
  window.dispatchEvent(new CustomEvent('aura-analytics-consent', { detail: granted }));
}
