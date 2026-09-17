import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter, useFocusEffect, Redirect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import Screen from '@/src/components/Screen';
import Card from '@/src/components/Card';
import { useTheme } from '@/src/context/ThemeContext';
import { useAuth } from '@/src/context/AuthContext';
import { useData } from '@/src/context/DataContext';
import { getModerationQueue } from '@/src/services/moderation';
import { getOpenTicketCount } from '@/src/services/support';
import { seedSampleBakeries } from '@/src/services/seed';
import { setAppBadgeCount } from '@/src/utils/pushNotifications';
import { getSponsorClickCount } from '@/src/utils/analytics';

function ActionCard({ icon, title, subtitle, onPress, tint, badge }) {
  const { colors, spacing, typography } = useTheme();
  return (
    <Card onPress={onPress} style={{ marginBottom: spacing.md }}>
      <View style={styles.row}>
        <View style={[styles.icon, { backgroundColor: tint || colors.primarySoft }]}>
          <MaterialCommunityIcons name={icon} size={22} color={colors.primary} />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={[typography.heading, { color: colors.text }]}>{title}</Text>
          <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>{subtitle}</Text>
        </View>
        {typeof badge === 'number' && badge > 0 ? (
          <View style={[styles.badge, { backgroundColor: colors.danger }]}>
            <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        ) : (
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textFaint} />
        )}
      </View>
    </Card>
  );
}

export default function AdminDashboard() {
  const { colors, spacing, typography } = useTheme();
  const { isSuperuser, user } = useAuth();
  const { bakeries, refreshBakeries } = useData();
  const router = useRouter();

  const [queueCount, setQueueCount] = useState(0);
  const [supportCount, setSupportCount] = useState(0);
  const [sponsorClicks, setSponsorClicks] = useState(0);
  const [seeding, setSeeding] = useState(false);

  // Also syncs the app icon badge to the combined total whenever this screen
  // regains focus — e.g. after resolving items, the badge count drops to
  // match without needing a push to arrive first.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (isSuperuser) {
        Promise.all([
          getModerationQueue().catch(() => []),
          getOpenTicketCount().catch(() => 0),
        ]).then(([queue, supportOpen]) => {
          if (!active) return;
          setQueueCount(queue.length);
          setSupportCount(supportOpen);
          setAppBadgeCount(queue.length + supportOpen);
        });
        getSponsorClickCount()
          .then((n) => active && setSponsorClicks(n))
          .catch(() => {});
      }
      return () => {
        active = false;
      };
    }, [isSuperuser])
  );

  // Belt-and-suspenders: a non-superuser can never reach this screen. The tab is
  // removed from the layout AND the security rules block the writes, but we also
  // redirect here.
  if (!isSuperuser) {
    return <Redirect href="/(tabs)" />;
  }

  const runSeed = () => {
    Alert.alert(
      'Add sample bakeries?',
      'This adds a handful of demo king-cake bakeries so you can try the app. You can edit or delete them anytime.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add samples',
          onPress: async () => {
            setSeeding(true);
            try {
              const n = await seedSampleBakeries();
              await refreshBakeries();
              Alert.alert('Done', `Added ${n} sample bakeries.`);
            } catch (e) {
              Alert.alert('Could not add samples', e.message || 'Please try again.');
            } finally {
              setSeeding(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Screen scroll contentStyle={{ padding: 20, paddingBottom: 40 }}>
      <View style={styles.headerRow}>
        <View style={[styles.crown, { backgroundColor: colors.goldSoft }]}>
          <MaterialCommunityIcons name="shield-crown" size={20} color={colors.gold} />
        </View>
        <Text style={[typography.caption, { color: colors.gold, marginLeft: 8 }]}>SUPERUSER</Text>
      </View>
      <Text style={[typography.display, { color: colors.text, marginTop: spacing.sm }]}>Admin</Text>
      <Text style={[typography.small, { color: colors.textMuted, marginTop: 2, marginBottom: spacing.xl }]}>
        Manage bakeries and moderate reviews
      </Text>

      <ActionCard
        icon="flag-outline"
        title="Moderation queue"
        subtitle={queueCount > 0 ? `${queueCount} item${queueCount === 1 ? '' : 's'} need review` : 'No items pending'}
        onPress={() => router.push('/admin/moderation')}
        badge={queueCount}
      />
      <ActionCard
        icon="plus-box-outline"
        title="Add a bakery"
        subtitle="Create a new king-cake listing"
        onPress={() => router.push('/admin/add-bakery')}
      />
      <ActionCard
        icon="store-outline"
        title="Manage bakeries"
        subtitle={`Edit or remove — ${bakeries.length} total`}
        onPress={() => router.push('/admin/manage')}
      />
      <ActionCard
        icon="lifebuoy"
        title="Support requests"
        subtitle={supportCount > 0 ? `${supportCount} open request${supportCount === 1 ? '' : 's'}` : 'No open requests'}
        onPress={() => router.push('/admin/support')}
        badge={supportCount}
      />

      <Text style={[typography.subheading, { color: colors.textMuted, marginTop: spacing.lg, marginBottom: 10, letterSpacing: 0.5 }]}>
        ANALYTICS
      </Text>
      <ActionCard
        icon="knife"
        title="kingcakeknives.com clicks"
        subtitle={`${sponsorClicks} click${sponsorClicks === 1 ? '' : 's'} on the sponsor banner (app + website)`}
        tint={colors.goldSoft}
      />

      <Text style={[typography.subheading, { color: colors.textMuted, marginTop: spacing.lg, marginBottom: 10, letterSpacing: 0.5 }]}>
        UTILITIES
      </Text>
      <ActionCard
        icon="database-plus-outline"
        title={seeding ? 'Adding samples…' : 'Add sample bakeries'}
        subtitle="Populate demo data to try things out"
        tint={colors.greenSoft}
        onPress={seeding ? undefined : runSeed}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  crown: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  badge: { minWidth: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
});
