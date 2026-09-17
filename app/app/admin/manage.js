import React, { useState } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet, Alert, TextInput } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '@/src/context/ThemeContext';
import { useAuth } from '@/src/context/AuthContext';
import { useData } from '@/src/context/DataContext';
import Card from '@/src/components/Card';
import EmptyState from '@/src/components/EmptyState';
import KingCakeRating from '@/src/components/KingCakeRating';
import { deleteBakery, setSponsored } from '@/src/services/bakeries';
import { matchesSearch } from '@/src/utils/search';

export default function ManageBakeries() {
  const { colors, spacing, typography, radius, isDark } = useTheme();
  const { isSuperuser } = useAuth();
  const { bakeries, removeBakery, refreshBakeries, applyBakeryPatch } = useData();
  const router = useRouter();

  const [term, setTerm] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  if (!isSuperuser) return <Redirect href="/(tabs)" />;

  const filtered = bakeries.filter((b) => matchesSearch(b, term));

  const confirmDelete = (bakery) => {
    Alert.alert(
      'Delete bakery?',
      `This permanently deletes “${bakery.name}” and all of its reviews. This can’t be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(bakery.id);
            try {
              await deleteBakery(bakery.id);
              removeBakery(bakery.id);
            } catch (e) {
              Alert.alert('Could not delete', e.message || 'Please try again.');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshBakeries();
    setRefreshing(false);
  };

  const SPONSORED_MAX = 5;
  const sponsoredCount = bakeries.filter((b) => b.sponsored).length;
  const toggleSponsored = async (b) => {
    const turningOn = !b.sponsored;
    if (turningOn && sponsoredCount >= SPONSORED_MAX) {
      Alert.alert('Limit reached', `You can feature up to ${SPONSORED_MAX} sponsored bakeries. Un-star one first.`);
      return;
    }
    applyBakeryPatch(b.id, { sponsored: turningOn }); // optimistic
    try {
      await setSponsored(b.id, turningOn);
    } catch (e) {
      applyBakeryPatch(b.id, { sponsored: b.sponsored }); // revert
      Alert.alert('Could not update', e.message || 'Please try again.');
    }
  };

  const renderItem = ({ item }) => (
    <Card style={{ marginBottom: spacing.md }}>
      <View style={styles.row}>
        <View style={{ flex: 1, paddingRight: spacing.sm }}>
          {item.sponsored ? (
            <View style={[styles.sponsorTag, { backgroundColor: colors.goldSoft }]}>
              <MaterialCommunityIcons name="star" size={12} color={colors.gold} />
              <Text style={[typography.caption, { color: colors.gold, marginLeft: 3 }]}>Sponsored</Text>
            </View>
          ) : null}
          <Text style={[typography.heading, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            {item.address || 'No address'}
          </Text>
          <View style={{ marginTop: 8 }}>
            <KingCakeRating value={item.avgRating} count={item.ratingCount} showValue size={13} />
          </View>
        </View>
        <Pressable onPress={() => toggleSponsored(item)} hitSlop={8} style={{ alignItems: 'center', paddingLeft: 4 }}>
          <MaterialCommunityIcons
            name={item.sponsored ? 'star' : 'star-outline'}
            size={28}
            color={item.sponsored ? colors.gold : colors.textFaint}
          />
          <Text style={[typography.caption, { color: item.sponsored ? colors.gold : colors.textFaint }]}>Feature</Text>
        </Pressable>
      </View>

      <View style={[styles.actions, { borderTopColor: colors.divider }]}>
        <Pressable
          onPress={() => router.push(`/admin/edit-bakery/${item.id}`)}
          style={[styles.actionBtn, { borderColor: colors.border, borderRadius: radius.md }]}
        >
          <MaterialCommunityIcons name="pencil-outline" size={17} color={colors.primary} />
          <Text style={[typography.small, { color: colors.primary, marginLeft: 6, fontWeight: '700' }]}>Edit</Text>
        </Pressable>
        <View style={{ width: 10 }} />
        <Pressable
          onPress={() => confirmDelete(item)}
          disabled={deletingId === item.id}
          style={[styles.actionBtn, { borderColor: colors.dangerSoft, backgroundColor: colors.dangerSoft, borderRadius: radius.md }]}
        >
          <MaterialCommunityIcons name="trash-can-outline" size={17} color={colors.danger} />
          <Text style={[typography.small, { color: colors.danger, marginLeft: 6, fontWeight: '700' }]}>
            {deletingId === item.id ? 'Deleting…' : 'Delete'}
          </Text>
        </Pressable>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ marginLeft: -6 }}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
        </Pressable>
        <Text style={[typography.heading, { color: colors.text }]}>Manage bakeries</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 14 }}>
        <View style={[styles.searchBox, { backgroundColor: colors.inputBg, borderColor: colors.border, borderRadius: radius.md }]}>
          <MaterialCommunityIcons name="magnify" size={19} color={colors.textFaint} />
          <TextInput
            style={[typography.body, { flex: 1, marginLeft: 8, color: colors.text, height: 46 }]}
            placeholder="Search bakeries to edit…"
            placeholderTextColor={colors.textFaint}
            value={term}
            onChangeText={setTerm}
            autoCorrect={false}
          />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
          <MaterialCommunityIcons name="star" size={14} color={colors.gold} />
          <Text style={[typography.caption, { color: colors.textMuted, marginLeft: 5 }]}>
            Sponsored {sponsoredCount}/{SPONSORED_MAX} · tap a bakery’s star to feature it
          </Text>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View style={{ height: 320 }}>
            <EmptyState
              icon="storefront-outline"
              title={term ? 'No matches' : 'No bakeries yet'}
              message={term ? 'Try a different search.' : 'Add your first bakery to get started.'}
            />
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, paddingHorizontal: 12, height: 48 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  sponsorTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 5,
  },
  actions: { flexDirection: 'row', marginTop: 14, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    height: 42,
  },
});
