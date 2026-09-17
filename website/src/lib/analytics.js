import { doc, setDoc, getDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Bumps the click counter for the "Sponsored by kingcakeknives.com" banner.
 * Works for signed-out visitors too — see firestore.rules, which only allows
 * a strict +1 on this one field. Best-effort: never blocks the actual link.
 */
export async function trackSponsorClick() {
  try {
    await setDoc(
      doc(db, 'analytics', 'sponsorLinkClicks'),
      { count: increment(1) },
      { merge: true }
    );
  } catch (e) {
    // Ignore — analytics should never block the user's action.
  }
}

/** Superuser-only (see firestore.rules) — for the admin dashboard stat. */
export async function getSponsorClickCount() {
  const snap = await getDoc(doc(db, 'analytics', 'sponsorLinkClicks'));
  return snap.exists() ? snap.data().count || 0 : 0;
}
