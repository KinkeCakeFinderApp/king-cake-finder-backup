#!/usr/bin/env node
// King Cake Finder — bulk bakery importer.
//
// Standalone script: uses the Firebase SDK directly (same public config
// already shipped in the app/website), completely separate from the app's
// own code. Signs in as a superuser (Firestore rules require that role to
// create bakery documents) and writes one Firestore doc per CSV row —
// exactly what the admin "Add bakery" form does, just looped.
//
// Usage:
//   node scripts/import-bakeries.js scripts/bakeries-template.csv
//   node scripts/import-bakeries.js mybakeries.csv --dry-run
//
// Credentials: create scripts/.env (copy scripts/.env.example) with
// SUPERUSER_EMAIL / SUPERUSER_PASSWORD and it's loaded automatically — no
// prompt, no retyping each run. That file is gitignored-equivalent by being
// listed in .gitignore; never commit it. Env vars set in your shell also
// work and take priority. Without either, the script just prompts you.
//
// CSV columns — see scripts/bakeries-template.csv:
//   name, address, phone, description,
//   home_bakery (yes/no), brick_and_mortar (yes/no), shipping (yes/no),
//   price1_name, price1, price2_name, price2, price3_name, price3
// Address is auto-geocoded; add more price columns (price4_name/price4, ...)
// if a bakery needs more than 3 price tiers — no other change needed.

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const readline = require('readline');
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword, signOut } = require('firebase/auth');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

// Public web config — safe to embed (same values as src/firebase/config.js).
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  databaseURL: 'https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.firebasestorage.app',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: '1:YOUR_SENDER_ID:web:ee8bcc43241b9a28da52dd',
  measurementId: 'YOUR_MEASUREMENT_ID',
};

const GEOCODE_DELAY_MS = 1100; // Nominatim's usage policy: max 1 request/sec.

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((f) => f.trim() !== '')) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }

  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (r[i] || '').trim(); });
    return obj;
  });
}

// Reads every "priceN_name" / "priceN" column pair present in the row (the
// template ships 3, but more work automatically if you add price4_name/
// price4, etc.) — each is just plain text and a plain number, no encoding.
function readVariationColumns(row) {
  const indexes = new Set();
  Object.keys(row).forEach((k) => {
    const m = k.match(/^price(\d+)_name$/);
    if (m) indexes.add(Number(m[1]));
  });
  return [...indexes]
    .sort((a, b) => a - b)
    .map((i) => ({ name: row[`price${i}_name`]?.trim() || '', price: row[`price${i}`] }))
    .filter((v) => v.name)
    .map((v) => ({ name: v.name, price: Number(v.price) }))
    .filter((v) => !Number.isNaN(v.price));
}

function parseBool(raw) {
  const v = String(raw || '').trim().toLowerCase();
  return v === 'yes' || v === 'true' || v === '1';
}

function rowToBakery(row) {
  const errors = [];
  const name = row.name?.trim();
  const address = row.address?.trim();
  if (!name) errors.push('missing name');
  if (!address) errors.push('missing address');

  const isHomeBakery = parseBool(row.home_bakery);
  const isBrickAndMortar = parseBool(row.brick_and_mortar);
  if (!isHomeBakery && !isBrickAndMortar) errors.push('set home_bakery and/or brick_and_mortar to "yes"');

  const variations = readVariationColumns(row);
  if (variations.length === 0) errors.push('no valid prices (fill in price1_name + price1, at least)');

  let coords = null;
  if (row.lat && row.lng) {
    const lat = parseFloat(row.lat);
    const lng = parseFloat(row.lng);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) coords = { lat, lng };
  }

  return {
    errors,
    bakery: {
      name,
      address,
      phone: row.phone?.trim() || '',
      description: row.description?.trim() || '',
      shipping: parseBool(row.shipping),
      isHomeBakery,
      isBrickAndMortar,
      variations,
      coords, // null means "geocode it"
    },
  };
}

