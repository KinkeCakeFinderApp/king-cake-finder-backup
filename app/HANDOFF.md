# King Cake Finder — Project Handoff

A complete summary of the project for whoever (or whatever) picks it up next.
Read this top to bottom before making changes.

---

## 1. What this is

**King Cake Finder** — a mobile app + companion website for discovering, rating,
and reviewing bakeries that sell king cakes (a New Orleans / Mardi Gras
tradition). Users browse bakeries, see them on a map, read/write reviews, save
favorites, and get distance to each bakery. There is a superuser/admin role for
managing bakery listings and moderating content.

Both surfaces share **one Google Firebase backend** (the same accounts and the
same database), so a change to data shows up on both.

---

## 2. Tech stack & repo layout

- **Repo:** `harrisikeda-lab/king-cake-tracker-app`
- **Mobile app** — Expo SDK 54, React Native 0.81, Expo Router v6 (file-based
  routing under `app/`, tab group `app/(tabs)`, auth group `app/(auth)`).
  - Branch: **`claude/new-session-jm9m0q`**
- **Website** — Vite + React + react-router-dom v6 (pages under `src/pages/`).
  - Branch: **`website`**
- **Backend** — Firebase v10 modular SDK: Authentication (email/password) +
  Cloud Firestore. Firebase project id: **`king-cake-app`** (Spark / free tier).
- **Maps** — Leaflet + OpenStreetMap tiles (free, **no API key**). The app
  renders maps inside a WebView; the website loads Leaflet from a CDN.

Bundle / package id (iOS + Android): **`com.kingcakefinder.app`**

### Running / building
- **App (dev):** `npm install` then `npx expo start -c` (add `--tunnel` only if
  the phone and dev machine aren't on the same Wi‑Fi). Test in Expo Go.
- **App (store builds):** EAS cloud builds — `eas build --platform android
  --profile production` (AAB) / `--profile preview` (test APK);
  `eas build --platform ios --profile production` (needs Apple Developer
  enrollment; EAS makes the certs). Then `eas submit`.
- **Website:** `npm run build` then `firebase deploy --only hosting`.

---

## 3. Firebase details

- **Web config** (apiKey/appId/etc.) lives in `src/firebase/config.js` (app) and
  `src/firebase.js` (website). These are **public by design and safe to commit** —
  do not treat them as secrets.
- **reCAPTCHA v2 ("I'm not a robot" Checkbox)** — site key
  `YOUR_RECAPTCHA_SITE_KEY` is in the client config (public).
  The matching **secret key is private and is NOT in the repo** and is not used
  (no server on the free tier). The key must have `king-cake-app.web.app` listed
  under its Domains in the reCAPTCHA admin console.
- **Security rules** live in `firestore.rules` (on the app branch — source of
  truth). The owner deploys rules by **pasting them into the Firebase console**
  (Firestore → Rules → Publish); they do NOT use the Firebase CLI/service account.
- **Admins (superusers):** there is intentionally **no in-app admin creation**.
  To make someone an admin, open their doc in Firestore console `users/{uid}` and
  set `role: "superuser"`. (See `a.txt` Section 2b.)

### ⚠️ The single most important engineering rule
**Never write a Firestore query that requires a deployed index.** The owner only
pastes *rules*, never *indexes*. Every list query in this project is deliberately
written to use only Firestore's automatic single-field indexes (query one
equality field, sort in JS) or to read documents directly. Collection-group
queries and `where + orderBy` combinations were all removed because the required
indexes were never deployed and silently broke features (History, moderation
queue, support queue, account deletion). If you add a feature that needs a
different query, either keep it index-free the same way, or you must also get the
owner to deploy `firestore.indexes.json` (they historically have not).

---

## 4. Features currently implemented (app + website unless noted)

- **Guest browsing** — browse bakeries/reviews with no account; login is only
  prompted at an account action (review, favorite, report, block, inbox,
  support). Welcome screen has "Browse without an account."
