# 👑 King Cake Finder — Website

The companion **website** for the King Cake Finder mobile app. It shares the
**exact same Firebase backend** (Authentication + Cloud Firestore) as the Expo
app, so bakeries, accounts, and reviews are the same across app and web. This
site also carries **Google ads** (the app does not) and shows an **app-download
popup**.

> This is the `website` branch. The mobile app lives on its own branch — the two
> are separate deliverables and drift apart over time. Shared code (Firebase
> config, profanity filter) is **copied**, not merged.

Built with **React + Vite**, deployed on **Firebase Hosting** (free Spark tier)
inside the same Firebase project as the app.

---

## Features
- Home with a prominent search + app call-to-action, and your favorites when logged in
- Search/browse with all sorts & filters (rating, count, closest via browser GPS, price, brick/home/ships)
- Per-bakery pages at `/bakery/{id}` (shareable, SEO-friendly) with maps links, pricing, phone, reviews
- Shared auth (same account as the app), favorites, account deletion
- Reviews with king-cake ratings, 500-char limit, **reCAPTCHA**, auto-moderation, and transactional rating updates
- Superuser **Admin** (bakery add/edit/delete + moderation queue)
- **Google AdSense** ad slots (website only), **cookie consent**, **app-download popup**, privacy policy

---

## Run it locally
```bash
npm install
npm run dev        # http://localhost:5173
```

The Firebase config in `src/firebase.js` is already set to the app's
`king-cake-app` project (same web keys — safe to expose, protected by rules). To
point at a different project, replace those values.

---

## Deploy to Firebase Hosting
One-time setup on this branch:
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
#  • Use existing project → king-cake-app
#  • Public directory:  dist
#  • Single-page app (rewrite all URLs to /index.html):  Yes
#  • Overwrite dist/index.html:  No
```
(`firebase.json` + `.firebaserc` are already included with SPA rewrites, so you
can usually skip `firebase init` and just deploy.)

Build & deploy:
```bash
npm run build
firebase deploy --only hosting
```
You'll get a free `https://king-cake-app.web.app` URL with automatic SSL. Add a
custom domain later in the Firebase console. This deploys **hosting only** — it
never touches the app's Firestore rules.

---

## Things to fill in (all in `src/config.js`, clearly marked)
- **`ADSENSE_CLIENT` / `AD_SLOTS`** — your Google AdSense publisher ID + ad slot IDs.
  AdSense must **approve your site first** (needs real content, a privacy policy,
  and some traffic). Ad slots render a labeled placeholder until then, and only
  show real ads after the visitor accepts cookies.
- **`APP_STORE_URL` / `PLAY_STORE_URL`** — the real store links once the app is
  published. Until then the download popup shows "coming soon."
- **`RECAPTCHA_SITE_KEY`** — ships with Google's public test key (always passes).
  Create your own v2 checkbox key and register your web domain for production.
- **`ADMIN_PASSPHRASE`** — keep it identical to the app if you want the same secret.

---

## Important: making the site public (optional but recommended)
The app's Firestore rules require **login to read bakeries**. So right now the
website only shows bakeries to logged-in users. For a truly public site (better
for SEO and ads, which need traffic), make bakeries and published reviews
publicly readable. In the **app's** `firestore.rules`, change:

```
match /bakeries/{bakeryId} {
  allow read: if true;                       // was: if isSignedIn()
  allow create, update, delete: if isSuperuser();

  match /reviews/{reviewUid} {
    allow read: if resource == null
      || resource.data.status == 'published'          // anyone can read published reviews
      || (request.auth != null && resource.data.authorUid == request.auth.uid)
      || isSuperuser();
    // ...create/update/delete unchanged...
  }
}
```

The website code already handles both cases: it works for logged-in users now,
and becomes fully public the moment you apply the rule above — no code change.

---

## Shared data model (do not create a new database)
`users/{uid}`, `bakeries/{bakeryId}`, `bakeries/{bakeryId}/reviews/{uid}`,
`moderationQueue/{id}`, `messages/{uid}/items/{id}` — identical to the app.
List views read lean summary fields; full detail + reviews load only on a bakery
page; the bakery list is cached in memory. Same free-tier discipline as the app.
