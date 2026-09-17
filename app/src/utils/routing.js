const OSRM_ROUTE_URL = 'https://router.project-osrm.org/route/v1/driving';
const REQUEST_TIMEOUT_MS = 6000;
const METERS_PER_MILE = 1609.344;

/**
 * Real road-network driving distance/time between two coordinates, from
 * OSRM's public demo routing server (no API key, no account — see
 * https://router.project-osrm.org). It's a free community instance with no
 * uptime guarantee, so a null result here just means "not available right
 * now" and callers should fall back to utils/distance.js's straight-line
 * estimate rather than surfacing an error.
 */
export async function fetchDrivingRoute(from, to) {
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

  const url = `${OSRM_ROUTE_URL}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;

    const data = await res.json();
    const route = data?.routes?.[0];
    if (data?.code !== 'Ok' || !route) return null;

    return {
      miles: route.distance / METERS_PER_MILE,
      minutes: route.duration / 60,
    };
  } catch (e) {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
