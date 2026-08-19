import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { size, theme } from '../theme';
import type { Group } from '../storage';

const sameSet = (a: string[], b: string[]) => {
  if (a.length !== b.length || a.length === 0) return false;
  const s = new Set(a);
  return b.every((x) => s.has(x));
};

/**
 * Named zones. Tapping a group selects its strips so the master controls drive
 * just that zone. "Save selection" turns the current selection into a group.
 */
export function Groups({
  groups,
  selected,
  onApply,
  onSave,
  onDelete,
}: {
  groups: Group[];
  selected: string[];
  onApply: (members: string[]) => void;
  onSave: (name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState('');
  const [managing, setManaging] = useState(false);

  return (
    <View>
      <View style={styles.grid}>
        {groups.map((g) => {
          const active = sameSet(g.members, selected);
          return (
            <View key={g.id} style={styles.chipWrap}>
              <Pressable
                onPress={() => onApply(g.members)}
                style={({ pressed }) => [
                  styles.chip,
                  active ? styles.chipActive : styles.chipIdle,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
                  {g.name}
                </Text>
                <Text style={[styles.count, active && styles.chipTextActive]}>{g.members.length}</Text>
              </Pressable>
              {managing ? (
                <Pressable onPress={() => onDelete(g.id)} hitSlop={8} style={styles.del}>
                  <Text style={styles.delText}>✕</Text>
                </Pressable>
              ) : null}
            </View>
          );
        })}
      </View>

      <View style={styles.saveRow}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={selected.length ? `Save ${selected.length} selected as…` : 'Select strips first…'}
          placeholderTextColor={theme.textDim}
          autoCorrect={false}
          style={styles.input}
        />
        <Pressable
          onPress={() => {
            onSave(name);
            setName('');
          }}
          style={[styles.saveBtn, selected.length === 0 && styles.dim]}
          disabled={selected.length === 0}
          hitSlop={8}
        >
          <Text style={styles.saveText}>Save</Text>
        </Pressable>
      </View>

      {groups.length > 0 ? (
        <Pressable onPress={() => setManaging((m) => !m)} style={styles.manage} hitSlop={8}>
          <Text style={styles.manageText}>{managing ? 'Done' : 'Delete groups'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chipWrap: { position: 'relative' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 52,
    paddingHorizontal: 18,
    borderRadius: 26,
    borderWidth: 2,
  },
  chipIdle: { backgroundColor: theme.surfaceHi, borderColor: theme.border },
  chipActive: { backgroundColor: theme.accent, borderColor: '#ffffff44' },
  chipText: { color: theme.text, fontSize: size.fontMd, fontWeight: '800' },
  chipTextActive: { color: '#000' },
  count: { color: theme.textDim, fontSize: size.fontSm, fontWeight: '700' },
  del: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.err,
    alignItems: 'center',
    justifyContent: 'center',
  },
  delText: { color: '#000', fontWeight: '900', fontSize: 15 },
  saveRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
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
  saveBtn: {
    minHeight: size.touchMd,
    paddingHorizontal: 22,
    borderRadius: 12,
    backgroundColor: theme.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: { color: '#000', fontWeight: '800', fontSize: size.fontMd },
  dim: { opacity: 0.4 },
  manage: { paddingVertical: 12, alignItems: 'center' },
  manageText: { color: theme.textDim, fontSize: size.fontMd, fontWeight: '700' },
});
