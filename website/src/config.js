// ---------------------------------------------------------------------------
// Website configuration. The values marked "PASTE" are account-specific.
// ---------------------------------------------------------------------------

// NOTE: There is intentionally no admin passphrase. Superusers are provisioned
// by hand in the Firebase console (set role: "superuser" on the user doc); the
// security rules only let a client create a normal account.

// reCAPTCHA v2 ("I'm not a robot") SITE key used before submitting a review.
// This is the PUBLIC key (safe to ship); the matching SECRET key is only for
// server-side verification and is NOT used here — keep the secret key private.
// Registered for king-cake-app.web.app; add localhost in the reCAPTCHA admin
// console if you want the check to run during local `npm run dev`.
export const RECAPTCHA_SITE_KEY = 'YOUR_RECAPTCHA_SITE_KEY';

// PASTE the URL printed by `npm run deploy` in recaptcha-verify-worker/ once
// deployed (looks like "https://king-cake-recaptcha-verify.<subdomain>.workers.dev").
// Without this, the checkbox is solved but never actually verified server-side.
export const RECAPTCHA_VERIFY_URL = 'https://YOUR-RECAPTCHA-WORKER.YOUR-SUBDOMAIN.workers.dev';

// Same pattern, second worker: scores review text for toxicity via Perspective
// API on top of the keyword filter in lib/profanity.js. Fails open (never
// blocks a review) if the worker's PERSPECTIVE_API_KEY isn't set yet.
export const MODERATION_CHECK_URL = 'https://YOUR-MODERATION-WORKER.YOUR-SUBDOMAIN.workers.dev';
export function recaptchaVerifyConfigured() {
  return !!RECAPTCHA_VERIFY_URL;
}

export const REVIEW_MAX_CHARS = 500;
export const AVG_DRIVING_SPEED_MPH = 32;

// Ads are handled entirely by Google AdSense Auto Ads (see the loader script
// in index.html) — no manual ad-slot placement needed in the app code.

// ---- Mobile app store links (WEBSITE ONLY) ---------------------------------
// PASTE the real store URLs once the app is published. Until then the download
// popup shows "coming soon" for any link left as a placeholder.
export const APP_STORE_URL = 'https://apps.apple.com/us/app/king-cake-finder/id6801690462';
export const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.kingcakefinder.app';
export function storeLinkReady(url) {
  return url && !url.includes('XXXX');
}

export const SITE_NAME = 'King Cake Finder';
