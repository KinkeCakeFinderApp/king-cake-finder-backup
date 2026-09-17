# King Cake Finder — Public Backup

Public backup of the King Cake Finder mobile app + website source code.

- `app/` — Expo/React Native mobile app (Expo SDK 54, Expo Router). See `app/HANDOFF.md` for full project context, conventions, and outstanding work.
- `website/` — Vite + React companion website.

`node_modules` and build output are excluded (run `npm install` in each folder to restore them).

**Account-specific values are redacted** (Firebase project keys, reCAPTCHA site key, AdSense publisher ID, Cloudflare worker URLs, EAS project ID, and `scripts/.env`) — replaced with `YOUR_*` placeholders so the code structure stays intact and buildable once you paste your own values back in. See each file's comments for where to get them.
