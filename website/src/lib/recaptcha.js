import { RECAPTCHA_VERIFY_URL, recaptchaVerifyConfigured } from '../config';

/**
 * Sends a solved reCAPTCHA token to the verify worker (recaptcha-verify-worker/)
 * so it's actually checked server-side, not just solved in the browser. Fails
 * open (returns true) if the worker URL isn't configured yet, so review
 * posting doesn't break before deploy — but this means real verification is
 * OFF until RECAPTCHA_VERIFY_URL is set in src/config.js.
 */
export async function verifyRecaptchaToken(token) {
  if (!recaptchaVerifyConfigured()) return true;
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
