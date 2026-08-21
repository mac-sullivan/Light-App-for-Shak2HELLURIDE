import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { effectName } from '../effects';
import { MAX_EFFECT, MIN_EFFECT } from '../protocol';
import type { Scene } from '../storage';
import { size, theme } from '../theme';

const ALL_MODES = Array.from({ length: MAX_EFFECT - MIN_EFFECT + 1 }, (_, i) => i + MIN_EFFECT);

export function EffectPad({
  selected,
  onPick,
  scenes,
  onApplyScene,
}: {
  selected?: number;
  onPick: (mode: number) => void;
  scenes: Scene[];
  onApplyScene: (scene: Scene) => void;
}) {
  return (
    <View>
      {scenes.length > 0 ? (
        <>
          <Text style={styles.section}>My scenes</Text>
          <View style={styles.grid}>
            {scenes.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => onApplyScene(s)}
                style={({ pressed }) => [styles.cell, styles.sceneCell, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={styles.cellName} numberOfLines={1}>
                  ♥ {s.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}

      <Text style={styles.section}>All effects · {ALL_MODES.length}</Text>
      <Text style={styles.hint}>Tap any to preview it live on the strips</Text>
      <View style={styles.grid}>
        {ALL_MODES.map((m) => (
          <Pressable
            key={m}
            onPress={() => onPick(m)}
            style={({ pressed }) => [styles.cell, selected === m && styles.active, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={styles.cellName} numberOfLines={1}>
              {effectName(m)}
            </Text>
            <Text style={styles.cellNum}>#{m}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { color: theme.textDim, fontSize: size.fontSm, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginTop: 14, marginBottom: 6 },
  hint: { color: theme.textDim, fontSize: size.fontSm, marginBottom: 12, opacity: 0.8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: {
    width: '48%',
    minHeight: 58,
    borderRadius: 12,
    backgroundColor: theme.surfaceHi,
    borderWidth: 2,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  sceneCell: { borderColor: theme.accent, backgroundColor: theme.accentDim },
  cellName: { color: theme.text, fontSize: size.fontSm, fontWeight: '700', textAlign: 'center' },
  cellNum: { color: theme.textDim, fontSize: 12, marginTop: 2 },
  active: { borderColor: theme.accent, backgroundColor: theme.accentDim },
});
