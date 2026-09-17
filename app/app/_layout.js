import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ThemeProvider, useTheme } from '@/src/context/ThemeContext';
import { AuthProvider, useAuth } from '@/src/context/AuthContext';
import { DataProvider } from '@/src/context/DataContext';
import { isFirebaseConfigured } from '@/src/firebase/config';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <DataProvider>
              <RootNavigator />
            </DataProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const { colors } = useTheme();
  const { initializing, isAuthenticated, canBrowse } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Redirect based on auth state once initialization finishes. Guests (canBrowse
  // but not signed in) are allowed into the app; only the welcome screen bounces
  // people who are neither signed in nor browsing as a guest.
  useEffect(() => {
    if (initializing) return;
    const inAuthGroup = segments[0] === '(auth)';

    if (!canBrowse && !inAuthGroup) {
      router.replace('/(auth)/welcome');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [initializing, isAuthenticated, canBrowse, segments, router]);

  if (!isFirebaseConfigured()) {
    return <ConfigNotice />;
  }

  if (initializing) {
    return (
      <View style={[styles.splash, { backgroundColor: colors.primary }]}>
        <MaterialCommunityIcons name="cupcake" size={64} color="#fff" />
        <Text style={styles.splashTitle}>King Cake Finder</Text>
        <ActivityIndicator color="#fff" style={{ marginTop: 20 }} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="bakery/[id]" />
      <Stack.Screen name="admin/add-bakery" />
      <Stack.Screen name="admin/manage" />
      <Stack.Screen name="admin/moderation" />
      <Stack.Screen name="admin/edit-bakery/[id]" />
      <Stack.Screen name="admin/support" />
      <Stack.Screen name="inbox" />
      <Stack.Screen name="support" />
      <Stack.Screen name="privacy-policy" options={{ presentation: 'modal' }} />
      <Stack.Screen name="terms" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

/** Shown until the developer pastes their own Firebase keys into config.js. */
function ConfigNotice() {
  return (
    <View style={styles.configRoot}>
      <ScrollView contentContainerStyle={styles.configContent}>
        <MaterialCommunityIcons name="cog-outline" size={56} color="#5B3A8C" />
        <Text style={styles.configTitle}>One quick setup step</Text>
        <Text style={styles.configBody}>
          King Cake Finder is ready to run, but it needs your own Firebase project
          keys (they're account-specific and can't be pre-filled).
        </Text>
        <Text style={styles.configStep}>
          1. Create a free Firebase project (Spark tier is fine).{'\n'}
          2. Enable Email/Password authentication and Cloud Firestore.{'\n'}
          3. Copy your web app config into{'\n'}
          <Text style={styles.configCode}>src/firebase/config.js</Text>.{'\n'}
          4. Deploy the included <Text style={styles.configCode}>firestore.rules</Text>.
        </Text>
        <Text style={styles.configFoot}>
          Reload the app after saving your keys.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  splashTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 16,
    letterSpacing: 0.3,
  },
  configRoot: { flex: 1, backgroundColor: '#FBF7F0' },
  configContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  configTitle: { fontSize: 22, fontWeight: '800', color: '#2A2333', marginTop: 16 },
  configBody: {
    fontSize: 15,
    color: '#6E6578',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
    maxWidth: 340,
  },
  configStep: {
    fontSize: 14,
    color: '#2A2333',
    marginTop: 20,
    lineHeight: 24,
    maxWidth: 340,
  },
  configCode: {
    fontFamily: 'monospace',
    color: '#5B3A8C',
    fontWeight: '700',
  },
  configFoot: { fontSize: 13, color: '#9A93A3', marginTop: 20 },
});
