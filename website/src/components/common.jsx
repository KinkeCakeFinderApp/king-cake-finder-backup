import React from 'react';

export function Loading({ label = 'Loading…' }) {
  return (
    <div className="center" style={{ padding: '20px' }}>
      <div className="spinner" />
      <div className="muted small">{label}</div>
    </div>
  );
}

export function EmptyState({ icon = '🧁', title, message, action = null }) {
  return (
    <div className="empty">
      <div className="icon">{icon}</div>
      <h3 className="h3">{title}</h3>
      {message ? <p className="muted" style={{ maxWidth: 380, margin: '0 auto' }}>{message}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

export function FavoriteButton({ active, onClick, size = 24, label }) {
  const aria = label || (active ? 'Remove from favorites' : 'Add to favorites');
  return (
    <button
      className={`fav-btn${active ? ' active' : ''}`}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
      aria-label={aria}
      title={aria}
      style={{ fontSize: size }}
    >
      {active ? '★' : '☆'}
    </button>
  );
}

export function ToTasteButton({ active, onClick, size = 24, label }) {
  const aria = label || (active ? 'Remove from to be tasted' : 'Add to to be tasted');
  return (
    <button
      className={`fav-btn taste${active ? ' active' : ''}`}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
      aria-label={aria}
      title={aria}
      style={{ fontSize: size }}
    >
      {active ? '🔖' : '📑'}
    </button>
  );
}

export function Modal({ children, onClose, labelledBy }) {
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
        <button className="x" onClick={onClose} aria-label="Close">×</button>
        {children}
      </div>
    </div>
  );
}
