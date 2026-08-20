import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { size, theme } from '../theme';
import type { DeviceEntry } from '../ble/types';
import { connColor } from './StatusDot';

const nameOf = (d: DeviceEntry) => d.label || d.name;

/** Per-strip chips for hand-picking a selection. "All" lives in the panel. */
export function SelectionChips({
  devices,
  selected,
  onToggle,
}: {
  devices: DeviceEntry[];
  selected: string[];
  onToggle: (name: string) => void;
}) {
  const allActive = selected.length === 0;
  const sel = new Set(selected);
  const ordered = [...devices].sort((a, b) => Number(b.state === 'connected') - Number(a.state === 'connected'));

  return (
    <View style={styles.wrap}>
      {ordered.map((d) => {
        const active = !allActive && sel.has(d.name);
        return (
          <Pressable
            key={d.name}
            onPress={() => onToggle(d.name)}
            hitSlop={6}
            style={({ pressed }) => [
              styles.chip,
              active ? styles.chipActive : styles.chipIdle,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <View style={[styles.dot, { backgroundColor: connColor(d.state) }]} />
            <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
              {nameOf(d)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 52,
    paddingHorizontal: 16,
    borderRadius: 26,
    borderWidth: 2,
  },
  chipIdle: { backgroundColor: theme.surfaceHi, borderColor: theme.border },
  chipActive: { backgroundColor: theme.accent, borderColor: '#ffffff44' },
  chipText: { color: theme.text, fontSize: size.fontMd, fontWeight: '800' },
  chipTextActive: { color: '#000' },
  dot: { width: 12, height: 12, borderRadius: 6 },
});
