import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { size, theme } from '../theme';
import type { DeviceEntry } from '../ble/types';
import type { RGB } from '../protocol';
import { StatusDot, connLabel } from './StatusDot';

const rgbCss = (c: RGB) => `rgb(${c.r},${c.g},${c.b})`;
const nameOf = (d: DeviceEntry) => d.label || d.name;

export function DeviceList({
  devices,
  editing,
  selected,
  onToggleSelect,
  onTogglePower,
  onRemove,
  onAdd,
  onSetLabel,
}: {
  devices: DeviceEntry[];
  editing: boolean;
  selected: string[];
  onToggleSelect: (name: string) => void;
  onTogglePower: (name: string, on: boolean) => void;
  onRemove: (name: string) => void;
  onAdd: (name: string) => void;
  onSetLabel: (name: string, label: string) => void;
}) {
  const [draft, setDraft] = useState('');
  const allSelected = selected.length === 0;
  const sel = new Set(selected);
  // While editing, keep a stable order so re-sorts don't steal input focus.
  const ordered = editing
    ? devices
    : [...devices].sort((a, b) => Number(b.state === 'connected') - Number(a.state === 'connected'));

  return (
    <View>
      {ordered.map((d) => {
        const isSelected = !allSelected && sel.has(d.name);
        if (editing) {
          return (
            <View key={d.name} style={styles.editRow}>
              <StatusDot state={d.state} />
              <View style={styles.editInfo}>
                <LabelInput device={d} onSetLabel={onSetLabel} />
                <Text style={styles.broadcast} numberOfLines={1}>
                  broadcasts as “{d.name}”
                </Text>
              </View>
              <Pressable onPress={() => onRemove(d.name)} hitSlop={8} style={styles.removeBtn}>
                <Text style={styles.removeText}>Remove</Text>
              </Pressable>
            </View>
          );
        }
        return (
          <View key={d.name} style={[styles.row, isSelected && styles.rowSelected]}>
            <StatusDot state={d.state} />
            <Pressable style={styles.info} onPress={() => onToggleSelect(d.name)}>
              <Text style={styles.name} numberOfLines={1}>
                {nameOf(d)}
              </Text>
              <Text style={[styles.state, { color: d.state === 'connected' ? theme.ok : theme.textDim }]}>
                {connLabel(d.state)}
                {isSelected ? '  • selected' : '  • tap to select'}
              </Text>
            </Pressable>
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
          </View>
        );
      })}

      {editing ? (
        <View style={styles.addRow}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Add a broadcast name…"
            placeholderTextColor={theme.textDim}
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

// Local editable label field so typing doesn't re-render the whole list.
function LabelInput({
  device,
  onSetLabel,
}: {
  device: DeviceEntry;
  onSetLabel: (name: string, label: string) => void;
}) {
  const [text, setText] = useState(device.label ?? '');
  return (
    <TextInput
      value={text}
      onChangeText={setText}
      onEndEditing={() => onSetLabel(device.name, text)}
      onBlur={() => onSetLabel(device.name, text)}
      placeholder={device.name}
      placeholderTextColor={theme.textDim}
      autoCorrect={false}
      style={styles.labelInput}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  rowSelected: { backgroundColor: theme.accentDim, borderBottomColor: theme.accent },
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
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  editInfo: { flex: 1 },
  labelInput: {
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: theme.surfaceAlt,
    borderWidth: 2,
    borderColor: theme.border,
    color: theme.text,
    fontSize: size.fontMd,
    fontWeight: '700',
    paddingHorizontal: 12,
  },
  broadcast: { color: theme.textDim, fontSize: 12, marginTop: 4, marginLeft: 4 },
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
