import { haversineMiles } from '@/src/utils/distance';
import { minPrice } from '@/src/utils/format';

// Sort options offered in the filter sheet.
export const SORT_OPTIONS = [
  { key: 'rating_high', label: 'Highest rating', icon: 'arrow-up-bold' },
  { key: 'rating_low', label: 'Lowest rating', icon: 'arrow-down-bold' },
  { key: 'count_high', label: 'Most ratings', icon: 'sort-numeric-descending' },
  { key: 'count_low', label: 'Fewest ratings', icon: 'sort-numeric-ascending' },
  { key: 'closest', label: 'Closest to me', icon: 'map-marker-radius-outline' },
  { key: 'price_high', label: 'Price: high to low', icon: 'cash' },
  { key: 'price_low', label: 'Price: low to high', icon: 'cash-multiple' },
];

// Independent boolean filters (can be combined).
export const FILTER_OPTIONS = [
  { key: 'brickOnly', label: 'Brick-and-mortar only', icon: 'storefront-outline' },
  { key: 'homeOnly', label: 'Home bakery only', icon: 'home-outline' },
  { key: 'shippingOnly', label: 'Offers shipping', icon: 'truck-fast-outline' },
];

export const DEFAULT_SORT = 'rating_high';

export const DEFAULT_FILTERS = {
  brickOnly: false,
  homeOnly: false,
  shippingOnly: false,
};

/**
 * Case-insensitive, partial match across everything a user might search:
 * name, address, cake variation names, and description keywords.
 */
export function matchesSearch(bakery, term) {
  const q = String(term || '').trim().toLowerCase();
  if (!q) return true;

  const haystack = [
    bakery.name,
    bakery.address,
    bakery.description,
    ...(Array.isArray(bakery.variations)
      ? bakery.variations.map((v) => v.name)
      : []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  // Match if every whitespace-separated token appears somewhere in the haystack.
  return q.split(/\s+/).every((token) => haystack.includes(token));
}

function passesFilters(bakery, filters) {
  if (filters.brickOnly && !bakery.isBrickAndMortar) return false;
  if (filters.homeOnly && !bakery.isHomeBakery) return false;
  if (filters.shippingOnly && !bakery.shipping) return false;
  return true;
}

function comparator(sort, userCoords) {
  const distOf = (b) => {
    const d = haversineMiles(userCoords, b.coords);
    return d === null ? Number.POSITIVE_INFINITY : d;
  };
  const priceOf = (b) => {
    const p = minPrice(b.variations);
    return p === null ? null : p;
  };

  switch (sort) {
    case 'rating_low':
      return (a, b) => (a.avgRating || 0) - (b.avgRating || 0);
    case 'count_high':
      return (a, b) => (b.ratingCount || 0) - (a.ratingCount || 0);
    case 'count_low':
      return (a, b) => (a.ratingCount || 0) - (b.ratingCount || 0);
    case 'closest':
      return (a, b) => distOf(a) - distOf(b);
    case 'price_high':
      return (a, b) => {
        const pa = priceOf(a);
        const pb = priceOf(b);
        if (pa === null) return 1;
        if (pb === null) return -1;
        return pb - pa;
      };
    case 'price_low':
      return (a, b) => {
        const pa = priceOf(a);
        const pb = priceOf(b);
        if (pa === null) return 1;
        if (pb === null) return -1;
        return pa - pb;
      };
    case 'rating_high':
    default:
      return (a, b) => (b.avgRating || 0) - (a.avgRating || 0);
  }
}

/**
 * Full pipeline used by the Search screen: filter by search term, apply the
 * boolean filters, then sort. Returns a new array.
 */
export function filterAndSort({ bakeries, term, sort, filters, userCoords }) {
  const result = bakeries
    .filter((b) => matchesSearch(b, term))
    .filter((b) => passesFilters(b, filters || DEFAULT_FILTERS));

  const cmp = comparator(sort || DEFAULT_SORT, userCoords);
  // Stable-ish secondary sort by name to keep ordering deterministic.
  return result.sort((a, b) => {
    const primary = cmp(a, b);
    if (primary !== 0) return primary;
    return (a.name || '').localeCompare(b.name || '');
  });
}

export function activeFilterCount(filters) {
  if (!filters) return 0;
  return Object.values(filters).filter(Boolean).length;
}
