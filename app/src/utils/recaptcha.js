import { RECAPTCHA_VERIFY_URL } from '@/src/config/appConfig';

/**
 * Sends a solved reCAPTCHA token to the verify worker so it's actually
 * checked server-side, not just solved in the WebView. Mirrors the website's
 * src/lib/recaptcha.js — same worker, same contract.
 */
export async function verifyRecaptchaToken(token) {
  if (!RECAPTCHA_VERIFY_URL) return true;
  try {
    const res = await fetch(RECAPTCHA_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    return !!data.ok;
  } catch (e) {
    return false;
  }
}
