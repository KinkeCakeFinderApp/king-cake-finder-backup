import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import BakeryCard from '../components/BakeryCard';
import { EmptyState, Loading } from '../components/common';

export default function Favorites() {
  const { isAuthenticated, profile } = useAuth();
  const { bakeries, loading, loadedOnce } = useData();

  const favorites = useMemo(() => {
    const set = new Set(profile?.favorites || []);
    return bakeries.filter((b) => set.has(b.id));
  }, [bakeries, profile]);

  if (!isAuthenticated) {
    return (
      <div className="container page">
        <EmptyState icon="★" title="Your favorites live here" message="Log in to save and see your favorite bakeries." action={<Link className="btn" to="/login">Log in</Link>} />
      </div>
    );
  }

  return (
    <div className="container page">
      <h1 className="h1">Your favorites</h1>
      <p className="muted mb-3">{favorites.length} saved</p>
      {loading && !loadedOnce ? (
        <Loading />
      ) : favorites.length === 0 ? (
        <EmptyState icon="☆" title="No favorites yet" message="Tap the star on any bakery to save it here — it syncs with the app too." action={<Link className="btn" to="/search">Browse bakeries</Link>} />
      ) : (
        <div className="results">{favorites.map((b) => <BakeryCard key={b.id} bakery={b} />)}</div>
      )}
    </div>
  );
}
