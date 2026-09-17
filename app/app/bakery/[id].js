import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '@/src/context/ThemeContext';
import { useAuth } from '@/src/context/AuthContext';
import { useData } from '@/src/context/DataContext';
import KingCakeRating from '@/src/components/KingCakeRating';
import FavoriteButton from '@/src/components/FavoriteButton';
import ToTasteButton from '@/src/components/ToTasteButton';
import ShippingBadge from '@/src/components/ShippingBadge';
import ReviewItem from '@/src/components/ReviewItem';
import ReviewComposer from '@/src/components/ReviewComposer';
import SignInPrompt from '@/src/components/SignInPrompt';
import FoodSafetyNotice from '@/src/components/FoodSafetyNotice';
import MiniMap from '@/src/components/MiniMap';
import Loading from '@/src/components/Loading';
import Card from '@/src/components/Card';
import { useRequireAuth } from '@/src/hooks/useRequireAuth';
import { getBakery } from '@/src/services/bakeries';
import { getPublishedReviews, getMyReview } from '@/src/services/reviews';
import { reportReview, adminDeleteReview } from '@/src/services/moderation';
import { haversineMiles, formatDistance, estimateTravelTime, formatMinutes } from '@/src/utils/distance';
import { fetchDrivingRoute } from '@/src/utils/routing';
import { formatPrice } from '@/src/utils/format';
import { openInAppleMaps, openInGoogleMaps, callPhone } from '@/src/utils/maps';

