import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeContext';

/**
 * Food-safety warning shown on every bakery page. Covers the three things that
 * can go wrong eating a king cake: the hidden baby/trinket choking hazard,
 * allergens, and the fact that we don't make or inspect the food.
 */
export default function FoodSafetyNotice({ style }) {
  const { colors, typography, radius } = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.goldSoft, borderColor: colors.gold, borderRadius: radius.md },
        style,
      ]}
    >
      <View style={styles.header}>
        <MaterialCommunityIcons name="alert-outline" size={18} color={colors.gold} />
        <Text style={[typography.bodyStrong, { color: colors.text, marginLeft: 6 }]}>
          Before you eat
        </Text>
      </View>
      <Text style={[typography.small, { color: colors.text, marginTop: 6, lineHeight: 20 }]}>
        <Text style={styles.b}>Choking hazard: </Text>
        many king cakes hide a small plastic baby, bean, or trinket inside. Cut
        and eat carefully, warn your guests, and keep pieces away from young
        children.{'\n'}
        <Text style={styles.b}>Allergens: </Text>
        king cakes commonly contain wheat/gluten, eggs, and dairy, and may
        contain or be made near nuts, soy, or other allergens. If you have a food
        allergy, check with the bakery before eating.{'\n'}
        <Text style={styles.b}>No guarantee: </Text>
        King Cake Finder lists bakeries but does not make, inspect, or guarantee
        any food. Some listings are home bakers who may not be licensed or
        inspected — you eat at your own risk.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, padding: 14 },
  header: { flexDirection: 'row', alignItems: 'center' },
  b: { fontWeight: '800' },
});
