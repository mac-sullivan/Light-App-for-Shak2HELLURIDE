import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { size, theme } from '../theme';
import { useScenes } from '../hooks/useScenes';

export function ScenesPanel() {
  const { scenes, saveCurrent, applyScene, deleteScene } = useScenes();
  const [name, setName] = useState('');
  const [managing, setManaging] = useState(false);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Scenes</Text>
      <Text style={styles.sub}>Save the whole car's current look, then recall it with one tap.</Text>

      {/* Save current look */}
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
            saveCurrent(name);
            setName('');
          }}
          style={styles.saveBtn}
          hitSlop={8}
        >
          <Text style={styles.saveText}>Save</Text>
        </Pressable>
      </View>

      {scenes.length === 0 ? (
        <Text style={styles.empty}>
          No scenes yet. Set the car up how you like (colors, effects, per-group), then save it above.
        </Text>
      ) : (
        <View style={styles.grid}>
          {scenes.map((s) => (
            <View key={s.id} style={styles.sceneWrap}>
              <Pressable
                onPress={() => applyScene(s)}
                style={({ pressed }) => [styles.scene, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={styles.sceneText} numberOfLines={2}>
                  {s.name}
                </Text>
              </Pressable>
              {managing ? (
                <Pressable onPress={() => deleteScene(s.id)} hitSlop={8} style={styles.del}>
                  <Text style={styles.delText}>✕</Text>
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
      )}

      {scenes.length > 0 ? (
        <Pressable onPress={() => setManaging((m) => !m)} style={styles.manage} hitSlop={8}>
          <Text style={styles.manageText}>{managing ? 'Done' : 'Delete scenes'}</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  content: { padding: size.gap, paddingBottom: 48 },
  title: { color: theme.text, fontSize: size.fontLg, fontWeight: '900' },
  sub: { color: theme.textDim, fontSize: size.fontSm, marginTop: 4, marginBottom: 16 },
  saveRow: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 20 },
  input: {
    flex: 1,
    minHeight: size.touchLg,
    borderRadius: size.radius,
    backgroundColor: theme.surfaceAlt,
    borderWidth: 2,
    borderColor: theme.border,
    color: theme.text,
    fontSize: size.fontMd,
    paddingHorizontal: 16,
  },
  saveBtn: {
    minHeight: size.touchLg,
    paddingHorizontal: 28,
    borderRadius: size.radius,
    backgroundColor: theme.ok,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: { color: '#000', fontWeight: '900', fontSize: size.fontLg },
  empty: { color: theme.textDim, fontSize: size.fontMd, lineHeight: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: size.gap },
  sceneWrap: { position: 'relative', width: '48%' },
  scene: {
    minHeight: size.touchLg + 12,
    borderRadius: size.radius,
    backgroundColor: theme.accentDim,
    borderWidth: 2,
    borderColor: theme.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  sceneText: { color: theme.text, fontSize: size.fontMd, fontWeight: '800', textAlign: 'center' },
  del: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.err,
    alignItems: 'center',
    justifyContent: 'center',
  },
  delText: { color: '#000', fontWeight: '900', fontSize: 16 },
  manage: { paddingVertical: 18, alignItems: 'center' },
  manageText: { color: theme.textDim, fontSize: size.fontMd, fontWeight: '700' },
});
