import { MODERATION_CHECK_URL } from '@/src/config/appConfig';

/**
 * Asks the moderation-check-worker to score review text for toxicity via
 * Perspective API, on top of the local keyword filter (utils/profanity.js).
 * Fails open (never flags) on any error — mirrors the website's
 * src/lib/moderationCheck.js.
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
