import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EFFECT_FAVORITES, effectName } from '../effects';
import { MAX_EFFECT, MIN_EFFECT } from '../protocol';
import { size, theme } from '../theme';

const ALL_MODES = Array.from({ length: MAX_EFFECT - MIN_EFFECT + 1 }, (_, i) => i + MIN_EFFECT);

export function EffectPad({
  selected,
  showAll,
  onPick,
  onToggleAll,
}: {
  selected?: number;
  showAll: boolean;
  onPick: (mode: number) => void;
  onToggleAll: () => void;
}) {
  return (
    <View>
      <Text style={styles.hint}>Names are labels — tap to see what each looks like on the strips</Text>

      <View style={styles.grid}>
        {EFFECT_FAVORITES.map((mode) => (
          <Pressable
            key={mode}
            onPress={() => onPick(mode)}
            style={({ pressed }) => [
              styles.pick,
              selected === mode && styles.active,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={styles.pickLabel} numberOfLines={1}>
              {effectName(mode)}
            </Text>
            <Text style={styles.pickNum}>#{mode}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={onToggleAll} style={styles.toggle} hitSlop={8}>
        <Text style={styles.toggleText}>{showAll ? '▲ Hide all effects' : '▼ All effects (1–120)'}</Text>
      </Pressable>

      {showAll ? (
        <View style={styles.allGrid}>
          {ALL_MODES.map((m) => (
            <Pressable
              key={m}
              onPress={() => onPick(m)}
              style={({ pressed }) => [
                styles.cell,
                selected === m && styles.active,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text style={styles.cellName} numberOfLines={1}>
                {effectName(m)}
              </Text>
              <Text style={styles.cellNum}>#{m}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hint: { color: theme.textDim, fontSize: size.fontSm, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: size.gap },
  pick: {
    minWidth: '30%',
    flexGrow: 1,
    minHeight: size.touchMd,
    borderRadius: size.radius,
    backgroundColor: theme.surfaceHi,
    borderWidth: 2,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  pickLabel: { color: theme.text, fontSize: size.fontMd, fontWeight: '800', textAlign: 'center' },
  pickNum: { color: theme.textDim, fontSize: size.fontSm, marginTop: 2 },
  active: { borderColor: theme.accent, backgroundColor: theme.accentDim },
  toggle: { paddingVertical: 16, alignItems: 'center' },
  toggleText: { color: theme.accent, fontSize: size.fontMd, fontWeight: '800' },
  allGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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
  cellName: { color: theme.text, fontSize: size.fontSm, fontWeight: '700', textAlign: 'center' },
  cellNum: { color: theme.textDim, fontSize: 12, marginTop: 2 },
});
