import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '@/src/context/ThemeContext';
import { useAuth } from '@/src/context/AuthContext';
import { useData } from '@/src/context/DataContext';
import BakeryForm from '@/src/components/BakeryForm';
import { createBakery, getBakery } from '@/src/services/bakeries';

export default function AddBakery() {
  const { colors, typography, isDark } = useTheme();
  const { isSuperuser } = useAuth();
  const { upsertBakery } = useData();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  if (!isSuperuser) return <Redirect href="/(tabs)" />;

  const handleSubmit = async (data) => {
    setSubmitting(true);
    try {
      const id = await createBakery(data);
      const fresh = await getBakery(id);
      if (fresh) upsertBakery(fresh);
      Alert.alert('Bakery added', `${data.name} is now live.`);
      router.back();
    } catch (e) {
      Alert.alert('Could not save', e.message || 'Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ marginLeft: -6 }}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
        </Pressable>
        <Text style={[typography.heading, { color: colors.text }]}>Add a bakery</Text>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <BakeryForm submitLabel="Add bakery" onSubmit={handleSubmit} submitting={submitting} />
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
});
