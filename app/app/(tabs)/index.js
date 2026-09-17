import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, SectionList, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '@/src/context/ThemeContext';
import { useAuth } from '@/src/context/AuthContext';
import { useData } from '@/src/context/DataContext';
import BakeryCard from '@/src/components/BakeryCard';
import Button from '@/src/components/Button';
import SignInPrompt from '@/src/components/SignInPrompt';
import SponsorBanner from '@/src/components/SponsorBanner';
import { getUnreadCount } from '@/src/services/messages';
import { setAppBadgeCount } from '@/src/utils/pushNotifications';

export default function Home() {
  const { colors, spacing, typography, isDark } = useTheme();
  const { profile, user, isSuperuser } = useAuth();
  const isGuest = !user;
  const { bakeries, refreshBakeries } = useData();
  const router = useRouter();

  const [refreshing, setRefreshing] = useState(false);
  const [unread, setUnread] = useState(0);

  // Refresh the unread inbox badge whenever Home regains focus. The app icon
  // badge mirrors it too — except for superusers, whose icon badge instead
  // reflects the admin queue (set by the Admin tab), so the two don't fight
  // over what the badge number means.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (user) {
        getUnreadCount(user.uid)
          .then((n) => {
            if (!active) return;
            setUnread(n);
            if (!isSuperuser) setAppBadgeCount(n);
          })
          .catch(() => {});
      }
      return () => {
        active = false;
      };
    }, [user, isSuperuser])
  );

  const favorites = useMemo(() => {
    const favIds = new Set(profile?.favorites || []);
    return bakeries.filter((b) => favIds.has(b.id));
  }, [bakeries, profile]);

  const toTaste = useMemo(() => {
    const ids = new Set(profile?.toTaste || []);
    return bakeries.filter((b) => ids.has(b.id));
  }, [bakeries, profile]);

  // Two independent lists, each padded with a placeholder row when empty so
  // its section header + an inline "nothing here yet" message still show.
  const sections = isGuest
    ? []
    : [
        {
          key: 'toTaste',
          title: 'To be tasted',
          data: toTaste.length ? toTaste : [{ id: '_empty_toTaste', _empty: true }],
          emptyMessage: 'Tap the bookmark on any bakery to add it here — a wishlist for next time.',
          // A bakery can be in both lists at once, so prefix keys per-section
          // to keep them unique across the whole SectionList.
          keyExtractor: (item) => `toTaste_${item.id}`,
        },
        {
          key: 'favorites',
          title: 'Saved bakeries',
          data: favorites.length ? favorites : [{ id: '_empty_favorites', _empty: true }],
          emptyMessage: 'Favorite a bakery to see it here — tap the star on any bakery to save it.',
          keyExtractor: (item) => `favorites_${item.id}`,
        },
      ];

  // Admin-featured bakeries (up to 5), shown at the top of Home.
  const featured = useMemo(
    () => bakeries.filter((b) => b.sponsored).slice(0, 5),
    [bakeries]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshBakeries();
    if (user) {
      getUnreadCount(user.uid)
        .then((n) => {
          setUnread(n);
          if (!isSuperuser) setAppBadgeCount(n);
        })
        .catch(() => {});
    }
    setRefreshing(false);
  }, [refreshBakeries, user, isSuperuser]);

  const renderHeader = () => (
    <View>
      <SponsorBanner style={{ marginHorizontal: 20, marginTop: 6, marginBottom: 8 }} />
      <View style={{ paddingHorizontal: 20, paddingTop: 6 }}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[typography.small, { color: colors.textMuted }]}>
              {greeting()}
            </Text>
            <Text style={[typography.display, { color: colors.text, marginTop: 2 }]}>
              {isGuest
                ? 'King Cake Finder'
                : profile?.firstName
                ? `Hi, ${profile.firstName}`
                : 'Your favorites'}
            </Text>
          </View>

          {/* Inbox is account-only, so the bell is hidden for guests. */}
          {isGuest ? null : (
            <Pressable
              onPress={() => router.push('/inbox')}
              style={[styles.bell, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <MaterialCommunityIcons name="bell-outline" size={22} color={colors.text} />
              {unread > 0 ? (
                <View style={[styles.dot, { backgroundColor: colors.danger }]}>
                  <Text style={styles.dotText}>{unread > 9 ? '9+' : unread}</Text>
                </View>
              ) : null}
            </Pressable>
          )}
        </View>
      </View>

      {featured.length > 0 ? (
        <View style={{ marginTop: spacing.xl }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
            <MaterialCommunityIcons name="star" size={16} color={colors.gold} />
            <Text
              style={[
                typography.subheading,
                { color: colors.textMuted, marginLeft: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
              ]}
            >
              Sponsored
            </Text>
          </View>
          {featured.map((b) => (
            <BakeryCard key={`sp_${b.id}`} bakery={b} sponsored onPress={() => router.push(`/bakery/${b.id}`)} />
          ))}
        </View>
      ) : null}

      {isGuest ? (
        <Text
          style={[
            typography.subheading,
            { color: colors.textMuted, marginTop: spacing.xl, marginBottom: spacing.md, textTransform: 'uppercase', letterSpacing: 0.5 },
          ]}
        >
          Discover
        </Text>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        renderSectionHeader={({ section }) => (
          <Text
            style={[
              typography.subheading,
              {
                color: colors.textMuted,
                backgroundColor: colors.background,
                marginTop: spacing.xl,
                marginBottom: spacing.md,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              },
            ]}
          >
            {section.title}
          </Text>
        )}
        renderItem={({ item, section }) =>
          item._empty ? (
            <Text style={[typography.small, { color: colors.textFaint, paddingBottom: spacing.md }]}>
              {section.emptyMessage}
            </Text>
          ) : (
            <BakeryCard bakery={item} onPress={() => router.push(`/bakery/${item.id}`)} />
          )
        }
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          isGuest ? (
            <View>
              <SignInPrompt
                icon="star-outline"
                title="Save favorites & bakeries to taste"
                message="Log in or create a free account to save bakeries and see them here. You can keep browsing without one."
              />
              <View style={{ height: spacing.lg }} />
              <Button
                title="Browse bakeries"
                icon="magnify"
                onPress={() => router.push('/(tabs)/search')}
              />
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start' },
  bell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  dotText: { color: '#fff', fontSize: 10, fontWeight: '800' },
});
