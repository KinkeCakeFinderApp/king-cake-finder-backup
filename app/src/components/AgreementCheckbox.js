import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeContext';

/**
 * Required "I have read and agree to the Privacy Policy and Terms of Service"
 * checkbox shown on the login and signup screens. The two document names are
 * tappable and open the in-app Privacy Policy / Terms pages.
 */
export default function AgreementCheckbox({ checked, onToggle, error }) {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();

  return (
    <View style={{ marginBottom: spacing.md }}>
      <Pressable
        onPress={onToggle}
        hitSlop={6}
        style={styles.row}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: !!checked }}
      >
        <View
          style={[
            styles.box,
            {
              borderColor: error ? colors.danger : checked ? colors.primary : colors.border,
              backgroundColor: checked ? colors.primary : 'transparent',
            },
          ]}
        >
          {checked ? (
            <MaterialCommunityIcons name="check" size={15} color={colors.onPrimary} />
          ) : null}
        </View>
        <Text style={[typography.small, { color: colors.textMuted, flex: 1, marginLeft: 10, lineHeight: 19 }]}>
          I have read and agree to the{' '}
          <Text
            style={{ color: colors.primary, fontWeight: '700' }}
            onPress={() => router.push('/privacy-policy')}
          >
            Privacy Policy
          </Text>
          {' '}and{' '}
          <Text
            style={{ color: colors.primary, fontWeight: '700' }}
            onPress={() => router.push('/terms')}
          >
            Terms of Service
          </Text>
          .
        </Text>
      </Pressable>
      {error ? (
        <Text style={[typography.caption, { color: colors.danger, marginTop: 6, marginLeft: 32 }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
});
