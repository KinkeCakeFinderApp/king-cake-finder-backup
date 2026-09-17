import React, { useState } from 'react';
import KingCakeRating from './KingCakeRating';
import Recaptcha from './Recaptcha';
import { useAuth } from '../context/AuthContext';
import { submitReview } from '../services/reviews';
import { REVIEW_MAX_CHARS } from '../config';
import { verifyRecaptchaToken } from '../lib/recaptcha';

/**
 * Review composer: 1–5 king-cake rating above a 500-char box with a live
 * counter, a reCAPTCHA that must be solved before submitting, then
 * auto-moderation inside submitReview().
 */
export default function ReviewComposer({ bakeryId, existingReview, onSubmitted, onCancelEdit }) {
  const { user, profile } = useAuth();
  const [rating, setRating] = useState(existingReview ? existingReview.rating : 0);
  const [text, setText] = useState(existingReview ? existingReview.text : '');
  const [captchaToken, setCaptchaToken] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const isEditing = !!existingReview;
  const remaining = REVIEW_MAX_CHARS - text.length;

  const handleSubmit = async () => {
    setError(null);
    setNotice(null);
    if (rating < 1) { setError('Tap the king cakes to choose a rating first.'); return; }
    if (!captchaToken) { setError('Please complete the "I\'m not a robot" check.'); return; }
    setSubmitting(true);
    try {
      const verified = await verifyRecaptchaToken(captchaToken);
      if (!verified) {
        setError('Bot check failed to verify. Please retry the "I\'m not a robot" check.');
        setCaptchaToken(null);
        setSubmitting(false);
        return;
      }
      const { status, moderation } = await submitReview({
        bakeryId, uid: user.uid, username: profile?.username || 'user', rating, text,
      });
      if (status === 'moderated') {
        setNotice(`Thanks — your review mentioned something our filter flagged (${moderation.reason || 'inappropriate content'}). It's pending moderator review and isn't public yet.`);
      }
      if (onSubmitted) onSubmitted(status);
    } catch (e) {
      setError(e.message || 'Could not submit your review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card">
      <h3 className="h3">{isEditing ? 'Edit your review' : 'Write a review'}</h3>
      <div className="small muted" style={{ marginTop: 2 }}>Rate this bakery's king cakes</div>

      <div className="mt-2 mb-2">
        <KingCakeRating value={rating} interactive onChange={setRating} size={30} />
      </div>

      <textarea
        className="textarea"
        placeholder="Share what made their king cake great (or not)…"
        value={text}
        maxLength={REVIEW_MAX_CHARS}
        onChange={(e) => setText(e.target.value.slice(0, REVIEW_MAX_CHARS))}
      />
      <div className="counter" style={{ color: remaining <= 25 ? 'var(--danger)' : undefined }}>
        {remaining} characters left
      </div>

      <div className="mt-2"><Recaptcha onVerify={setCaptchaToken} onExpire={() => setCaptchaToken(null)} /></div>

      {error ? <div className="field-error mt-1">{error}</div> : null}
      {notice ? <div className="small mt-2" style={{ color: 'var(--gold)' }}>{notice}</div> : null}

      <div className="row gap-1 mt-2">
        {isEditing && onCancelEdit ? (
          <button className="btn ghost" onClick={onCancelEdit} disabled={submitting}>Cancel</button>
        ) : null}
        <button className="btn" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Posting…' : isEditing ? 'Save changes' : 'Post review'}
        </button>
      </div>
      <div className="small faint mt-2">Reviews are auto-checked to keep things PG. A bot check runs before posting.</div>
    </div>
  );
}
