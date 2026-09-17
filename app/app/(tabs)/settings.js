import React, { useState } from 'react';
import {
  View,
  Text,
  Switch,
  Pressable,
  StyleSheet,
  Alert,
  Modal,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import Screen from '@/src/components/Screen';
import Card from '@/src/components/Card';
import Button from '@/src/components/Button';
import TextField from '@/src/components/TextField';
import SignInPrompt from '@/src/components/SignInPrompt';
import { useTheme } from '@/src/context/ThemeContext';
import { useAuth } from '@/src/context/AuthContext';
import { useRequireAuth } from '@/src/hooks/useRequireAuth';
import { updateUserProfile } from '@/src/services/users';
import { friendlyAuthError } from '@/src/utils/validation';

function Row({ icon, title, subtitle, right, onPress, danger }) {
  const { colors, spacing, typography } = useTheme();
  const content = (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: danger ? colors.dangerSoft : colors.primarySoft }]}>
        <MaterialCommunityIcons name={icon} size={19} color={danger ? colors.danger : colors.primary} />
      </View>
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Text style={[typography.bodyStrong, { color: danger ? colors.danger : colors.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[typography.small, { color: colors.textMuted, marginTop: 1 }]}>{subtitle}</Text>
        ) : null}
      </View>
      {right}
    </View>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
        {content}
      </Pressable>
    );
  }
  return content;
}

