import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/src/context/ThemeContext';

/** Soft, slightly elevated surface used for list rows and content blocks. */
export default function Card({ children, onPress, style, padded = true }) {
  const { colors, radius, spacing, isDark } = useTheme();

  const content = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          borderColor: colors.border,
          padding: padded ? spacing.lg : 0,
          shadowColor: colors.shadow,
          shadowOpacity: isDark ? 0 : 0.06,
          elevation: isDark ? 0 : 2,
        },
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1, transform: [{ scale: pressed ? 0.995 : 1 }] })}
      >
        {content}
      </Pressable>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
});
