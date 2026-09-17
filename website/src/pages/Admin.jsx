import React, { useEffect, useState, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import BakeryForm from '../components/BakeryForm';
import KingCakeRating from '../components/KingCakeRating';
import { Modal, Loading, EmptyState, FavoriteButton } from '../components/common';
import { createBakery, updateBakery, deleteBakery, getBakery, setSponsored } from '../services/bakeries';
import {
  getModerationQueue, approveReview, rejectReview, dismissQueueEntry, messageAuthor,
} from '../services/moderation';
import { matchesSearch } from '../lib/search';
import { formatDate } from '../lib/format';
import { REVIEW_MAX_CHARS } from '../config';
import { getSponsorClickCount } from '../lib/analytics';

export default function Admin() {
  const { isSuperuser, initializing } = useAuth();
  const { bakeries, upsertBakery, removeBakery, getBakeryById, applyBakeryPatch, refreshBakeries } = useData();

  const [tab, setTab] = useState('bakeries');
  const [term, setTerm] = useState('');
  const [editing, setEditing] = useState(null); // bakery object or 'new'
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const [queue, setQueue] = useState([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [drafts, setDrafts] = useState({});
  const [msgTarget, setMsgTarget] = useState(null);
  const [msgBody, setMsgBody] = useState('');

  const [sponsorClicks, setSponsorClicks] = useState(0);
  const [clicksLoading, setClicksLoading] = useState(false);

  const loadQueue = useCallback(async () => {
    setQueueLoading(true);
    try {
      const q = await getModerationQueue();
      setQueue(q);
      const d = {}; q.forEach((it) => { d[it.id] = it.originalText || ''; }); setDrafts(d);
    } catch (e) { setQueue([]); } finally { setQueueLoading(false); }
  }, []);

  useEffect(() => { if (tab === 'moderation' && isSuperuser) loadQueue(); }, [tab, isSuperuser, loadQueue]);

  useEffect(() => {
    if (tab !== 'analytics' || !isSuperuser) return;
    setClicksLoading(true);
    getSponsorClickCount()
      .then(setSponsorClicks)
      .catch(() => setSponsorClicks(0))
      .finally(() => setClicksLoading(false));
  }, [tab, isSuperuser]);

  if (initializing) return <div className="container page"><Loading /></div>;
  if (!isSuperuser) return <Navigate to="/" replace />;

  // ---- Bakery CRUD ----
  const saveBakery = async (data) => {
    setSubmitting(true);
    try {
      if (editing === 'new') {
        const id = await createBakery(data);
        const fresh = await getBakery(id);
        if (fresh) upsertBakery(fresh);
      } else {
        await updateBakery(editing.id, data);
        const fresh = await getBakery(editing.id);
        if (fresh) upsertBakery(fresh);
      }
      setEditing(null);
    } catch (e) {
      alert(e.message || 'Could not save.');
    } finally { setSubmitting(false); }
  };

  const confirmDelete = async (bakery) => {
    if (!window.confirm(`Delete “${bakery.name}” and all its reviews? This can't be undone.`)) return;
    setBusyId(bakery.id);
    try { await deleteBakery(bakery.id); removeBakery(bakery.id); }
    catch (e) { alert(e.message || 'Could not delete.'); }
    finally { setBusyId(null); }
  };

  const SPONSORED_MAX = 5;
  const sponsoredCount = bakeries.filter((b) => b.sponsored).length;
  const toggleSponsored = async (b) => {
    const turningOn = !b.sponsored;
    if (turningOn && sponsoredCount >= SPONSORED_MAX) {
      alert(`You can feature up to ${SPONSORED_MAX} sponsored bakeries. Un-star one first.`);
      return;
    }
    applyBakeryPatch(b.id, { sponsored: turningOn }); // optimistic
    try {
      await setSponsored(b.id, turningOn);
    } catch (e) {
      applyBakeryPatch(b.id, { sponsored: b.sponsored }); // revert
      alert(e.message || 'Could not update sponsored status.');
    }
  };

  // ---- Moderation ----
  const refreshRating = async (bakeryId) => {
    const fresh = await getBakery(bakeryId).catch(() => null);
    if (fresh) applyBakeryPatch(bakeryId, { avgRating: fresh.avgRating, ratingCount: fresh.ratingCount });
  };
  const approve = async (item) => {
    setBusyId(item.id);
    try { await approveReview({ bakeryId: item.bakeryId, authorUid: item.authorUid, rating: item.rating, text: drafts[item.id], queueDocId: item.id }); await refreshRating(item.bakeryId); setQueue((q) => q.filter((i) => i.id !== item.id)); }
    catch (e) { alert(e.message || 'Could not publish.'); } finally { setBusyId(null); }
  };
  const reject = async (item) => {
    if (!window.confirm('Delete this review permanently?')) return;
    setBusyId(item.id);
    try { await rejectReview({ bakeryId: item.bakeryId, authorUid: item.authorUid, queueDocId: item.id }); await refreshRating(item.bakeryId); setQueue((q) => q.filter((i) => i.id !== item.id)); }
    catch (e) { alert(e.message || 'Could not delete.'); } finally { setBusyId(null); }
  };
  const dismiss = async (item) => {
    setBusyId(item.id);
    try { await dismissQueueEntry(item.id); setQueue((q) => q.filter((i) => i.id !== item.id)); }
    catch (e) { alert(e.message || 'Could not dismiss.'); } finally { setBusyId(null); }
  };
  const sendMsg = async () => {
    if (!msgTarget || !msgBody.trim()) return;
    try { await messageAuthor({ toUid: msgTarget.authorUid, body: msgBody.trim(), relatedReviewId: msgTarget.id }); setMsgTarget(null); setMsgBody(''); alert('Message sent to the author’s inbox.'); }
    catch (e) { alert(e.message || 'Could not send.'); }
  };

  const filtered = bakeries.filter((b) => matchesSearch(b, term));

  return (
    <div className="container page">
      <div className="row gap-1"><span className="badge gold">👑 Superuser</span></div>
      <h1 className="h1 mt-1">Admin</h1>

      <div className="row gap-1 mt-2 mb-3">
        <button className={`chip${tab === 'bakeries' ? ' active' : ''}`} onClick={() => setTab('bakeries')}>Bakeries ({bakeries.length})</button>
        <button className={`chip${tab === 'moderation' ? ' active' : ''}`} onClick={() => setTab('moderation')}>Moderation queue</button>
        <button className={`chip${tab === 'analytics' ? ' active' : ''}`} onClick={() => setTab('analytics')}>Analytics</button>
      </div>

      {tab === 'bakeries' ? (
        <>
          <div className="row gap-1 wrap mb-3">
            <input className="input" style={{ maxWidth: 320 }} value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search bakeries…" />
            <button className="btn green" onClick={() => setEditing('new')}>+ Add bakery</button>
            <button className="chip" onClick={refreshBakeries}>Refresh</button>
            <span className="small muted" style={{ marginLeft: 'auto' }}>⭐ Sponsored {sponsoredCount}/{SPONSORED_MAX}</span>
          </div>
          <p className="small faint mb-2">Tap the ⭐ star on up to {SPONSORED_MAX} bakeries to feature them in the Sponsored row above the ads.</p>

          {filtered.length === 0 ? (
            <EmptyState icon="🏪" title={term ? 'No matches' : 'No bakeries yet'} message={term ? 'Try another search.' : 'Add your first bakery.'} />
          ) : (
            <div className="results">
              {filtered.map((b) => (
                <div className={`card${b.sponsored ? ' sponsored-card' : ''}`} key={b.id}>
                  <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {b.sponsored ? <span className="badge gold" style={{ marginBottom: 4 }}>⭐ Sponsored</span> : null}
                      <div className="h3">{b.name}</div>
                      <div className="small muted">{b.address || 'No address'}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <FavoriteButton
                        active={b.sponsored}
                        onClick={() => toggleSponsored(b)}
                        label={b.sponsored ? 'Remove from sponsored' : 'Mark as sponsored'}
                      />
                      <div className="small faint" style={{ marginTop: -4 }}>Feature</div>
                    </div>
                  </div>
                  <div className="mt-1"><KingCakeRating value={b.avgRating} count={b.ratingCount} showValue size={14} /></div>
                  <div className="row gap-1 mt-2">
                    <button className="btn ghost sm" onClick={() => setEditing(b)}>Edit</button>
                    <button className="btn danger sm" onClick={() => confirmDelete(b)} disabled={busyId === b.id}>{busyId === b.id ? 'Deleting…' : 'Delete'}</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : tab === 'analytics' ? (
        <>
          {clicksLoading ? (
            <Loading label="Loading…" />
          ) : (
            <div className="card">
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="h3">🔪 kingcakeknives.com clicks</div>
                  <div className="small muted mt-1">Sponsor banner clicks, combined across the app and website</div>
                </div>
                <div className="h1" style={{ marginLeft: 16 }}>{sponsorClicks}</div>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {queueLoading ? (
            <Loading label="Loading queue…" />
          ) : queue.length === 0 ? (
            <EmptyState icon="✅" title="All clear" message="No flagged or reported reviews right now." />
          ) : (
            queue.map((item) => {
              const bakery = getBakeryById(item.bakeryId);
              const isReport = item.reason === 'Reported by a user';
              const busy = busyId === item.id;
              return (
                <div className="card mb-2" key={item.id}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <span className={`badge ${isReport ? 'gold' : 'type'}`}>{item.reason || 'Flagged'}</span>
                    <span className="small faint">{formatDate(item.createdAt)}</span>
                  </div>
                  <div className="small muted mt-1"><strong>@{item.authorUsername || 'user'}</strong> · {bakery ? bakery.name : 'Unknown bakery'}</div>
                  <div className="mt-1"><KingCakeRating value={item.rating} size={14} /></div>
                  <label className="label mt-2">Review text (editable)</label>
                  <textarea className="textarea" value={drafts[item.id] || ''} maxLength={REVIEW_MAX_CHARS} onChange={(e) => setDrafts((d) => ({ ...d, [item.id]: e.target.value.slice(0, REVIEW_MAX_CHARS) }))} />
                  <div className="row gap-1 wrap mt-2">
                    <button className="btn sm" onClick={() => approve(item)} disabled={busy}>Approve & publish</button>
                    <button className="btn danger sm" onClick={() => reject(item)} disabled={busy}>Delete</button>
                    <button className="btn ghost sm" onClick={() => { setMsgTarget(item); setMsgBody(`Hi ${item.authorUsername || 'there'}, your review was flagged (${item.reason || 'inappropriate content'}). `); }} disabled={busy}>Message author</button>
                    {isReport ? <button className="chip" onClick={() => dismiss(item)} disabled={busy}>Dismiss report</button> : null}
                  </div>
                </div>
              );
            })
          )}
        </>
      )}

      {/* Add/Edit modal */}
      {editing && (
        <Modal onClose={() => setEditing(null)} labelledBy="form-title">
          <h2 id="form-title" className="h2 mb-2">{editing === 'new' ? 'Add a bakery' : 'Edit bakery'}</h2>
          <BakeryForm
            initial={editing === 'new' ? null : editing}
            submitLabel={editing === 'new' ? 'Add bakery' : 'Save changes'}
            onSubmit={saveBakery}
            submitting={submitting}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}

      {/* Message author modal */}
      {msgTarget && (
        <Modal onClose={() => setMsgTarget(null)} labelledBy="msg-title">
          <h2 id="msg-title" className="h2">Message @{msgTarget.authorUsername || 'user'}</h2>
          <p className="small muted mt-1">Explain what was wrong. It lands in their inbox.</p>
          <textarea className="textarea mt-2" value={msgBody} onChange={(e) => setMsgBody(e.target.value)} />
          <button className="btn block mt-2" onClick={sendMsg}>Send message</button>
        </Modal>
      )}
    </div>
  );
}
