// King Cake Finder — review toxicity check worker.
//
// The app's keyword filter (src/utils/profanity.js) catches obvious
// profanity/slurs/threats instantly and for free, but misses subtler
// harassment that doesn't use flagged words. This worker runs review text
// through a Workers AI instruct model with a custom moderation prompt — same
// Cloudflare account as the worker itself, no separate API key, no card,
// free tier (10,000 neurons/day). submitReview() checks this ALONGSIDE the
// keyword filter — either one flagging sends a review to the moderation
// queue exactly like today.
//
// History: first built against Google's Perspective API (closed to new
// sign-ups ahead of its Dec 2026 retirement), then OpenAI's Moderation
// endpoint (free, but requires a card on the account regardless), then
// Llama Guard 3 (works, no key/card needed, but its fixed safety taxonomy
// only catches severe categories — hate speech, threats, sexual content —
// not personal harassment/insults directed at a person, which is what we
// actually want caught here). This version uses a general instruct model
// with a purpose-written prompt instead, so it can be told explicitly what
// "flagged" means for a bakery review site: harassment of a person, yes;
// harsh-but-fair criticism of the food or service, no.
//
// Fails OPEN on any error — the keyword filter is still the baseline, so a
// toxicity-check hiccup should never block someone from posting a legitimate
// review.

const ALLOWED_ORIGINS = [
  'https://king-cake-app.web.app',
  'http://localhost:5173',
];

const SYSTEM_PROMPT = `You are a content moderator for a bakery review website (King Cake Finder). Users post reviews of bakeries.

Flag a review ONLY if it contains one or more of:
- Harassment, insults, or personal attacks directed at a specific person (the bakery owner, staff, or another reviewer) rather than criticism of the food, service, price, or business itself.
- Hate speech or slurs targeting a group based on race, religion, ethnicity, gender, sexual orientation, disability, etc.
- Explicit threats of violence.
- Sexual content.
- Content promoting self-harm or suicide.

Do NOT flag a review just because it is negative, harsh, sarcastic, or critical of the food, service, cleanliness, prices, or wait times — negative reviews are normal and expected, and are NOT harassment.

Respond with EXACTLY one line and nothing else:
- The single word SAFE, if none of the above apply.
- Or FLAGGED: <category in 2-4 words>, if one does.`;

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const headers = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }
    if (request.method !== 'POST') {
      return Response.json({ flagged: false, error: 'method_not_allowed' }, { status: 405, headers });
    }

    let text;
    try {
      const body = await request.json();
      text = body && body.text;
    } catch (e) {
      return Response.json({ flagged: false, error: 'invalid_json' }, { status: 400, headers });
    }

    if (!text || typeof text !== 'string' || !text.trim()) {
      return Response.json({ flagged: false }, { status: 200, headers });
    }
    if (!env.AI) {
      return Response.json({ flagged: false, error: 'server_misconfigured' }, { status: 200, headers });
    }

    try {
      const result = await env.AI.run('@cf/meta/llama-3.1-8b-instruct-fast', {
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: text },
        ],
        max_tokens: 30,
        temperature: 0,
      });

      const raw = String(result?.response || '').trim();
      const flagged = /^flagged/i.test(raw);
      let category = null;
      if (flagged) {
        const parts = raw.split(':');
        category = parts.length > 1 ? parts.slice(1).join(':').trim() : 'Harassment';
      }

      return Response.json({ flagged, category }, { status: 200, headers });
    } catch (e) {
      console.error('moderation check failed:', e.message, e.stack);
      return Response.json({ flagged: false, error: 'request_failed', detail: e.message }, { status: 200, headers });
    }
  },
};
