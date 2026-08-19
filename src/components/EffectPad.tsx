import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EFFECT_PICKS } from '../effects';
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
      <Text style={styles.hint}>Curated picks — labels are guesses, tap to explore</Text>
      <View style={styles.grid}>
        {EFFECT_PICKS.map((e) => (
          <Pressable
            key={e.name}
            onPress={() => onPick(e.mode)}
            style={({ pressed }) => [
              styles.pick,
              selected === e.mode && styles.active,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={styles.pickLabel}>{e.name}</Text>
            <Text style={styles.pickNum}>#{e.mode}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={onToggleAll} style={styles.toggle} hitSlop={8}>
        <Text style={styles.toggleText}>{showAll ? '▲ Hide all effects' : '▼ All effects (1–120)'}</Text>
      </Pressable>

      {showAll ? (
        <View style={styles.numGrid}>
          {ALL_MODES.map((m) => (
            <Pressable
              key={m}
              onPress={() => onPick(m)}
              style={({ pressed }) => [
                styles.numCell,
                selected === m && styles.active,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text style={styles.numText}>{m}</Text>
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
  },
  pickLabel: { color: theme.text, fontSize: size.fontMd, fontWeight: '800' },
  pickNum: { color: theme.textDim, fontSize: size.fontSm, marginTop: 2 },
  active: { borderColor: theme.accent, backgroundColor: theme.accentDim },
  toggle: { paddingVertical: 16, alignItems: 'center' },
  toggleText: { color: theme.accent, fontSize: size.fontMd, fontWeight: '800' },
  numGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  numCell: {
    width: '15%',
    aspectRatio: 1.2,
    borderRadius: 12,
    backgroundColor: theme.surfaceHi,
    borderWidth: 2,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numText: { color: theme.text, fontSize: size.fontMd, fontWeight: '700' },
});
