import {
  doc, getDoc, getDocs, setDoc, deleteDoc, collection, query, where, orderBy,
  runTransaction, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { moderateText } from '../lib/profanity';
import { checkToxicity } from '../lib/moderationCheck';
import { REVIEW_MAX_CHARS } from '../config';

const round2 = (n) => Math.round(n * 100) / 100;
export const queueId = (bakeryId, uid) => `${bakeryId}_${uid}`;

/**
 * Creates or edits the signed-in user's single review, auto-moderates it, and
 * recomputes the bakery's avgRating/ratingCount in one transaction. Flagged
 * reviews are held out of the public list and pushed to the shared moderation
 * queue. Mirrors the mobile app exactly so both surfaces stay consistent.
 */
export async function submitReview({ bakeryId, uid, username, rating, text }) {
  const safeRating = Math.max(1, Math.min(5, Math.round(Number(rating) || 0)));
  const safeText = String(text || '').slice(0, REVIEW_MAX_CHARS);
  const keywordResult = moderateText(safeText);
  const toxicityResult = await checkToxicity(safeText);
  const moderation = keywordResult.flagged
    ? keywordResult
    : toxicityResult.flagged
    ? { flagged: true, reason: `AI-flagged (${toxicityResult.category})`, matched: [] }
    : { flagged: false, reason: null, matched: [] };
  const status = moderation.flagged ? 'moderated' : 'published';

  const reviewRef = doc(db, 'bakeries', bakeryId, 'reviews', uid);
  const bakeryRef = doc(db, 'bakeries', bakeryId);

  let priorStatus = null;
  await runTransaction(db, async (tx) => {
    const [bakerySnap, reviewSnap] = await Promise.all([tx.get(bakeryRef), tx.get(reviewRef)]);
    if (!bakerySnap.exists()) throw new Error('This bakery no longer exists.');

    const b = bakerySnap.data();
    const prevCount = b.ratingCount || 0;
    const prevSum = (b.avgRating || 0) * prevCount;

    let oldCount = 0, oldSum = 0, createdAt = serverTimestamp();
    if (reviewSnap.exists()) {
      const prev = reviewSnap.data();
      priorStatus = prev.status || null;
      if (prev.status === 'published') { oldCount = 1; oldSum = prev.rating || 0; }
      if (prev.createdAt) createdAt = prev.createdAt;
    }
    const newCount = status === 'published' ? 1 : 0;
    const newSum = status === 'published' ? safeRating : 0;
    const count = Math.max(0, prevCount + newCount - oldCount);
    const sum = Math.max(0, prevSum + newSum - oldSum);

    tx.set(reviewRef, {
      rating: safeRating, text: safeText, status,
      authorUid: uid, authorUsername: username,
      createdAt, updatedAt: serverTimestamp(),
    });
    tx.update(bakeryRef, { ratingCount: count, avgRating: round2(count > 0 ? sum / count : 0) });
  });

  const qRef = doc(db, 'moderationQueue', queueId(bakeryId, uid));
  if (status === 'moderated') {
    await setDoc(qRef, {
      bakeryId, authorUid: uid, authorUsername: username,
      originalText: safeText, rating: safeRating,
      reason: moderation.reason || 'Flagged for review',
      resolved: false, createdAt: serverTimestamp(),
    });
  } else if (priorStatus === 'moderated') {
    await deleteDoc(qRef).catch(() => {});
  }

  return { status, moderation };
}

export async function getMyReview(bakeryId, uid) {
  const snap = await getDoc(doc(db, 'bakeries', bakeryId, 'reviews', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getPublishedReviews(bakeryId, max = 50) {
  // Single equality filter with NO orderBy, so this needs only Firestore's
  // automatic single-field index (no composite index to deploy). Sort
  // newest-first in code.
  const q = query(
    collection(db, 'bakeries', bakeryId, 'reviews'),
    where('status', '==', 'published')
  );
  const snap = await getDocs(q);
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  items.sort((a, b) => {
    const ta = a.createdAt && a.createdAt.seconds ? a.createdAt.seconds : 0;
    const tb = b.createdAt && b.createdAt.seconds ? b.createdAt.seconds : 0;
    return tb - ta;
  });
  return items.slice(0, max);
}

export { round2 };