- **Auth** — email/password sign up / log in / **password reset ("Forgot
  password?")** / **in-app account deletion** (Settings/Account → Delete account,
  removes the user's reviews, moderation entries, inbox, support tickets, profile).
- **Bakery browsing** — Search with filters/sort; **Map tab/page** showing all
  bakeries as pins (tap → open); bakery detail with pricing/variations, phone,
  address, **an embedded map (you + bakery + distance line)**, and Apple/Google
  Maps links.
- **Reviews & ratings** — one review per user per bakery, king-cake (cupcake)
  rating, auto-moderation profanity filter, reCAPTCHA before posting. Reviews are
  public.
- **UGC safety (Apple 1.2)** — **report** a review, **block** a user (hides their
  reviews; unblock in Settings/Account), admin moderation queue + remove review +
  message the author.
- **Favorites** and **History** (your reviews).
- **Admin** (superuser only) — add/edit/delete bakeries, moderation queue,
  support ticket inbox, mark up to 5 bakeries **sponsored**.
- **Sponsored** — admin-marked sponsored bakeries surface on Home; a paid
  **"Sponsored by kingcakeknives.com"** banner sits atop Home/Search (app) and
  every page (website).
- **Compliance** — in-app Privacy Policy and **Terms of Service** (with a
  zero-tolerance UGC clause + food/allergen disclaimer), a required "I agree to
  the Privacy Policy & Terms of Service" checkbox on login/signup, and a
  **food-safety "Before you eat" warning** on every bakery page (hidden
  baby/trinket choking hazard, allergens, no-guarantee).
- **Website extras** — Google AdSense (publisher `ca-pub-XXXXXXXXXXXXXXXX`, ad
  slot `5785421511`), cookie consent, app-download popup, support email
  `Kingcakeknives@gmail.com` in the footer. **The mobile app has no ad SDK/tracking**
  but does show the sponsored placements.

---

## 5. Notable fixes made (so you don't re-break them)

- Rewrote all index-dependent queries to be **index-free** (see §3): published
  reviews, moderation queue, support queue, History (`getMyReviews` reads each
  bakery's review doc directly), account deletion, username-uniqueness.
- **Search keyboard** used to close after one keystroke — the search box was in
  the FlatList header and remounted on each change. It's now a **fixed header
  above** the list. Keep it out of the list.
- **reCAPTCHA modal** is **full-screen** so the image challenge fits on phones.
- **Admin privilege-escalation** fixed: removed the hardcoded passphrase + hidden
  admin-signup; rules only allow self-serve `role: "user"`.
- Icons: the iOS app icon is 1024×1024 **with no alpha** (Apple requires this) —
  don't reintroduce transparency to `assets/icon.png`.

---

## 6. App-store submission status

### Apple App Store
- App record exists (App Store Connect app id **6801690462**), bundle
  `com.kingcakefinder.app`. A build (1.0.0 (3)) was uploaded.
- **Status: REJECTED under Guideline 2.1 – Information Needed** (this is a routine
  "please send info" rejection, not a code defect).
- Screenshots are done and correctly sized: **6.5" iPhone 1242×2688** and **13"
  iPad 2048×2732** (generated for the owner).
- **To get unblocked**, the owner must reply in the Resolution Center with: a
  demo account (`test@gmail.com` / `123456` — must actually be created in the
  app), a screen recording on a physical iPhone showing the core flows, and the
  written answers (an essentials notes block was drafted — see chat / `a.txt`).
  No new build required to reply.

### Google Play
- Developer account **setup is incomplete**: identity verification pending
  (documents uploaded, Google reviewing), and Google requires **verifying a real
  Android device** by signing into the Play Console app on one (Waydroid /
  emulators do not reliably pass this). New personal developer accounts also must
  run **closed testing with 12+ testers for 14 days** before production.
- Build command for the store: `eas build --platform android --profile production`
  (AAB). Because of the sponsored placements, answer **"Contains ads: Yes."**

Full step-by-step for both stores + the compliance checklist is in **`a.txt`** at
the repo root (app branch).

---

## 7. Outstanding action items (for the owner)

1. **Re-publish `firestore.rules`** in the Firebase console — required for the
   admin lockdown and support-ticket deletion changes to take effect.
2. **Deploy the website** (`npm run build` → `firebase deploy --only hosting`) and
   **rebuild the app** so all recent changes ship.
3. **Apple:** create the `test@gmail.com` account, record the demo video, reply in
   the Resolution Center with the notes + video, resubmit.
4. **Google:** finish account setup (verify a real Android device; identity
   verification is pending on Google's side), then build/upload the AAB.

---

## 8. Conventions for whoever works on this next

- **Both surfaces:** most changes should be mirrored on the app **and** the
  website (they share the backend and users expect parity). Switch branches with
  `git checkout claude/new-session-jm9m0q` (app) / `git checkout website`.
- **Index-free queries only** (see §3) — this is the easiest thing to get wrong.
- **Never commit secrets:** the reCAPTCHA *secret* key, any Firebase service
  account JSON. The Firebase *web* config and reCAPTCHA *site* key are public and
  intentionally committed.
- **Validate before committing:** the website has a real build (`npm run build`);
  for the app there's no local build here, so keep imports/exports consistent and
  parse-check.
- After edits, **commit and push** to the correct feature branch.
- Data model lives in Firestore: `bakeries/{id}` (+ `reviews/{uid}` subcollection),
  `users/{uid}` (fields incl. `role`, `favorites`, `blockedUsers`),
  `moderationQueue/{id}`, `supportTickets/{id}`, `messages/{uid}/items/{id}`.

---

_Last updated at the point of handoff. The chat history has the blow-by-blow;
this file is the durable summary._
