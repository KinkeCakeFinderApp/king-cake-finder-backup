import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeContext';

function Section({ title, children }) {
  const { colors, typography, spacing } = useTheme();
  return (
    <View style={{ marginTop: spacing.xl }}>
      <Text style={[typography.heading, { color: colors.text, marginBottom: 8 }]}>{title}</Text>
      <Text style={[typography.body, { color: colors.textMuted, lineHeight: 22 }]}>{children}</Text>
    </View>
  );
}

export default function PrivacyPolicy() {
  const { colors, typography, spacing, isDark } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ marginLeft: -6 }}>
          <MaterialCommunityIcons name="close" size={26} color={colors.text} />
        </Pressable>
        <Text style={[typography.heading, { color: colors.text }]}>Privacy Policy</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        <Text style={[typography.caption, { color: colors.textFaint }]}>Last updated: 2026</Text>

        <Section title="Overview">
          King Cake Finder helps you discover, rate, and save king-cake bakeries.
          This policy explains what we collect and how it’s used. We keep data
          collection to the minimum needed to run the app.
        </Section>

        <Section title="Information we collect">
          When you create an account we store your username, first and last name,
          and email address. When you write reviews we store the review text,
          your rating, and the timestamp. We also store your list of favorited
          bakeries and your app preferences (theme, notifications).
        </Section>

        <Section title="Location">
          With your permission, the app reads your device’s location to show the
          distance to nearby bakeries and to sort results by proximity. Your
          location is used on-device only and is never uploaded or shared. You
          can deny or revoke this permission at any time — the app still works,
          you just won’t see distances.
        </Section>

        <Section title="User-generated content & moderation">
          Reviews are public. To keep content PG, every review is automatically
          screened before it’s published, and flagged content is held for human
          moderation. You can report any review you find inappropriate. Our
          moderators can edit, remove, or hold reviews, and may message you about
          content that was flagged.
        </Section>

        <Section title="How we use your data">
          We use your information to operate the app: to authenticate you,
          display your reviews and favorites, compute distances, and moderate
          content. We don't sell your personal data, and we never use your
          personal data to target advertising.
        </Section>

        <Section title="Advertising & sponsored content">
          The app shows clearly-labeled sponsored placements — for example a
          "Sponsored by" banner and sponsored bakery slots. These are chosen by
          us, are the same for everyone, and are not based on your personal data.
          The app does not use any third-party ad network or ad tracking. (Our
          companion website does show Google AdSense ads; see the website's
          privacy policy for how those cookies work.)
        </Section>

        <Section title="Data retention & deletion">
          You can delete your account at any time from Settings → Delete account.
          Deleting your account permanently removes your profile, your reviews,
          and your favorites, and updates affected bakery ratings accordingly.
        </Section>

        <Section title="Security">
          Data is stored in Google Firebase with access controlled by security
          rules: you can only read and write your own profile and your own
          reviews, and only moderators can manage bakery listings and moderate
          content.
        </Section>

        <Section title="Contact">
          Questions about your privacy or need help? Contact our support team
          right in the app — we'll reply in your inbox.
        </Section>

        <Pressable
          onPress={() => router.push('/support')}
          style={[styles.contact, { backgroundColor: colors.primarySoft }]}
        >
          <MaterialCommunityIcons name="lifebuoy" size={18} color={colors.primary} />
          <Text style={[typography.small, { color: colors.primary, marginLeft: 8, fontWeight: '700' }]}>
            Contact support
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  contact: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 20,
  },
});
