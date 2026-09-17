import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '@/src/components/Screen';
import TextField from '@/src/components/TextField';
import Button from '@/src/components/Button';
import { useTheme } from '@/src/context/ThemeContext';
import { useAuth } from '@/src/context/AuthContext';
import { validateSignup, friendlyAuthError } from '@/src/utils/validation';
import { isUsernameTaken } from '@/src/services/users';
import { ADMIN_PASSPHRASE } from '@/src/config/appConfig';

/**
 * Secret superuser signup. Reached only by long-pressing the logo on the
 * welcome screen — never linked in the normal flow. Requires the admin
 * passphrase; without it, no account here can become a superuser.
 */
export default function AdminSignup() {
  const { colors, spacing, typography } = useTheme();
  const { signUp } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [passphrase, setPassphrase] = useState('');
  const [errors, setErrors] = useState({});
  const [topError, setTopError] = useState(null);
  const [loading, setLoading] = useState(false);

  const update = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSignup = async () => {
    setTopError(null);
    const validationErrors = validateSignup(form);
    if (passphrase.trim() !== ADMIN_PASSPHRASE) {
      validationErrors.passphrase = 'Incorrect admin passphrase.';
    }
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    try {
      const taken = await isUsernameTaken(form.username).catch(() => false);
      if (taken) {
        setErrors((e) => ({ ...e, username: 'That username is already taken.' }));
        setLoading(false);
        return;
      }
      await signUp(form, { asAdmin: true, passphrase: passphrase.trim() });
    } catch (e) {
      setTopError(friendlyAuthError(e));
      setLoading(false);
    }
  };

  return (
    <Screen scroll contentStyle={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
        </Pressable>

        <View style={[styles.badge, { backgroundColor: colors.primarySoft }]}>
          <MaterialCommunityIcons name="shield-crown-outline" size={18} color={colors.primary} />
          <Text style={[typography.caption, { color: colors.primary, marginLeft: 6 }]}>
            SUPERUSER SIGNUP
          </Text>
        </View>

        <Text style={[typography.title, { color: colors.text, marginTop: spacing.md }]}>
          Create an admin account
        </Text>
        <Text style={[typography.body, { color: colors.textMuted, marginTop: 4, marginBottom: spacing.xl }]}>
          This account can manage bakeries and moderate content. Requires the
          admin passphrase.
        </Text>

        <TextField
          label="Admin passphrase"
          value={passphrase}
          onChangeText={setPassphrase}
          placeholder="Enter the secret passphrase"
          secureTextEntry
          icon="key-outline"
          error={errors.passphrase}
        />

        <TextField label="Username" value={form.username} onChangeText={update('username')} placeholder="admin_marie" icon="account-outline" error={errors.username} />

        <View style={styles.nameRow}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <TextField label="First name" value={form.firstName} onChangeText={update('firstName')} placeholder="Marie" autoCapitalize="words" error={errors.firstName} />
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <TextField label="Last name" value={form.lastName} onChangeText={update('lastName')} placeholder="Laveau" autoCapitalize="words" error={errors.lastName} />
          </View>
        </View>

        <TextField label="Email" value={form.email} onChangeText={update('email')} placeholder="admin@example.com" keyboardType="email-address" icon="email-outline" error={errors.email} />
        <TextField label="Password" value={form.password} onChangeText={update('password')} placeholder="At least 6 characters" secureTextEntry icon="lock-outline" error={errors.password} />
        <TextField label="Confirm password" value={form.confirmPassword} onChangeText={update('confirmPassword')} placeholder="Re-enter your password" secureTextEntry icon="lock-check-outline" error={errors.confirmPassword} />

        {topError ? (
          <Text style={[typography.small, { color: colors.danger, marginBottom: spacing.md }]}>{topError}</Text>
        ) : null}

        <Button title="Create admin account" icon="shield-crown-outline" onPress={handleSignup} loading={loading} />
        <View style={{ height: 24 }} />
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24 },
  back: { alignSelf: 'flex-start', marginLeft: -6 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginTop: 12,
  },
  nameRow: { flexDirection: 'row' },
});
