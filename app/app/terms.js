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

export default function Terms() {
  const { colors, typography, isDark } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ marginLeft: -6 }}>
          <MaterialCommunityIcons name="close" size={26} color={colors.text} />
        </Pressable>
        <Text style={[typography.heading, { color: colors.text }]}>Terms of Service</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        <Text style={[typography.caption, { color: colors.textFaint }]}>Last updated: 2026</Text>

        <Section title="Acceptance">
          By creating an account or using King Cake Finder, you agree to these
          Terms of Service and to our Privacy Policy. If you don't agree, please
          don't use the app.
        </Section>

        <Section title="Who can use King Cake Finder">
          You must be old enough to form a binding agreement in your location and
          meet the minimum age of the app store you downloaded from. You're
          responsible for keeping your account secure and for activity under it.
        </Section>

        <Section title="Community rules — zero tolerance">
          King Cake Finder has zero tolerance for objectionable content or abusive
          behavior. You agree not to post reviews or content that are unlawful,
          hateful, harassing, threatening, sexually explicit, defamatory, spam, or
          that infringe others' rights. Every review is automatically screened
          before publishing, you can report any review, and we may remove content,
          and suspend or terminate accounts, at our discretion. We aim to act on
          reports of objectionable content promptly (within 24 hours).
        </Section>

        <Section title="Your content">
          You keep ownership of what you post, but you grant us a license to
          display and distribute it within the service. Reviews and ratings are
          the personal opinions of the people who wrote them — not ours — and we
          don't verify their accuracy.
        </Section>

        <Section title="Food, allergens & health disclaimer">
          King Cake Finder is a discovery and listing service. We do not make,
          handle, sell, inspect, or guarantee any food, and we're not responsible
          for what any bakery sells or serves. IMPORTANT: many king cakes contain
          a small plastic baby, bean, or trinket baked or placed inside, which is
          a choking hazard — cut and eat carefully and keep pieces away from young
          children. King cakes commonly contain allergens including wheat/gluten,
          eggs, and dairy, and may contain or be prepared near nuts, soy, and
          others. Some listings are home bakers who may not be licensed or
          inspected. Always confirm ingredients and allergens directly with the
          bakery. You purchase and consume food at your own risk.
        </Section>

        <Section title="Listing accuracy — hours, prices & availability">
          King Cake Finder does not operate, manage, or guarantee the accuracy of
          any bakery's inventory, pricing, or hours. Prices, variations, and hours
          shown are submitted by bakery owners or the community and can change
          without notice — especially during peak Mardi Gras season, when king
          cakes commonly sell out. We cannot guarantee that a bakery will have
          king cakes available when you arrive, that listed prices are current,
          or that posted hours are accurate. Always call ahead before visiting.
        </Section>

        <Section title="No warranty & limitation of liability">
          The app is provided "as is" without warranties of any kind. To the
          fullest extent allowed by law, King Cake Finder is not liable for any
          injury, illness, allergic reaction, or other loss arising from food you
          buy or eat, from bakery listings, or from your use of the app.
        </Section>

        <Section title="Changes & termination">
          We may update these terms or the app over time; continued use means you
          accept the changes. We may suspend or end access for violations of these
          terms. You can delete your account any time in Settings → Delete account.
        </Section>

        <Section title="Contact">
          Questions about these terms? Contact our support team right in the app —
          we'll reply in your inbox.
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
