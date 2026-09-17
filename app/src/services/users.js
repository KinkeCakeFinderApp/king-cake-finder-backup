import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  collection,
  query,
  where,
  getDocs,
  runTransaction,
} from 'firebase/firestore';
import { db } from '@/src/firebase/config';

/**
 * Creates the Firestore profile for a newly registered user. Self-serve signups
 * are always role "user"; the security rules reject any client attempt to
 * create a "superuser". Admins are provisioned by hand in the Firebase console.
 */
export async function createUserProfile(uid, profile) {
  const ref = doc(db, 'users', uid);
  await setDoc(ref, {
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

/**
 * Updates safe, user-owned profile fields only. `role` is intentionally never
 * part of the allowed patch so a normal user cannot escalate themselves — and
 * the security rules reject a role change from the client regardless.
 */
export async function updateUserProfile(uid, patch) {
  const allowed = {};
  if (typeof patch.notificationsEnabled === 'boolean') {
    allowed.notificationsEnabled = patch.notificationsEnabled;
  }
  if (patch.theme === 'light' || patch.theme === 'dark') {
    allowed.theme = patch.theme;
  }
  if (typeof patch.firstName === 'string') allowed.firstName = patch.firstName.trim();
  if (typeof patch.lastName === 'string') allowed.lastName = patch.lastName.trim();
  if (Object.keys(allowed).length === 0) return;
  await updateDoc(doc(db, 'users', uid), allowed);
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

/**
 * Saves this device's push token on the user's own profile (always allowed —
 * it's their own doc). Superusers ALSO get their token added to
 * config/notifications.adminPushTokens, a doc any signed-in user may read (see
 * firestore.rules) so a reporting/support-filing user's client can notify the
 * admin directly, without needing read access to the admin's private profile.
 */
export async function savePushToken(uid, token, isSuperuser) {
  if (!token) return;
  await updateDoc(doc(db, 'users', uid), { pushToken: token });
  if (isSuperuser) {
    await setDoc(
      doc(db, 'config', 'notifications'),
      { adminPushTokens: arrayUnion(token) },
      { merge: true }
    );
  }
}

/** Admin push tokens — readable by any signed-in user (see firestore.rules). */
export async function getAdminPushTokens() {
  const snap = await getDoc(doc(db, 'config', 'notifications'));
  if (!snap.exists()) return [];
  const tokens = snap.data().adminPushTokens;
  return Array.isArray(tokens) ? tokens : [];
}

/** Block/unblock another user. `entry` is { uid, username } so the blocked list
 * can be shown (and unblocked) in Settings. Writes only to the caller's own
 * profile, so the existing "own profile, role unchanged" rule already allows it. */
export async function addBlockedUser(uid, entry) {
  await updateDoc(doc(db, 'users', uid), { blockedUsers: arrayUnion(entry) });
}

export async function removeBlockedUser(uid, entry) {
  await updateDoc(doc(db, 'users', uid), { blockedUsers: arrayRemove(entry) });
}

/**
 * Checks whether a username is already taken (best-effort uniqueness). Uses the
 * lowercased mirror field for a case-insensitive match.
 */
export async function isUsernameTaken(username) {
  // Plain collection query on the top-level `users` collection — uses Firestore's
  // automatic single-field index, so it needs no deployed index.
  const q = query(
    collection(db, 'users'),
    where('usernameLower', '==', username.trim().toLowerCase())
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

/**
 * Fully deletes a user's own content ahead of removing their auth account:
 *  - every review they authored (recomputing each affected bakery's rating for
 *    published reviews), and any moderation-queue entry tied to it
 *  - their inbox messages
 *  - their support tickets
 *  - their profile document
 * Reads each bakery's review doc (id == uid) directly instead of a
 * collection-group query, so account deletion needs NO deployed index.
 */
export async function deleteUserData(uid) {
  // 1. Remove the user's review from every bakery (doc id == uid).
  const bakeriesSnap = await getDocs(collection(db, 'bakeries')).catch(() => null);
  const bakeryDocs = bakeriesSnap ? bakeriesSnap.docs : [];

  for (const bakeryDoc of bakeryDocs) {
    const reviewRef = doc(db, 'bakeries', bakeryDoc.id, 'reviews', uid);
    try {
      await runTransaction(db, async (tx) => {
        const [bakerySnap, reviewSnap] = await Promise.all([
          tx.get(bakeryDoc.ref),
          tx.get(reviewRef),
        ]);
        if (!reviewSnap.exists()) return;
        const data = reviewSnap.data();
        // Only published reviews contributed to the denormalized average.
        if (bakerySnap.exists() && data.status === 'published') {
          const b = bakerySnap.data();
          const count = Math.max(0, (b.ratingCount || 0) - 1);
          const sum = (b.avgRating || 0) * (b.ratingCount || 0) - (data.rating || 0);
          tx.update(bakeryDoc.ref, {
            ratingCount: count,
            avgRating: count > 0 ? Math.round((Math.max(0, sum) / count) * 100) / 100 : 0,
          });
        }
        tx.delete(reviewRef);
      });
    } catch (e) {
      await deleteDoc(reviewRef).catch(() => {});
    }
    // Remove any moderation-queue entries tied to this review.
    await deleteDoc(doc(db, 'moderationQueue', `${bakeryDoc.id}_${uid}`)).catch(() => {});
    await deleteDoc(doc(db, 'moderationQueue', `report_${bakeryDoc.id}_${uid}`)).catch(() => {});
  }

  // 2. Delete inbox messages (direct subcollection read; no index needed).
  const msgSnap = await getDocs(collection(db, 'messages', uid, 'items')).catch(() => null);
  if (msgSnap) {
    for (const m of msgSnap.docs) {
      await deleteDoc(m.ref).catch(() => {});
    }
  }

  // 3. Delete any support tickets the user filed (they hold the user's email).
  const ticketSnap = await getDocs(
    query(collection(db, 'supportTickets'), where('fromUid', '==', uid))
  ).catch(() => null);
  if (ticketSnap) {
    for (const t of ticketSnap.docs) {
      await deleteDoc(t.ref).catch(() => {});
    }
  }

  // 4. Delete the profile document itself.
  await deleteDoc(doc(db, 'users', uid)).catch(() => {});
}
