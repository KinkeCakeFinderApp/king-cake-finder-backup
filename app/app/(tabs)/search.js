import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '@/src/context/ThemeContext';
import { useData } from '@/src/context/DataContext';
import BakeryCard from '@/src/components/BakeryCard';
import FilterSheet from '@/src/components/FilterSheet';
import EmptyState from '@/src/components/EmptyState';
import Loading from '@/src/components/Loading';
import SponsorBanner from '@/src/components/SponsorBanner';
import {
  filterAndSort,
  DEFAULT_SORT,
  DEFAULT_FILTERS,
  activeFilterCount,
  SORT_OPTIONS,
} from '@/src/utils/search';

export default function Search() {
  const { colors, spacing, typography, radius, isDark } = useTheme();
  const router = useRouter();
  const {
    bakeries,
    loadingBakeries,
    loadedOnce,
    refreshBakeries,
    userCoords,
    locationStatus,
    requestLocation,
  } = useData();

  const [term, setTerm] = useState('');
  const [sort, setSort] = useState(DEFAULT_SORT);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const results = useMemo(
    () => filterAndSort({ bakeries, term, sort, filters, userCoords }),
    [bakeries, term, sort, filters, userCoords]
  );

  const filterBadge = activeFilterCount(filters) + (sort !== DEFAULT_SORT ? 1 : 0);
  const sortLabel = SORT_OPTIONS.find((o) => o.key === sort)?.label || '';

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshBakeries();
    setRefreshing(false);
  }, [refreshBakeries]);

  const handleChangeSort = (key) => {
    if (key === 'closest' && locationStatus !== 'granted') {
      requestLocation(true);
    }
    setSort(key);
  };

  const toggleFilter = (key) =>
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));

  const resetFilters = () => {
    setSort(DEFAULT_SORT);
    setFilters(DEFAULT_FILTERS);
  };

  const renderHeader = () => (
    <View>
      <SponsorBanner style={{ marginHorizontal: 20, marginTop: 6, marginBottom: 8 }} />
      <View style={{ paddingHorizontal: 20, paddingTop: 6 }}>
      <Text style={[typography.display, { color: colors.text }]}>Find a king cake</Text>
      <Text style={[typography.small, { color: colors.textMuted, marginTop: 2, marginBottom: spacing.lg }]}>
        {bakeries.length} {bakeries.length === 1 ? 'bakery' : 'bakeries'} on the map
      </Text>

      <View style={styles.searchRow}>
        <View
          style={[
            styles.searchBox,
            { backgroundColor: colors.inputBg, borderColor: colors.border, borderRadius: radius.md },
          ]}
        >
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textFaint} />
          <TextInput
            style={[typography.body, styles.searchInput, { color: colors.text }]}
            placeholder="Search name, type, city, flavor…"
            placeholderTextColor={colors.textFaint}
            value={term}
            onChangeText={setTerm}
            returnKeyType="search"
            autoCorrect={false}
          />
          {term.length > 0 ? (
            <Pressable onPress={() => setTerm('')} hitSlop={8}>
              <MaterialCommunityIcons name="close-circle" size={18} color={colors.textFaint} />
            </Pressable>
          ) : null}
        </View>

        <Pressable
          onPress={() => setSheetOpen(true)}
          style={[
            styles.filterBtn,
            { backgroundColor: filterBadge ? colors.primary : colors.inputBg, borderColor: colors.border, borderRadius: radius.md },
          ]}
        >
          <MaterialCommunityIcons
            name="tune-variant"
            size={22}
            color={filterBadge ? colors.onPrimary : colors.text}
          />
          {filterBadge ? (
            <View style={[styles.badge, { backgroundColor: colors.gold }]}>
              <Text style={styles.badgeText}>{filterBadge}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <View style={styles.sortRow}>
        <MaterialCommunityIcons name="sort" size={15} color={colors.textFaint} />
        <Text style={[typography.caption, { color: colors.textMuted, marginLeft: 4 }]}>
          Sorted by {sortLabel.toLowerCase()}
        </Text>
      </View>
      </View>
    </View>
  );

  if (loadingBakeries && !loadedOnce) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        {renderHeader()}
        <Loading label="Loading bakeries…" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {/* Header (incl. the search box) is OUTSIDE the FlatList so typing never
          remounts the input — otherwise the keyboard closes on each keystroke. */}
      {renderHeader()}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <BakeryCard bakery={item} onPress={() => router.push(`/bakery/${item.id}`)} />
        )}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View style={{ height: 380 }}>
            <EmptyState
              icon="cupcake"
              title={term || filterBadge ? 'No king cakes match your search yet' : 'No bakeries yet'}
              message={
                term || filterBadge
                  ? 'Try a different search term or clear your filters.'
                  : 'Once bakeries are added, they’ll show up here to browse and rate.'
              }
            />
          </View>
        }
      />

      <FilterSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        sort={sort}
        filters={filters}
        onChangeSort={handleChangeSort}
        onToggleFilter={toggleFilter}
        onReset={resetFilters}
        locationAvailable={locationStatus === 'granted'}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  searchRow: { flexDirection: 'row', alignItems: 'center' },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    paddingHorizontal: 12,
    height: 50,
  },
  searchInput: { flex: 1, marginLeft: 8, padding: 0, height: 48 },
  filterBtn: {
    width: 50,
    height: 50,
    borderWidth: 1.5,
    marginLeft: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#3A2E12', fontSize: 11, fontWeight: '800' },
  sortRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 4 },
});
