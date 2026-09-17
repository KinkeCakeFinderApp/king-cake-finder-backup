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
import { useData } from '@/src/context/DataContext';
import Card from '@/src/components/Card';
import Button from '@/src/components/Button';
import EmptyState from '@/src/components/EmptyState';
import Loading from '@/src/components/Loading';
import KingCakeRating from '@/src/components/KingCakeRating';
import {
  getModerationQueue,
  approveReview,
  rejectReview,
  dismissQueueEntry,
  messageAuthor,
} from '@/src/services/moderation';
import { getBakery } from '@/src/services/bakeries';
import { formatDate } from '@/src/utils/format';
import { REVIEW_MAX_CHARS } from '@/src/config/appConfig';

export default function Moderation() {
  const { colors, spacing, typography, radius, isDark } = useTheme();
  const { isSuperuser } = useAuth();
  const { getBakeryById, applyBakeryPatch } = useData();
  const router = useRouter();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState({}); // queueId -> edited text
  const [busyId, setBusyId] = useState(null);

  const [msgTarget, setMsgTarget] = useState(null);
  const [msgBody, setMsgBody] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const q = await getModerationQueue();
      setItems(q);
      const initialDrafts = {};
      q.forEach((it) => {
        initialDrafts[it.id] = it.originalText || '';
      });
      setDrafts(initialDrafts);
    } catch (e) {
      setItems([]);
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

  const refreshBakeryRating = async (bakeryId) => {
    const fresh = await getBakery(bakeryId).catch(() => null);
    if (fresh) applyBakeryPatch(bakeryId, { avgRating: fresh.avgRating, ratingCount: fresh.ratingCount });
  };

  const handleApprove = async (item) => {
    setBusyId(item.id);
    try {
      await approveReview({
        bakeryId: item.bakeryId,
        authorUid: item.authorUid,
        rating: item.rating,
        text: drafts[item.id],
        queueDocId: item.id,
      });
      await refreshBakeryRating(item.bakeryId);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (e) {
      Alert.alert('Could not publish', e.message || 'Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = (item) => {
    Alert.alert('Delete this review?', 'It will be permanently removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setBusyId(item.id);
          try {
            await rejectReview({
              bakeryId: item.bakeryId,
              authorUid: item.authorUid,
              queueDocId: item.id,
            });
            await refreshBakeryRating(item.bakeryId);
            setItems((prev) => prev.filter((i) => i.id !== item.id));
          } catch (e) {
            Alert.alert('Could not delete', e.message || 'Please try again.');
          } finally {
            setBusyId(null);
          }
        },
      },
    ]);
  };

  const handleDismiss = async (item) => {
    setBusyId(item.id);
    try {
      await dismissQueueEntry(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (e) {
      Alert.alert('Could not dismiss', e.message || 'Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const openMessage = (item) => {
    setMsgTarget(item);
    setMsgBody(
      `Hi ${item.authorUsername || 'there'}, your review of a bakery was flagged by our filter (${item.reason || 'inappropriate content'}). `
    );
  };

  const sendMessage = async () => {
    if (!msgTarget || !msgBody.trim()) return;
    setSending(true);
    try {
      await messageAuthor({
        toUid: msgTarget.authorUid,
        body: msgBody.trim(),
        relatedReviewId: msgTarget.id,
      });
      setMsgTarget(null);
      setMsgBody('');
      Alert.alert('Message sent', 'The author will see it in their inbox.');
    } catch (e) {
      Alert.alert('Could not send', e.message || 'Please try again.');
    } finally {
      setSending(false);
    }
  };

  const renderItem = ({ item }) => {
    const bakery = getBakeryById(item.bakeryId);
    const isReport = item.reason === 'Reported by a user';
    const busy = busyId === item.id;
    return (
      <Card style={{ marginBottom: spacing.md }}>
        <View style={styles.topRow}>
          <View style={[styles.reasonTag, { backgroundColor: isReport ? colors.goldSoft : colors.dangerSoft }]}>
            <MaterialCommunityIcons
              name={isReport ? 'flag-outline' : 'alert-outline'}
              size={13}
              color={isReport ? colors.gold : colors.danger}
            />
            <Text style={[typography.caption, { color: isReport ? colors.gold : colors.danger, marginLeft: 4 }]}>
              {item.reason || 'Flagged'}
            </Text>
          </View>
          <Text style={[typography.caption, { color: colors.textFaint }]}>{formatDate(item.createdAt)}</Text>
        </View>

        <Text style={[typography.small, { color: colors.textMuted, marginTop: spacing.md }]}>
          <Text style={{ fontWeight: '700', color: colors.text }}>@{item.authorUsername || 'user'}</Text>
          {' · '}
          {bakery ? bakery.name : 'Unknown bakery'}
        </Text>

        <View style={{ marginTop: 6 }}>
          <KingCakeRating value={item.rating} size={14} />
        </View>

        <Text style={[typography.caption, { color: colors.textFaint, marginTop: spacing.md, textTransform: 'uppercase' }]}>
          Review text (editable)
        </Text>
        <View style={[styles.editBox, { backgroundColor: colors.inputBg, borderColor: colors.border, borderRadius: radius.md }]}>
          <TextInput
            style={[typography.body, { color: colors.text, minHeight: 60, textAlignVertical: 'top' }]}
            value={drafts[item.id]}
            onChangeText={(t) => setDrafts((d) => ({ ...d, [item.id]: t.slice(0, REVIEW_MAX_CHARS) }))}
            multiline
            maxLength={REVIEW_MAX_CHARS}
          />
        </View>

        <View style={styles.actionsGrid}>
          <View style={{ flex: 1 }}>
            <Button title="Approve & publish" icon="check" size="sm" onPress={() => handleApprove(item)} loading={busy} />
          </View>
        </View>
        <View style={[styles.actionsRow, { marginTop: 8 }]}>
          <Pressable
            onPress={() => handleReject(item)}
            disabled={busy}
            style={[styles.smallBtn, { borderColor: colors.dangerSoft, backgroundColor: colors.dangerSoft, borderRadius: radius.md }]}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.danger} />
            <Text style={[typography.caption, { color: colors.danger, marginLeft: 5 }]}>Delete</Text>
          </Pressable>
          <Pressable
            onPress={() => openMessage(item)}
            disabled={busy}
            style={[styles.smallBtn, { borderColor: colors.border, borderRadius: radius.md }]}
          >
            <MaterialCommunityIcons name="message-outline" size={16} color={colors.primary} />
            <Text style={[typography.caption, { color: colors.primary, marginLeft: 5 }]}>Message</Text>
          </Pressable>
          {isReport ? (
            <Pressable
              onPress={() => handleDismiss(item)}
              disabled={busy}
              style={[styles.smallBtn, { borderColor: colors.border, borderRadius: radius.md }]}
            >
              <MaterialCommunityIcons name="close" size={16} color={colors.textMuted} />
              <Text style={[typography.caption, { color: colors.textMuted, marginLeft: 5 }]}>Dismiss</Text>
            </Pressable>
          ) : null}
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
        <Text style={[typography.heading, { color: colors.text }]}>Moderation queue</Text>
        <View style={{ width: 28 }} />
      </View>

      {loading ? (
        <Loading label="Loading queue…" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ height: 340 }}>
              <EmptyState
                icon="check-decagram-outline"
                title="All clear"
                message="No flagged or reported reviews right now. Nice and PG."
              />
            </View>
          }
        />
      )}

      {/* Message author modal */}
      <Modal visible={!!msgTarget} transparent animationType="fade" onRequestClose={() => setMsgTarget(null)}>
        <View style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[typography.heading, { color: colors.text }]}>
                Message @{msgTarget?.authorUsername || 'user'}
              </Text>
              <Pressable onPress={() => setMsgTarget(null)} hitSlop={10}>
                <MaterialCommunityIcons name="close" size={22} color={colors.textMuted} />
              </Pressable>
            </View>
            <Text style={[typography.small, { color: colors.textMuted, marginBottom: 12 }]}>
              Explain what was wrong. This lands in their inbox.
            </Text>
            <View style={[styles.editBox, { backgroundColor: colors.inputBg, borderColor: colors.border, borderRadius: radius.md }]}>
              <TextInput
                style={[typography.body, { color: colors.text, minHeight: 90, textAlignVertical: 'top' }]}
                value={msgBody}
                onChangeText={setMsgBody}
                multiline
                placeholder="Write your message…"
                placeholderTextColor={colors.textFaint}
              />
            </View>
            <View style={{ marginTop: 14 }}>
              <Button title="Send message" icon="send" onPress={sendMessage} loading={sending} />
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
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reasonTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  editBox: { borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 10, marginTop: 6 },
  actionsGrid: { flexDirection: 'row', marginTop: 14 },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  smallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    paddingHorizontal: 12,
    height: 38,
  },
  modalBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 420, borderRadius: 22, padding: 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
});
