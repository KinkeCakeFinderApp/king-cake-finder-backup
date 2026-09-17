import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeContext';

export default function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry,
  keyboardType,
  autoCapitalize = 'none',
  autoCorrect = false,
  multiline = false,
  numberOfLines,
  maxLength,
  helper,
  icon,
  editable = true,
  onBlur,
  style,
}) {
  const { colors, spacing, typography, radius } = useTheme();
  const [focused, setFocused] = useState(false);
  const [hide, setHide] = useState(!!secureTextEntry);

  return (
    <View style={[{ marginBottom: spacing.lg }, style]}>
      {label ? (
        <Text
          style={[
            typography.caption,
            { color: colors.textMuted, marginBottom: spacing.xs, textTransform: 'uppercase' },
          ]}
        >
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.inputWrap,
          {
            backgroundColor: colors.inputBg,
            borderColor: error
              ? colors.danger
              : focused
              ? colors.primary
              : colors.border,
            borderRadius: radius.md,
            alignItems: multiline ? 'flex-start' : 'center',
          },
        ]}
      >
        {icon ? (
          <MaterialCommunityIcons
            name={icon}
            size={19}
            color={colors.textFaint}
            style={{ marginRight: 8, marginTop: multiline ? 12 : 0 }}
          />
        ) : null}

        <TextInput
          style={[
            styles.input,
            typography.body,
            {
              color: colors.text,
              height: multiline ? undefined : 48,
              minHeight: multiline ? 96 : undefined,
              textAlignVertical: multiline ? 'top' : 'center',
              paddingVertical: multiline ? 12 : 0,
            },
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textFaint}
          secureTextEntry={hide}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={(e) => {
            setFocused(false);
            if (onBlur) onBlur(e);
          }}
        />

        {secureTextEntry ? (
          <Pressable onPress={() => setHide((h) => !h)} hitSlop={10}>
            <MaterialCommunityIcons
              name={hide ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={colors.textFaint}
            />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text style={[typography.small, { color: colors.danger, marginTop: 4 }]}>
          {error}
        </Text>
      ) : helper ? (
        <Text style={[typography.small, { color: colors.textFaint, marginTop: 4 }]}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inputWrap: {
    flexDirection: 'row',
    borderWidth: 1.5,
    paddingHorizontal: 14,
  },
  input: { flex: 1, padding: 0 },
});
