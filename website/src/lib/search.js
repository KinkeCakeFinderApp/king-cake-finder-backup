import { haversineMiles } from './distance';
import { minPrice } from './format';

export const SORT_OPTIONS = [
  { key: 'rating_high', label: 'Highest rating' },
  { key: 'rating_low', label: 'Lowest rating' },
  { key: 'count_high', label: 'Most ratings' },
  { key: 'count_low', label: 'Fewest ratings' },
  { key: 'closest', label: 'Closest to me' },
  { key: 'price_high', label: 'Price: high to low' },
  { key: 'price_low', label: 'Price: low to high' },
];

export const FILTER_OPTIONS = [
  { key: 'brickOnly', label: 'Brick-and-mortar' },
  { key: 'homeOnly', label: 'Home bakery' },
  { key: 'shippingOnly', label: 'Ships' },
];

export const DEFAULT_SORT = 'rating_high';
export const DEFAULT_FILTERS = { brickOnly: false, homeOnly: false, shippingOnly: false };

/** Case-insensitive partial match across name, address, variations, description. */
export function matchesSearch(bakery, term) {
  const q = String(term || '').trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    bakery.name,
    bakery.address,
    bakery.description,
    ...(Array.isArray(bakery.variations) ? bakery.variations.map((v) => v.name) : []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return q.split(/\s+/).every((token) => haystack.includes(token));
}

function passesFilters(b, f) {
  if (f.brickOnly && !b.isBrickAndMortar) return false;
  if (f.homeOnly && !b.isHomeBakery) return false;
  if (f.shippingOnly && !b.shipping) return false;
  return true;
}

function comparator(sort, userCoords) {
  const distOf = (b) => {
    const d = haversineMiles(userCoords, b.coords);
    return d == null ? Infinity : d;
  };
  const priceOf = (b) => minPrice(b.variations);
  switch (sort) {
    case 'rating_low': return (a, b) => (a.avgRating || 0) - (b.avgRating || 0);
    case 'count_high': return (a, b) => (b.ratingCount || 0) - (a.ratingCount || 0);
    case 'count_low': return (a, b) => (a.ratingCount || 0) - (b.ratingCount || 0);
    case 'closest': return (a, b) => distOf(a) - distOf(b);
    case 'price_high': return (a, b) => {
      const pa = priceOf(a), pb = priceOf(b);
      if (pa == null) return 1; if (pb == null) return -1; return pb - pa;
    };
    case 'price_low': return (a, b) => {
      const pa = priceOf(a), pb = priceOf(b);
      if (pa == null) return 1; if (pb == null) return -1; return pa - pb;
    };
    case 'rating_high':
    default: return (a, b) => (b.avgRating || 0) - (a.avgRating || 0);
  }
}

export function filterAndSort({ bakeries, term, sort, filters, userCoords }) {
  const cmp = comparator(sort || DEFAULT_SORT, userCoords);
  return bakeries
    .filter((b) => matchesSearch(b, term))
    .filter((b) => passesFilters(b, filters || DEFAULT_FILTERS))
    .sort((a, b) => cmp(a, b) || (a.name || '').localeCompare(b.name || ''));
}

export function activeFilterCount(filters) {
  return filters ? Object.values(filters).filter(Boolean).length : 0;
}
