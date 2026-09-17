import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common';
import { friendlyAuthError } from '../lib/validation';

export default function Account() {
  const { isAuthenticated, profile, isSuperuser, logOut, deleteAccount, blockedUsers, unblockUser } = useAuth();
  const navigate = useNavigate();
  const [showDelete, setShowDelete] = useState(false);
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  if (!isAuthenticated) {
    return (
      <div className="container page center">
        <h2 className="h2">You're logged out</h2>
        <Link className="btn mt-2" to="/login">Log in</Link>
      </div>
    );
  }

  const handleLogout = async () => { await logOut(); navigate('/'); };
  const handleDelete = async () => {
    setError(null); setDeleting(true);
    try { await deleteAccount(password); navigate('/'); }
    catch (e) { setError(friendlyAuthError(e)); setDeleting(false); }
  };

  return (
    <div className="container page" style={{ maxWidth: 560 }}>
      <h1 className="h1">Account</h1>

      <div className="card mt-3">
        <div className="row gap-1">
          <div className="avatar" style={{ width: 52, height: 52, fontSize: '1.3rem' }}>
            {(profile?.firstName || profile?.username || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="h3">{profile ? `${profile.firstName} ${profile.lastName}` : '—'}</div>
            <div className="small muted">@{profile?.username}</div>
            <div className="small faint">{profile?.email}</div>
          </div>
          {isSuperuser ? <span className="badge gold" style={{ marginLeft: 'auto' }}>👑 Admin</span> : null}
        </div>
      </div>

      <div className="card mt-2">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div><strong>Log out</strong><div className="small muted">Sign out on this device</div></div>
          <button className="btn ghost sm" onClick={handleLogout}>Log out</button>
        </div>
        <div className="divider-line" />
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div><strong style={{ color: 'var(--danger)' }}>Delete account</strong><div className="small muted">Permanently remove your account & data</div></div>
          <button className="btn danger sm" onClick={() => { setPassword(''); setError(null); setShowDelete(true); }}>Delete</button>
        </div>
      </div>

      {blockedUsers && blockedUsers.length > 0 ? (
        <div className="card mt-2">
          <div className="eyebrow" style={{ marginBottom: 8 }}>Blocked users</div>
          {blockedUsers.map((b, i) => (
            <div key={b.uid}>
              {i > 0 ? <div className="divider-line" /> : null}
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div><strong>{b.username || 'user'}</strong><div className="small muted">Their reviews are hidden from you</div></div>
                <button className="btn ghost sm" onClick={() => unblockUser(b).catch(() => {})}>Unblock</button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <p className="small faint mt-3">Your account and data are shared with the King Cake Finder mobile app.</p>

      {showDelete && (
        <Modal onClose={() => setShowDelete(false)} labelledBy="del-title">
          <h2 id="del-title" className="h2" style={{ color: 'var(--danger)' }}>Delete your account?</h2>
          <p className="muted mt-1">This permanently deletes your account, reviews, and favorites — on the website and the app. This can't be undone. Enter your password to confirm.</p>
          <input className="input mt-2" type="password" placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error ? <div className="field-error mt-1">{error}</div> : null}
          <button className="btn danger block mt-2" onClick={handleDelete} disabled={deleting}>{deleting ? 'Deleting…' : 'Delete forever'}</button>
          <button className="btn ghost block mt-1" onClick={() => setShowDelete(false)} disabled={deleting}>Cancel</button>
        </Modal>
      )}
    </div>
  );
}
