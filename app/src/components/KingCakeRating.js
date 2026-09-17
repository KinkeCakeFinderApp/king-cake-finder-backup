import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeContext';

// A "cupcake" glyph stands in for a king cake — festive and instantly readable.
const CAKE_ICON = 'cupcake';

/**
 * Renders a 1–5 king-cake rating.
 *  - Display mode: pass `value` (may be fractional) to show the average, with an
 *    optional numeric label and rating count.
 *  - Interactive mode: pass `interactive` + `onChange` to let the user tap to
 *    set a whole-number rating.
 */
export default function KingCakeRating({
  value = 0,
  interactive = false,
  onChange,
  size = 18,
  showValue = false,
  count,
  gap = 3,
  style,
}) {
  const { colors, typography, spacing } = useTheme();
  const rounded = Math.round(value); // whole-cake fill for crisp display

  return (
    <View style={[styles.row, style]}>
      <View style={styles.cakes}>
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = interactive ? i <= value : i <= rounded;
          const cake = (
            <MaterialCommunityIcons
              name={CAKE_ICON}
              size={interactive ? size + 10 : size}
              color={filled ? colors.gold : colors.starEmpty}
              style={{ marginRight: i < 5 ? gap : 0 }}
            />
          );
          if (!interactive) return <View key={i}>{cake}</View>;
          return (
            <Pressable
              key={i}
              onPress={() => onChange && onChange(i)}
              hitSlop={6}
              accessibilityLabel={`Rate ${i} out of 5 king cakes`}
              style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.88 : 1 }] })}
            >
              {cake}
            </Pressable>
          );
        })}
      </View>

      {showValue && !interactive ? (
        <Text
          style={[
            typography.small,
            { color: colors.textMuted, marginLeft: spacing.sm, fontWeight: '700' },
          ]}
        >
          {value ? value.toFixed(1) : 'New'}
          {typeof count === 'number' && count > 0 ? (
            <Text style={{ color: colors.textFaint, fontWeight: '600' }}>
              {`  (${count})`}
            </Text>
          ) : null}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  cakes: { flexDirection: 'row', alignItems: 'center' },
});
