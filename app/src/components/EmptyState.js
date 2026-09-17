import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeContext';

/**
 * Thoughtful empty state with an icon, headline and supporting line.
 * Optionally renders an action element (e.g. a button) below the text.
 */
export default function EmptyState({
  icon = 'cupcake',
  title,
  message,
  action = null,
}) {
  const { colors, spacing, typography } = useTheme();
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: colors.primarySoft },
        ]}
      >
        <MaterialCommunityIcons name={icon} size={34} color={colors.primary} />
      </View>
      <Text
        style={[
          typography.heading,
          { color: colors.text, marginTop: spacing.lg, textAlign: 'center' },
        ]}
      >
        {title}
      </Text>
      {message ? (
        <Text
          style={[
            typography.body,
            {
              color: colors.textMuted,
              marginTop: spacing.sm,
              textAlign: 'center',
              lineHeight: 21,
              maxWidth: 300,
            },
          ]}
        >
          {message}
        </Text>
      ) : null}
      {action ? <View style={{ marginTop: spacing.xl }}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  iconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
