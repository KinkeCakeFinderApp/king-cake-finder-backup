import React, { useMemo, useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import BakeryCard from '../components/BakeryCard';
import SponsoredRow from '../components/SponsoredRow';
import { Loading, EmptyState } from '../components/common';
import {
  filterAndSort, SORT_OPTIONS, FILTER_OPTIONS, DEFAULT_SORT, DEFAULT_FILTERS, activeFilterCount,
} from '../lib/search';

export default function Search() {
  const [params, setParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { bakeries, loading, loadedOnce, authRequired, userCoords, locationStatus, requestLocation } = useData();

  const [term, setTerm] = useState(params.get('q') || '');
  const [sort, setSort] = useState(DEFAULT_SORT);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  // Keep the URL's ?q= in sync so results are shareable.
  useEffect(() => {
    const next = new URLSearchParams(params);
    if (term.trim()) next.set('q', term.trim()); else next.delete('q');
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  const results = useMemo(
    () => filterAndSort({ bakeries, term, sort, filters, userCoords }),
    [bakeries, term, sort, filters, userCoords]
  );

  const toggleFilter = (k) => setFilters((f) => ({ ...f, [k]: !f[k] }));
  const changeSort = (key) => {
    if (key === 'closest' && locationStatus !== 'granted') requestLocation();
    setSort(key);
  };

  const badge = activeFilterCount(filters) + (sort !== DEFAULT_SORT ? 1 : 0);

  if (authRequired && !isAuthenticated) {
    return (
      <div className="container page">
        <EmptyState
          icon="🔐"
          title="Log in to browse bakeries"
          message="Bakery data is shared with the app and currently requires an account to view."
          action={<Link className="btn" to="/login">Log in</Link>}
        />
      </div>
    );
  }

  return (
    <div className="container page">
      <h1 className="h1">Find a king cake</h1>
      <p className="muted">{bakeries.length} {bakeries.length === 1 ? 'bakery' : 'bakeries'} on the map</p>

      {/* Controls */}
      <div className="card mt-3">
        <div className="searchbar" style={{ boxShadow: 'none', border: '1.5px solid var(--border)' }}>
          <span aria-hidden="true">🔎</span>
          <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search name, city, flavor, description…" aria-label="Search" />
          {term ? <button className="chip" onClick={() => setTerm('')}>Clear</button> : null}
        </div>

        <div className="row wrap gap-1 mt-2" style={{ alignItems: 'center' }}>
          <label className="small muted" htmlFor="sort">Sort:</label>
          <select id="sort" className="select" style={{ width: 'auto' }} value={sort} onChange={(e) => changeSort(e.target.value)}>
            {SORT_OPTIONS.map((o) => (
              <option key={o.key} value={o.key} disabled={o.key === 'closest' && locationStatus === 'denied'}>
                {o.label}{o.key === 'closest' && locationStatus === 'denied' ? ' (location off)' : ''}
              </option>
            ))}
          </select>
          {FILTER_OPTIONS.map((f) => (
            <button key={f.key} className={`chip${filters[f.key] ? ' active' : ''}`} onClick={() => toggleFilter(f.key)}>
              {f.label}
            </button>
          ))}
          {badge ? (
            <button className="chip" onClick={() => { setSort(DEFAULT_SORT); setFilters(DEFAULT_FILTERS); }}>Reset</button>
          ) : null}
        </div>
        {locationStatus === 'denied' && (
          <div className="small faint mt-1">Location is off, so “Closest to me” is unavailable. The site still works without it.</div>
        )}
      </div>

      <SponsoredRow />

      <div className="mt-2">
        {loading && !loadedOnce ? (
          <Loading label="Loading bakeries…" />
        ) : results.length === 0 ? (
          <EmptyState
            icon="🧁"
            title={term || badge ? 'No king cakes match your search yet' : 'No bakeries yet'}
            message={term || badge ? 'Try a different search term or clear your filters.' : 'Once bakeries are added, they’ll show up here.'}
          />
        ) : (
          <div className="results">
            {results.map((b) => <BakeryCard key={b.id} bakery={b} />)}
          </div>
        )}
      </div>
    </div>
  );
}
