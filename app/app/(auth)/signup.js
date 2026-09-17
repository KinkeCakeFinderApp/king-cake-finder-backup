import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '@/src/components/Screen';
import TextField from '@/src/components/TextField';
import Button from '@/src/components/Button';
import AgreementCheckbox from '@/src/components/AgreementCheckbox';
import { useTheme } from '@/src/context/ThemeContext';
import { useAuth } from '@/src/context/AuthContext';
import { validateSignup, friendlyAuthError } from '@/src/utils/validation';
import { isUsernameTaken } from '@/src/services/users';

export default function Signup() {
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
  const [errors, setErrors] = useState({});
  const [agreed, setAgreed] = useState(false);
  const [agreeError, setAgreeError] = useState(null);
  const [topError, setTopError] = useState(null);
  const [loading, setLoading] = useState(false);

  const update = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSignup = async () => {
    setTopError(null);
    const validationErrors = validateSignup(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    if (!agreed) {
      setAgreeError('Please read and agree to the Privacy Policy and Terms of Service to continue.');
      return;
    }

    setLoading(true);
    try {
      // Best-effort username uniqueness check.
      const taken = await isUsernameTaken(form.username).catch(() => false);
      if (taken) {
        setErrors((e) => ({ ...e, username: 'That username is already taken.' }));
        setLoading(false);
        return;
      }
      await signUp(form);
      // Root navigator redirects into the app on success.
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

        <Text style={[typography.title, { color: colors.text, marginTop: spacing.md }]}>
          Create your account
        </Text>
        <Text style={[typography.body, { color: colors.textMuted, marginTop: 4, marginBottom: spacing.xl }]}>
          Join to rate, review and save king cakes.
        </Text>

        <TextField
          label="Username"
          value={form.username}
          onChangeText={update('username')}
          placeholder="kingcakefan"
          icon="account-outline"
          error={errors.username}
        />

        <View style={styles.nameRow}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <TextField
              label="First name"
              value={form.firstName}
              onChangeText={update('firstName')}
              placeholder="Marie"
              autoCapitalize="words"
              error={errors.firstName}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <TextField
              label="Last name"
              value={form.lastName}
              onChangeText={update('lastName')}
              placeholder="Laveau"
              autoCapitalize="words"
              error={errors.lastName}
            />
          </View>
        </View>

        <TextField
          label="Email"
          value={form.email}
          onChangeText={update('email')}
          placeholder="you@example.com"
          keyboardType="email-address"
          icon="email-outline"
          error={errors.email}
        />
        <TextField
          label="Password"
          value={form.password}
          onChangeText={update('password')}
          placeholder="At least 6 characters"
          secureTextEntry
          icon="lock-outline"
          error={errors.password}
        />
        <TextField
          label="Confirm password"
          value={form.confirmPassword}
          onChangeText={update('confirmPassword')}
          placeholder="Re-enter your password"
          secureTextEntry
          icon="lock-check-outline"
          error={errors.confirmPassword}
        />

        {topError ? (
          <Text style={[typography.small, { color: colors.danger, marginBottom: spacing.md }]}>
            {topError}
          </Text>
        ) : null}

        <AgreementCheckbox
          checked={agreed}
          onToggle={() => {
            setAgreed((v) => !v);
            setAgreeError(null);
          }}
          error={agreeError}
        />

        <Button title="Create account" onPress={handleSignup} loading={loading} />

        <View style={styles.footer}>
          <Text style={[typography.small, { color: colors.textMuted }]}>Already have one? </Text>
          <Pressable onPress={() => router.replace('/(auth)/login')}>
            <Text style={[typography.small, { color: colors.primary, fontWeight: '700' }]}>Log in</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24 },
  back: { alignSelf: 'flex-start', marginLeft: -6 },
  nameRow: { flexDirection: 'row' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
});
