// ---------------------------------------------------------------------------
// App-wide configuration constants
// ---------------------------------------------------------------------------

// NOTE: There is intentionally no admin passphrase in the app. Superusers are
// provisioned by hand in the Firebase console (open the user's document in
// Firestore and set role: "superuser"). The security rules only let a client
// create a normal account, so admin can never be self-granted from the app.

// reCAPTCHA v2 ("I'm not a robot" Checkbox) SITE key used by the WebView-based
// bot check before a review is submitted. This is the PUBLIC key (safe to ship);
// the matching SECRET key is only for server-side verification and is NOT used
// here (no Cloud Functions on the Spark tier) — keep the secret key private.
// Registered for the domain king-cake-app.web.app in the reCAPTCHA admin console.
export const RECAPTCHA_SITE_KEY = 'YOUR_RECAPTCHA_SITE_KEY';

// The WebView loads reCAPTCHA from this origin. reCAPTCHA validates the domain
// against the list registered with your site key, so this must match a domain
// registered for the key above. king-cake-app.web.app is registered, so the
// WebView presents that origin (works in Expo Go and the built app alike).
export const RECAPTCHA_DOMAIN = 'https://king-cake-app.web.app';

// Server-side verification endpoint (a Cloudflare Worker — the only backend
// this project has). The checkbox above only produces a token client-side;
// this actually checks it with Google using the secret key, which never
// ships in the app. Shared with the website's recaptcha-verify-worker/.
export const RECAPTCHA_VERIFY_URL = 'https://YOUR-RECAPTCHA-WORKER.YOUR-SUBDOMAIN.workers.dev';

// Same pattern, second worker: scores review text for toxicity via Perspective
// API on top of the keyword filter in utils/profanity.js. Fails open (never
// blocks a review) if the worker's PERSPECTIVE_API_KEY isn't set yet. Shared
// with the website's moderation-check-worker/.
export const MODERATION_CHECK_URL = 'https://YOUR-MODERATION-WORKER.YOUR-SUBDOMAIN.workers.dev';

// Maximum length of a review's text body (also enforced in the UI + rules).
export const REVIEW_MAX_CHARS = 500;

// Rough average driving speed (miles per hour) used to estimate travel time
// when a live maps ETA is not available. Kept intentionally conservative for
// mixed city/highway driving.
export const AVG_DRIVING_SPEED_MPH = 32;

// Where the in-app privacy policy links out to. Replace with your hosted
// policy URL if you publish one; the app also ships a full in-app copy.
export const PRIVACY_POLICY_URL = 'https://kingcakefinder.example.com/privacy';

// Contact address surfaced in the privacy policy / support copy.
export const SUPPORT_EMAIL = 'support@kingcakefinder.example.com';
