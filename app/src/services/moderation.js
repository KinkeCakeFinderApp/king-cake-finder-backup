import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  runTransaction,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/src/firebase/config';
import { round2, queueId } from '@/src/services/reviews';
import { sendMessage } from '@/src/services/messages';
import { getAdminPushTokens } from '@/src/services/users';
import { sendPushNotification } from '@/src/utils/pushNotifications';
import { getAdminBadgeCount } from '@/src/utils/adminBadge';

/**
 * Superuser removes ANY review (published or not), directly from a bakery page —
 * not only from the moderation queue. Backs a published review out of the
 * bakery's rating in the same transaction, then clears any related queue entries.
 */
export async function adminDeleteReview({ bakeryId, authorUid }) {
  const reviewRef = doc(db, 'bakeries', bakeryId, 'reviews', authorUid);
  const bakeryRef = doc(db, 'bakeries', bakeryId);

  await runTransaction(db, async (tx) => {
    const [bakerySnap, reviewSnap] = await Promise.all([
      tx.get(bakeryRef),
      tx.get(reviewRef),
    ]);
    if (!reviewSnap.exists()) return;
    const r = reviewSnap.data();
    if (bakerySnap.exists() && r.status === 'published') {
      const b = bakerySnap.data();
      const count = Math.max(0, (b.ratingCount || 0) - 1);
      const sum = (b.avgRating || 0) * (b.ratingCount || 0) - (r.rating || 0);
      tx.update(bakeryRef, {
        ratingCount: count,
        avgRating: round2(count > 0 ? Math.max(0, sum) / count : 0),
      });
    }
    tx.delete(reviewRef);
  });

  // Best-effort cleanup of any moderation/report entries for this review.
  await deleteDoc(doc(db, 'moderationQueue', `${bakeryId}_${authorUid}`)).catch(() => {});
  await deleteDoc(doc(db, 'moderationQueue', `report_${bakeryId}_${authorUid}`)).catch(() => {});
}

/**
 * Unresolved moderation-queue entries, newest first (superuser only). Queries by
 * `resolved` only (no orderBy) so it needs just Firestore's automatic
 * single-field index — no composite index to deploy — then sorts in code.
 */
export async function getModerationQueue() {
  const q = query(collection(db, 'moderationQueue'), where('resolved', '==', false));
  const snap = await getDocs(q);
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  items.sort((a, b) => {
    const ta = a.createdAt && a.createdAt.seconds ? a.createdAt.seconds : 0;
    const tb = b.createdAt && b.createdAt.seconds ? b.createdAt.seconds : 0;
    return tb - ta;
  });
  return items;
}

/**
 * A superuser edits the flagged text (optional) and publishes the review. The
 * review flips to "published", the bakery's rating is recomputed in a
 * transaction, and the queue entry is marked resolved.
 */
export async function approveReview({ bakeryId, authorUid, rating, text, queueDocId }) {
  const reviewRef = doc(db, 'bakeries', bakeryId, 'reviews', authorUid);
  const bakeryRef = doc(db, 'bakeries', bakeryId);
  const queueRef = doc(db, 'moderationQueue', queueDocId || queueId(bakeryId, authorUid));

  await runTransaction(db, async (tx) => {
    const [bakerySnap, reviewSnap] = await Promise.all([
      tx.get(bakeryRef),
      tx.get(reviewRef),
    ]);
    if (!reviewSnap.exists()) throw new Error('That review no longer exists.');

    const prev = reviewSnap.data();
    const nextRating = Math.max(
      1,
      Math.min(5, Math.round(Number(rating) || prev.rating))
    );

    // Recompute only if the review was not already contributing.
    if (bakerySnap.exists() && prev.status !== 'published') {
      const b = bakerySnap.data();
      const count = (b.ratingCount || 0) + 1;
      const sum = (b.avgRating || 0) * (b.ratingCount || 0) + nextRating;
      tx.update(bakeryRef, {
        ratingCount: count,
        avgRating: round2(count > 0 ? sum / count : 0),
      });
    }

    tx.update(reviewRef, {
      status: 'published',
      rating: nextRating,
      text: String(text != null ? text : prev.text || ''),
      moderatedBy: 'superuser',
      updatedAt: serverTimestamp(),
    });

    tx.update(queueRef, { resolved: true, resolvedAt: serverTimestamp() });
  });
}