export default function Settings() {
  const { colors, spacing, typography, mode, setThemeMode } = useTheme();
  const { user, profile, isSuperuser, logOut, deleteAccount, blockedUsers, unblockUser } = useAuth();
  const requireAuth = useRequireAuth();
  const router = useRouter();
  const isGuest = !user;

  const [savingNotif, setSavingNotif] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const notificationsEnabled = profile?.notificationsEnabled !== false;
  const isDark = mode === 'dark';

  const toggleNotifications = async (value) => {
    if (!user) return;
    setSavingNotif(true);
    try {
      await updateUserProfile(user.uid, { notificationsEnabled: value });
    } catch (e) {
      Alert.alert('Could not save', friendlyAuthError(e));
    } finally {
      setSavingNotif(false);
    }
  };

  const toggleTheme = async (value) => {
    const next = value ? 'dark' : 'light';
    setThemeMode(next);
    if (user) updateUserProfile(user.uid, { theme: next }).catch(() => {});
  };

  const confirmLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => logOut() },
    ]);
  };

  const handleDelete = async () => {
    setDeleteError(null);
    setDeleting(true);
    try {
      await deleteAccount(password);
      // Auth state clears -> root navigator returns to welcome.
    } catch (e) {
      setDeleteError(friendlyAuthError(e));
      setDeleting(false);
    }
  };

  return (
    <Screen scroll contentStyle={{ padding: 20, paddingBottom: 40 }}>
      <Text style={[typography.display, { color: colors.text, marginBottom: spacing.xs }]}>Settings</Text>
      <Text style={[typography.small, { color: colors.textMuted, marginBottom: spacing.xl }]}>
        Manage your account and preferences
      </Text>

      {/* Account summary — guests see a sign-in prompt instead */}
      {isGuest ? (
        <SignInPrompt
          icon="account-circle-outline"
          title="You're browsing as a guest"
          message="Log in or create a free account to write reviews, save favorites, and get support."
          style={{ marginBottom: spacing.lg }}
        />
      ) : (
        <Card style={{ marginBottom: spacing.lg }}>
          <View style={styles.profileRow}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {(profile?.firstName || profile?.username || '?').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={[typography.heading, { color: colors.text }]}>
                {profile ? `${profile.firstName} ${profile.lastName}` : '—'}
              </Text>
              <Text style={[typography.small, { color: colors.textMuted }]}>@{profile?.username}</Text>
              <Text style={[typography.small, { color: colors.textFaint, marginTop: 2 }]}>{profile?.email}</Text>
            </View>
            {isSuperuser ? (
              <View style={[styles.tag, { backgroundColor: colors.goldSoft }]}>
                <MaterialCommunityIcons name="shield-crown" size={13} color={colors.gold} />
                <Text style={[typography.caption, { color: colors.gold, marginLeft: 4 }]}>Admin</Text>
              </View>
            ) : null}
          </View>
        </Card>
      )}

      {/* Preferences */}
      <Text style={[typography.subheading, styles.section, { color: colors.textMuted }]}>PREFERENCES</Text>
      <Card style={{ marginBottom: spacing.lg }}>
        {/* Notifications require an account (they land in your inbox). */}
        {isGuest ? null : (
          <>
            <Row
              icon="bell-outline"
              title="Notifications"
              subtitle="Moderation replies & updates in your inbox"
              right={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={toggleNotifications}
                  disabled={savingNotif}
                  trackColor={{ true: colors.primary, false: colors.border }}
                  thumbColor="#fff"
                />
              }
            />
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          </>
        )}
        <Row
          icon={isDark ? 'weather-night' : 'white-balance-sunny'}
          title="Dark theme"
          subtitle="Switch between light and dark"
          right={
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor="#fff"
            />
          }
        />
      </Card>

      {/* About / compliance */}
      <Text style={[typography.subheading, styles.section, { color: colors.textMuted }]}>ABOUT</Text>
      <Card style={{ marginBottom: spacing.lg }}>
        <Row
          icon="information-outline"
          title="About King Cake Finder"
          subtitle="Our story & FAQs, on the website"
          right={<MaterialCommunityIcons name="open-in-new" size={20} color={colors.textFaint} />}
          onPress={() => Linking.openURL('https://king-cake-app.web.app/about')}
        />
        <View style={[styles.divider, { backgroundColor: colors.divider }]} />
        <Row
          icon="shield-lock-outline"
          title="Privacy policy"
          subtitle="How your data is used"
          right={<MaterialCommunityIcons name="chevron-right" size={22} color={colors.textFaint} />}
          onPress={() => router.push('/privacy-policy')}
        />
        <View style={[styles.divider, { backgroundColor: colors.divider }]} />
        <Row
          icon="file-document-outline"
          title="Terms of Service"
          subtitle="The rules for using King Cake Finder"
          right={<MaterialCommunityIcons name="chevron-right" size={22} color={colors.textFaint} />}
          onPress={() => router.push('/terms')}
        />
        {/* Inbox is account-only. */}
        {isGuest ? null : (
          <>
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            <Row
              icon="message-alert-outline"
              title="Your inbox"
              subtitle="Replies from our team & moderators"
              right={<MaterialCommunityIcons name="chevron-right" size={22} color={colors.textFaint} />}
              onPress={() => router.push('/inbox')}
            />
          </>
        )}
        <View style={[styles.divider, { backgroundColor: colors.divider }]} />
        <Row
          icon="lifebuoy"
          title="Contact support"
          subtitle="Get help — we reply in your inbox"
          right={<MaterialCommunityIcons name="chevron-right" size={22} color={colors.textFaint} />}
          onPress={() => {
            // Support tickets are tied to an account, so guests sign in first.
            if (!requireAuth('Log in or create an account to contact support.')) return;
            router.push('/support');
          }}
        />
      </Card>

      {/* Blocked users — only shown when the signed-in user has blocked someone */}
      {!isGuest && blockedUsers.length > 0 ? (
        <>
          <Text style={[typography.subheading, styles.section, { color: colors.textMuted }]}>BLOCKED USERS</Text>
          <Card style={{ marginBottom: spacing.lg }}>
            {blockedUsers.map((b, i) => (
              <View key={b.uid}>
                {i > 0 ? <View style={[styles.divider, { backgroundColor: colors.divider }]} /> : null}
                <View style={styles.row}>
                  <View style={[styles.rowIcon, { backgroundColor: colors.primarySoft }]}>
                    <MaterialCommunityIcons name="account-cancel-outline" size={19} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={[typography.bodyStrong, { color: colors.text }]}>{b.username || 'user'}</Text>
                    <Text style={[typography.small, { color: colors.textMuted, marginTop: 1 }]}>
                      Their reviews are hidden from you
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => unblockUser(b).catch(() => {})}
                    hitSlop={8}
                    style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                  >
                    <Text style={[typography.small, { color: colors.primary, fontWeight: '700' }]}>Unblock</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      {/* Account actions */}
      <Text style={[typography.subheading, styles.section, { color: colors.textMuted }]}>ACCOUNT</Text>
      {isGuest ? (
        <Card style={{ marginBottom: spacing.lg }}>
          <Row
            icon="login"
            title="Log in or create account"
            subtitle="Unlock reviews, favorites & support"
            right={<MaterialCommunityIcons name="chevron-right" size={22} color={colors.textFaint} />}
            onPress={() => router.push('/(auth)/welcome')}
          />
        </Card>
      ) : (
        <Card style={{ marginBottom: spacing.lg }}>
          <Row
            icon="logout"
            title="Log out"
            right={<MaterialCommunityIcons name="chevron-right" size={22} color={colors.textFaint} />}
            onPress={confirmLogout}
          />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <Row
            icon="trash-can-outline"
            title="Delete account"
            subtitle="Permanently remove your account & data"
            danger
            right={<MaterialCommunityIcons name="chevron-right" size={22} color={colors.danger} />}
            onPress={() => {
              setPassword('');
              setDeleteError(null);
              setDeleteVisible(true);
            }}
          />
        </Card>
      )}

      <Text style={[typography.caption, { color: colors.textFaint, textAlign: 'center', marginTop: spacing.md }]}>
        King Cake Finder · v1.0.0
      </Text>

      {/* Delete confirmation modal */}
      <Modal visible={deleteVisible} transparent animationType="fade" onRequestClose={() => setDeleteVisible(false)}>
        <View style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <MaterialCommunityIcons name="alert-circle-outline" size={34} color={colors.danger} />
            <Text style={[typography.heading, { color: colors.text, marginTop: 10 }]}>Delete your account?</Text>
            <Text style={[typography.small, { color: colors.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 20 }]}>
              This permanently deletes your account, your reviews and your saved
              favorites. This can’t be undone. Enter your password to confirm.
            </Text>

            <View style={{ width: '100%', marginTop: 18 }}>
              <TextField
                value={password}
                onChangeText={setPassword}
                placeholder="Your password"
                secureTextEntry
                icon="lock-outline"
                error={deleteError}
                style={{ marginBottom: 8 }}
              />
            </View>

            <View style={{ width: '100%', marginTop: 8 }}>
              <Button title="Delete forever" variant="danger" onPress={handleDelete} loading={deleting} />
              <View style={{ height: 10 }} />
              <Button title="Cancel" variant="ghost" onPress={() => setDeleteVisible(false)} disabled={deleting} />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 10, marginLeft: 4, letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  rowIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 50 },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  tag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 },
  modalBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  modalCard: { width: '100%', maxWidth: 380, borderRadius: 22, padding: 24, alignItems: 'center' },
});