// Nominatim indexes buildings, not individual units — a suite/apt/unit
// number in the query reliably makes it return zero results even when the
// building itself is a perfect match. Strip it for a fallback retry.
function stripUnitNumber(address) {
  return address.replace(/,?\s*(?:ste|suite|unit|apt|apartment|#)\.?\s*\S+/i, '');
}

async function nominatimSearch(q) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
    { headers: { 'Accept-Language': 'en', 'User-Agent': 'king-cake-finder-bulk-import/1.0' } }
  );
  const data = await res.json();
  if (Array.isArray(data) && data.length > 0) {
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  }
  return null;
}

async function geocodeAddress(address) {
  try {
    const direct = await nominatimSearch(address);
    if (direct) return direct;

    const stripped = stripUnitNumber(address);
    if (stripped !== address) {
      await sleep(GEOCODE_DELAY_MS);
      return await nominatimSearch(stripped);
    }
  } catch (e) { /* fall through */ }
  return null;
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function prompt(question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    if (!hidden) {
      rl.question(question, (answer) => { rl.close(); resolve(answer); });
      return;
    }
    const stdin = process.stdin;
    let muted = false;
    // eslint-disable-next-line no-underscore-dangle
    rl._writeToOutput = (str) => { if (!muted) rl.output.write(str); };
    rl.question(question, (answer) => { rl.close(); process.stdout.write('\n'); resolve(answer); });
    muted = true;
  });
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const csvPath = args.find((a) => !a.startsWith('--'));

  if (!csvPath) {
    console.error('Usage: node scripts/import-bakeries.js <path-to-csv> [--dry-run]');
    process.exit(1);
  }

  const fullPath = path.resolve(csvPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    process.exit(1);
  }

  const rows = parseCsv(fs.readFileSync(fullPath, 'utf8'));
  if (rows.length === 0) {
    console.error('No data rows found in CSV.');
    process.exit(1);
  }

  console.log(`Parsed ${rows.length} row(s) from ${csvPath}.\n`);

  const parsed = rows.map((row, i) => ({ line: i + 2, ...rowToBakery(row) })); // +2: header + 1-index
  const bad = parsed.filter((p) => p.errors.length > 0);
  const good = parsed.filter((p) => p.errors.length === 0);

  if (bad.length > 0) {
    console.log(`⚠️  ${bad.length} row(s) have problems and will be skipped:`);
    bad.forEach((p) => console.log(`   Line ${p.line}: ${p.errors.join('; ')}`));
    console.log('');
  }

  if (good.length === 0) {
    console.log('Nothing valid to import.');
    process.exit(0);
  }

  console.log(`${good.length} row(s) ready to import${dryRun ? ' (DRY RUN — CSV validation only, no sign-in needed, nothing will be written)' : ''}.\n`);

  let auth, db;
  if (!dryRun) {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    const email = process.env.SUPERUSER_EMAIL || (await prompt('Superuser email: '));
    const password = process.env.SUPERUSER_PASSWORD || (await prompt('Superuser password: ', { hidden: true }));

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e) {
      console.error(`Sign-in failed: ${e.message}`);
      process.exit(1);
    }
    console.log(`Signed in as ${email.trim()}.\n`);
  }

  let created = 0;
  let failed = 0;

  for (const p of good) {
    const b = p.bakery;
    process.stdout.write(`Line ${p.line}: ${b.name} — `);
    try {
      let coords = b.coords;
      if (!coords) {
        process.stdout.write('geocoding... ');
        coords = await geocodeAddress(b.address);
        await sleep(GEOCODE_DELAY_MS);
      }
      if (dryRun) {
        console.log(`OK (dry run)${coords ? '' : ' — no coords found, would save without location'}`);
        continue;
      }
      await addDoc(collection(db, 'bakeries'), {
        ...b,
        coords: coords || null,
        avgRating: 0,
        ratingCount: 0,
        sponsored: false,
        imageUrl: null,
        createdAt: serverTimestamp(),
      });
      created++;
      console.log(`created${coords ? '' : ' (no coords — geocoding failed, distance sorting won\'t work for this one)'}`);
    } catch (e) {
      failed++;
      console.log(`FAILED — ${e.message}`);
    }
  }

  if (auth) await signOut(auth);

  console.log(`\nDone. ${dryRun ? `${good.length} would be created` : `${created} created, ${failed} failed`}, ${bad.length} skipped (invalid).`);
  process.exit(0);
}

main();
