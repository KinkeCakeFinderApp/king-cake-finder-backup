import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '@/src/context/ThemeContext';
import { useAuth } from '@/src/context/AuthContext';
import { useData } from '@/src/context/DataContext';
import Card from '@/src/components/Card';
import KingCakeRating from '@/src/components/KingCakeRating';
import EmptyState from '@/src/components/EmptyState';
import SignInPrompt from '@/src/components/SignInPrompt';
import Loading from '@/src/components/Loading';
import { getMyReviews } from '@/src/services/reviews';
import { formatDate } from '@/src/utils/format';

export default function History() {
  const { colors, spacing, typography, radius, isDark } = useTheme();
  const { user } = useAuth();
  const { getBakeryById, bakeries } = useData();
  const router = useRouter();
  const isGuest = !user;

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const list = await getMyReviews(user.uid, bakeries);
      setReviews(list);
    } catch (e) {
      setReviews([]);
    }
  }, [user, bakeries]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      load().finally(() => active && setLoading(false));
      return () => {
        active = false;
      };
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const renderHeader = () => (
    <View style={{ paddingHorizontal: 20, paddingTop: 6 }}>
      <Text style={[typography.display, { color: colors.text }]}>Your reviews</Text>
      <Text style={[typography.small, { color: colors.textMuted, marginTop: 2, marginBottom: spacing.lg }]}>
        {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
      </Text>
    </View>
  );

  const renderItem = ({ item }) => {
    const bakery = item.bakeryId ? getBakeryById(item.bakeryId) : null;
    const pending = item.status === 'moderated';
    return (
      <Card
        onPress={item.bakeryId ? () => router.push(`/bakery/${item.bakeryId}`) : undefined}
        style={{ marginBottom: spacing.md }}
      >
        <View style={styles.row}>
          <View style={{ flex: 1, paddingRight: spacing.sm }}>
            <Text style={[typography.heading, { color: colors.text }]} numberOfLines={1}>
              {bakery ? bakery.name : 'Bakery'}
            </Text>
            <View style={{ marginTop: 6 }}>
              <KingCakeRating value={item.rating} size={15} />
            </View>
            {item.text ? (
              <Text
                style={[typography.small, { color: colors.textMuted, marginTop: 6, lineHeight: 19 }]}
                numberOfLines={2}
              >
                {item.text}
              </Text>
            ) : null}
            <Text style={[typography.caption, { color: colors.textFaint, marginTop: 8 }]}>
              {formatDate(item.createdAt)}
            </Text>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            {pending ? (
              <View style={[styles.badge, { backgroundColor: colors.goldSoft, borderRadius: radius.sm }]}>
                <MaterialCommunityIcons name="clock-alert-outline" size={13} color={colors.gold} />
                <Text style={[typography.caption, { color: colors.gold, marginLeft: 4 }]}>Pending</Text>
              </View>
            ) : (
              <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textFaint} />
            )}
          </View>
        </View>
      </Card>
    );
  };

  if (isGuest) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        {renderHeader()}
        <View style={{ paddingHorizontal: 20, paddingTop: spacing.lg }}>
          <SignInPrompt
            icon="pencil-outline"
            title="Track your reviews"
            message="Log in or create a free account to write reviews and keep a history of your king-cake journey."
          />
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        {renderHeader()}
        <Loading label="Loading your reviews…" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <FlatList
        data={reviews}
        keyExtractor={(item) => `${item.bakeryId}_${item.id}`}
        ListHeaderComponent={renderHeader}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View style={{ height: 360 }}>
            <EmptyState
              icon="pencil-outline"
              title="No reviews yet"
              message="When you review a bakery, it’ll appear here so you can track your king-cake journey."
            />
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4 },
});
