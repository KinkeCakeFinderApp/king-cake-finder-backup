import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeContext';
import {
  SORT_OPTIONS,
  FILTER_OPTIONS,
  DEFAULT_SORT,
  DEFAULT_FILTERS,
} from '@/src/utils/search';
import Button from '@/src/components/Button';

/**
 * Bottom-sheet modal for choosing a sort order and toggling filters. Controlled
 * by the Search screen via `sort` / `filters` + change handlers.
 */
export default function FilterSheet({
  visible,
  onClose,
  sort,
  filters,
  onChangeSort,
  onToggleFilter,
  onReset,
  locationAvailable,
}) {
  const { colors, spacing, typography, radius } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        <View style={styles.headerRow}>
          <Text style={[typography.title, { color: colors.text }]}>Sort & filter</Text>
          <Pressable onPress={onReset} hitSlop={8}>
            <Text style={[typography.small, { color: colors.primary, fontWeight: '700' }]}>
              Reset
            </Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 440 }}>
          <Text style={[typography.caption, styles.sectionLabel, { color: colors.textMuted }]}>
            SORT BY
          </Text>
          {SORT_OPTIONS.map((opt) => {
            const disabled = opt.key === 'closest' && !locationAvailable;
            const selected = sort === opt.key;
            return (
              <Pressable
                key={opt.key}
                disabled={disabled}
                onPress={() => onChangeSort(opt.key)}
                style={[
                  styles.row,
                  {
                    borderColor: colors.divider,
                    opacity: disabled ? 0.4 : 1,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={opt.icon}
                  size={20}
                  color={selected ? colors.primary : colors.textMuted}
                />
                <Text
                  style={[
                    typography.body,
                    {
                      color: selected ? colors.primary : colors.text,
                      fontWeight: selected ? '700' : '500',
                      marginLeft: spacing.md,
                      flex: 1,
                    },
                  ]}
                >
                  {opt.label}
                  {disabled ? '  (location off)' : ''}
                </Text>
                {selected ? (
                  <MaterialCommunityIcons name="check-circle" size={20} color={colors.primary} />
                ) : (
                  <View style={[styles.radio, { borderColor: colors.border }]} />
                )}
              </Pressable>
            );
          })}

          <Text
            style={[
              typography.caption,
              styles.sectionLabel,
              { color: colors.textMuted, marginTop: spacing.lg },
            ]}
          >
            FILTER
          </Text>
          {FILTER_OPTIONS.map((opt) => {
            const on = !!filters[opt.key];
            return (
              <Pressable
                key={opt.key}
                onPress={() => onToggleFilter(opt.key)}
                style={[styles.row, { borderColor: colors.divider }]}
              >
                <MaterialCommunityIcons
                  name={opt.icon}
                  size={20}
                  color={on ? colors.green : colors.textMuted}
                />
                <Text
                  style={[
                    typography.body,
                    {
                      color: on ? colors.text : colors.text,
                      fontWeight: on ? '700' : '500',
                      marginLeft: spacing.md,
                      flex: 1,
                    },
                  ]}
                >
                  {opt.label}
                </Text>
                <View
                  style={[
                    styles.check,
                    {
                      backgroundColor: on ? colors.green : 'transparent',
                      borderColor: on ? colors.green : colors.border,
                    },
                  ]}
                >
                  {on ? <MaterialCommunityIcons name="check" size={15} color="#fff" /> : null}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={{ marginTop: spacing.lg }}>
          <Button title="Show results" onPress={onClose} icon="magnify" />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 34,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sectionLabel: { letterSpacing: 0.6, marginTop: 6, marginBottom: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2 },
  check: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
