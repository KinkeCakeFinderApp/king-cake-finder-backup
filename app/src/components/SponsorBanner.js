import React from 'react';
import { Pressable, Text, StyleSheet, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeContext';
import { trackSponsorClick } from '@/src/utils/analytics';

const SPONSOR_URL = 'https://kingcakeknives.com';

/**
 * Thin "Sponsored by kingcakeknives.com" bar shown at the top of the main
 * browsing screens. Tapping it opens the sponsor's site in the browser.
 */
export default function SponsorBanner({ style }) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel="Sponsored by kingcakeknives.com"
      onPress={() => {
        trackSponsorClick();
        Linking.openURL(SPONSOR_URL).catch(() => {});
      }}
      style={({ pressed }) => [styles.banner, { opacity: pressed ? 0.6 : 1 }, style]}
    >
      <MaterialCommunityIcons name="knife" size={30} color={colors.gold} />
      <Text style={[styles.label, { color: colors.text, marginLeft: 12 }]}>
        Sponsored by{' '}
        <Text style={{ fontWeight: '800', color: colors.primary }}>kingcakeknives.com</Text>
      </Text>
      <MaterialCommunityIcons
        name="open-in-new"
        size={20}
        color={colors.textFaint}
        style={{ marginLeft: 10 }}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  label: { fontSize: 19, fontWeight: '600' },
});
