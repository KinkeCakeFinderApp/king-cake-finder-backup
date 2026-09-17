import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '@/src/context/ThemeContext';

/**
 * Full map of every bakery (Leaflet + OpenStreetMap in a WebView — no API key).
 * Each pin opens a popup with the bakery's name/rating and a "View bakery"
 * button that posts the id back to RN so the caller can navigate. Also shows the
 * user's location when known.
 */
export default function BakeryMap({ bakeries, userCoords, onOpenBakery }) {
  const { colors } = useTheme();

  const points = useMemo(
    () =>
      (bakeries || [])
        .filter(
          (b) => b.coords && typeof b.coords.lat === 'number' && typeof b.coords.lng === 'number'
        )
        .map((b) => ({
          id: b.id,
          name: b.name,
          lat: b.coords.lat,
          lng: b.coords.lng,
          rating: Number(b.avgRating) || 0,
          count: Number(b.ratingCount) || 0,
        })),
    [bakeries]
  );

  const hasUser = userCoords && typeof userCoords.lat === 'number' && typeof userCoords.lng === 'number';

  const html = useMemo(
    () => buildHtml(points, hasUser ? userCoords : null, colors.surface),
    [points, hasUser, userCoords, colors.surface]
  );

  const onMessage = (e) => {
    try {
      const d = JSON.parse(e.nativeEvent.data);
      if (d.type === 'open' && d.id && onOpenBakery) onOpenBakery(d.id);
    } catch (err) {
      /* ignore */
    }
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.surface }]}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        style={{ backgroundColor: 'transparent' }}
      />
    </View>
  );
}

function buildHtml(points, userCoords, bg) {
  const pts = JSON.stringify(points);
  const user = userCoords ? JSON.stringify([userCoords.lat, userCoords.lng]) : 'null';
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; background: ${bg}; }
    .leaflet-control-attribution { font-size: 9px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    function post(o){ if(window.ReactNativeWebView){ window.ReactNativeWebView.postMessage(JSON.stringify(o)); } }
    var points = ${pts};
    var user = ${user};

    var map = L.map('map', { zoomControl: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    var bakeryIcon = L.divIcon({
      className: '',
      html: '<div style="width:20px;height:20px;border-radius:50%;background:#C99A2E;border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.35)"></div>',
      iconSize: [20,20], iconAnchor: [10,10]
    });

    var bounds = [];
    points.forEach(function(p){
      var m = L.marker([p.lat, p.lng], { icon: bakeryIcon }).addTo(map);
      var wrap = document.createElement('div'); wrap.style.minWidth = '150px';
      var title = document.createElement('div');
      title.style.cssText = 'font-weight:700;font-size:14px;margin-bottom:2px'; title.textContent = p.name;
      var rate = document.createElement('div');
      rate.style.cssText = 'font-size:12px;color:#555;margin-bottom:6px';
      rate.textContent = p.count > 0 ? ('\\u2605 ' + p.rating.toFixed(1) + ' (' + p.count + ')') : 'No ratings yet';
      var btn = document.createElement('button');
      btn.textContent = 'View bakery';
      btn.style.cssText = 'background:#5B3A8C;color:#fff;border:none;border-radius:6px;padding:7px 12px;font-size:13px;font-weight:700;cursor:pointer';
      btn.onclick = function(){ post({ type:'open', id: p.id }); };
      wrap.appendChild(title); wrap.appendChild(rate); wrap.appendChild(btn);
      m.bindPopup(wrap);
      bounds.push([p.lat, p.lng]);
    });

    if (user) {
      var meIcon = L.divIcon({
        className: '',
        html: '<div style="width:16px;height:16px;border-radius:50%;background:#5B3A8C;border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.35)"></div>',
        iconSize: [16,16], iconAnchor: [8,8]
      });
      L.marker(user, { icon: meIcon }).addTo(map).bindPopup('You are here');
      bounds.push(user);
    }

    if (bounds.length > 1) {
      map.fitBounds(L.latLngBounds(bounds).pad(0.2));
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 13);
    } else {
      map.setView([29.95, -90.07], 9); // New Orleans as a sensible default
    }
    setTimeout(function(){ map.invalidateSize(); }, 250);
  </script>
</body>
</html>`;
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
