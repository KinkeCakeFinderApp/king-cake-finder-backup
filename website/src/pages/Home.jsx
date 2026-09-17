import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import BakeryCard from '../components/BakeryCard';
import SponsoredRow from '../components/SponsoredRow';
import { Loading } from '../components/common';
import { APP_STORE_URL, PLAY_STORE_URL, storeLinkReady } from '../config';

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, profile } = useAuth();
  const { bakeries, loading, loadedOnce } = useData();
  const [q, setQ] = useState('');

  const favorites = useMemo(() => {
    const set = new Set(profile?.favorites || []);
    return bakeries.filter((b) => set.has(b.id));
  }, [bakeries, profile]);

  const toTaste = useMemo(() => {
    const set = new Set(profile?.toTaste || []);
    return bakeries.filter((b) => set.has(b.id));
  }, [bakeries, profile]);

  const onSearch = (e) => {
    e.preventDefault();
    navigate(`/search${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`);
  };

  return (
    <div className="page">
      <div className="container">
        {/* Hero */}
        <section className="hero">
          <div className="eyebrow">A Louisiana tradition</div>
          <h1 className="h1" style={{ maxWidth: 640, marginTop: 8 }}>
            Find the best <span style={{ color: 'var(--purple)' }}>king cakes</span> near you
          </h1>
          <p className="muted" style={{ maxWidth: 560, fontSize: '1.1rem', marginTop: 10 }}>
            Browse local bakeries, compare prices and ratings, read reviews, and save your favorites.
            Same account and data as the mobile app.
          </p>

          <form onSubmit={onSearch} className="searchbar mt-3" style={{ maxWidth: 560 }}>
            <span aria-hidden="true">🔎</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, city, or flavor…" aria-label="Search bakeries" />
            <button className="btn" type="submit">Search</button>
          </form>

          <div className="dots">
            <span style={{ background: 'var(--purple)' }} />
            <span style={{ background: 'var(--green)' }} />
            <span style={{ background: 'var(--gold)' }} />
          </div>
        </section>

        <SponsoredRow />

        {/* To be tasted (logged in) */}
        {isAuthenticated && (
          <section className="mt-4">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h2 className="h2">To be tasted</h2>
              <Link className="link" to="/to-taste">View all</Link>
            </div>
            {loading && !loadedOnce ? (
              <Loading label="Loading your list…" />
            ) : toTaste.length === 0 ? (
              <p className="muted mt-2">Nothing saved yet — tap the 📑 on any bakery to add it to your wishlist.</p>
            ) : (
              <div className="results mt-3">
                {toTaste.slice(0, 4).map((b) => <BakeryCard key={b.id} bakery={b} />)}
              </div>
            )}
          </section>
        )}

        {/* Favorites (logged in) */}
        {isAuthenticated && (
          <section className="mt-4">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h2 className="h2">Your favorites</h2>
              <Link className="link" to="/favorites">View all</Link>
            </div>
            {loading && !loadedOnce ? (
              <Loading label="Loading your favorites…" />
            ) : favorites.length === 0 ? (
              <p className="muted mt-2">No favorites yet — tap the ☆ on any bakery to save it here.</p>
            ) : (
              <div className="results mt-3">
                {favorites.slice(0, 4).map((b) => <BakeryCard key={b.id} bakery={b} />)}
              </div>
            )}
          </section>
        )}

        {/* How it works */}
        <section className="mt-4">
          <h2 className="h2">How it works</h2>
          <div className="results mt-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            {[
              { icon: '🔎', t: 'Discover', d: 'Search every bakery by name, location, flavor, or price.' },
              { icon: '🧁', t: 'Rate & review', d: 'Leave a king-cake rating and a review — one per bakery.' },
              { icon: '📍', t: 'Find the closest', d: 'Allow location to sort bakeries by distance from you.' },
              { icon: '★', t: 'Save favorites', d: 'Keep your go-to bakeries a tap away, synced with the app.' },
            ].map((c) => (
              <div className="card" key={c.t}>
                <div style={{ fontSize: '1.8rem' }}>{c.icon}</div>
                <h3 className="h3 mt-1">{c.t}</h3>
                <p className="small muted" style={{ marginTop: 4 }}>{c.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* App CTA */}
        <section className="card mt-4" style={{ background: 'var(--purple-deep)', color: '#F3EEF7', border: 'none' }}>
          <div className="row wrap" style={{ justifyContent: 'space-between', gap: 16 }}>
            <div style={{ maxWidth: 460 }}>
              <h2 className="h2" style={{ color: '#fff' }}>Take King Cake Finder with you</h2>
              <p style={{ color: '#D9CCEA', marginTop: 6 }}>Get the mobile app for GPS distance and your favorites on the go.</p>
            </div>
            <div className="row gap-1 wrap">
              <a className="btn dark" href={storeLinkReady(APP_STORE_URL) ? APP_STORE_URL : undefined} target="_blank" rel="noreferrer" onClick={(e) => { if (!storeLinkReady(APP_STORE_URL)) e.preventDefault(); }} style={{ opacity: storeLinkReady(APP_STORE_URL) ? 1 : 0.6 }}> App Store</a>
              <a className="btn dark" href={storeLinkReady(PLAY_STORE_URL) ? PLAY_STORE_URL : undefined} target="_blank" rel="noreferrer" onClick={(e) => { if (!storeLinkReady(PLAY_STORE_URL)) e.preventDefault(); }} style={{ opacity: storeLinkReady(PLAY_STORE_URL) ? 1 : 0.6 }}>▶ Google Play</a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
