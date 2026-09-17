import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import KingCakeRating from './KingCakeRating';
import { FavoriteButton, ToTasteButton } from './common';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { haversineMiles, formatDistance, estimateTravelTime } from '../lib/distance';
import { startingPriceLabel } from '../lib/format';

export default function BakeryCard({ bakery, sponsored = false }) {
  const navigate = useNavigate();
  const { isAuthenticated, isFavorite, toggleFavorite, isToTaste, toggleToTaste } = useAuth();
  const { userCoords } = useData();

  const { distanceLabel, timeLabel } = useMemo(() => {
    const miles = haversineMiles(userCoords, bakery.coords);
    return { distanceLabel: formatDistance(miles), timeLabel: estimateTravelTime(miles) };
  }, [userCoords, bakery.coords]);

  const price = startingPriceLabel(bakery.variations);
  const typeLabel = bakery.isHomeBakery ? 'Home bakery' : bakery.isBrickAndMortar ? 'Brick-and-mortar' : 'Bakery';

  return (
    <div className="card tap bakery-card" onClick={() => navigate(`/bakery/${bakery.id}`)}>
      <div className="top">
        <div style={{ flex: 1, minWidth: 0 }}>
          {sponsored ? <span className="badge gold" style={{ marginBottom: 4 }}>⭐ Sponsored</span> : null}
          <h3 className="h3" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{bakery.name}</h3>
          <div className="small muted" style={{ marginTop: 2 }}>{typeLabel}</div>
        </div>
        {isAuthenticated ? (
          <div className="row" style={{ gap: 0 }}>
            <ToTasteButton active={isToTaste(bakery.id)} onClick={() => toggleToTaste(bakery.id)} />
            <FavoriteButton active={isFavorite(bakery.id)} onClick={() => toggleFavorite(bakery.id)} />
          </div>
        ) : null}
      </div>

      <div style={{ marginTop: 10 }}>
        <KingCakeRating value={bakery.avgRating} count={bakery.ratingCount} showValue size={16} />
      </div>

      <div className="meta">
        {distanceLabel ? <span className="m">📍 {distanceLabel}</span> : null}
        {timeLabel ? <span className="m">🕒 {timeLabel}</span> : null}
        {price ? <span className="m" style={{ color: 'var(--green)' }}>🏷️ {price}</span> : null}
        {bakery.shipping ? <span className="badge ship" style={{ marginLeft: 'auto' }}>🚚 Ships</span> : null}
      </div>
    </div>
  );
}
