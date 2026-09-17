import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, orderBy, limit, startAfter, serverTimestamp, writeBatch, where,
} from 'firebase/firestore';
import { db } from '../firebase';

const PAGE_SIZE = 50;

function normalizeBakery(snap) {
  const d = snap.data() || {};
  return {
    id: snap.id,
    name: d.name || '',
    address: d.address || '',
    phone: d.phone || '',
    coords: d.coords || null,
    isHomeBakery: !!d.isHomeBakery,
    isBrickAndMortar: !!d.isBrickAndMortar,
    shipping: !!d.shipping,
    description: d.description || '',
    variations: Array.isArray(d.variations) ? d.variations : [],
    avgRating: typeof d.avgRating === 'number' ? d.avgRating : 0,
    ratingCount: typeof d.ratingCount === 'number' ? d.ratingCount : 0,
    sponsored: !!d.sponsored,
    imageUrl: d.imageUrl || null,
    createdAt: d.createdAt || null,
  };
}

/** Admin-only: mark/unmark a bakery as a sponsored (featured) listing. */
export async function setSponsored(id, value) {
  await updateDoc(doc(db, 'bakeries', id), { sponsored: !!value });
}

/** Loads the full bakery list in lean pages (never the reviews subcollection). */
export async function fetchAllBakeries() {
  const results = [];
  let cursor = null;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const constraints = [orderBy('name'), limit(PAGE_SIZE)];
    if (cursor) constraints.push(startAfter(cursor));
    const snap = await getDocs(query(collection(db, 'bakeries'), ...constraints));
    snap.docs.forEach((d) => results.push(normalizeBakery(d)));
    if (snap.docs.length < PAGE_SIZE) break;
    cursor = snap.docs[snap.docs.length - 1];
  }
  return results;
}

export async function getBakery(id) {
  const snap = await getDoc(doc(db, 'bakeries', id));
  return snap.exists() ? normalizeBakery(snap) : null;
}

function sanitizeVariations(variations) {
  if (!Array.isArray(variations)) return [];
  return variations
    .map((v) => ({ name: String(v.name || '').trim(), price: Number(v.price) }))
    .filter((v) => v.name.length > 0 && !Number.isNaN(v.price));
}

function buildPayload(data) {
  return {
    name: String(data.name || '').trim(),
    address: String(data.address || '').trim(),
    phone: String(data.phone || '').trim(),
    coords: data.coords || null,
    isHomeBakery: !!data.isHomeBakery,
    isBrickAndMortar: !!data.isBrickAndMortar,
    shipping: !!data.shipping,
    description: String(data.description || '').trim(),
    variations: sanitizeVariations(data.variations),
  };
}

export async function createBakery(data) {
  const ref = await addDoc(collection(db, 'bakeries'), {
    ...buildPayload(data),
    avgRating: 0,
    ratingCount: 0,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateBakery(id, data) {
  await updateDoc(doc(db, 'bakeries', id), buildPayload(data));
}

export async function deleteBakery(id) {
  const reviewsSnap = await getDocs(collection(db, 'bakeries', id, 'reviews'));
  let batch = writeBatch(db);
  let ops = 0;
  for (const r of reviewsSnap.docs) {
    batch.delete(r.ref);
    if (++ops >= 450) { await batch.commit(); batch = writeBatch(db); ops = 0; }
  }
  if (ops > 0) await batch.commit();
  const modSnap = await getDocs(query(collection(db, 'moderationQueue'), where('bakeryId', '==', id))).catch(() => null);
  if (modSnap) for (const m of modSnap.docs) await deleteDoc(m.ref).catch(() => {});
  await deleteDoc(doc(db, 'bakeries', id));
}

/**
 * Geocodes an address to { lat, lng } using OpenStreetMap's free Nominatim
 * service (no API key). Used by the admin add/edit form so distance sorting
 * works. Returns null on failure — the form also allows manual coordinates.
 */
export async function geocodeAddress(address) {
  const q = String(address || '').trim();
  if (!q) return null;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch (e) {
    // fall through
  }
  return null;
}
