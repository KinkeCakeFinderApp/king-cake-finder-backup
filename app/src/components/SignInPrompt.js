import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeContext';
import Button from '@/src/components/Button';

/**
 * Shown to guests where an account is required (write a review, save favorites,
 * see your history, contact support). Offers to log in or create an account —
 * both routes lead into the (auth) group, which a guest is allowed to visit.
 */
export default function SignInPrompt({
  icon = 'account-circle-outline',
  title = 'Sign in to continue',
  message = 'Create a free account or log in to use this feature.',
  style,
}) {
  const { colors, spacing, typography, radius } = useTheme();
  const router = useRouter();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radius.lg },
        style,
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft }]}>
        <MaterialCommunityIcons name={icon} size={26} color={colors.primary} />
      </View>
      <Text style={[typography.heading, { color: colors.text, marginTop: spacing.md, textAlign: 'center' }]}>
        {title}
      </Text>
      <Text
        style={[
          typography.small,
          { color: colors.textMuted, marginTop: 6, textAlign: 'center', lineHeight: 20, maxWidth: 300 },
        ]}
      >
        {message}
      </Text>

      <View style={{ width: '100%', marginTop: spacing.lg }}>
        <Button
          title="Create an account"
          icon="account-plus-outline"
          onPress={() => router.push('/(auth)/signup')}
        />
        <View style={{ height: spacing.sm }} />
        <Button
          title="I already have an account"
          variant="ghost"
          onPress={() => router.push('/(auth)/login')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: 22,
    alignItems: 'center',
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
