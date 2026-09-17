import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import BakeryCard from '../components/BakeryCard';
import { EmptyState, Loading } from '../components/common';

export default function ToTaste() {
  const { isAuthenticated, profile } = useAuth();
  const { bakeries, loading, loadedOnce } = useData();

  const toTaste = useMemo(() => {
    const set = new Set(profile?.toTaste || []);
    return bakeries.filter((b) => set.has(b.id));
  }, [bakeries, profile]);

  if (!isAuthenticated) {
    return (
      <div className="container page">
        <EmptyState icon="🔖" title="Your to-be-tasted list lives here" message="Log in to save bakeries you want to try later." action={<Link className="btn" to="/login">Log in</Link>} />
      </div>
    );
  }

  return (
    <div className="container page">
      <h1 className="h1">To be tasted</h1>
      <p className="muted mb-3">{toTaste.length} saved to try</p>
      {loading && !loadedOnce ? (
        <Loading />
      ) : toTaste.length === 0 ? (
        <EmptyState icon="📑" title="Nothing saved yet" message="Tap the bookmark on any bakery to add it to your wishlist — it syncs with the app too." action={<Link className="btn" to="/search">Browse bakeries</Link>} />
      ) : (
        <div className="results">{toTaste.map((b) => <BakeryCard key={b.id} bakery={b} />)}</div>
      )}
    </div>
  );
}
