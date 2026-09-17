import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/src/firebase/config';

/**
 * Combined count of unresolved moderation-queue entries + open support
 * tickets — the admin's push/app-icon badge number. Queries Firestore
 * directly (rather than importing services/moderation.js + services/support.js)
 * to avoid a circular import, since both of those call this when they create
 * a new report/ticket.
 */
export async function getAdminBadgeCount() {
  const [modSnap, supportSnap] = await Promise.all([
    getDocs(query(collection(db, 'moderationQueue'), where('resolved', '==', false))),
    getDocs(query(collection(db, 'supportTickets'), where('resolved', '==', false))),
  ]);
  return modSnap.size + supportSnap.size;
}
