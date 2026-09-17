import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/src/firebase/config';

/**
 * Writes a moderation DM into a user's inbox at messages/{uid}/items/{id}.
 * `ownerUid` is duplicated onto the item so a user can query/clean up their own
 * messages with a collection-group query on deletion.
 */
export async function sendMessage({ toUid, body, relatedReviewId }) {
  await addDoc(collection(db, 'messages', toUid, 'items'), {
    ownerUid: toUid,
    fromRole: 'superuser',
    body: String(body || '').trim(),
    relatedReviewId: relatedReviewId || null,
    read: false,
    createdAt: serverTimestamp(),
  });
}

/** A user's inbox items, newest first. */
export async function getMessages(uid) {
  const q = query(
    collection(db, 'messages', uid, 'items'),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function markMessageRead(uid, messageId) {
  await updateDoc(doc(db, 'messages', uid, 'items', messageId), { read: true });
}

/** Count of unread inbox items (used for the badge). */
export async function getUnreadCount(uid) {
  const items = await getMessages(uid);
  return items.filter((m) => !m.read).length;
}
