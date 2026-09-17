import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadLeaflet } from './MiniMap';

/**
 * A map of every bakery (Leaflet + OpenStreetMap tiles — no API key). Each pin
 * opens a popup with the bakery name/rating and a "View bakery" button that
 * routes to the bakery page. Also plots the visitor's location when known.
 */
export default function BakeryMap({ bakeries, userCoords, height = '70vh' }) {
  const ref = useRef(null);
  const mapRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const points = (bakeries || []).filter(
      (b) => b.coords && typeof b.coords.lat === 'number' && typeof b.coords.lng === 'number'
    );
    const hasUser = userCoords && typeof userCoords.lat === 'number' && typeof userCoords.lng === 'number';

    loadLeaflet()
      .then((L) => {
        if (cancelled || !ref.current) return;
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
        const map = L.map(ref.current, { zoomControl: true });
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

        const bounds = [];
        points.forEach((p) => {
          const m = L.marker([p.coords.lat, p.coords.lng], { icon: bakeryIcon }).addTo(map);
          const wrap = document.createElement('div');
          wrap.style.minWidth = '150px';
          const title = document.createElement('div');
          title.style.cssText = 'font-weight:700;font-size:14px;margin-bottom:2px';
          title.textContent = p.name;
          const rate = document.createElement('div');
          rate.style.cssText = 'font-size:12px;color:#555;margin-bottom:6px';
          rate.textContent =
            p.ratingCount > 0
              ? `★ ${(Number(p.avgRating) || 0).toFixed(1)} (${p.ratingCount})`
              : 'No ratings yet';
          const btn = document.createElement('button');
          btn.textContent = 'View bakery';
          btn.style.cssText =
            'background:#5B3A8C;color:#fff;border:none;border-radius:6px;padding:7px 12px;font-size:13px;font-weight:700;cursor:pointer';
          btn.onclick = () => navigate(`/bakery/${p.id}`);
          wrap.appendChild(title);
          wrap.appendChild(rate);
          wrap.appendChild(btn);
          m.bindPopup(wrap);
          bounds.push([p.coords.lat, p.coords.lng]);
        });

        if (hasUser) {
          const meIcon = L.divIcon({
            className: '',
            html: '<div style="width:16px;height:16px;border-radius:50%;background:#5B3A8C;border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.35)"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });
          L.marker([userCoords.lat, userCoords.lng], { icon: meIcon }).addTo(map).bindPopup('You are here');
          bounds.push([userCoords.lat, userCoords.lng]);
        }

        if (bounds.length > 1) map.fitBounds(L.latLngBounds(bounds).pad(0.2));
        else if (bounds.length === 1) map.setView(bounds[0], 13);
        else map.setView([29.95, -90.07], 9); // New Orleans default
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
  }, [bakeries, userCoords, navigate]);

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
