import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter, useFocusEffect, Redirect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '@/src/context/ThemeContext';
import { useAuth } from '@/src/context/AuthContext';
import Card from '@/src/components/Card';
import Button from '@/src/components/Button';
import EmptyState from '@/src/components/EmptyState';
import Loading from '@/src/components/Loading';
import { getOpenTickets, resolveTicket } from '@/src/services/support';
import { sendMessage, getUnreadCount } from '@/src/services/messages';
import { sendPushNotification } from '@/src/utils/pushNotifications';
import { formatDate } from '@/src/utils/format';

export default function AdminSupport() {
  const { colors, spacing, typography, radius, isDark } = useTheme();
  const { isSuperuser } = useAuth();
  const router = useRouter();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const [replyTarget, setReplyTarget] = useState(null);
  const [replyBody, setReplyBody] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      setTickets(await getOpenTickets());
    } catch (e) {
      setTickets([]);
    }
  }, []);

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

  if (!isSuperuser) return <Redirect href="/(tabs)" />;

  const handleResolve = async (ticket) => {
    setBusyId(ticket.id);
    try {
      await resolveTicket(ticket.id);
      setTickets((prev) => prev.filter((t) => t.id !== ticket.id));
    } catch (e) {
      Alert.alert('Could not resolve', e.message || 'Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const openReply = (ticket) => {
    setReplyTarget(ticket);
    setReplyBody(`Hi ${ticket.fromUsername || 'there'}, thanks for reaching out. `);
  };

  const sendReply = async (alsoResolve) => {
    if (!replyTarget || !replyBody.trim()) return;
    setSending(true);
    try {
      await sendMessage({
        toUid: replyTarget.fromUid,
        body: replyBody.trim(),
        relatedReviewId: null,
      });
      getUnreadCount(replyTarget.fromUid)
        .catch(() => undefined)
        .then((count) =>
          sendPushNotification(
            replyTarget.pushToken,
            'Support reply',
            replyBody.trim(),
            { type: 'support_reply' },
            count
          )
        )
        .catch(() => {});
      if (alsoResolve) {
        await resolveTicket(replyTarget.id).catch(() => {});
        setTickets((prev) => prev.filter((t) => t.id !== replyTarget.id));
      }
      setReplyTarget(null);
      setReplyBody('');
      Alert.alert('Reply sent', 'It landed in their inbox.');
    } catch (e) {
      Alert.alert('Could not send', e.message || 'Please try again.');
    } finally {
      setSending(false);
    }
  };

  const renderItem = ({ item }) => {
    const busy = busyId === item.id;
    return (
      <Card style={{ marginBottom: spacing.md }}>
        <View style={styles.topRow}>
          <Text style={[typography.heading, { color: colors.text, flex: 1, paddingRight: 8 }]} numberOfLines={2}>
            {item.subject || '(no subject)'}
          </Text>
          <Text style={[typography.caption, { color: colors.textFaint }]}>{formatDate(item.createdAt)}</Text>
        </View>

        <Text style={[typography.small, { color: colors.textMuted, marginTop: 4 }]}>
          <Text style={{ fontWeight: '700', color: colors.text }}>@{item.fromUsername || 'user'}</Text>
          {item.email ? ` · ${item.email}` : ''}
        </Text>

        <Text style={[typography.body, { color: colors.text, marginTop: spacing.md, lineHeight: 21 }]}>
          {item.body}
        </Text>

        <View style={[styles.actionsRow, { marginTop: spacing.lg }]}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Button title="Reply" icon="reply" size="sm" onPress={() => openReply(item)} disabled={busy} />
          </View>
          <Pressable
            onPress={() => handleResolve(item)}
            disabled={busy}
            style={[styles.resolveBtn, { borderColor: colors.border, borderRadius: radius.md }]}
          >
            <MaterialCommunityIcons name="check" size={17} color={colors.green} />
            <Text style={[typography.small, { color: colors.text, marginLeft: 6, fontWeight: '700' }]}>
              {busy ? '…' : 'Resolve'}
            </Text>
          </Pressable>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ marginLeft: -6 }}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
        </Pressable>
        <Text style={[typography.heading, { color: colors.text }]}>Support requests</Text>
        <View style={{ width: 28 }} />
      </View>

      {loading ? (
        <Loading label="Loading requests…" />
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ height: 340 }}>
              <EmptyState
                icon="lifebuoy"
                title="No open requests"
                message="When users contact support, their messages show up here."
              />
            </View>
          }
        />
      )}

      {/* Reply modal */}
      <Modal visible={!!replyTarget} transparent animationType="fade" onRequestClose={() => setReplyTarget(null)}>
        <View style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[typography.heading, { color: colors.text }]}>
                Reply to @{replyTarget?.fromUsername || 'user'}
              </Text>
              <Pressable onPress={() => setReplyTarget(null)} hitSlop={10}>
                <MaterialCommunityIcons name="close" size={22} color={colors.textMuted} />
              </Pressable>
            </View>
            {replyTarget?.subject ? (
              <Text style={[typography.small, { color: colors.textMuted, marginBottom: 10 }]}>
                Re: {replyTarget.subject}
              </Text>
            ) : null}
            <View style={[styles.editBox, { backgroundColor: colors.inputBg, borderColor: colors.border, borderRadius: radius.md }]}>
              <TextInput
                style={[typography.body, { color: colors.text, minHeight: 100, textAlignVertical: 'top' }]}
                value={replyBody}
                onChangeText={setReplyBody}
                multiline
                placeholder="Write your reply…"
                placeholderTextColor={colors.textFaint}
              />
            </View>
            <View style={{ marginTop: 14 }}>
              <Button title="Send & resolve" icon="check-all" onPress={() => sendReply(true)} loading={sending} />
              <View style={{ height: 10 }} />
              <Button title="Send only" variant="ghost" onPress={() => sendReply(false)} disabled={sending} />
            </View>
          </View>
        </View>
      </Modal>
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
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  actionsRow: { flexDirection: 'row', alignItems: 'center' },
  resolveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    paddingHorizontal: 16,
    height: 40,
  },
  modalBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 420, borderRadius: 22, padding: 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  editBox: { borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 10, marginTop: 6 },
});
