import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  writeBatch,
  where,
} from 'firebase/firestore';
import * as Location from 'expo-location';
import { db } from '@/src/firebase/config';

const PAGE_SIZE = 50;

function normalizeBakery(snap) {
  const data = snap.data() || {};
  return {
    id: snap.id,
    name: data.name || '',
    address: data.address || '',
    phone: data.phone || '',
    coords: data.coords || null,
    isHomeBakery: !!data.isHomeBakery,
    isBrickAndMortar: !!data.isBrickAndMortar,
    shipping: !!data.shipping,
    description: data.description || '',
    variations: Array.isArray(data.variations) ? data.variations : [],
    avgRating: typeof data.avgRating === 'number' ? data.avgRating : 0,
    ratingCount: typeof data.ratingCount === 'number' ? data.ratingCount : 0,
    sponsored: !!data.sponsored,
    imageUrl: data.imageUrl || null,
    createdAt: data.createdAt || null,
  };
}

/** Admin-only: feature/un-feature a bakery (shows in the Featured row). */
export async function setSponsored(id, value) {
  await updateDoc(doc(db, 'bakeries', id), { sponsored: !!value });
}

/**
 * Loads the full bakery list in lean pages (name, coords, price, rating
 * summary, flags — never the reviews subcollection). Paginates under the hood
 * with limit + startAfter so we never issue one enormous read, then caches the
 * result in memory via DataContext.
 */
export async function fetchAllBakeries() {
  const results = [];
  let cursor = null;

  // Loop through pages until we've read everything.
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

/** Fetch a single page (exposed for callers that want manual pagination). */
export async function fetchBakeryPage(cursor = null, pageSize = PAGE_SIZE) {
  const constraints = [orderBy('name'), limit(pageSize)];
  if (cursor) constraints.push(startAfter(cursor));
  const snap = await getDocs(query(collection(db, 'bakeries'), ...constraints));
  return {
    items: snap.docs.map(normalizeBakery),
    cursor: snap.docs.length ? snap.docs[snap.docs.length - 1] : null,
    hasMore: snap.docs.length === pageSize,
  };
}

export async function getBakery(id) {
  const snap = await getDoc(doc(db, 'bakeries', id));
  return snap.exists() ? normalizeBakery(snap) : null;
}

function sanitizeVariations(variations) {
  if (!Array.isArray(variations)) return [];
  return variations
    .map((v) => ({
      name: String(v.name || '').trim(),
      price: Number(v.price),
    }))
    .filter((v) => v.name.length > 0 && !Number.isNaN(v.price));
}

export async function createBakery(data) {
  const payload = {
    name: String(data.name || '').trim(),
    address: String(data.address || '').trim(),
    phone: String(data.phone || '').trim(),
    coords: data.coords || null,
    isHomeBakery: !!data.isHomeBakery,
    isBrickAndMortar: !!data.isBrickAndMortar,
    shipping: !!data.shipping,
    description: String(data.description || '').trim(),
    variations: sanitizeVariations(data.variations),
    avgRating: 0,
    ratingCount: 0,
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, 'bakeries'), payload);
  return ref.id;
}

export async function updateBakery(id, data) {
  const payload = {
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
  await updateDoc(doc(db, 'bakeries', id), payload);
}

/**
 * Deletes a bakery along with its reviews subcollection and any moderation
 * entries that reference it. Reviews are removed in batches to respect
 * Firestore's 500-write batch limit.
 */
export async function deleteBakery(id) {
  const reviewsSnap = await getDocs(collection(db, 'bakeries', id, 'reviews'));
  let batch = writeBatch(db);
  let ops = 0;
  for (const r of reviewsSnap.docs) {
    batch.delete(r.ref);
    ops += 1;
    if (ops >= 450) {
      await batch.commit();
      batch = writeBatch(db);
      ops = 0;
    }
  }
  if (ops > 0) await batch.commit();

  // Remove moderation-queue entries tied to this bakery.
  const modSnap = await getDocs(
    query(collection(db, 'moderationQueue'), where('bakeryId', '==', id))
  ).catch(() => null);
  if (modSnap) {
    for (const m of modSnap.docs) {
      await deleteDoc(m.ref).catch(() => {});
    }
  }

  await deleteDoc(doc(db, 'bakeries', id));
}

/**
 * Geocodes a free-text address to { lat, lng } using expo-location's forward
 * geocoder so distance sorting works. Returns null if it can't be resolved (the
 * Add/Edit form then lets the superuser enter coordinates manually).
 */
export async function geocodeAddress(address) {
  const trimmed = String(address || '').trim();
  if (!trimmed) return null;
  try {
    const results = await Location.geocodeAsync(trimmed);
    if (results && results.length > 0) {
      const { latitude, longitude } = results[0];
      if (typeof latitude === 'number' && typeof longitude === 'number') {
        return { lat: latitude, lng: longitude };
      }
    }
  } catch (e) {
    // Fall through to null — caller handles manual entry.
  }
  return null;
}
