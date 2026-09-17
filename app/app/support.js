import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '@/src/context/ThemeContext';
import { useAuth } from '@/src/context/AuthContext';
import TextField from '@/src/components/TextField';
import Button from '@/src/components/Button';
import { createSupportTicket } from '@/src/services/support';
import { isNonEmpty } from '@/src/utils/validation';

/**
 * In-app "Contact support" form. Requests go to the superuser support queue in
 * the Admin tab; replies come back to the user's inbox.
 */
export default function Support() {
  const { colors, spacing, typography, isDark } = useTheme();
  const { user, profile } = useAuth();
  const router = useRouter();

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    const e = {};
    if (!isNonEmpty(subject)) e.subject = 'Add a short subject.';
    if (!isNonEmpty(body)) e.body = 'Tell us how we can help.';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setSending(true);
    try {
      await createSupportTicket({
        uid: user.uid,
        username: profile?.username,
        email: profile?.email,
        subject,
        body,
        pushToken: profile?.pushToken,
      });
      Alert.alert(
        'Message sent',
        "Thanks! Our team will get back to you in your inbox.",
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err) {
      Alert.alert('Could not send', err.message || 'Please try again in a moment.');
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ marginLeft: -6 }}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
        </Pressable>
        <Text style={[typography.heading, { color: colors.text }]}>Contact support</Text>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.intro, { backgroundColor: colors.primarySoft }]}>
            <MaterialCommunityIcons name="lifebuoy" size={22} color={colors.primary} />
            <Text style={[typography.small, { color: colors.text, marginLeft: 10, flex: 1, lineHeight: 19 }]}>
              Have a question or a problem? Send us a message and we'll reply
              right in your app inbox.
            </Text>
          </View>

          <View style={{ height: spacing.lg }} />

          <TextField
            label="Subject"
            value={subject}
            onChangeText={setSubject}
            placeholder="e.g. I can't see my reviews"
            autoCapitalize="sentences"
            icon="tag-outline"
            error={errors.subject}
          />

          <TextField
            label="How can we help?"
            value={body}
            onChangeText={setBody}
            placeholder="Describe what's going on…"
            multiline
            autoCapitalize="sentences"
            icon="message-text-outline"
            error={errors.body}
          />

          <Text style={[typography.caption, { color: colors.textFaint, marginBottom: spacing.lg }]}>
            Sent from {profile?.email || 'your account'}. We'll reply in your inbox.
          </Text>

          <Button title="Send message" icon="send" onPress={handleSend} loading={sending} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  intro: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
  },
});
