import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/src/context/ThemeContext';

export default function Loading({ label = 'Loading…' }) {
  const { colors, spacing, typography } = useTheme();
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      {label ? (
        <Text
          style={[
            typography.small,
            { color: colors.textMuted, marginTop: spacing.md },
          ]}
        >
          {label}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
});
