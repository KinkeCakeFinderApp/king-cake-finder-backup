import { AVG_DRIVING_SPEED_MPH } from '../config';

const EARTH_RADIUS_MILES = 3958.8;
const toRad = (deg) => (deg * Math.PI) / 180;

/** Great-circle distance in miles (haversine). Null if a coord is missing. */
export function haversineMiles(from, to) {
  if (
    !from || !to ||
    typeof from.lat !== 'number' || typeof from.lng !== 'number' ||
    typeof to.lat !== 'number' || typeof to.lng !== 'number'
  ) {
    return null;
  }
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat));
  return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(miles) {
  if (miles == null || Number.isNaN(miles)) return null;
  if (miles < 0.1) return '< 0.1 mi';
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}

/** Formats a minute count as a short label, e.g. "8 min" or "1 hr 5 min". */
export function formatMinutes(rawMinutes) {
  const minutes = Math.max(1, Math.round(rawMinutes));
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins === 0 ? `${hrs} hr` : `${hrs} hr ${mins} min`;
}

/**
 * Estimated driving time from a straight-line distance, used only as a
 * fallback when a real route (see lib/routing.js) isn't available yet or
 * fails.
 */
export function estimateTravelTime(miles) {
  if (miles == null || Number.isNaN(miles)) return null;
  return formatMinutes((miles * 1.25 / AVG_DRIVING_SPEED_MPH) * 60);
}
