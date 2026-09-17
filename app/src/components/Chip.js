import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeContext';

/** Small pill used for tags, filters and toggles. `tone`: 'purple'|'green'|'gold'|'neutral'. */
export default function Chip({
  label,
  icon,
  selected = false,
  onPress,
  tone = 'neutral',
  style,
}) {
  const { colors, radius, typography } = useTheme();

  const tones = {
    purple: { bg: colors.primarySoft, fg: colors.primary },
    green: { bg: colors.greenSoft, fg: colors.green },
    gold: { bg: colors.goldSoft, fg: colors.gold },
    neutral: { bg: colors.inputBg, fg: colors.textMuted },
  };
  const t = tones[tone] || tones.neutral;

  const bg = selected ? colors.primary : t.bg;
  const fg = selected ? colors.onPrimary : t.fg;

  const inner = (
    <View
      style={[
        styles.chip,
        { backgroundColor: bg, borderRadius: radius.pill },
        style,
      ]}
    >
      {icon ? (
        <MaterialCommunityIcons
          name={icon}
          size={14}
          color={fg}
          style={{ marginRight: 5 }}
        />
      ) : null}
      <Text style={[typography.caption, { color: fg }]}>{label}</Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
        {inner}
      </Pressable>
    );
  }
  return inner;
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
});
