function destination(address, coords) {
  if (coords && typeof coords.lat === 'number' && typeof coords.lng === 'number') {
    return `${coords.lat},${coords.lng}`;
  }
  return encodeURIComponent(String(address || '').trim());
}

export function googleMapsUrl(address, coords) {
  return `https://www.google.com/maps/dir/?api=1&destination=${destination(address, coords)}`;
}

export function appleMapsUrl(address, coords) {
  const d = destination(address, coords);
  return `https://maps.apple.com/?daddr=${d}`;
}

export function telUrl(phone) {
  return `tel:${String(phone || '').replace(/[^\d+]/g, '')}`;
}
