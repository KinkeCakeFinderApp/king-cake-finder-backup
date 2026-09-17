import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, spacing, radius, typography } from '@/src/theme/colors';

const STORAGE_KEY = 'kcf.themeMode';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState(null); // null = not yet resolved

  // Resolve the initial mode from storage (falling back to system, then light).
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (active) {
          setMode(stored === 'light' || stored === 'dark' ? stored : systemScheme || 'light');
        }
      } catch (e) {
        if (active) setMode(systemScheme || 'light');
      }
    })();
    return () => {
      active = false;
    };
    // Only run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setThemeMode = useCallback(async (next) => {
    if (next !== 'light' && next !== 'dark') return;
    setMode(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next);
    } catch (e) {
      // Non-fatal — theme still applies for this session.
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const resolvedMode = mode || 'light';
  const colors = resolvedMode === 'dark' ? darkColors : lightColors;

  const value = useMemo(
    () => ({
      mode: resolvedMode,
      isDark: resolvedMode === 'dark',
      colors,
      spacing,
      radius,
      typography,
      setThemeMode,
      toggleTheme,
    }),
    [resolvedMode, colors, setThemeMode, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
