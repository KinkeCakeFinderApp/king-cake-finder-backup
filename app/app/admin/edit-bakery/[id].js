import React, { useEffect, useState } from 'react';
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
import { useLocalSearchParams, useRouter, Redirect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '@/src/context/ThemeContext';
import { useAuth } from '@/src/context/AuthContext';
import { useData } from '@/src/context/DataContext';
import BakeryForm from '@/src/components/BakeryForm';
import Loading from '@/src/components/Loading';
import { getBakery, updateBakery } from '@/src/services/bakeries';

export default function EditBakery() {
  const { id } = useLocalSearchParams();
  const { colors, typography, isDark } = useTheme();
  const { isSuperuser } = useAuth();
  const { getBakeryById, upsertBakery } = useData();
  const router = useRouter();

  const [initial, setInitial] = useState(() => getBakeryById(id));
  const [loading, setLoading] = useState(!initial);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    if (!initial) {
      getBakery(id)
        .then((b) => active && setInitial(b))
        .finally(() => active && setLoading(false));
    }
    return () => {
      active = false;
    };
  }, [id, initial]);

  if (!isSuperuser) return <Redirect href="/(tabs)" />;

  const handleSubmit = async (data) => {
    setSubmitting(true);
    try {
      await updateBakery(id, data);
      const fresh = await getBakery(id);
      if (fresh) upsertBakery(fresh);
      Alert.alert('Saved', `${data.name} was updated.`);
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
        <Text style={[typography.heading, { color: colors.text }]}>Edit bakery</Text>
        <View style={{ width: 28 }} />
      </View>

      {loading ? (
        <Loading />
      ) : !initial ? (
        <View style={styles.centered}>
          <Text style={[typography.body, { color: colors.textMuted }]}>Bakery not found.</Text>
        </View>
      ) : (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <BakeryForm initial={initial} submitLabel="Save changes" onSubmit={handleSubmit} submitting={submitting} />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
