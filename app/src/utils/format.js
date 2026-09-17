/** Formats a number as USD, dropping cents when they are .00. */
export function formatPrice(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return '—';
  const hasCents = Math.round(num * 100) % 100 !== 0;
  return `$${num.toFixed(hasCents ? 2 : 0)}`;
}

/**
 * Given a bakery's variations, returns a compact "starting price" label:
 * the lowest variation price, e.g. "from $18".
 */
export function startingPriceLabel(variations) {
  if (!Array.isArray(variations) || variations.length === 0) return null;
  const prices = variations
    .map((v) => Number(v.price))
    .filter((p) => !Number.isNaN(p));
  if (prices.length === 0) return null;
  const min = Math.min(...prices);
  return `from ${formatPrice(min)}`;
}

/** Lowest variation price as a raw number (used for price sorting). */
export function minPrice(variations) {
  if (!Array.isArray(variations) || variations.length === 0) return null;
  const prices = variations
    .map((v) => Number(v.price))
    .filter((p) => !Number.isNaN(p));
  return prices.length ? Math.min(...prices) : null;
}

/** Converts a Firestore Timestamp | Date | millis into a JS Date (or null). */
export function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000);
  return null;
}

/** Friendly date label, e.g. "Aug 3, 2026". */
export function formatDate(value) {
  const date = toDate(value);
  if (!date) return '';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Relative-ish label used in the inbox, e.g. "2 days ago". */
export function timeAgo(value) {
  const date = toDate(value);
  if (!date) return '';
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(value);
}
