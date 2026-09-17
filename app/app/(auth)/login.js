import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '@/src/components/Screen';
import TextField from '@/src/components/TextField';
import Button from '@/src/components/Button';
import AgreementCheckbox from '@/src/components/AgreementCheckbox';
import { useTheme } from '@/src/context/ThemeContext';
import { useAuth } from '@/src/context/AuthContext';
import { isValidEmail, friendlyAuthError } from '@/src/utils/validation';

export default function Login() {
  const { colors, spacing, typography } = useTheme();
  const { logIn, resetPassword } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [agreeError, setAgreeError] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(null);
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Enter your password.');
      return;
    }
    if (!agreed) {
      setAgreeError('Please read and agree to the Privacy Policy and Terms of Service to continue.');
      return;
    }
    setLoading(true);
    try {
      await logIn(email, password);
      // Root navigator redirects into the app on success.
    } catch (e) {
      setError(friendlyAuthError(e));
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    setError(null);
    if (!isValidEmail(email)) {
      setError('Type your email in the box above, then tap "Forgot password?".');
      return;
    }
    const sent = () =>
      Alert.alert(
        'Check your email',
        `If an account exists for ${email.trim()}, we've sent a link to reset your password. It can take a minute — check your spam folder too.`
      );
    try {
      await resetPassword(email);
      sent();
    } catch (e) {
      // Don't reveal whether an email is registered.
      if (e && e.code === 'auth/user-not-found') sent();
      else setError(friendlyAuthError(e));
    }
  };

  return (
    <Screen scroll contentStyle={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
        </Pressable>

        <Text style={[typography.title, { color: colors.text, marginTop: spacing.md }]}>
          Welcome back
        </Text>
        <Text style={[typography.body, { color: colors.textMuted, marginTop: 4, marginBottom: spacing.xl }]}>
          Log in to keep finding great king cakes.
        </Text>

        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          icon="email-outline"
        />
        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Your password"
          secureTextEntry
          icon="lock-outline"
        />

        <Pressable onPress={handleForgot} hitSlop={8} style={styles.forgot}>
          <Text style={[typography.small, { color: colors.primary, fontWeight: '700' }]}>
            Forgot password?
          </Text>
        </Pressable>

        {error ? (
          <Text style={[typography.small, { color: colors.danger, marginBottom: spacing.md }]}>
            {error}
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

        <Button title="Log in" onPress={handleLogin} loading={loading} />

        <View style={styles.footer}>
          <Text style={[typography.small, { color: colors.textMuted }]}>New here? </Text>
          <Pressable onPress={() => router.replace('/(auth)/signup')}>
            <Text style={[typography.small, { color: colors.primary, fontWeight: '700' }]}>
              Create an account
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24 },
  back: { alignSelf: 'flex-start', marginLeft: -6 },
  forgot: { alignSelf: 'flex-end', marginTop: 4, marginBottom: 12, paddingVertical: 4 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
});
