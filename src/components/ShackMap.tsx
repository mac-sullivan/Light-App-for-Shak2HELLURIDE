import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { size, theme } from '../theme';
import type { DeviceEntry } from '../ble/types';
import { connColor } from './StatusDot';
import { rgbCss } from '../util/color';

type Slot = { name: string; left: number; top: number; w: number; h: number; vertical?: boolean };

// Top-down layout of the shack (percentages of the map container).
const SLOTS: Slot[] = [
  { name: 'Front Siding', left: 26, top: 2, w: 48, h: 8 },
  { name: 'Front Skirt', left: 26, top: 11, w: 48, h: 8 },
  { name: 'Left Siding', left: 3, top: 22, w: 8, h: 64, vertical: true },
  { name: 'Left Skirt', left: 13, top: 22, w: 8, h: 64, vertical: true },
  { name: 'Right Skirt', left: 79, top: 22, w: 8, h: 64, vertical: true },
  { name: 'Right Siding', left: 89, top: 22, w: 8, h: 64, vertical: true },
  // interior bottom: Balcony ahead of Stairs; ShakAssist directly left of Stairs
  { name: 'Balcony', left: 38, top: 60, w: 24, h: 11 },
  { name: 'ShakAssist', left: 12, top: 75, w: 24, h: 14 },
  { name: 'Back Stairs', left: 38, top: 75, w: 24, h: 14 },
];

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, '');

export function ShackMap({
  devices,
  selected,
  onToggle,
}: {
  devices: DeviceEntry[];
  selected: string[];
  onToggle: (name: string) => void;
}) {
  const allSelected = selected.length === 0;
  const sel = new Set(selected);

  // Match a map slot to a device by friendly label or broadcast name.
  const findDevice = (slotName: string): DeviceEntry | undefined =>
    devices.find((d) => norm(d.label || '') === norm(slotName) || norm(d.name) === norm(slotName));

  return (
    <View style={styles.map}>
      {SLOTS.map((slot) => {
        const dev = findDevice(slot.name);
        const linked = !!dev && dev.state === 'connected';
        const isSel = !!dev && !allSelected && sel.has(dev.name);
        const fill = !dev
          ? theme.surfaceAlt
          : dev.state === 'connected'
            ? (dev.power ? rgbCss(dev.color) : theme.surfaceHi)
            : theme.surfaceHi;
        const border = dev ? connColor(dev.state) : theme.border;

        return (
          <Pressable
            key={slot.name}
            onPress={() => dev && onToggle(dev.name)}
            disabled={!dev}
            style={[
              styles.shape,
              {
                left: `${slot.left}%`,
                top: `${slot.top}%`,
                width: `${slot.w}%`,
                height: `${slot.h}%`,
                backgroundColor: fill,
                borderColor: isSel ? theme.text : border,
                borderWidth: isSel ? 4 : 2,
                opacity: dev ? 1 : 0.35,
              },
            ]}
          >
            <Text
              style={[
                styles.label,
                slot.vertical && styles.labelVertical,
                { color: linked && dev?.power ? '#000' : theme.text },
              ]}
              numberOfLines={2}
            >
              {slot.name}
            </Text>
            {isSel ? <View style={styles.check} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    aspectRatio: 0.9,
    backgroundColor: theme.surface,
    borderRadius: size.radius,
    borderWidth: 1,
    borderColor: theme.border,
    position: 'relative',
  },
  shape: {
    position: 'absolute',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  label: { fontSize: 12, fontWeight: '800', textAlign: 'center' },
  labelVertical: { transform: [{ rotate: '-90deg' }], width: 90, fontSize: 12 },
  check: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.text,
  },
});
