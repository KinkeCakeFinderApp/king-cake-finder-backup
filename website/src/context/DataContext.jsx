import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchAllBakeries } from '../services/bakeries';
import { useAuth } from './AuthContext';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [bakeries, setBakeries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [error, setError] = useState(null);

  const [userCoords, setUserCoords] = useState(null);
  const [locationStatus, setLocationStatus] = useState('undetermined'); // granted | denied | unavailable

  const [authRequired, setAuthRequired] = useState(false);

  const loadBakeries = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAuthRequired(false);
    try {
      setBakeries(await fetchAllBakeries());
      setLoadedOnce(true);
    } catch (e) {
      // Under the shared rules, an unauthenticated read is permission-denied.
      // If the project's bakeries are made publicly readable, this just works.
      if (e && e.code === 'permission-denied') setAuthRequired(true);
      setError(e);
      setBakeries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Attempt a load on mount and whenever auth changes. Works for signed-in users
  // now, and for everyone once bakeries are made publicly readable.
  useEffect(() => {
    loadBakeries();
  }, [isAuthenticated, loadBakeries]);

  /** Requests browser geolocation; degrades gracefully on denial. */
  const requestLocation = useCallback(() => {
    if (!('geolocation' in navigator)) { setLocationStatus('unavailable'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus('granted');
      },
      (err) => setLocationStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
    );
  }, []);

  const applyBakeryPatch = useCallback((id, patch) => {
    setBakeries((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }, []);
  const upsertBakery = useCallback((bakery) => {
    setBakeries((prev) => {
      const idx = prev.findIndex((b) => b.id === bakery.id);
      if (idx === -1) return [...prev, bakery].sort((a, b) => a.name.localeCompare(b.name));
      const next = prev.slice(); next[idx] = { ...next[idx], ...bakery }; return next;
    });
  }, []);
  const removeBakery = useCallback((id) => setBakeries((prev) => prev.filter((b) => b.id !== id)), []);
  const getBakeryById = useCallback((id) => bakeries.find((b) => b.id === id) || null, [bakeries]);

  const value = {
    bakeries, loading, loadedOnce, error, authRequired, refreshBakeries: loadBakeries,
    getBakeryById, applyBakeryPatch, upsertBakery, removeBakery,
    userCoords, locationStatus, requestLocation,
  };
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
