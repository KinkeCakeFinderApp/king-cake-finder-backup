import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { useTheme } from '@/src/context/ThemeContext';
import { useData } from '@/src/context/DataContext';
import BakeryMap from '@/src/components/BakeryMap';
import EmptyState from '@/src/components/EmptyState';

export default function MapTab() {
  const { colors, spacing, typography, isDark } = useTheme();
  const { bakeries, userCoords } = useData();
  const router = useRouter();

  const mapped = bakeries.filter(
    (b) => b.coords && typeof b.coords.lat === 'number' && typeof b.coords.lng === 'number'
  );

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: spacing.md }}>
        <Text style={[typography.display, { color: colors.text }]}>Map</Text>
        <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>
          {mapped.length} {mapped.length === 1 ? 'bakery' : 'bakeries'} · tap a pin to open it
        </Text>
      </View>

      {mapped.length > 0 ? (
        <BakeryMap
          bakeries={mapped}
          userCoords={userCoords}
          onOpenBakery={(id) => router.push(`/bakery/${id}`)}
        />
      ) : (
        <View style={{ flex: 1 }}>
          <EmptyState
            icon="map-marker-off-outline"
            title="No mapped bakeries yet"
            message="Bakeries with a saved location will show up here on the map."
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
