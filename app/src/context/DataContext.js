import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import * as Location from 'expo-location';
import { fetchAllBakeries } from '@/src/services/bakeries';
import { useAuth } from '@/src/context/AuthContext';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  // Guests browse too, so the bakery list loads for anyone past the welcome
  // screen (signed-in OR guest). Firestore rules allow public reads.
  const { canBrowse } = useAuth();

  const [bakeries, setBakeries] = useState([]);
  const [loadingBakeries, setLoadingBakeries] = useState(false);
  const [bakeriesError, setBakeriesError] = useState(null);
  const [loadedOnce, setLoadedOnce] = useState(false);

  const [userCoords, setUserCoords] = useState(null);
  // 'undetermined' | 'granted' | 'denied' | 'unavailable'
  const [locationStatus, setLocationStatus] = useState('undetermined');
  const locationRequested = useRef(false);

  const loadBakeries = useCallback(async () => {
    setLoadingBakeries(true);
    setBakeriesError(null);
    try {
      const list = await fetchAllBakeries();
      setBakeries(list);
      setLoadedOnce(true);
    } catch (e) {
      setBakeriesError(e);
    } finally {
      setLoadingBakeries(false);
    }
  }, []);

  // Load the bakery list once the visitor is browsing (signed-in or guest).
  // Cached in memory afterward; refreshed on pull-to-refresh or mutation.
  useEffect(() => {
    if (canBrowse && !loadedOnce && !loadingBakeries) {
      loadBakeries();
    }
    if (!canBrowse) {
      // Clear cache when back at the welcome screen so the next visitor (a
      // different account, or guest) starts fresh.
      setBakeries([]);
      setLoadedOnce(false);
    }
  }, [canBrowse, loadedOnce, loadingBakeries, loadBakeries]);

  /**
   * Requests foreground location permission and reads the current position.
   * Degrades gracefully: on denial or error, distance features are simply
   * unavailable and the app keeps working.
   */
  const requestLocation = useCallback(async (force = false) => {
    if (locationRequested.current && !force) return;
    locationRequested.current = true;
    try {
      const servicesOn = await Location.hasServicesEnabledAsync().catch(() => true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationStatus('denied');
        return;
      }
      if (!servicesOn) {
        setLocationStatus('unavailable');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setLocationStatus('granted');
    } catch (e) {
      setLocationStatus('unavailable');
    }
  }, []);

  // Ask for location once the visitor is in the app (guests get distance too).
  useEffect(() => {
    if (canBrowse) requestLocation();
  }, [canBrowse, requestLocation]);

  // --- In-memory cache mutators so screens reflect changes instantly ---------

  const applyBakeryPatch = useCallback((id, patch) => {
    setBakeries((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...patch } : b))
    );
  }, []);

  const upsertBakery = useCallback((bakery) => {
    setBakeries((prev) => {
      const idx = prev.findIndex((b) => b.id === bakery.id);
      if (idx === -1) return [...prev, bakery].sort((a, b) => a.name.localeCompare(b.name));
      const next = prev.slice();
      next[idx] = { ...next[idx], ...bakery };
      return next;
    });
  }, []);

  const removeBakery = useCallback((id) => {
    setBakeries((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const getBakeryById = useCallback(
    (id) => bakeries.find((b) => b.id === id) || null,
    [bakeries]
  );

  const value = {
    bakeries,
    loadingBakeries,
    bakeriesError,
    loadedOnce,
    refreshBakeries: loadBakeries,
    getBakeryById,
    applyBakeryPatch,
    upsertBakery,
    removeBakery,
    userCoords,
    locationStatus,
    requestLocation,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within a DataProvider');
  return ctx;
}
