export function formatPrice(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return '—';
  const hasCents = Math.round(num * 100) % 100 !== 0;
  return `$${num.toFixed(hasCents ? 2 : 0)}`;
}

export function minPrice(variations) {
  if (!Array.isArray(variations) || variations.length === 0) return null;
  const prices = variations.map((v) => Number(v.price)).filter((p) => !Number.isNaN(p));
  return prices.length ? Math.min(...prices) : null;
}

export function startingPriceLabel(variations) {
  const min = minPrice(variations);
  return min == null ? null : `from ${formatPrice(min)}`;
}

export function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000);
  return null;
}

export function formatDate(value) {
  const d = toDate(value);
  if (!d) return '';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function timeAgo(value) {
  const d = toDate(value);
  if (!d) return '';
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(value);
}
