import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { size, theme } from '../theme';
import type { DeviceEntry } from '../ble/types';
import type { RGB } from '../protocol';
import { EFFECT_PICKS } from '../effects';
import { useThrottledCallback } from '../util/throttle';
import { ColorPad } from './ColorPad';
import { StatusDot, connLabel } from './StatusDot';

const rgbCss = (c: RGB) => `rgb(${c.r},${c.g},${c.b})`;

export function DeviceList({
  devices,
  editing,
  onTogglePower,
  onRemove,
  onAdd,
  onDeviceColor,
  onDeviceEffect,
  onDeviceBrightness,
}: {
  devices: DeviceEntry[];
  editing: boolean;
  onTogglePower: (name: string, on: boolean) => void;
  onRemove: (name: string) => void;
  onAdd: (name: string) => void;
  onDeviceColor: (name: string, color: RGB) => void;
  onDeviceEffect: (name: string, mode: number) => void;
  onDeviceBrightness: (name: string, value: number) => void;
}) {
  const [draft, setDraft] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <View>
      {devices.map((d) => {
        const isOpen = expanded === d.name && !editing;
        return (
          <View key={d.name}>
            <View style={styles.row}>
              <StatusDot state={d.state} />
              <Pressable
                style={styles.info}
                onPress={() => !editing && setExpanded(isOpen ? null : d.name)}
                disabled={editing}
              >
                <Text style={styles.name} numberOfLines={1}>
                  {d.name}
                </Text>
                <Text
                  style={[styles.state, { color: d.state === 'connected' ? theme.ok : theme.textDim }]}
                >
                  {connLabel(d.state)}
                  {!editing && d.state === 'connected' ? (isOpen ? '  ▲ tap to close' : '  ▾ tap to control') : ''}
                </Text>
              </Pressable>

              {editing ? (
                <Pressable onPress={() => onRemove(d.name)} hitSlop={8} style={styles.removeBtn}>
                  <Text style={styles.removeText}>Remove</Text>
                </Pressable>
              ) : (
                <>
                  <View style={[styles.colorDot, { backgroundColor: rgbCss(d.color) }]} />
                  <Pressable
                    onPress={() => onTogglePower(d.name, !d.power)}
                    disabled={d.state !== 'connected'}
                    hitSlop={8}
                    style={[
                      styles.powerBtn,
                      { backgroundColor: d.power ? theme.ok : theme.surfaceHi },
                      d.state !== 'connected' && styles.dim,
                    ]}
                  >
                    <Text style={[styles.powerText, { color: d.power ? '#000' : theme.text }]}>
                      {d.power ? 'ON' : 'OFF'}
                    </Text>
                  </Pressable>
                </>
              )}
            </View>

            {isOpen ? (
              <DevicePanel
                device={d}
                onColor={onDeviceColor}
                onEffect={onDeviceEffect}
                onBrightness={onDeviceBrightness}
              />
            ) : null}
          </View>
        );
      })}

      {editing ? (
        <View style={styles.addRow}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Advertised BLE name…"
            placeholderTextColor={theme.textDim}
            autoCapitalize="characters"
            autoCorrect={false}
            style={styles.input}
          />
          <Pressable
            onPress={() => {
              onAdd(draft);
              setDraft('');
            }}
            style={styles.addBtn}
            hitSlop={8}
          >
            <Text style={styles.addText}>Add</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function DevicePanel({
  device,
  onColor,
  onEffect,
  onBrightness,
}: {
  device: DeviceEntry;
  onColor: (name: string, color: RGB) => void;
  onEffect: (name: string, mode: number) => void;
  onBrightness: (name: string, value: number) => void;
}) {
  const [bright, setBright] = useState(200);
  const sendBright = useThrottledCallback((v: number) => onBrightness(device.name, v), 70);

  return (
    <View style={styles.panel}>
      <Text style={styles.panelLabel}>Solid color</Text>
      <ColorPad selected={device.color} onPick={(c) => onColor(device.name, c)} />

      <Text style={styles.panelLabel}>Effects</Text>
      <View style={styles.effectRow}>
        {EFFECT_PICKS.slice(0, 6).map((e) => (
          <Pressable key={e.name} onPress={() => onEffect(device.name, e.mode)} style={styles.effChip}>
            <Text style={styles.effChipText}>{e.name}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.panelLabel}>Brightness</Text>
      <Slider
        minimumValue={0}
        maximumValue={255}
        value={bright}
        step={1}
        minimumTrackTintColor={theme.warn}
        maximumTrackTintColor={theme.surfaceHi}
        thumbTintColor={theme.text}
        onValueChange={(v) => {
          setBright(v);
          sendBright(v);
        }}
        onSlidingComplete={(v) => onBrightness(device.name, v)}
        style={styles.slider}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  info: { flex: 1 },
  name: { color: theme.text, fontSize: size.fontMd, fontWeight: '800' },
  state: { fontSize: size.fontSm, marginTop: 2, fontWeight: '600' },
  colorDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#00000066' },
  powerBtn: {
    minWidth: 74,
    minHeight: size.touchMd,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.border,
  },
  powerText: { fontSize: size.fontMd, fontWeight: '800' },
  dim: { opacity: 0.4 },
  panel: {
    backgroundColor: theme.surfaceAlt,
    borderRadius: size.radius,
    padding: size.gap,
    marginBottom: size.gap,
    borderWidth: 1,
    borderColor: theme.border,
  },
  panelLabel: {
    color: theme.textDim,
    fontSize: size.fontSm,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 10,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  effectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  effChip: {
    flexGrow: 1,
    minWidth: '30%',
    minHeight: size.touchMd,
    borderRadius: 12,
    backgroundColor: theme.surfaceHi,
    borderWidth: 2,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  effChipText: { color: theme.text, fontSize: size.fontMd, fontWeight: '700' },
  slider: { width: '100%', height: 56 },
  addRow: { flexDirection: 'row', gap: 12, marginTop: 14, alignItems: 'center' },
  input: {
    flex: 1,
    minHeight: size.touchMd,
    borderRadius: 12,
    backgroundColor: theme.surfaceAlt,
    borderWidth: 2,
    borderColor: theme.border,
    color: theme.text,
    fontSize: size.fontMd,
    paddingHorizontal: 14,
  },
  addBtn: {
    minHeight: size.touchMd,
    paddingHorizontal: 22,
    borderRadius: 12,
    backgroundColor: theme.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: { color: '#000', fontWeight: '800', fontSize: size.fontMd },
  removeBtn: {
    minHeight: size.touchMd,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.err,
  },
  removeText: { color: '#000', fontWeight: '800', fontSize: size.fontMd },
});
