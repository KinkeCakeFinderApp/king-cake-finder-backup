import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeContext';
import { useAuth } from '@/src/context/AuthContext';
import { useRequireAuth } from '@/src/hooks/useRequireAuth';

/** Toggles "to be tasted" wishlist state for a bakery — a separate list from
 * favorites, for bakeries the user wants to try later. */
export default function ToTasteButton({ bakeryId, size = 24, style }) {
  const { colors } = useTheme();
  const { isToTaste, toggleToTaste } = useAuth();
  const requireAuth = useRequireAuth();
  const active = isToTaste(bakeryId);

  const onPress = () => {
    // Guests are prompted to sign in before they can save to their wishlist.
    if (!requireAuth('Log in or create an account to save bakeries to taste later.')) {
      return;
    }
    toggleToTaste(bakeryId);
  };

  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityLabel={active ? 'Remove from to be tasted' : 'Add to to be tasted'}
      style={({ pressed }) => [
        styles.btn,
        { opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.9 : 1 }] },
        style,
      ]}
    >
      <MaterialCommunityIcons
        name={active ? 'bookmark' : 'bookmark-outline'}
        size={size}
        color={active ? colors.primary : colors.textFaint}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { padding: 2 },
});
