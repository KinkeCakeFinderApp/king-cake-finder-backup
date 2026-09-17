import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeContext';

/** Small "Ships" indicator shown when a bakery offers shipping. */
export default function ShippingBadge({ compact = false }) {
  const { colors, typography, radius } = useTheme();
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: colors.greenSoft, borderRadius: radius.sm },
      ]}
    >
      <MaterialCommunityIcons name="truck-fast-outline" size={14} color={colors.green} />
      {!compact ? (
        <Text style={[typography.caption, { color: colors.green, marginLeft: 4 }]}>
          Ships
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
});