/**
 * A superuser deletes a flagged/reported review outright. If the review was
 * live (published), it is backed out of the bakery's average in the same
 * transaction so ratings stay correct.
 */
export async function rejectReview({ bakeryId, authorUid, queueDocId }) {
  const reviewRef = doc(db, 'bakeries', bakeryId, 'reviews', authorUid);
  const bakeryRef = doc(db, 'bakeries', bakeryId);
  const queueRef = doc(db, 'moderationQueue', queueDocId || queueId(bakeryId, authorUid));

  await runTransaction(db, async (tx) => {
    const [bakerySnap, reviewSnap] = await Promise.all([
      tx.get(bakeryRef),
      tx.get(reviewRef),
    ]);

    if (
      reviewSnap.exists() &&
      bakerySnap.exists() &&
      reviewSnap.data().status === 'published'
    ) {
      const b = bakerySnap.data();
      const count = Math.max(0, (b.ratingCount || 0) - 1);
      const sum =
        (b.avgRating || 0) * (b.ratingCount || 0) - (reviewSnap.data().rating || 0);
      tx.update(bakeryRef, {
        ratingCount: count,
        avgRating: round2(count > 0 ? Math.max(0, sum) / count : 0),
      });
    }

    if (reviewSnap.exists()) tx.delete(reviewRef);
    tx.update(queueRef, { resolved: true, resolvedAt: serverTimestamp() });
  });
}

/** Dismiss a queue entry without deleting the review (e.g. a false report). */
export async function dismissQueueEntry(queueDocId) {
  await updateDoc(doc(db, 'moderationQueue', queueDocId), {
    resolved: true,
    resolvedAt: serverTimestamp(),
  });
}

/**
 * Any user can report/flag a published review as inappropriate (store UGC
 * requirement). Creates a moderation-queue entry for superusers. The doc id is
 * keyed to the review so repeat reports collapse into one entry.
 */
export async function reportReview({ bakeryId, review, reporterUid, bakeryName }) {
  const id = `report_${bakeryId}_${review.authorUid}`;
  await setDoc(doc(db, 'moderationQueue', id), {
    bakeryId,
    authorUid: review.authorUid,
    authorUsername: review.authorUsername || 'user',
    originalText: review.text || '',
    rating: review.rating || 0,
    reason: 'Reported by a user',
    reportedBy: reporterUid,
    resolved: false,
    createdAt: serverTimestamp(),
  });

  const [tokens, badgeCount] = await Promise.all([
    getAdminPushTokens().catch(() => []),
    getAdminBadgeCount().catch(() => undefined),
  ]);
  const snippet = String(review.text || '').slice(0, 80);
  const where = bakeryName ? ` on ${bakeryName}` : '';
  await sendPushNotification(
    tokens,
    'New review report',
    `@${review.authorUsername || 'user'}'s ${review.rating || '?'}★ review${where} was reported${snippet ? `: "${snippet}${review.text && review.text.length > 80 ? '…' : ''}"` : '.'}`,
    { type: 'report', bakeryId, authorUid: review.authorUid },
    badgeCount
  );
}

/**
 * Superuser sends a direct message to the review's author explaining why it was
 * moderated. Lands in the user's inbox (messages/{uid}/items/{id}).
 */
export async function messageAuthor({ toUid, body, relatedReviewId }) {
  await sendMessage({ toUid, body, relatedReviewId });
}

/** Whether the current user has an open report on a review (avoids dupes in UI). */
export async function hasOpenReport(bakeryId, authorUid) {
  const snap = await getDoc(
    doc(db, 'moderationQueue', `report_${bakeryId}_${authorUid}`)
  );
  return snap.exists() && snap.data().resolved === false;
}
