import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeContext';
import { useAuth } from '@/src/context/AuthContext';
import { useRequireAuth } from '@/src/hooks/useRequireAuth';

/** Toggles favorite state for a bakery, writing to the user's favorites array. */
export default function FavoriteButton({ bakeryId, size = 24, style }) {
  const { colors } = useTheme();
  const { isFavorite, toggleFavorite } = useAuth();
  const requireAuth = useRequireAuth();
  const active = isFavorite(bakeryId);

  const onPress = () => {
    // Guests are prompted to sign in before they can save favorites.
    if (!requireAuth('Log in or create an account to save your favorite bakeries.')) {
      return;
    }
    toggleFavorite(bakeryId);
  };

  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityLabel={active ? 'Remove from favorites' : 'Add to favorites'}
      style={({ pressed }) => [
        styles.btn,
        { opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.9 : 1 }] },
        style,
      ]}
    >
      <MaterialCommunityIcons
        name={active ? 'star' : 'star-outline'}
        size={size}
        color={active ? colors.gold : colors.textFaint}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { padding: 2 },
});
