import {
  doc, setDoc, getDoc, getDocs, deleteDoc, collection, addDoc, query, where,
  runTransaction, updateDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { round2, queueId } from './reviews';

/**
 * Superuser removes ANY review directly from a bakery page (not only queued
 * ones). Backs a published review out of the bakery's rating in a transaction,
 * then clears any related moderation-queue entries.
 */
export async function adminDeleteReview({ bakeryId, authorUid }) {
  const reviewRef = doc(db, 'bakeries', bakeryId, 'reviews', authorUid);
  const bakeryRef = doc(db, 'bakeries', bakeryId);
  await runTransaction(db, async (tx) => {
    const [bakerySnap, reviewSnap] = await Promise.all([tx.get(bakeryRef), tx.get(reviewRef)]);
    if (!reviewSnap.exists()) return;
    const r = reviewSnap.data();
    if (bakerySnap.exists() && r.status === 'published') {
      const b = bakerySnap.data();
      const count = Math.max(0, (b.ratingCount || 0) - 1);
      const sum = (b.avgRating || 0) * (b.ratingCount || 0) - (r.rating || 0);
      tx.update(bakeryRef, { ratingCount: count, avgRating: round2(count > 0 ? Math.max(0, sum) / count : 0) });
    }
    tx.delete(reviewRef);
  });
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

export async function approveReview({ bakeryId, authorUid, rating, text, queueDocId }) {
  const reviewRef = doc(db, 'bakeries', bakeryId, 'reviews', authorUid);
  const bakeryRef = doc(db, 'bakeries', bakeryId);
  const queueRef = doc(db, 'moderationQueue', queueDocId || queueId(bakeryId, authorUid));
  await runTransaction(db, async (tx) => {
    const [bakerySnap, reviewSnap] = await Promise.all([tx.get(bakeryRef), tx.get(reviewRef)]);
    if (!reviewSnap.exists()) throw new Error('That review no longer exists.');
    const prev = reviewSnap.data();
    const nextRating = Math.max(1, Math.min(5, Math.round(Number(rating) || prev.rating)));
    if (bakerySnap.exists() && prev.status !== 'published') {
      const b = bakerySnap.data();
      const count = (b.ratingCount || 0) + 1;
      const sum = (b.avgRating || 0) * (b.ratingCount || 0) + nextRating;
      tx.update(bakeryRef, { ratingCount: count, avgRating: round2(count > 0 ? sum / count : 0) });
    }
    tx.update(reviewRef, {
      status: 'published', rating: nextRating,
      text: String(text != null ? text : prev.text || ''),
      moderatedBy: 'superuser', updatedAt: serverTimestamp(),
    });
    tx.update(queueRef, { resolved: true, resolvedAt: serverTimestamp() });
  });
}

export async function rejectReview({ bakeryId, authorUid, queueDocId }) {
  const reviewRef = doc(db, 'bakeries', bakeryId, 'reviews', authorUid);
  const bakeryRef = doc(db, 'bakeries', bakeryId);
  const queueRef = doc(db, 'moderationQueue', queueDocId || queueId(bakeryId, authorUid));
  await runTransaction(db, async (tx) => {
    const [bakerySnap, reviewSnap] = await Promise.all([tx.get(bakeryRef), tx.get(reviewRef)]);
    if (reviewSnap.exists() && bakerySnap.exists() && reviewSnap.data().status === 'published') {
      const b = bakerySnap.data();
      const count = Math.max(0, (b.ratingCount || 0) - 1);
      const sum = (b.avgRating || 0) * (b.ratingCount || 0) - (reviewSnap.data().rating || 0);
      tx.update(bakeryRef, { ratingCount: count, avgRating: round2(count > 0 ? Math.max(0, sum) / count : 0) });
    }
    if (reviewSnap.exists()) tx.delete(reviewRef);
    tx.update(queueRef, { resolved: true, resolvedAt: serverTimestamp() });
  });
}

export async function dismissQueueEntry(queueDocId) {
  await updateDoc(doc(db, 'moderationQueue', queueDocId), { resolved: true, resolvedAt: serverTimestamp() });
}

/** Any signed-in user can report a published review (shared UGC moderation). */
export async function reportReview({ bakeryId, review, reporterUid }) {
  await setDoc(doc(db, 'moderationQueue', `report_${bakeryId}_${review.authorUid}`), {
    bakeryId, authorUid: review.authorUid, authorUsername: review.authorUsername || 'user',
    originalText: review.text || '', rating: review.rating || 0,
    reason: 'Reported by a user', reportedBy: reporterUid,
    resolved: false, createdAt: serverTimestamp(),
  });
}

export async function hasOpenReport(bakeryId, authorUid) {
  const snap = await getDoc(doc(db, 'moderationQueue', `report_${bakeryId}_${authorUid}`));
  return snap.exists() && snap.data().resolved === false;
}

/** Superuser sends a DM to a review author's shared inbox. */
export async function messageAuthor({ toUid, body, relatedReviewId }) {
  await addDoc(collection(db, 'messages', toUid, 'items'), {
    ownerUid: toUid, fromRole: 'superuser', body: String(body || '').trim(),
    relatedReviewId: relatedReviewId || null, read: false, createdAt: serverTimestamp(),
  });
}
