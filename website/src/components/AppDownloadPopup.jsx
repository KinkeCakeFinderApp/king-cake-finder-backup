import React, { useEffect, useState } from 'react';
import { Modal } from './common';
import { APP_STORE_URL, PLAY_STORE_URL, storeLinkReady, SITE_NAME } from '../config';

const KEY = 'kcf_app_popup_dismissed_at';
const REMIND_AFTER_MS = 3 * 24 * 60 * 60 * 1000; // don't nag: re-show after ~3 days

function isMobile() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
}

/**
 * Promotes the mobile app on first visit. Dismissal is remembered for a few
 * days so it isn't annoying. Accessible: closeable + Escape-dismissible.
 */
export default function AppDownloadPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let last = 0;
    try { last = Number(localStorage.getItem(KEY)) || 0; } catch (e) { /* ignore */ }
    if (Date.now() - last > REMIND_AFTER_MS) {
      const t = setTimeout(() => setOpen(true), 1200); // let the page paint first
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(KEY, String(Date.now())); } catch (e) { /* ignore */ }
    setOpen(false);
  };

  if (!open) return null;

  const StoreLink = ({ url, label, sublabel }) => {
    const ready = storeLinkReady(url);
    return (
      <a
        className={`btn ${ready ? 'dark' : 'ghost'} block`}
        href={ready ? url : undefined}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => { if (!ready) e.preventDefault(); }}
        style={{ justifyContent: 'flex-start', gap: 12, opacity: ready ? 1 : 0.6, marginBottom: 10 }}
      >
        <span style={{ fontSize: 22 }}>{label.icon}</span>
        <span style={{ textAlign: 'left', lineHeight: 1.1 }}>
          <span className="small faint" style={{ display: 'block' }}>{sublabel}</span>
          <strong>{ready ? label.text : 'Coming soon'}</strong>
        </span>
      </a>
    );
  };

  return (
    <Modal onClose={dismiss} labelledBy="popup-title">
      <div className="center">
        <img src="/favicon.svg" alt="" style={{ width: 64, height: 64, margin: '0 auto 12px' }} />
        <h2 id="popup-title" className="h2">Get the {SITE_NAME} app</h2>
        <p className="muted" style={{ marginTop: 6 }}>
          {isMobile()
            ? 'Faster browsing, GPS distance, and your favorites in your pocket.'
            : 'Take it with you — GPS distance, favorites, and reviews on the go.'}
        </p>
      </div>

      <div className="mt-3">
        <StoreLink url={APP_STORE_URL} sublabel="Download on the" label={{ icon: '', text: 'App Store' }} />
        <StoreLink url={PLAY_STORE_URL} sublabel="Get it on" label={{ icon: '▶', text: 'Google Play' }} />
      </div>

      <button className="btn ghost block mt-2" onClick={dismiss}>Maybe later</button>
    </Modal>
  );
}
