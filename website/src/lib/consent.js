// Simple cookie-consent state for ad/analytics cookies. Ads load only after
// the visitor accepts (now used by AdSense Auto Ads).
const KEY = 'kcf_cookie_consent';

export function getConsent() {
  try { return localStorage.getItem(KEY); } catch (e) { return null; }
}
export function hasAdConsent() {
  return getConsent() === 'accepted';
}
export function setConsent(value) {
  try { localStorage.setItem(KEY, value); } catch (e) { /* ignore */ }
  window.dispatchEvent(new CustomEvent('kcf-consent', { detail: value }));
}
