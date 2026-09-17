import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '@/src/context/ThemeContext';
import { useAuth } from '@/src/context/AuthContext';
import Card from '@/src/components/Card';
import EmptyState from '@/src/components/EmptyState';
import Loading from '@/src/components/Loading';
import { getMessages, markMessageRead } from '@/src/services/messages';
import { setAppBadgeCount } from '@/src/utils/pushNotifications';
import { timeAgo } from '@/src/utils/format';

export default function Inbox() {
  const { colors, spacing, typography, radius, isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const list = await getMessages(user.uid);
      setMessages(list);
      // Mark unread items as read now that they've been seen.
      const unread = list.filter((m) => !m.read);
      await Promise.all(unread.map((m) => markMessageRead(user.uid, m.id).catch(() => {})));
      if (unread.length > 0) setAppBadgeCount(0).catch(() => {});
    } catch (e) {
      setMessages([]);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      load().finally(() => active && setLoading(false));
      return () => {
        active = false;
      };
    }, [load])
  );

  const renderItem = ({ item }) => (
    <Card style={{ marginBottom: spacing.md }}>
      <View style={styles.row}>
        <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
          <MaterialCommunityIcons name="shield-account-outline" size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <View style={styles.headerRow}>
            <Text style={[typography.bodyStrong, { color: colors.text }]}>Moderator</Text>
            {!item.read ? <View style={[styles.unreadDot, { backgroundColor: colors.danger }]} /> : null}
          </View>
          <Text style={[typography.body, { color: colors.text, marginTop: 4, lineHeight: 21 }]}>
            {item.body}
          </Text>
          <Text style={[typography.caption, { color: colors.textFaint, marginTop: 8 }]}>
            {timeAgo(item.createdAt)}
          </Text>
        </View>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ marginLeft: -6 }}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
        </Pressable>
        <Text style={[typography.heading, { color: colors.text }]}>Inbox</Text>
        <View style={{ width: 28 }} />
      </View>

      {loading ? (
        <Loading label="Loading messages…" />
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ height: 360 }}>
              <EmptyState
                icon="email-outline"
                title="No messages"
                message="Messages from moderators about your reviews will show up here."
              />
            </View>
          }
        />
      )}
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
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  unreadDot: { width: 9, height: 9, borderRadius: 5 },
});
