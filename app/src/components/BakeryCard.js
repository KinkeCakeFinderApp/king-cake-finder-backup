import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeContext';
import { useData } from '@/src/context/DataContext';
import Card from '@/src/components/Card';
import KingCakeRating from '@/src/components/KingCakeRating';
import ShippingBadge from '@/src/components/ShippingBadge';
import FavoriteButton from '@/src/components/FavoriteButton';
import ToTasteButton from '@/src/components/ToTasteButton';
import { haversineMiles, formatDistance, estimateTravelTime } from '@/src/utils/distance';
import { startingPriceLabel } from '@/src/utils/format';

/** A single search result row. */
export default function BakeryCard({ bakery, onPress, sponsored = false }) {
  const { colors, spacing, typography } = useTheme();
  const { userCoords } = useData();

  const { distanceLabel, timeLabel } = useMemo(() => {
    const miles = haversineMiles(userCoords, bakery.coords);
    return {
      distanceLabel: formatDistance(miles),
      timeLabel: estimateTravelTime(miles),
    };
  }, [userCoords, bakery.coords]);

  const price = startingPriceLabel(bakery.variations);
  const typeLabel = bakery.isHomeBakery
    ? 'Home bakery'
    : bakery.isBrickAndMortar
    ? 'Brick-and-mortar'
    : 'Bakery';

  return (
    <Card onPress={onPress} style={{ marginBottom: spacing.md }}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1, paddingRight: spacing.sm }}>
          {sponsored ? (
            <View style={[styles.sponsorTag, { backgroundColor: colors.goldSoft }]}>
              <MaterialCommunityIcons name="star" size={12} color={colors.gold} />
              <Text style={[typography.caption, { color: colors.gold, marginLeft: 3 }]}>Sponsored</Text>
            </View>
          ) : null}
          <Text style={[typography.heading, { color: colors.text }]} numberOfLines={1}>
            {bakery.name}
          </Text>
          <Text
            style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}
            numberOfLines={1}
          >
            {typeLabel}
          </Text>
        </View>
        <View style={styles.actions}>
          <ToTasteButton bakeryId={bakery.id} style={{ marginRight: 6 }} />
          <FavoriteButton bakeryId={bakery.id} />
        </View>
      </View>

      <View style={[styles.ratingRow, { marginTop: spacing.sm }]}>
        <KingCakeRating value={bakery.avgRating} count={bakery.ratingCount} showValue size={16} />
      </View>

      <View style={[styles.metaRow, { marginTop: spacing.md }]}>
        {distanceLabel ? (
          <Meta icon="map-marker-outline" color={colors.primary} text={distanceLabel} />
        ) : null}
        {timeLabel ? (
          <Meta icon="clock-outline" color={colors.textMuted} text={timeLabel} />
        ) : null}
        {price ? (
          <Meta icon="tag-outline" color={colors.green} text={price} textColor={colors.text} />
        ) : null}
        {bakery.shipping ? (
          <View style={{ marginLeft: 'auto' }}>
            <ShippingBadge />
          </View>
        ) : null}
      </View>
    </Card>
  );
}

function Meta({ icon, color, text, textColor }) {
  const { colors, typography } = useTheme();
  return (
    <View style={styles.meta}>
      <MaterialCommunityIcons name={icon} size={15} color={color} />
      <Text
        style={[
          typography.small,
          { color: textColor || colors.textMuted, marginLeft: 4, fontWeight: '600' },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'flex-start' },
  actions: { flexDirection: 'row', alignItems: 'center' },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  meta: { flexDirection: 'row', alignItems: 'center', marginRight: 14, marginBottom: 2 },
  sponsorTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 5,
  },
});
