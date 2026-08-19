import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { size, theme } from '../theme';
import type { Scene } from '../storage';

/**
 * Saveable whole-car looks. Tap a scene to apply it to every connected strip.
 * Saving uses an inline name field (no modals, per the field-use constraint).
 */
export function Scenes({
  scenes,
  onSave,
  onApply,
  onDelete,
}: {
  scenes: Scene[];
  onSave: (name: string) => void;
  onApply: (scene: Scene) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState('');
  const [managing, setManaging] = useState(false);

  return (
    <View>
      {scenes.length > 0 ? (
        <View style={styles.grid}>
          {scenes.map((s) => (
            <View key={s.id} style={styles.sceneWrap}>
              <Pressable
                onPress={() => onApply(s)}
                style={({ pressed }) => [styles.scene, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={styles.sceneText} numberOfLines={1}>
                  {s.name}
                </Text>
              </Pressable>
              {managing ? (
                <Pressable onPress={() => onDelete(s.id)} hitSlop={8} style={styles.del}>
                  <Text style={styles.delText}>✕</Text>
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.empty}>No scenes yet. Set a look, then save it below.</Text>
      )}

      <View style={styles.saveRow}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Name this look…"
          placeholderTextColor={theme.textDim}
          autoCorrect={false}
          style={styles.input}
        />
        <Pressable
          onPress={() => {
            onSave(name);
            setName('');
          }}
          style={styles.saveBtn}
          hitSlop={8}
        >
          <Text style={styles.saveText}>Save</Text>
        </Pressable>
      </View>

      {scenes.length > 0 ? (
        <Pressable onPress={() => setManaging((m) => !m)} style={styles.manage} hitSlop={8}>
          <Text style={styles.manageText}>{managing ? 'Done' : 'Delete scenes'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: size.gap, marginBottom: size.gap },
  sceneWrap: { position: 'relative' },
  scene: {
    minWidth: '30%',
    flexGrow: 1,
    minHeight: size.touchMd,
    borderRadius: size.radius,
    backgroundColor: theme.accentDim,
    borderWidth: 2,
    borderColor: theme.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  sceneText: { color: theme.text, fontSize: size.fontMd, fontWeight: '800' },
  del: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.err,
    alignItems: 'center',
    justifyContent: 'center',
  },
  delText: { color: '#000', fontWeight: '900', fontSize: 16 },
  empty: { color: theme.textDim, fontSize: size.fontSm, marginBottom: 12 },
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
    backgroundColor: theme.ok,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: { color: '#000', fontWeight: '800', fontSize: size.fontMd },
  manage: { paddingVertical: 14, alignItems: 'center' },
  manageText: { color: theme.textDim, fontSize: size.fontMd, fontWeight: '700' },
});
