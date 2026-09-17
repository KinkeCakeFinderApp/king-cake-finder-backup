import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import KingCakeRating from '../components/KingCakeRating';
import ReviewItem from '../components/ReviewItem';
import ReviewComposer from '../components/ReviewComposer';
import FoodSafetyNotice from '../components/FoodSafetyNotice';
import MiniMap from '../components/MiniMap';
import { FavoriteButton, ToTasteButton, Loading } from '../components/common';
import { getBakery } from '../services/bakeries';
import { getPublishedReviews, getMyReview } from '../services/reviews';
import { reportReview, adminDeleteReview } from '../services/moderation';
import { haversineMiles, formatDistance, estimateTravelTime, formatMinutes } from '../lib/distance';
import { fetchDrivingRoute } from '../lib/routing';
import { formatPrice } from '../lib/format';
import { googleMapsUrl, appleMapsUrl, telUrl } from '../lib/maps';
import { SITE_NAME } from '../config';

export default function BakeryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isSuperuser, isFavorite, toggleFavorite, isToTaste, toggleToTaste, isBlocked, blockUser } = useAuth();
  const { getBakeryById, applyBakeryPatch, userCoords } = useData();

  const [bakery, setBakery] = useState(() => getBakeryById(id));
  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [reported, setReported] = useState(() => new Set());

  const load = useCallback(async () => {
    setLoading(true);
    // allSettled: a failure in one call (e.g. reviews) must not wipe the others.
    const [freshR, publishedR, mineR] = await Promise.allSettled([
      getBakery(id),
      getPublishedReviews(id),
      user ? getMyReview(id, user.uid) : Promise.resolve(null),
    ]);
    const fresh = freshR.status === 'fulfilled' ? freshR.value : null;
    if (fresh) { setBakery(fresh); applyBakeryPatch(id, { avgRating: fresh.avgRating, ratingCount: fresh.ratingCount }); }
    setReviews(publishedR.status === 'fulfilled' ? publishedR.value : []);
    setMyReview(mineR.status === 'fulfilled' ? mineR.value : null);
    setLoading(false);
  }, [id, user, applyBakeryPatch]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (bakery) document.title = `${bakery.name} — ${SITE_NAME}`;
    return () => { document.title = SITE_NAME; };
  }, [bakery]);

  // Real road route from OSRM (see lib/routing.js), fetched once per
  // bakery+location. Falls back to the straight-line estimate below when it
  // hasn't resolved yet or the free routing server is unavailable.
  const [routeInfo, setRouteInfo] = useState(null);
  const bakeryLat = bakery?.coords?.lat;
  const bakeryLng = bakery?.coords?.lng;

  useEffect(() => {
    setRouteInfo(null);
    if (!userCoords || typeof bakeryLat !== 'number' || typeof bakeryLng !== 'number') return;

    let active = true;
    fetchDrivingRoute(userCoords, { lat: bakeryLat, lng: bakeryLng }).then((route) => {
      if (active && route) setRouteInfo(route);
    });
    return () => { active = false; };
  }, [userCoords, bakeryLat, bakeryLng]);

  const distance = useMemo(() => {
    if (routeInfo) {
      return { label: formatDistance(routeInfo.miles), time: formatMinutes(routeInfo.minutes) };
    }
    const miles = haversineMiles(userCoords, bakery?.coords);
    return { label: formatDistance(miles), time: estimateTravelTime(miles) };
  }, [userCoords, bakery, routeInfo]);

  const onReport = async (review) => {
    if (!isAuthenticated) { navigate('/login'); return; }
    try {
      await reportReview({ bakeryId: id, review, reporterUid: user.uid });
      setReported((prev) => new Set(prev).add(review.id));
    } catch (e) { /* ignore */ }
  };

  const onBlock = async (review) => {
    if (!isAuthenticated) { navigate('/login'); return; }
    const authorUid = review.authorUid || review.id;
    if (!window.confirm(`Block ${review.authorUsername || 'this user'}? You won't see their reviews anymore. You can unblock them later on your Account page.`)) return;
    try {
      await blockUser(authorUid, review.authorUsername);
    } catch (e) { /* ignore */ }
  };

  const onAdminDelete = async (review) => {
    if (!window.confirm('Remove this review? As an admin, this permanently deletes it and updates the bakery’s rating. This can’t be undone.')) return;
    try {
      await adminDeleteReview({ bakeryId: id, authorUid: review.authorUid || review.id });
      await load();
    } catch (e) {
      alert(e.message || 'Could not remove the review.');
    }
  };

  if (!bakery && loading) return <div className="container page"><Loading /></div>;
  if (!bakery) {
    return (
      <div className="container page center">
        <h2 className="h2">Bakery not found</h2>
        <p className="muted">It may have been removed.</p>
        <Link className="link" to="/search">← Back to search</Link>
      </div>
    );
  }

  const typeLabel = bakery.isHomeBakery && bakery.isBrickAndMortar
    ? 'Home & brick-and-mortar bakery'
    : bakery.isHomeBakery ? 'Home bakery' : bakery.isBrickAndMortar ? 'Brick-and-mortar bakery' : 'Bakery';
  const otherReviews = reviews.filter((r) => r.id !== user?.uid && !isBlocked(r.authorUid || r.id));

  return (
    <div className="container page" style={{ maxWidth: 820 }}>
      <Link className="link small" to="/search">← Back to search</Link>

      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 12 }}>
        <h1 className="h1" style={{ flex: 1 }}>{bakery.name}</h1>
        {isAuthenticated ? (
          <div className="row" style={{ gap: 0 }}>
            <ToTasteButton size={30} active={isToTaste(bakery.id)} onClick={() => toggleToTaste(bakery.id)} />
            <FavoriteButton size={30} active={isFavorite(bakery.id)} onClick={() => toggleFavorite(bakery.id)} />
          </div>
        ) : null}
      </div>

      <div className="row wrap gap-1" style={{ marginTop: 6 }}>
        <span className="badge type">{typeLabel}</span>
        {bakery.shipping ? <span className="badge ship">🚚 Ships</span> : null}
      </div>

      <div className="mt-2"><KingCakeRating value={bakery.avgRating} count={bakery.ratingCount} showValue size={22} /></div>

      {bakery.description ? <p style={{ marginTop: 16, fontSize: '1.05rem' }}>{bakery.description}</p> : null}

      {/* Food-safety warning: choking hazard (hidden baby), allergens, no guarantee */}
      <FoodSafetyNotice />

      {/* Pricing */}
      <h2 className="h3 mt-4">Variations & pricing</h2>
      <div className="card mt-2" style={{ padding: '4px 20px' }}>
        {bakery.variations.length === 0 ? (
          <p className="muted small" style={{ padding: '16px 0' }}>No pricing listed yet.</p>
        ) : bakery.variations.map((v, i) => (
          <div className="price-row" key={`${v.name}_${i}`}>
            <span>{v.name}</span>
            <span className="p">{formatPrice(v.price)}</span>
          </div>
        ))}
      </div>

      {/* Location */}
      <h2 className="h3 mt-4">Location</h2>
      <div className="card mt-2">
        <p style={{ margin: 0 }}>{bakery.address || 'Address not provided'}</p>
        {bakery.coords ? (
          <div className="mt-2">
            <MiniMap bakeryCoords={bakery.coords} userCoords={userCoords} bakeryName={bakery.name} />
            {userCoords ? (
              <p className="small muted mt-1" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: 5, background: '#5B3A8C', display: 'inline-block' }} /> You
                <span style={{ width: 10, height: 10, borderRadius: 5, background: '#C99A2E', display: 'inline-block', marginLeft: 10 }} /> {bakery.name}
              </p>
            ) : (
              <p className="small faint mt-1">Allow location in your browser to see how far away you are.</p>
            )}
          </div>
        ) : null}
        <div className="row gap-1 wrap mt-2" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="row gap-1 wrap">
            <a className="btn ghost sm" href={googleMapsUrl(bakery.address, bakery.coords)} target="_blank" rel="noreferrer">Open in Google Maps</a>
            <a className="btn ghost sm" href={appleMapsUrl(bakery.address, bakery.coords)} target="_blank" rel="noreferrer">Open in Apple Maps</a>
            {bakery.phone ? <a className="btn ghost sm" href={telUrl(bakery.phone)}>📞 {bakery.phone}</a> : null}
          </div>
          {distance.label ? (
            <p className="small muted" style={{ margin: 0, whiteSpace: 'nowrap' }}>
              📍 {distance.label}{distance.time ? ` · about ${distance.time}` : ''}
            </p>
          ) : null}
        </div>
      </div>

      {/* Reviews */}
      <h2 className="h3 mt-3">Reviews{bakery.ratingCount ? ` (${bakery.ratingCount})` : ''}</h2>

      {!isAuthenticated ? (
        <div className="card mt-2 center">
          <p className="muted">Want to leave a review?</p>
          <Link className="btn mt-1" to="/login">Log in to review</Link>
        </div>
      ) : myReview && !editing ? (
        <div className="mt-2">
          <ReviewItem
            review={{ ...myReview, id: user.uid }}
            isOwn
            onEdit={() => setEditing(true)}
            onDelete={isSuperuser ? () => onAdminDelete({ ...myReview, authorUid: user.uid }) : undefined}
          />
        </div>
      ) : (
        <div className="mt-2">
          <ReviewComposer
            bakeryId={bakery.id}
            existingReview={editing ? myReview : null}
            onSubmitted={() => { setEditing(false); load(); }}
            onCancelEdit={editing ? () => setEditing(false) : undefined}
          />
        </div>
      )}

      <div className="mt-2">
        {otherReviews.length === 0 ? (
          <p className="muted small center" style={{ padding: 16 }}>{myReview ? 'No other reviews yet.' : 'Be the first to review this bakery!'}</p>
        ) : otherReviews.map((r) => (
          <ReviewItem key={r.id} review={r} onReport={() => onReport(r)} onBlock={() => onBlock(r)} reported={reported.has(r.id)} onDelete={isSuperuser ? () => onAdminDelete(r) : undefined} />
        ))}
      </div>
    </div>
  );
}
