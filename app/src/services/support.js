import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/src/firebase/config';
import { getAdminPushTokens } from '@/src/services/users';
import { sendPushNotification } from '@/src/utils/pushNotifications';
import { getAdminBadgeCount } from '@/src/utils/adminBadge';

/**
 * A signed-in user files a support request. It lands in the `supportTickets`
 * collection, which superusers work through in the Admin tab. Replies are sent
 * back to the user's inbox (see services/messages). The filer's own push token
 * is snapshotted onto the ticket so the admin can notify them of a reply later
 * without needing read access to the user's private profile.
 */
export async function createSupportTicket({ uid, username, email, subject, body, pushToken }) {
  await addDoc(collection(db, 'supportTickets'), {
    fromUid: uid,
    fromUsername: username || 'user',
    email: email || '',
    subject: String(subject || '').trim(),
    body: String(body || '').trim(),
    pushToken: pushToken || null,
    resolved: false,
    createdAt: serverTimestamp(),
  });

  const [tokens, badgeCount] = await Promise.all([
    getAdminPushTokens().catch(() => []),
    getAdminBadgeCount().catch(() => undefined),
  ]);
  const cleanSubject = String(subject || '').trim();
  const snippet = String(body || '').trim().slice(0, 80);
  await sendPushNotification(
    tokens,
    `New support request: ${cleanSubject || 'no subject'}`,
    `@${username || 'user'}${email ? ` (${email})` : ''}: ${snippet}${body && body.length > 80 ? '…' : ''}`,
    { type: 'support' },
    badgeCount
  );
}

/**
 * Open (unresolved) support tickets, newest first — superuser only. Queries by
 * `resolved` only (no orderBy) so it needs just Firestore's automatic
 * single-field index — no composite index to deploy — then sorts in code.
 */
export async function getOpenTickets() {
  const q = query(collection(db, 'supportTickets'), where('resolved', '==', false));
  const snap = await getDocs(q);
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  items.sort((a, b) => {
    const ta = a.createdAt && a.createdAt.seconds ? a.createdAt.seconds : 0;
    const tb = b.createdAt && b.createdAt.seconds ? b.createdAt.seconds : 0;
    return tb - ta;
  });
  return items;
}

/** Count of open tickets (for the Admin dashboard badge). */
export async function getOpenTicketCount() {
  const tickets = await getOpenTickets();
  return tickets.length;
}

export async function resolveTicket(ticketId) {
  await updateDoc(doc(db, 'supportTickets', ticketId), {
    resolved: true,
    resolvedAt: serverTimestamp(),
  });
}
