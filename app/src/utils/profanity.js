// ---------------------------------------------------------------------------
// Auto-moderation: keep all public content PG-rated.
//
// Screens review text for profanity, sexual content, slurs, threats, and
// self-harm content. It normalizes common obfuscation (leetspeak,
// padding/repeated characters, punctuation and spacing) and then matches
// against a curated word list.
//
// Matching is ANCHORED, not raw-substring: a "prefix" root only matches a token
// that STARTS with it, and "word" roots must match a whole token. This avoids
// false positives on innocent words — e.g. "spicy" (contains "spic"),
// "grape" (contains "rape") and "snigger" (contains "nigg") are NOT flagged,
// while "spic", "rape" and "nigger" are.
//
// This is the first-pass, instant, zero-cost filter. A second pass —
// utils/moderationCheck.js, calling a Cloudflare Worker running an AI model —
// catches subtler harassment/toxicity this word list can't (see
// services/reviews.js, which checks both and flags if either does).
// ---------------------------------------------------------------------------

// [root, matchType('prefix'|'word'), category]
const RULES = [
  // Profanity (prefix roots have no innocent English collisions at the start).
  ['fuck', 'prefix', 'profanity'],
  ['motherfuck', 'prefix', 'profanity'],
  ['shit', 'prefix', 'profanity'],
  ['bitch', 'prefix', 'profanity'],
  ['bastard', 'prefix', 'profanity'],
  ['asshole', 'prefix', 'profanity'],
  ['dickhead', 'prefix', 'profanity'],
  ['jackass', 'prefix', 'profanity'],
  ['dumbass', 'prefix', 'profanity'],
  ['cunt', 'prefix', 'profanity'],
  ['whore', 'prefix', 'profanity'],
  ['slut', 'prefix', 'profanity'],
  ['goddamn', 'prefix', 'profanity'],
  ['douche', 'prefix', 'profanity'],
  ['wanker', 'prefix', 'profanity'],
  ['damn', 'word', 'profanity'],
  ['crap', 'word', 'profanity'],
  ['dick', 'word', 'profanity'],
  ['twat', 'word', 'profanity'],
  ['prick', 'word', 'profanity'],
  ['schmuck', 'word', 'profanity'],
  ['bollocks', 'word', 'profanity'],
  ['bullshit', 'word', 'profanity'],
  ['dipshit', 'word', 'profanity'],
  ['horseshit', 'word', 'profanity'],
  ['bugger', 'word', 'profanity'],
  ['arsehole', 'prefix', 'profanity'],
  ['wank', 'word', 'profanity'],
  ['knobhead', 'word', 'profanity'],
  ['ass', 'word', 'profanity'],

  // Sexual content.
  ['cocksuck', 'prefix', 'sexual'],
  ['pussy', 'prefix', 'sexual'],
  ['blowjob', 'prefix', 'sexual'],
  ['handjob', 'prefix', 'sexual'],
  ['jerkoff', 'prefix', 'sexual'],
  ['dildo', 'prefix', 'sexual'],
  ['masturbat', 'prefix', 'sexual'],
  ['porno', 'prefix', 'sexual'],
  ['boner', 'prefix', 'sexual'],
  ['orgasm', 'prefix', 'sexual'],
  ['jizz', 'prefix', 'sexual'],
  ['cum', 'word', 'sexual'],
  ['anal', 'word', 'sexual'],
  ['cock', 'word', 'sexual'],
  ['porn', 'word', 'sexual'],
  ['nsfw', 'word', 'sexual'],
  ['horny', 'word', 'sexual'],

  // Slurs / hate speech. (No generic "hate" rule — that flagged ordinary
  // negative reviews like "I hate how long the wait was".)
  ['nigg', 'prefix', 'slur'],
  ['fag', 'prefix', 'slur'],
  ['tranny', 'prefix', 'slur'],
  ['kike', 'word', 'slur'],
  ['spic', 'word', 'slur'],
  ['wetback', 'word', 'slur'],
  ['retard', 'prefix', 'slur'],
  ['chink', 'word', 'slur'],
  ['gook', 'word', 'slur'],
  ['coon', 'word', 'slur'],
  ['beaner', 'word', 'slur'],
  ['towelhead', 'word', 'slur'],
  ['raghead', 'word', 'slur'],
  ['jap', 'word', 'slur'],
  ['injun', 'word', 'slur'],
  ['paki', 'word', 'slur'],

  // Threats / sexual violence.
  ['rape', 'prefix', 'threat'],
  ['rapist', 'word', 'threat'],

  // Self-harm.
  ['suicide', 'word', 'selfharm'],
  ['suicidal', 'word', 'selfharm'],
];

