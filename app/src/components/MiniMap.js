import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '@/src/context/ThemeContext';

/**
 * A small interactive map (Leaflet + OpenStreetMap tiles in a WebView) that
 * plots the bakery and, when available, the user's location, drawing a dashed
 * line between them. No API key required and works in Expo Go. Distance is shown
 * separately by the caller (see the Location card).
 */
export default function MiniMap({ bakeryCoords, userCoords, bakeryName = 'Bakery', height = 190 }) {
  const { colors, radius } = useTheme();

  const valid =
    bakeryCoords &&
    typeof bakeryCoords.lat === 'number' &&
    typeof bakeryCoords.lng === 'number';

  const hasUser =
    userCoords &&
    typeof userCoords.lat === 'number' &&
    typeof userCoords.lng === 'number';

  const html = useMemo(() => {
    if (!valid) return '';
    return buildHtml({ bakeryCoords, userCoords: hasUser ? userCoords : null, bakeryName, bg: colors.surface });
  }, [valid, hasUser, bakeryCoords, userCoords, bakeryName, colors.surface]);

  if (!valid) return null;

  return (
    <View
      style={[
        styles.wrap,
        { height, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface },
      ]}
    >
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={{ backgroundColor: 'transparent' }}
        scrollEnabled={false}
        javaScriptEnabled
        domStorageEnabled
      />
    </View>
  );
}

function esc(s) {
  return String(s).replace(/</g, '&lt;').replace(/'/g, '\\u0027');
}

function buildHtml({ bakeryCoords, userCoords, bakeryName, bg }) {
  const b = `[${bakeryCoords.lat}, ${bakeryCoords.lng}]`;
  const u = userCoords ? `[${userCoords.lat}, ${userCoords.lng}]` : 'null';
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; background: ${bg}; }
    .pin { border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 0 1px rgba(0,0,0,.35); }
    .bakery { width: 20px; height: 20px; background: #C99A2E; }
    .me { width: 16px; height: 16px; background: #5B3A8C; }
    .leaflet-control-attribution { font-size: 9px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var bakery = ${b};
    var user = ${u};
    var map = L.map('map', { zoomControl: true, attributionControl: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    var bakeryIcon = L.divIcon({ className: '', html: '<div class="pin bakery"></div>', iconSize: [20,20], iconAnchor: [10,10] });
    L.marker(bakery, { icon: bakeryIcon }).addTo(map).bindPopup('${esc(bakeryName)}');

    if (user) {
      var meIcon = L.divIcon({ className: '', html: '<div class="pin me"></div>', iconSize: [16,16], iconAnchor: [8,8] });
      L.marker(user, { icon: meIcon }).addTo(map).bindPopup('You are here');
      L.polyline([user, bakery], { color: '#5B3A8C', weight: 3, opacity: 0.6, dashArray: '6,7' }).addTo(map);
      map.fitBounds(L.latLngBounds([user, bakery]).pad(0.35));
    } else {
      map.setView(bakery, 13);
    }
    setTimeout(function(){ map.invalidateSize(); }, 250);
  </script>
</body>
</html>`;
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
