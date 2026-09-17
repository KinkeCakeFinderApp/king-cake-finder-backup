import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeContext';
import KingCakeRating from '@/src/components/KingCakeRating';
import { formatDate } from '@/src/utils/format';

/**
 * A single review row. When `isOwn` is set, shows edit affordance + a pending
 * badge for moderated reviews. For others' reviews, shows a report action.
 */
export default function ReviewItem({
  review,
  isOwn = false,
  onEdit,
  onReport,
  onBlock,
  onDelete,
  reported = false,
}) {
  const { colors, spacing, typography, radius } = useTheme();
  const pending = review.status === 'moderated';

  return (
    <View
      style={[
        styles.container,
        { borderColor: colors.divider },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.avatarRow}>
          <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
            <Text style={{ color: colors.primary, fontWeight: '800' }}>
              {(review.authorUsername || '?').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ marginLeft: spacing.sm }}>
            <Text style={[typography.bodyStrong, { color: colors.text }]}>
              {isOwn ? 'You' : review.authorUsername || 'Anonymous'}
            </Text>
            <Text style={[typography.caption, { color: colors.textFaint }]}>
              {formatDate(review.createdAt)}
            </Text>
          </View>
        </View>

        <KingCakeRating value={review.rating} size={14} />
      </View>

      {review.text ? (
        <Text
          style={[
            typography.body,
            { color: colors.text, marginTop: spacing.sm, lineHeight: 21 },
          ]}
        >
          {review.text}
        </Text>
      ) : null}

      <View style={[styles.footerRow, { marginTop: spacing.sm }]}>
        {pending && isOwn ? (
          <View style={[styles.badge, { backgroundColor: colors.goldSoft, borderRadius: radius.sm }]}>
            <MaterialCommunityIcons name="clock-alert-outline" size={13} color={colors.gold} />
            <Text style={[typography.caption, { color: colors.gold, marginLeft: 4 }]}>
              Pending review
            </Text>
          </View>
        ) : (
          <View />
        )}

        <View style={styles.actions}>
          {isOwn && onEdit ? (
            <Pressable onPress={onEdit} hitSlop={8} style={styles.action}>
              <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.primary} />
              <Text style={[typography.caption, { color: colors.primary, marginLeft: 4 }]}>
                Edit
              </Text>
            </Pressable>
          ) : null}

          {!isOwn && onReport ? (
            <Pressable
              onPress={reported ? undefined : onReport}
              hitSlop={8}
              style={styles.action}
              disabled={reported}
            >
              <MaterialCommunityIcons
                name={reported ? 'flag-checkered' : 'flag-outline'}
                size={16}
                color={reported ? colors.textFaint : colors.textMuted}
              />
              <Text
                style={[
                  typography.caption,
                  { color: reported ? colors.textFaint : colors.textMuted, marginLeft: 4 },
                ]}
              >
                {reported ? 'Reported' : 'Report'}
              </Text>
            </Pressable>
          ) : null}

          {!isOwn && onBlock ? (
            <Pressable onPress={onBlock} hitSlop={8} style={styles.action}>
              <MaterialCommunityIcons name="account-cancel-outline" size={16} color={colors.textMuted} />
              <Text style={[typography.caption, { color: colors.textMuted, marginLeft: 4 }]}>
                Block
              </Text>
            </Pressable>
          ) : null}

          {onDelete ? (
            <Pressable onPress={onDelete} hitSlop={8} style={styles.action}>
              <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.danger} />
              <Text style={[typography.caption, { color: colors.danger, marginLeft: 4 }]}>
                Remove
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actions: { flexDirection: 'row', alignItems: 'center' },
  action: { flexDirection: 'row', alignItems: 'center', marginLeft: 16 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});
