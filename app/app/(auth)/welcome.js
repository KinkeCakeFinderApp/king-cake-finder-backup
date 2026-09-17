import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '@/src/components/Screen';
import Button from '@/src/components/Button';
import { useTheme } from '@/src/context/ThemeContext';
import { useAuth } from '@/src/context/AuthContext';

// Same artwork as the app icon, shown as the welcome logo (long-press for admin).
const LOGO = require('../../assets/icon.png');

export default function Welcome() {
  const { colors, spacing, typography } = useTheme();
  const { enterGuest } = useAuth();
  const router = useRouter();

  // Browse bakeries & reviews without an account; account-only actions prompt
  // a sign-in when tapped.
  const browseAsGuest = () => {
    enterGuest();
    router.replace('/(tabs)');
  };

  return (
    <Screen contentStyle={styles.container}>
      <View style={styles.hero}>
        <View style={styles.logo}>
          <Image source={LOGO} style={styles.logoImage} resizeMode="contain" />
        </View>

        <Text style={[typography.display, { color: colors.text, marginTop: spacing.xl, textAlign: 'center' }]}>
          King Cake Finder
        </Text>
        <Text
          style={[
            typography.body,
            { color: colors.textMuted, marginTop: spacing.sm, textAlign: 'center', lineHeight: 22, maxWidth: 300 },
          ]}
        >
          Find the best king cakes near you — rate them, review them, and never
          lose track of your favorites.
        </Text>

        <View style={styles.accentRow}>
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
          <View style={[styles.dot, { backgroundColor: colors.green }]} />
          <View style={[styles.dot, { backgroundColor: colors.gold }]} />
        </View>
      </View>

      <View style={styles.actions}>
        <Button title="Create an account" icon="account-plus-outline" onPress={() => router.push('/(auth)/signup')} />
        <View style={{ height: spacing.md }} />
        <Button title="I already have an account" variant="ghost" onPress={() => router.push('/(auth)/login')} />
        <Pressable onPress={browseAsGuest} hitSlop={10} style={styles.guestBtn}>
          <Text style={[typography.small, { color: colors.textMuted, fontWeight: '700' }]}>
            Browse without an account
          </Text>
          <MaterialCommunityIcons name="arrow-right" size={16} color={colors.textMuted} style={{ marginLeft: 4 }} />
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-between', padding: 24, paddingBottom: 40 },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: {
    width: 128,
    height: 128,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  accentRow: { flexDirection: 'row', marginTop: 28 },
  dot: { width: 10, height: 10, borderRadius: 5, marginHorizontal: 5 },
  actions: {},
  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    paddingVertical: 14,
    marginTop: 4,
  },
});
