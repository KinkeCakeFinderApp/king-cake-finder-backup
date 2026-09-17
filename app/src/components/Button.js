import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeContext';

/**
 * Themed button.
 * variant: 'primary' | 'secondary' | 'ghost' | 'danger'
 */
export default function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  size = 'md',
}) {
  const { colors, radius, typography } = useTheme();

  const palettes = {
    primary: { bg: colors.primary, fg: colors.onPrimary, border: 'transparent' },
    secondary: { bg: colors.primarySoft, fg: colors.primary, border: 'transparent' },
    ghost: { bg: 'transparent', fg: colors.primary, border: colors.border },
    danger: { bg: colors.danger, fg: '#FFFFFF', border: 'transparent' },
  };
  const p = palettes[variant] || palettes.primary;

  const heights = { sm: 40, md: 52, lg: 56 };
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          height: heights[size] || heights.md,
          backgroundColor: p.bg,
          borderColor: p.border,
          borderWidth: variant === 'ghost' ? 1.5 : 0,
          borderRadius: radius.md,
          opacity: isDisabled ? 0.55 : pressed ? 0.9 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          paddingHorizontal: fullWidth ? 16 : 22,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={p.fg} />
      ) : (
        <View style={styles.row}>
          {icon ? (
            <MaterialCommunityIcons
              name={icon}
              size={19}
              color={p.fg}
              style={{ marginRight: 8 }}
            />
          ) : null}
          <Text style={[typography.bodyStrong, { color: p.fg }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});
