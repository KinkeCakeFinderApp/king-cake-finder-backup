import React, { useEffect } from 'react';
import { useData } from '../context/DataContext';
import BakeryMap from '../components/BakeryMap';
import { SITE_NAME } from '../config';

export default function MapPage() {
  const { bakeries, userCoords } = useData();

  useEffect(() => {
    document.title = `Map — ${SITE_NAME}`;
    return () => {
      document.title = SITE_NAME;
    };
  }, []);

  const mapped = (bakeries || []).filter(
    (b) => b.coords && typeof b.coords.lat === 'number' && typeof b.coords.lng === 'number'
  );

  return (
    <div className="container page">
      <h1 className="h1">Map</h1>
      <p className="muted mb-3">
        {mapped.length} {mapped.length === 1 ? 'bakery' : 'bakeries'} · click a pin to open it
      </p>
      {mapped.length > 0 ? (
        <BakeryMap bakeries={mapped} userCoords={userCoords} />
      ) : (
        <p className="muted">Bakeries with a saved location will appear here on the map.</p>
      )}
    </div>
  );
}
