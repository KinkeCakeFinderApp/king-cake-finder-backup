import React from 'react';
import KingCakeRating from './KingCakeRating';
import { formatDate } from '../lib/format';

export default function ReviewItem({ review, isOwn = false, onEdit, onReport, onBlock, onDelete, reported = false }) {
  const pending = review.status === 'moderated';
  return (
    <div className="review">
      <div className="rhead">
        <div className="row gap-1">
          <div className="avatar">{(review.authorUsername || '?').charAt(0).toUpperCase()}</div>
          <div>
            <div style={{ fontWeight: 700 }}>{isOwn ? 'You' : review.authorUsername || 'Anonymous'}</div>
            <div className="small faint">{formatDate(review.createdAt)}</div>
          </div>
        </div>
        <KingCakeRating value={review.rating} size={15} />
      </div>

      {review.text ? <p style={{ margin: '10px 0 6px' }}>{review.text}</p> : null}

      <div className="row" style={{ justifyContent: 'space-between', marginTop: 4 }}>
        {pending && isOwn ? <span className="badge gold">⏳ Pending review</span> : <span />}
        <div className="row gap-1">
          {isOwn && onEdit ? (
            <button className="chip" onClick={onEdit}>✏️ Edit</button>
          ) : null}
          {!isOwn && onReport ? (
            <button className="chip" onClick={reported ? undefined : onReport} disabled={reported}>
              {reported ? '✓ Reported' : '⚑ Report'}
            </button>
          ) : null}
          {!isOwn && onBlock ? (
            <button className="chip" onClick={onBlock}>🚫 Block</button>
          ) : null}
          {onDelete ? (
            <button className="chip" onClick={onDelete} style={{ color: 'var(--danger)', borderColor: 'var(--danger-soft)' }}>
              🗑 Remove
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
