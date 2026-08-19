import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SWATCHES } from '../effects';
import type { RGB } from '../protocol';
import { size, theme } from '../theme';

const rgbCss = (c: RGB) => `rgb(${c.r},${c.g},${c.b})`;
const sameColor = (a: RGB | undefined, b: RGB) => !!a && a.r === b.r && a.g === b.g && a.b === b.b;

export function ColorPad({ selected, onPick }: { selected?: RGB; onPick: (c: RGB) => void }) {
  return (
    <View style={styles.grid}>
      {SWATCHES.map((s) => {
        const active = sameColor(selected, s.rgb);
        return (
          <Pressable
            key={s.name}
            onPress={() => onPick(s.rgb)}
            hitSlop={4}
            style={({ pressed }) => [
              styles.swatch,
              { backgroundColor: rgbCss(s.rgb), opacity: pressed ? 0.7 : 1 },
              active && styles.active,
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: size.gap, justifyContent: 'space-between' },
  swatch: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: size.radius,
    borderWidth: 2,
    borderColor: '#00000055',
  },
  active: { borderColor: theme.text, borderWidth: 4 },
});