// Multi-word threat phrases (safe to test as substrings — they are unlikely to
// occur benignly).
const THREAT_PHRASES = [
  'kill you',
  'kill u',
  'gonna kill',
  'going to kill',
  'shoot you',
  'shoot up',
  'stab you',
  'beat you up',
  'hurt you',
  'die bitch',
  'burn down',
  'come to your house',
  'find where you live',
  'slit your throat',
  'blow your head off',
  'put you in the ground',
  'ill kill',
  'gonna shoot',
  'going to shoot',
  'burn your business down',
  'torch your store',
  'watch your back',
  'you will pay',
  'i know where you live',
  'break your legs',
  'smash your windows',
];

// Multi-word self-harm phrases — flagged so a human can follow up, not as
// punitive moderation.
const SELF_HARM_PHRASES = [
  'kill myself',
  'end my life',
  'want to die',
  'better off dead',
  'end it all',
  'not worth living',
  'hurt myself',
  'harm myself',
];

const LEET_MAP = {
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '8': 'b',
  '@': 'a',
  $: 's',
  '!': 'i',
  '|': 'i',
};

const CATEGORY_LABEL = {
  slur: 'Hate speech / slur',
  threat: 'Threat / violent content',
  selfharm: 'Self-harm content',
  sexual: 'Sexual content',
  profanity: 'Profanity / inappropriate content',
};

// Higher = more severe; used to pick the reason shown in the queue.
const CATEGORY_RANK = { slur: 5, threat: 4, selfharm: 3, sexual: 2, profanity: 1 };

/**
 * Normalize: lowercase, map leetspeak to letters, strip anything that isn't a
 * letter or space, then collapse runs of 3+ identical letters ("shiiit" ->
 * "shit"). Punctuation removal turns "f.u.c.k" into "fuck".
 */
function normalize(text) {
  let out = String(text || '').toLowerCase();
  out = out.replace(/[0134578@$!|]/g, (ch) => LEET_MAP[ch] || ch);
  out = out.replace(/[^a-z\s]/g, '');
  out = out.replace(/([a-z])\1{2,}/g, '$1');
  return out.trim();
}

/**
 * Build the list of candidate "words" to test:
 *  - each whitespace-separated token, and
 *  - joined runs of 3+ single-letter tokens, so spaced-out obfuscation like
 *    "f u c k" is caught without merging unrelated words ("spicy king").
 */
function candidateTokens(normalized) {
  const tokens = normalized.split(/\s+/).filter(Boolean);
  const candidates = [...tokens];

  let run = [];
  const flush = () => {
    if (run.length >= 3) candidates.push(run.join(''));
    run = [];
  };
  for (const t of tokens) {
    if (t.length === 1) run.push(t);
    else flush();
  }
  flush();

  return candidates;
}

function matchToken(token) {
  for (const [root, type, category] of RULES) {
    if (type === 'prefix' ? token.startsWith(root) : token === root) {
      return { root, category };
    }
  }
  return null;
}

/**
 * Screens text. Returns { flagged, reason, matched } where `reason` is a short
 * human-readable category for the moderation queue.
 */
export function moderateText(text) {
  const normalized = normalize(text);
  const matched = [];
  let topCategory = null;

  const consider = (category, token) => {
    matched.push(token);
    if (!topCategory || CATEGORY_RANK[category] > CATEGORY_RANK[topCategory]) {
      topCategory = category;
    }
  };

  for (const token of candidateTokens(normalized)) {
    const hit = matchToken(token);
    if (hit) consider(hit.category, hit.root);
  }

  for (const phrase of THREAT_PHRASES) {
    if (normalized.includes(phrase)) consider('threat', phrase);
  }

  for (const phrase of SELF_HARM_PHRASES) {
    if (normalized.includes(phrase)) consider('selfharm', phrase);
  }

  return {
    flagged: matched.length > 0,
    reason: topCategory ? CATEGORY_LABEL[topCategory] : null,
    matched: Array.from(new Set(matched)),
  };
}
