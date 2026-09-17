# reCAPTCHA verify worker

The only backend this project has. It exists for one reason: the reCAPTCHA
checkbox on the website only produces a token in the browser — Google
requires a **separate server-side request** (with the secret key) to check
that token is real before you can trust it. Without this, the checkbox is
just UI friction with no actual bot-blocking (which is what triggered
Google's "You aren't protected" email).

## One-time setup

1. **Get the secret key** (this is different from the public site key
   already in the app). In the reCAPTCHA Enterprise console
   (https://console.cloud.google.com/security/recaptcha), open the key
   `YOUR_RECAPTCHA_SITE_KEY` → **Integration** tab → look for
   "Use legacy secret key" (this is the classic v2/v3-style secret that works
   with the `siteverify` endpoint this worker calls — it's what makes an
   Enterprise-created key compatible with the checkbox already embedded on
   the site). Copy it — you'll paste it once in step 3, nowhere else.

2. **Create a free Cloudflare account** (no credit card required):
   https://dash.cloudflare.com/sign-up

3. From this directory (`recaptcha-verify-worker/`):
   ```
   npm install
   npx wrangler login          # opens a browser to authorize the CLI
   npx wrangler secret put RECAPTCHA_SECRET
   #   ^ paste the secret key from step 1 when prompted — it's stored
   #     encrypted by Cloudflare, never committed to this repo
   npm run deploy
   ```
   Wrangler prints the deployed URL, something like:
   `https://king-cake-recaptcha-verify.<your-subdomain>.workers.dev`

4. Give that URL to whoever is updating the website code (or paste it into
   `src/config.js` as `RECAPTCHA_VERIFY_URL` yourself) and rebuild/redeploy
   the site (`npm run build && firebase deploy --only hosting`).

## Ongoing

- Free tier: 100,000 requests/day — reviews on this app won't come close.
- Nothing else to maintain; the worker is stateless and has no database.
- If you ever rotate the reCAPTCHA secret, just re-run
  `npx wrangler secret put RECAPTCHA_SECRET`.
