import React, { useEffect, useRef } from 'react';

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

// Load Leaflet from the CDN once and reuse the promise across mounts.
let leafletPromise = null;
export function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }
    const s = document.createElement('script');
    s.src = LEAFLET_JS;
    s.async = true;
    s.onload = () => resolve(window.L);
    s.onerror = reject;
    document.body.appendChild(s);
  });
  return leafletPromise;
}

/**
 * Small map showing the bakery, the visitor's location (when known), and a
 * dashed line between them. Uses Leaflet + free OpenStreetMap tiles — no API
 * key. Distance is shown separately by the caller.
 */
export default function MiniMap({ bakeryCoords, userCoords, bakeryName = 'Bakery', height = 220 }) {
  const ref = useRef(null);
  const mapRef = useRef(null);

  const valid =
    bakeryCoords && typeof bakeryCoords.lat === 'number' && typeof bakeryCoords.lng === 'number';
  const hasUser =
    userCoords && typeof userCoords.lat === 'number' && typeof userCoords.lng === 'number';

  useEffect(() => {
    if (!valid) return undefined;
    let cancelled = false;

    loadLeaflet()
      .then((L) => {
        if (cancelled || !ref.current) return;
        // Tear down a previous instance before re-creating.
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
        const bakery = [bakeryCoords.lat, bakeryCoords.lng];
        const map = L.map(ref.current, { zoomControl: true, scrollWheelZoom: false });
        mapRef.current = map;
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap',
        }).addTo(map);

        const bakeryIcon = L.divIcon({
          className: '',
          html: '<div style="width:20px;height:20px;border-radius:50%;background:#C99A2E;border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.35)"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });
        L.marker(bakery, { icon: bakeryIcon }).addTo(map).bindPopup(bakeryName);

        if (hasUser) {
          const me = [userCoords.lat, userCoords.lng];
          const meIcon = L.divIcon({
            className: '',
            html: '<div style="width:16px;height:16px;border-radius:50%;background:#5B3A8C;border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.35)"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });
          L.marker(me, { icon: meIcon }).addTo(map).bindPopup('You are here');
          L.polyline([me, bakery], { color: '#5B3A8C', weight: 3, opacity: 0.6, dashArray: '6,7' }).addTo(map);
          map.fitBounds(L.latLngBounds([me, bakery]).pad(0.35));
        } else {
          map.setView(bakery, 13);
        }
        setTimeout(() => map.invalidateSize(), 200);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [valid, hasUser, bakeryCoords, userCoords, bakeryName]);

  if (!valid) return null;

  return (
    <div
      ref={ref}
      style={{
        height,
        width: '100%',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
        border: '1px solid var(--border)',
        background: 'var(--surface)',
      }}
    />
  );
}
