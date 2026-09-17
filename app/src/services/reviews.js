import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  collectionGroup,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/src/firebase/config';
import { moderateText } from '@/src/utils/profanity';
import { checkToxicity } from '@/src/utils/moderationCheck';
import { REVIEW_MAX_CHARS } from '@/src/config/appConfig';

function round2(n) {
  return Math.round(n * 100) / 100;
}

/** The moderation-queue doc id is deterministic so re-submits don't pile up. */
function queueId(bakeryId, uid) {
  return `${bakeryId}_${uid}`;
}

/**
 * Submits (creates or edits) the signed-in user's single review for a bakery.
 *
 * Flow:
 *  1. Auto-moderate the text (PG screen). Clean -> "published"; flagged ->
 *     "moderated" (kept out of the public list).
 *  2. In a transaction, write the review AND recompute the bakery's
 *     denormalized avgRating / ratingCount so the delta is always consistent —
 *     only "published" reviews contribute to the average.
 *  3. If flagged, upsert a moderation-queue entry; if it became clean on an
 *     edit, clear any prior queue entry.
 *
 * Returns { status, moderation } so the UI can tell the author what happened.
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
    const [bakerySnap, reviewSnap] = await Promise.all([
      tx.get(bakeryRef),
      tx.get(reviewRef),
    ]);
    if (!bakerySnap.exists()) {
      throw new Error('This bakery no longer exists.');
    }

    const b = bakerySnap.data();
    const prevCount = b.ratingCount || 0;
    const prevSum = (b.avgRating || 0) * prevCount;

    // Contribution of the previous review (if any) to the running average.
    let oldCount = 0;
    let oldSum = 0;
    let createdAt = serverTimestamp();
    if (reviewSnap.exists()) {
      const prev = reviewSnap.data();
      priorStatus = prev.status || null;
      if (prev.status === 'published') {
        oldCount = 1;
        oldSum = prev.rating || 0;
      }
      if (prev.createdAt) createdAt = prev.createdAt; // preserve original date
    }

    // Contribution of the new review.
    const newCount = status === 'published' ? 1 : 0;
    const newSum = status === 'published' ? safeRating : 0;

    const count = Math.max(0, prevCount + newCount - oldCount);
    const sum = Math.max(0, prevSum + newSum - oldSum);
    const avg = count > 0 ? sum / count : 0;

    tx.set(reviewRef, {
      rating: safeRating,
      text: safeText,
      status,
      authorUid: uid,
      authorUsername: username,
      createdAt,
      updatedAt: serverTimestamp(),
    });

    tx.update(bakeryRef, {
      ratingCount: count,
      avgRating: round2(avg),
    });
  });

  // Moderation-queue bookkeeping happens after the review write succeeds.
  const qRef = doc(db, 'moderationQueue', queueId(bakeryId, uid));
  if (status === 'moderated') {
    await setDoc(qRef, {
      bakeryId,
      authorUid: uid,
      authorUsername: username,
      originalText: safeText,
      rating: safeRating,
      reason: moderation.reason || 'Flagged for review',
      resolved: false,
      createdAt: serverTimestamp(),
    });
  } else if (priorStatus === 'moderated') {
    // Became clean (e.g. author edited out the language) — clear the old flag.
    await deleteDoc(qRef).catch(() => {});
  }

  return { status, moderation };
}

/** The signed-in user's own review for a bakery (published OR pending). */
export async function getMyReview(bakeryId, uid) {
  const snap = await getDoc(doc(db, 'bakeries', bakeryId, 'reviews', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Public, published reviews for a bakery, newest first. Queries by status only
 * (no orderBy) so it needs only Firestore's automatic single-field index — no
 * composite index to deploy — then sorts newest-first in code.
 */
export async function getPublishedReviews(bakeryId, max = 50) {
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

/**
 * Every review a user has authored (for the History tab), newest first. Reads
 * the user's review doc (doc id == uid) directly from each known bakery instead
 * of a collection-group query — so it needs NO deployed index and always
 * reflects a freshly-posted review. `bakeries` is the loaded bakery list.
 */
export async function getMyReviews(uid, bakeries) {
  const list = Array.isArray(bakeries) ? bakeries : [];
  const results = await Promise.all(
    list.map(async (b) => {
      try {
        const snap = await getDoc(doc(db, 'bakeries', b.id, 'reviews', uid));
        return snap.exists() ? { id: snap.id, bakeryId: b.id, ...snap.data() } : null;
      } catch (e) {
        return null;
      }
    })
  );
  const items = results.filter(Boolean);
  items.sort((a, b) => {
    const ta = a.createdAt && a.createdAt.seconds ? a.createdAt.seconds : 0;
    const tb = b.createdAt && b.createdAt.seconds ? b.createdAt.seconds : 0;
    return tb - ta;
  });
  return items;
}

export { round2, queueId };
