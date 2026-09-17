# 👑 King Cake Finder

Find the best **king cakes** near you — a Louisiana tradition. Browse bakeries,
see distance / price / ratings, read and write reviews, and favorite the ones
you love. Superusers manage listings and moderate content.

Built with **Expo (React Native) + Expo Router** on the frontend and **Firebase
(Spark free tier)** on the backend — Authentication + Cloud Firestore. No paid
services required.

---

## ✨ Features

- **Accounts** — email/password sign up (username, first/last name, email) and
  log in, with persisted sessions. In-app **account deletion** (store
  compliance) and a **secret passphrase-gated superuser signup**.
- **Search** — the main screen. Case-insensitive, partial matching across
  bakery name, address, cake variations and description. A filter sheet offers
  sort by highest/lowest rating, most/fewest ratings, closest (GPS), and
  price high↔low, plus filters for brick-and-mortar / home bakery / ships.
- **King-cake ratings** — ratings are rendered as 1–5 king-cake icons (not
  stars). Denormalized `avgRating` / `ratingCount` on each bakery keep lists
  cheap to read.
- **Bakery detail** — description, a variations→price table, address with
  **Open in Apple Maps / Google Maps** deep links, GPS distance + travel-time
  estimate, tap-to-call phone, shipping status, favorite toggle, and reviews.
- **Reviews** — one review per user (keyed by uid), a 1–5 king-cake rating
  above a 500-character text box with a live counter, a **reCAPTCHA** bot check
  before submitting, and **auto-moderation**. Ratings recompute instantly in a
  Firestore transaction.
- **Moderation** — flagged reviews are held (not public) and land in a
  superuser **moderation queue**, where they can be edited + published, deleted,
  or the author can be messaged. Users can also **report** any review.
- **Admin** — a role-gated tab: moderation queue, add / edit / delete bakeries
  (with address geocoding for distance sorting), and a one-tap sample-data
  seeder.
- **Home / History / Settings** — favorites, your past reviews, and a settings
  tab with notifications + light/dark theme toggles, privacy policy, inbox,
  logout and account deletion.
- **Polish** — a warm Mardi Gras palette (purple / green / gold) used as
  accents, full light + dark theming, thoughtful empty/loading states.

---

## 🚀 Getting started

### 1. Install dependencies

```bash
npm install
```

> Tip: to align native module versions with your installed Expo SDK, you can run
> `npx expo install` after the first `npm install`.

### 2. Create a Firebase project (free Spark tier)

