import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { size, theme } from '../theme';
import type { DeviceEntry } from '../ble/types';
import { connColor } from './StatusDot';
import { rgbCss } from '../util/color';
import { effectName } from '../effects';

type Slot = { name: string; left: number; top: number; w: number; h: number; vertical?: boolean };

// Even ~3% padding on all four sides. The side rails and the Balcony bottom-align
// on the same line (78%); ShakAssist + Back Stairs sit just below at the bottom edge.
const SLOTS: Slot[] = [
  { name: 'Front Siding', left: 26, top: 3, w: 48, h: 8 },
  { name: 'Front Skirt', left: 26, top: 12, w: 48, h: 8 },
  { name: 'Left Skirt', left: 3, top: 22, w: 8, h: 56, vertical: true },
  { name: 'Left Siding', left: 13, top: 22, w: 8, h: 56, vertical: true },
  { name: 'Right Siding', left: 79, top: 22, w: 8, h: 56, vertical: true },
  { name: 'Right Skirt', left: 89, top: 22, w: 8, h: 56, vertical: true },
  { name: 'Balcony', left: 38, top: 67, w: 28, h: 11 },
  // rear cluster: just below the rails/balcony, flush to the bottom padding
  { name: 'ShakAssist', left: 8, top: 83, w: 28, h: 14 },
  { name: 'Back Stairs', left: 38, top: 83, w: 28, h: 14 },
];

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, '');

export function ShackMap({
  devices,
  selected,
  assign,
  assignMode = false,
  pendingSlot = null,
  show = null,
  onSlotPress,
}: {
  devices: DeviceEntry[];
  selected: string[];
  assign: Record<string, string>;
  assignMode?: boolean;
  pendingSlot?: string | null;
  show?: string | null;
  onSlotPress: (slot: string, device?: DeviceEntry) => void;
}) {
  const allSelected = selected.length === 0;
  const sel = new Set(selected);

  const findDevice = (slot: string): DeviceEntry | undefined => {
    const assigned = assign[slot];
    if (assigned) return devices.find((d) => d.name === assigned);
    return devices.find((d) => norm(d.label || '') === norm(slot) || norm(d.name) === norm(slot));
  };

  const subLabel = (d: DeviceEntry): string => {
    if (show) return show;
    if (d.mode === 'auto') return 'Auto';
    if (d.mode === 'effect') return effectName(d.effect);
    return '';
  };

  return (
    <View style={styles.map}>
      {SLOTS.map((slot) => {
        const dev = findDevice(slot.name);
        const linked = !!dev && dev.state === 'connected';
        const isSel = !!dev && !allSelected && sel.has(dev.name);
        const pending = pendingSlot === slot.name;
        const fill = linked ? (dev!.power ? rgbCss(dev!.color) : theme.surfaceHi) : theme.surfaceAlt;
        const border = pending ? theme.warn : isSel ? theme.text : dev ? connColor(dev.state) : theme.border;
        const sub = dev && linked ? subLabel(dev) : '';

        return (
          <Pressable
            key={slot.name}
            onPress={() => { Haptics.selectionAsync().catch(() => {}); onSlotPress(slot.name, dev); }}
            disabled={!assignMode && !dev}
            style={[
              styles.shape,
              {
                left: `${slot.left}%`,
                top: `${slot.top}%`,
                width: `${slot.w}%`,
                height: `${slot.h}%`,
                backgroundColor: fill,
                borderColor: border,
                borderWidth: pending || isSel ? 4 : 2,
                opacity: dev || assignMode ? 1 : 0.35,
              },
            ]}
          >
            {slot.vertical ? (
              <Text
                style={[styles.vlabel, { color: linked && dev?.power ? '#000' : theme.text }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {slot.name}
              </Text>
            ) : (
              <>
                <Text
                  style={[styles.label, { color: linked && dev?.power ? '#000' : theme.text }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.6}
                >
                  {slot.name}
                </Text>
                {sub ? (
                  <Text style={[styles.sub, { color: linked && dev?.power ? '#000' : theme.textDim }]} numberOfLines={1}>
                    {sub}
                  </Text>
                ) : null}
              </>
            )}
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
    paddingHorizontal: 3,
  },
  label: { fontSize: 13, fontWeight: '800', textAlign: 'center', width: '100%' },
  vlabel: { fontSize: 12, fontWeight: '800', textAlign: 'center', width: 90, transform: [{ rotate: '-90deg' }] },
  sub: { fontSize: 10, fontWeight: '700', marginTop: 1 },
  check: { position: 'absolute', top: 3, right: 3, width: 12, height: 12, borderRadius: 6, backgroundColor: theme.text },
});
