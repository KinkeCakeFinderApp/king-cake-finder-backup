import { AVG_DRIVING_SPEED_MPH } from '@/src/config/appConfig';

const EARTH_RADIUS_MILES = 3958.8;

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Great-circle distance between two coordinates in miles (haversine formula).
 * Returns null when either coordinate is missing.
 */
export function haversineMiles(from, to) {
  if (
    !from ||
    !to ||
    typeof from.lat !== 'number' ||
    typeof from.lng !== 'number' ||
    typeof to.lat !== 'number' ||
    typeof to.lng !== 'number'
  ) {
    return null;
  }

  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_MILES * c;
}

/** Human-readable distance label, e.g. "0.4 mi" or "12 mi". */
export function formatDistance(miles) {
  if (miles === null || miles === undefined || Number.isNaN(miles)) {
    return null;
  }
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
 * fallback when a real route (see utils/routing.js) isn't available yet or
 * fails. We inflate the haversine distance by ~25% to approximate real road
 * routing, then divide by an average driving speed.
 */
export function estimateTravelTime(miles) {
  if (miles === null || miles === undefined || Number.isNaN(miles)) {
    return null;
  }
  const roadMiles = miles * 1.25;
  return formatMinutes((roadMiles / AVG_DRIVING_SPEED_MPH) * 60);
}
