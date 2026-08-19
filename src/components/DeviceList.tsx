import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { size, theme } from '../theme';
import type { DeviceEntry } from '../ble/types';
import { StatusDot, connLabel } from './StatusDot';

const rgbCss = (c: { r: number; g: number; b: number }) => `rgb(${c.r},${c.g},${c.b})`;

export function DeviceList({
  devices,
  editing,
  onTogglePower,
  onRemove,
  onAdd,
}: {
  devices: DeviceEntry[];
  editing: boolean;
  onTogglePower: (name: string, on: boolean) => void;
  onRemove: (name: string) => void;
  onAdd: (name: string) => void;
}) {
  const [draft, setDraft] = useState('');

  return (
    <View>
      {devices.map((d) => (
        <View key={d.name} style={styles.row}>
          <StatusDot state={d.state} />
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>
              {d.name}
            </Text>
            <Text style={[styles.state, { color: d.state === 'connected' ? theme.ok : theme.textDim }]}>
              {connLabel(d.state)}
              {d.lastError && d.state !== 'connected' ? ` · ${d.lastError}` : ''}
            </Text>
          </View>

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
      ))}

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
  removeBtn: {
    minHeight: size.touchMd,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.err,
  },
  removeText: { color: '#000', fontWeight: '800', fontSize: size.fontMd },
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
});
