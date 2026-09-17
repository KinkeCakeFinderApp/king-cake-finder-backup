import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';

/**
 * Returns a guard for account-only inline actions (favorite a bakery, report a
 * review, etc.). Call it with an optional message; it returns true when the
 * visitor is signed in, or false after showing a friendly "sign in to continue"
 * prompt (guests can jump straight to log in / sign up from the alert).
 *
 *   const requireAuth = useRequireAuth();
 *   const onPress = () => { if (!requireAuth('Log in to save favorites.')) return; ... };
 */
export function useRequireAuth() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  return useCallback(
    (message) => {
      if (isAuthenticated) return true;
      Alert.alert(
        'Sign in to continue',
        message || 'Create a free account or log in to use this feature.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Log in', onPress: () => router.push('/(auth)/login') },
          { text: 'Create account', onPress: () => router.push('/(auth)/signup') },
        ]
      );
      return false;
    },
    [isAuthenticated, router]
  );
}
