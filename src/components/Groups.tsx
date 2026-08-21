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
 * Named zones. Tapping a group selects its strips. "Save as group" (tucked
 * behind a button) turns the current selection into a reusable group.
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
  const [saving, setSaving] = useState(false);
  const [managing, setManaging] = useState(false);

  return (
    <View>
      {groups.length > 0 ? (
        <>
          <Text style={styles.section}>Groups</Text>
          <View style={styles.grid}>
            {groups.map((g) => {
              const active = sameSet(g.members, selected);
              return (
                <View key={g.id} style={styles.chipWrap}>
                  <Pressable
                    onPress={() => onApply(g.members)}
                    style={({ pressed }) => [styles.chip, active ? styles.chipActive : styles.chipIdle, { opacity: pressed ? 0.7 : 1 }]}
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
        </>
      ) : null}

      {saving ? (
        <View style={styles.saveRow}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={selected.length ? `Name for ${selected.length} strips…` : 'Select strips first…'}
            placeholderTextColor={theme.textDim}
            autoCorrect={false}
            autoFocus
            style={styles.input}
          />
          <Pressable
            onPress={() => {
              onSave(name);
              setName('');
              setSaving(false);
            }}
            style={[styles.saveBtn, selected.length === 0 && styles.dim]}
            disabled={selected.length === 0}
            hitSlop={8}
          >
            <Text style={styles.saveText}>Save</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.actions}>
          <Pressable onPress={() => setSaving(true)} hitSlop={8}>
            <Text style={styles.link}>＋ Save selection as a group</Text>
          </Pressable>
          {groups.length > 0 ? (
            <Pressable onPress={() => setManaging((m) => !m)} hitSlop={8}>
              <Text style={styles.linkDim}>{managing ? 'Done' : 'Edit'}</Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { color: theme.textDim, fontSize: size.fontSm, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginTop: size.gap, marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  chipWrap: { position: 'relative' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 52, paddingHorizontal: 18, borderRadius: 26, borderWidth: 2 },
  chipIdle: { backgroundColor: theme.surfaceHi, borderColor: theme.border },
  chipActive: { backgroundColor: theme.accent, borderColor: '#ffffff44' },
  chipText: { color: theme.text, fontSize: size.fontMd, fontWeight: '800' },
  chipTextActive: { color: '#000' },
  count: { color: theme.textDim, fontSize: size.fontSm, fontWeight: '700' },
  del: { position: 'absolute', top: -8, right: -8, width: 28, height: 28, borderRadius: 14, backgroundColor: theme.err, alignItems: 'center', justifyContent: 'center' },
  delText: { color: '#000', fontWeight: '900', fontSize: 15 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  link: { color: theme.accent, fontSize: size.fontMd, fontWeight: '800' },
  linkDim: { color: theme.textDim, fontSize: size.fontMd, fontWeight: '700' },
  saveRow: { flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 10 },
  input: { flex: 1, minHeight: size.touchMd, borderRadius: 12, backgroundColor: theme.surfaceAlt, borderWidth: 2, borderColor: theme.border, color: theme.text, fontSize: size.fontMd, paddingHorizontal: 14 },
  saveBtn: { minHeight: size.touchMd, paddingHorizontal: 22, borderRadius: 12, backgroundColor: theme.accent, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#000', fontWeight: '800', fontSize: size.fontMd },
  dim: { opacity: 0.4 },
});
