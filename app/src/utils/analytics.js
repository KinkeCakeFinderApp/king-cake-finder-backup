import { doc, setDoc, getDoc, increment } from 'firebase/firestore';
import { db } from '@/src/firebase/config';

/**
 * Bumps the click counter for the "Sponsored by kingcakeknives.com" banner.
 * Works for guests too (no sign-in required) — see firestore.rules, which
 * only allows a strict +1 on this one field. Best-effort: never blocks or
 * breaks the actual link-opening if the write fails.
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
