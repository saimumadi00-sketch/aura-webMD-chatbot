// The PHP portal is a separate website; never fall back to a local PHP path.
export function externalPortalUrl(value) {
  try {
    const url = new URL(String(value || '').trim());
    return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
}
