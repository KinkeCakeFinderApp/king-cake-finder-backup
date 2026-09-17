import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp,
  arrayUnion, arrayRemove, collection, query, where, getDocs, runTransaction,
} from 'firebase/firestore';
import { db } from '../firebase';

/** Creates the shared users/{uid} profile (identical shape to the mobile app). */
export async function createUserProfile(uid, profile) {
  await setDoc(doc(db, 'users', uid), {
    username: profile.username.trim(),
    usernameLower: profile.username.trim().toLowerCase(),
    firstName: profile.firstName.trim(),
    lastName: profile.lastName.trim(),
    email: profile.email.trim(),
    role: profile.role === 'superuser' ? 'superuser' : 'user',
    favorites: [],
    toTaste: [],
    blockedUsers: [],
    notificationsEnabled: true,
    theme: 'light',
    createdAt: serverTimestamp(),
  });
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function addFavorite(uid, bakeryId) {
  await updateDoc(doc(db, 'users', uid), { favorites: arrayUnion(bakeryId) });
}
export async function removeFavorite(uid, bakeryId) {
  await updateDoc(doc(db, 'users', uid), { favorites: arrayRemove(bakeryId) });
}

/** "To be tasted" is a separate wishlist from favorites — bakeries the user
 * wants to try but hasn't necessarily visited yet. */
export async function addToTaste(uid, bakeryId) {
  await updateDoc(doc(db, 'users', uid), { toTaste: arrayUnion(bakeryId) });
}
export async function removeToTaste(uid, bakeryId) {
  await updateDoc(doc(db, 'users', uid), { toTaste: arrayRemove(bakeryId) });
}

/** Block/unblock another user ({uid, username}) — writes only to the caller's
 * own profile, which existing rules already permit. */
export async function addBlockedUser(uid, entry) {
  await updateDoc(doc(db, 'users', uid), { blockedUsers: arrayUnion(entry) });
}
export async function removeBlockedUser(uid, entry) {
  await updateDoc(doc(db, 'users', uid), { blockedUsers: arrayRemove(entry) });
}

export async function isUsernameTaken(username) {
  // Plain collection query — uses Firestore's automatic single-field index (no
  // deployed index required).
  const q = query(collection(db, 'users'), where('usernameLower', '==', username.trim().toLowerCase()));
  const snap = await getDocs(q);
  return !snap.empty;
}

/**
 * Removes the user's own content ahead of deleting their auth account. Reads
 * each bakery's review doc (id == uid) directly instead of a collection-group
 * query, so account deletion needs NO deployed index.
 */
export async function deleteUserData(uid) {
  // 1. Remove the user's review from every bakery.
  const bakeriesSnap = await getDocs(collection(db, 'bakeries')).catch(() => null);
  const bakeryDocs = bakeriesSnap ? bakeriesSnap.docs : [];
  for (const bakeryDoc of bakeryDocs) {
    const reviewRef = doc(db, 'bakeries', bakeryDoc.id, 'reviews', uid);
    try {
      await runTransaction(db, async (tx) => {
        const [bakerySnap, reviewSnap] = await Promise.all([tx.get(bakeryDoc.ref), tx.get(reviewRef)]);
        if (!reviewSnap.exists()) return;
        const data = reviewSnap.data();
        if (bakerySnap.exists() && data.status === 'published') {
          const b = bakerySnap.data();
          const count = Math.max(0, (b.ratingCount || 0) - 1);
          const sum = (b.avgRating || 0) * (b.ratingCount || 0) - (data.rating || 0);
          tx.update(bakeryDoc.ref, { ratingCount: count, avgRating: count > 0 ? Math.round((Math.max(0, sum) / count) * 100) / 100 : 0 });
        }
        tx.delete(reviewRef);
      });
    } catch (e) {
      await deleteDoc(reviewRef).catch(() => {});
    }
    await deleteDoc(doc(db, 'moderationQueue', `${bakeryDoc.id}_${uid}`)).catch(() => {});
    await deleteDoc(doc(db, 'moderationQueue', `report_${bakeryDoc.id}_${uid}`)).catch(() => {});
  }
  // 2. Delete inbox messages (direct subcollection read; no index needed).
  const msgSnap = await getDocs(collection(db, 'messages', uid, 'items')).catch(() => null);
  if (msgSnap) for (const m of msgSnap.docs) await deleteDoc(m.ref).catch(() => {});
  // 3. Delete any support tickets the user filed (they hold the user's email).
  const ticketSnap = await getDocs(query(collection(db, 'supportTickets'), where('fromUid', '==', uid))).catch(() => null);
  if (ticketSnap) for (const t of ticketSnap.docs) await deleteDoc(t.ref).catch(() => {});
  // 4. Delete the profile document itself.
  await deleteDoc(doc(db, 'users', uid)).catch(() => {});
}