export default function BakeryDetail() {
  const { id } = useLocalSearchParams();
  const { colors, spacing, typography, radius, isDark } = useTheme();
  const { user, isSuperuser, isBlocked, blockUser } = useAuth();
  const { getBakeryById, applyBakeryPatch, userCoords, requestLocation, locationStatus } = useData();
  const requireAuth = useRequireAuth();
  const router = useRouter();

  const scrollRef = useRef(null);
  const composerY = useRef(0);
  const scrollToComposer = useCallback(() => {
    // Small delay lets the keyboard-triggered layout settle first, so the
    // measured position (and the resulting scroll) is accurate.
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, composerY.current - 16), animated: true });
    }, 50);
  }, []);

  const [bakery, setBakery] = useState(() => getBakeryById(id));
  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [reportedIds, setReportedIds] = useState(() => new Set());

  const load = useCallback(async () => {
    try {
      const [fresh, published, mine] = await Promise.all([
        getBakery(id),
        getPublishedReviews(id),
        user ? getMyReview(id, user.uid) : Promise.resolve(null),
      ]);
      if (fresh) {
        setBakery(fresh);
        applyBakeryPatch(id, { avgRating: fresh.avgRating, ratingCount: fresh.ratingCount });
      }
      setReviews(published);
      setMyReview(mine);
    } catch (e) {
      // Keep whatever we have from cache.
    } finally {
      setLoading(false);
    }
  }, [id, user, applyBakeryPatch]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      load().finally(() => {
        if (!active) return;
      });
      return () => {
        active = false;
      };
    }, [load])
  );

  // Real road route from OSRM (see utils/routing.js), fetched once per
  // bakery+location. Falls back to the straight-line estimate below when it
  // hasn't resolved yet or the free routing server is unavailable.
  const [routeInfo, setRouteInfo] = useState(null);
  const bakeryLat = bakery?.coords?.lat;
  const bakeryLng = bakery?.coords?.lng;

  useEffect(() => {
    setRouteInfo(null);
    if (!userCoords || typeof bakeryLat !== 'number' || typeof bakeryLng !== 'number') return;

    let active = true;
    fetchDrivingRoute(userCoords, { lat: bakeryLat, lng: bakeryLng }).then((route) => {
      if (active && route) setRouteInfo(route);
    });
    return () => {
      active = false;
    };
  }, [userCoords, bakeryLat, bakeryLng]);

  const distance = useMemo(() => {
    if (routeInfo) {
      return { label: formatDistance(routeInfo.miles), time: formatMinutes(routeInfo.minutes) };
    }
    const miles = haversineMiles(userCoords, bakery?.coords);
    return { label: formatDistance(miles), time: estimateTravelTime(miles) };
  }, [userCoords, bakery, routeInfo]);

  const onSubmitted = async () => {
    setEditing(false);
    await load();
  };

  const handleReport = async (review) => {
    // Reporting writes to Firestore as the reporter, so guests must sign in.
    if (!requireAuth('Log in or create an account to report a review.')) return;
    Alert.alert(
      'Report this review?',
      'It will be sent to our moderators to check. Thanks for helping keep things PG.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: async () => {
            try {
              await reportReview({ bakeryId: id, review, reporterUid: user.uid, bakeryName: bakery.name });
              setReportedIds((prev) => new Set(prev).add(review.id));
            } catch (e) {
              Alert.alert('Could not report', 'Please try again in a moment.');
            }
          },
        },
      ]
    );
  };

  const handleBlock = (review) => {
    // Blocking writes to the current user's profile, so guests sign in first.
    if (!requireAuth('Log in or create an account to block a user.')) return;
    const authorUid = review.authorUid || review.id;
    Alert.alert(
      `Block ${review.authorUsername || 'this user'}?`,
      "You won't see their reviews anymore. You can unblock them later in Settings.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await blockUser(authorUid, review.authorUsername);
            } catch (e) {
              Alert.alert('Could not block', 'Please try again in a moment.');
            }
          },
        },
      ]
    );
  };

  const handleAdminDelete = (review) => {
    Alert.alert(
      'Remove this review?',
      'As an admin, this permanently deletes the review and updates the bakery’s rating. This can’t be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminDeleteReview({ bakeryId: id, authorUid: review.authorUid || review.id });
              await load();
            } catch (e) {
              Alert.alert('Could not remove', e.message || 'Please try again.');
            }
          },
        },
      ]
    );
  };

  if (!bakery && loading) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
        <Header onBack={() => router.back()} />
        <Loading />
      </SafeAreaView>
    );
  }

  if (!bakery) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
        <Header onBack={() => router.back()} />
        <View style={styles.centered}>
          <MaterialCommunityIcons name="store-off-outline" size={48} color={colors.textFaint} />
          <Text style={[typography.heading, { color: colors.text, marginTop: 12 }]}>Bakery not found</Text>
          <Text style={[typography.small, { color: colors.textMuted, marginTop: 4 }]}>
            It may have been removed.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const typeLabel = bakery.isHomeBakery && bakery.isBrickAndMortar
    ? 'Home & brick-and-mortar bakery'
    : bakery.isHomeBakery
    ? 'Home bakery'
    : bakery.isBrickAndMortar
    ? 'Brick-and-mortar bakery'
    : 'Bakery';

  // Published reviews excluding the user's own (shown separately at top) and any
  // authors this user has blocked.
  const otherReviews = reviews.filter(
    (r) => r.id !== user?.uid && !isBlocked(r.authorUid || r.id)
  );

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Header
        onBack={() => router.back()}
        right={
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ToTasteButton bakeryId={bakery.id} size={26} style={{ marginRight: 10 }} />
            <FavoriteButton bakeryId={bakery.id} size={26} />
          </View>
        }
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title + type */}
        <Text style={[typography.display, { color: colors.text }]}>{bakery.name}</Text>
        <View style={styles.typeRow}>
          <MaterialCommunityIcons
            name={bakery.isHomeBakery ? 'home-outline' : 'storefront-outline'}
            size={15}
            color={colors.textMuted}
          />
          <Text style={[typography.small, { color: colors.textMuted, marginLeft: 5 }]}>{typeLabel}</Text>
          {bakery.shipping ? (
            <View style={{ marginLeft: 10 }}>
              <ShippingBadge />
            </View>
          ) : null}
        </View>

        <View style={{ marginTop: spacing.md }}>
          <KingCakeRating value={bakery.avgRating} count={bakery.ratingCount} showValue size={20} />
        </View>

        {bakery.description ? (
          <Text style={[typography.body, { color: colors.text, marginTop: spacing.lg, lineHeight: 22 }]}>
            {bakery.description}
          </Text>
        ) : null}

        {/* Food-safety warning: choking hazard (hidden baby), allergens, no guarantee */}
        <FoodSafetyNotice style={{ marginTop: spacing.lg }} />

        {/* Pricing table */}
        <SectionLabel icon="cake-variant-outline" text="Variations & pricing" />
        <Card padded={false} style={{ overflow: 'hidden' }}>
          {bakery.variations.length === 0 ? (
            <Text style={[typography.small, { color: colors.textMuted, padding: spacing.lg }]}>
              No pricing listed yet.
            </Text>
          ) : (
            bakery.variations.map((v, i) => (
              <View
                key={`${v.name}_${i}`}
                style={[
                  styles.priceRow,
                  { borderBottomColor: colors.divider, borderBottomWidth: i < bakery.variations.length - 1 ? StyleSheet.hairlineWidth : 0 },
                ]}
              >
                <Text style={[typography.body, { color: colors.text, flex: 1 }]}>{v.name}</Text>
                <Text style={[typography.bodyStrong, { color: colors.primary }]}>{formatPrice(v.price)}</Text>
              </View>
            ))
          )}
        </Card>

        {/* Location */}
        <SectionLabel icon="map-marker-outline" text="Location" />
        <Card>
          <Text style={[typography.body, { color: colors.text, lineHeight: 21 }]}>
            {bakery.address || 'Address not provided'}
          </Text>

          {/* Live map: bakery pin + your location + a line between them */}
          {bakery.coords ? (
            <View style={{ marginTop: spacing.md }}>
              <MiniMap
                bakeryCoords={bakery.coords}
                userCoords={userCoords}
                bakeryName={bakery.name}
              />
              {userCoords ? (
                <View style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: '#5B3A8C' }]} />
                  <Text style={[typography.caption, { color: colors.textMuted, marginRight: 12 }]}>You</Text>
                  <View style={[styles.legendDot, { backgroundColor: colors.gold }]} />
                  <Text style={[typography.caption, { color: colors.textMuted }]}>{bakery.name}</Text>
                </View>
              ) : locationStatus !== 'granted' ? (
                <Pressable onPress={() => requestLocation(true)} style={styles.enableRow} hitSlop={6}>
                  <MaterialCommunityIcons name="crosshairs-gps" size={14} color={colors.primary} />
                  <Text style={[typography.caption, { color: colors.primary, marginLeft: 4, fontWeight: '700' }]}>
                    Turn on location to see how far away you are
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          <View style={styles.mapButtons}>
            <MapButton icon="apple" label="Apple Maps" onPress={() => openInAppleMaps(bakery.address, bakery.coords)} />
            <View style={{ width: 10 }} />
            <MapButton icon="google-maps" label="Google Maps" onPress={() => openInGoogleMaps(bakery.address, bakery.coords)} />
          </View>
        </Card>

        {/* Phone, with distance/time (just under the map above) to the right of it */}
        {bakery.phone || distance.label ? (
          <Card
            onPress={bakery.phone ? () => callPhone(bakery.phone) : undefined}
            style={{ marginTop: spacing.md }}
          >
            <View style={styles.contactRow}>
              {bakery.phone ? (
                <>
                  <View style={[styles.contactIcon, { backgroundColor: colors.greenSoft }]}>
                    <MaterialCommunityIcons name="phone" size={18} color={colors.green} />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={[typography.caption, { color: colors.textMuted }]}>TAP TO CALL</Text>
                    <Text style={[typography.bodyStrong, { color: colors.text }]}>{bakery.phone}</Text>
                  </View>
                </>
              ) : (
                <View style={{ flex: 1 }} />
              )}
              {distance.label ? (
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[typography.bodyStrong, { color: colors.text }]}>{distance.label}</Text>
                  {distance.time ? (
                    <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
                      about {distance.time}
                    </Text>
                  ) : null}
                </View>
              ) : null}
              {bakery.phone ? (
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={22}
                  color={colors.textFaint}
                  style={{ marginLeft: spacing.sm }}
                />
              ) : null}
            </View>
          </Card>
        ) : null}

        {/* Reviews */}
        <SectionLabel icon="star-outline" text={`Reviews${bakery.ratingCount ? ` (${bakery.ratingCount})` : ''}`} />

        {/* Guests see a sign-in prompt; signed-in users see their review or the composer */}
        {!user ? (
          <SignInPrompt
            icon="star-outline"
            title="Want to leave a review?"
            message="Log in or create a free account to rate and review this bakery."
          />
        ) : myReview && !editing ? (
          <View style={{ marginBottom: spacing.md }}>
            <ReviewItem
              review={{ ...myReview, id: user.uid }}
              isOwn
              onEdit={() => setEditing(true)}
              onDelete={isSuperuser ? () => handleAdminDelete({ ...myReview, authorUid: user.uid }) : undefined}
            />
          </View>
        ) : (
          <View onLayout={(e) => { composerY.current = e.nativeEvent.layout.y; }}>
            <ReviewComposer
              bakeryId={bakery.id}
              existingReview={editing ? myReview : null}
              onSubmitted={onSubmitted}
              onCancelEdit={editing ? () => setEditing(false) : undefined}
              onFocusInput={scrollToComposer}
            />
          </View>
        )}

        {/* Other published reviews */}
        <View style={{ marginTop: spacing.md }}>
          {otherReviews.length === 0 ? (
            <Text style={[typography.small, { color: colors.textFaint, textAlign: 'center', paddingVertical: spacing.lg }]}>
              {myReview ? 'No other reviews yet.' : 'Be the first to review this bakery!'}
            </Text>
          ) : (
            otherReviews.map((r) => (
              <ReviewItem
                key={r.id}
                review={r}
                onReport={() => handleReport(r)}
                onBlock={() => handleBlock(r)}
                reported={reportedIds.has(r.id)}
                onDelete={isSuperuser ? () => handleAdminDelete(r) : undefined}
              />
            ))
          )}
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Header({ onBack, right }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.header, { borderBottomColor: colors.border }]}>
      <Pressable onPress={onBack} hitSlop={10} style={styles.headerBtn}>
        <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
      </Pressable>
      <View>{right}</View>
    </View>
  );
}

function SectionLabel({ icon, text }) {
  const { colors, typography, spacing } = useTheme();
  return (
    <View style={[styles.sectionLabel, { marginTop: spacing.xl }]}>
      <MaterialCommunityIcons name={icon} size={17} color={colors.primary} />
      <Text style={[typography.subheading, { color: colors.text, marginLeft: 7, letterSpacing: 0.3 }]}>
        {text}
      </Text>
    </View>
  );
}

function MapButton({ icon, label, onPress }) {
  const { colors, typography, radius } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.mapBtn,
        { backgroundColor: colors.inputBg, borderColor: colors.border, borderRadius: radius.md, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <MaterialCommunityIcons name={icon} size={18} color={colors.text} />
      <Text style={[typography.small, { color: colors.text, marginLeft: 7, fontWeight: '700' }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: { marginLeft: -6 },
  typeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  sectionLabel: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  priceRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  legendRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 5 },
  enableRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  mapButtons: { flexDirection: 'row', marginTop: 14 },
  mapBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    height: 46,
  },
  contactRow: { flexDirection: 'row', alignItems: 'center' },
  contactIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
});
