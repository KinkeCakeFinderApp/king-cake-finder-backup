import { MODERATION_CHECK_URL } from '../config';

/**
 * Asks the moderation-check-worker to score review text for toxicity via
 * Perspective API, on top of the local keyword filter (lib/profanity.js).
 * Fails open (never flags) on any error — a network hiccup or unconfigured
 * worker should never block someone from posting a legitimate review; the
 * keyword filter is still the baseline safety net either way.
 */
export async function checkToxicity(text) {
  if (!MODERATION_CHECK_URL || !text || !text.trim()) return { flagged: false };
  try {
    const res = await fetch(MODERATION_CHECK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    return { flagged: !!data.flagged, category: data.category || null };
  } catch (e) {
    return { flagged: false };
  }
}
