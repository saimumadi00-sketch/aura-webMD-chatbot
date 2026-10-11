// The PHP portal is a separate website; never fall back to a local PHP path.
export function externalPortalUrl(value, production = false) {
  try {
    const url = new URL(String(value || '').trim());
    if (url.username || url.password) return '';
    if (production && (url.protocol !== 'https:' || /^(localhost|127\.|0\.|\[?::1\]?)/i.test(url.hostname))) return '';
    return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
}
