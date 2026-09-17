import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Link, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeContext';

export default function NotFound() {
  const { colors, typography } = useTheme();
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <MaterialCommunityIcons name="map-marker-question-outline" size={56} color={colors.textFaint} />
        <Text style={[typography.title, { color: colors.text, marginTop: 16 }]}>Page not found</Text>
        <Text style={[typography.body, { color: colors.textMuted, marginTop: 6, textAlign: 'center' }]}>
          That screen doesn’t exist.
        </Text>
        <Link href="/(tabs)" style={[styles.link, { color: colors.primary }]}>
          Go home
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  link: { marginTop: 20, fontSize: 15, fontWeight: '700' },
});
