import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { size, theme } from '../theme';
import type { DeviceEntry } from '../ble/types';
import { connColor } from './StatusDot';

/**
 * Picks which strips the master controls target. Empty selection = All.
 * "All" and per-strip chips toggle the same underlying selection set.
 */
export function SelectionChips({
  devices,
  selected,
  onToggle,
  onAll,
}: {
  devices: DeviceEntry[];
  selected: string[];
  onToggle: (name: string) => void;
  onAll: () => void;
}) {
  const allActive = selected.length === 0;
  const sel = new Set(selected);

  return (
    <View style={styles.wrap}>
      <Chip label="ALL" active={allActive} onPress={onAll} big />
      {devices.map((d) => (
        <Chip
          key={d.name}
          label={d.name}
          active={!allActive && sel.has(d.name)}
          dot={connColor(d.state)}
          onPress={() => onToggle(d.name)}
        />
      ))}
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
  dot,
  big,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  dot?: string;
  big?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.chip,
        big && styles.chipBig,
        active ? styles.chipActive : styles.chipIdle,
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      {dot ? <View style={[styles.dot, { backgroundColor: dot }]} /> : null}
      <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 52,
    paddingHorizontal: 16,
    borderRadius: 26,
    borderWidth: 2,
  },
  chipBig: { paddingHorizontal: 22 },
  chipIdle: { backgroundColor: theme.surfaceHi, borderColor: theme.border },
  chipActive: { backgroundColor: theme.accent, borderColor: '#ffffff44' },
  chipText: { color: theme.text, fontSize: size.fontMd, fontWeight: '800' },
  chipTextActive: { color: '#000' },
  dot: { width: 12, height: 12, borderRadius: 6 },
});