1. Go to the [Firebase console](https://console.firebase.google.com/) and create
   a project.
2. **Authentication → Sign-in method →** enable **Email/Password**.
3. **Firestore Database →** create a database (production mode is fine — we ship
   rules below).
4. **Project settings → Your apps →** add a **Web app** and copy its config.

### 3. Paste your Firebase keys

Open **`src/firebase/config.js`** and replace the placeholder values in
`firebaseConfig` with your own. These are account-specific and are the *only*
thing you must fill in. Until you do, the app shows a friendly setup screen.

### 4. Deploy the security rules & indexes

Install the Firebase CLI, then from the project root:

```bash
npm install -g firebase-tools
firebase login
firebase use --add        # pick your project
firebase deploy --only firestore:rules,firestore:indexes
```

`firestore.rules` and `firestore.indexes.json` (wired up in `firebase.json`)
enforce the access model and create the composite indexes the app queries need.

### 5. (Optional) Configure reCAPTCHA & the admin passphrase

Open **`src/config/appConfig.js`**:

- `ADMIN_PASSPHRASE` — change this secret. It is the only way (besides the
  Firebase console) to create a superuser.
- `RECAPTCHA_SITE_KEY` / `RECAPTCHA_DOMAIN` — ships with Google's public **test**
  key (always passes) so it works out of the box. For production, create a
  reCAPTCHA **v2 “I'm not a robot” checkbox** key, register your domain, and
  paste both here.

### 6. Run it

```bash
npm start        # then press i / a, or scan the QR with Expo Go
```

---

## 👑 Becoming a superuser

Superusers are never self-serve through normal signup. Two ways to provision:

1. **Secret in-app path** — on the welcome screen, **long-press the logo** (~1.2s)
   to reach the hidden admin signup, then enter the `ADMIN_PASSPHRASE`.
2. **Firebase console** — set an existing user's `role` field to `"superuser"`
   in `users/{uid}`.

Once a superuser is signed in, the **Admin** tab appears. It is completely
removed from the tab layout for normal users, guarded in each admin screen, and
enforced again in the security rules.

> Sample data: in the Admin tab, **“Add sample bakeries”** seeds a handful of
> fictional New Orleans bakeries (with real coordinates) so you can try search,
> distance sorting, favorites and reviews immediately.

---

## 🗂 Project structure

```
app/                         Expo Router routes (file-based)
  _layout.js                 Providers, auth gating, config notice
  index.js                   Entry redirect
  (auth)/                    welcome, login, signup, admin-signup (secret)
  (tabs)/                    index(Home), search, history, settings, admin
  bakery/[id].js             Bakery detail + reviews + composer
  admin/                     add-bakery, manage, edit-bakery/[id], moderation
  inbox.js                   User inbox (moderation DMs)
  privacy-policy.js          In-app privacy policy
src/
  firebase/config.js         Firebase init (PASTE YOUR KEYS HERE)
  config/appConfig.js        Passphrase, reCAPTCHA, limits
  context/                   ThemeContext, AuthContext, DataContext
  services/                  users, bakeries, reviews, moderation, messages, seed
  components/                Reusable UI (KingCakeRating, BakeryCard, ...)
  utils/                     distance (haversine), search, profanity, maps, ...
  theme/colors.js            Palette, spacing, typography tokens
firestore.rules              Security rules (deploy these)
firestore.indexes.json       Composite indexes (deploy these)
```

---

## 💸 Free-tier efficiency

- Lists read **lean summary docs only** (never the reviews subcollection); heavy
  data loads only when a detail page opens.
- The full bakery list is **fetched once in paginated batches and cached in
  memory** (React Context), refreshed on pull-to-refresh or after a mutation.
- Rating summaries are **denormalized** onto each bakery and updated
  incrementally inside a transaction, so ratings never require reading the whole
  reviews subcollection.
- History uses a **collection-group query filtered by `authorUid`** instead of
  scanning every bakery.

---

## 🔐 Security model (see `firestore.rules`)

- A user can read/write **only their own** `users/{uid}` doc and can never change
  their own `role`.
- Any signed-in user can **read** bakeries; only superusers can create/update/
  delete them.
- A user can only write a review at `bakeries/{id}/reviews/{their own uid}`
  (one per user), with a validated 1–5 rating and ≤500-char body.
- Only superusers can read the `moderationQueue` and resolve entries; a reviewed
  author cannot delete a report filed against them.
- Users read/update only their own `messages/{uid}/...`; only superusers write
  into another user's inbox.

### Notes / trade-offs on the free tier

- **Content moderation runs client-side** (no Cloud Functions on Spark). The
  profanity filter (`src/utils/profanity.js`) flags a review before it's
  published; flagged reviews are held for a human. This is enforced in the app,
  not in rules.
- **Superuser signup writes `role: "superuser"` from the client**, gated by a
  client-side passphrase (rules can't verify a passphrase without a backend).
  For a hardened deployment, provision superusers via the console only and
  tighten the `users` create rule to `role == 'user'` (a comment in
  `firestore.rules` marks the exact line).
- **Username uniqueness is best-effort** (“unique-ish”): the strict rules don't
  allow reading other users' docs, so the check degrades gracefully.
- When a user **deletes their account**, their reviews are removed; affected
  bakery averages are recomputed where permitted.

---

## 📱 Store compliance

- Privacy policy included and linked in-app (Settings → Privacy policy).
- Location permission requested with a specific purpose string; the app works
  fully without location (you just lose distance/closest sorting).
- UGC handling: auto-moderation, user reporting, superuser removal, and author
  messaging.
- In-app account deletion.

---

## 🖼 Images (future-proof)

The schema leaves room for an optional `imageUrl` / `photos[]` on bakeries.
Store files in **Firebase Storage** (compress/resize on-device first) and keep
only the download URL in Firestore. `src/firebase/config.js` already exports a
`storage` instance for when you add this.
