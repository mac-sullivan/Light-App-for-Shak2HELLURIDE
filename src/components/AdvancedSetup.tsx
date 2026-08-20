import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { IC_MODELS } from '../protocol';
import { size, theme } from '../theme';

/**
 * One-time hardware setup for a controller, applied to the current selection.
 * Use this for strips that render differently (e.g. the Back Step pods washing
 * out to white — an RGBW/IC-model issue). These settings persist on the
 * controller itself.
 */
export function AdvancedSetup({
  targetLabel,
  onIcModel,
  onWhite,
  onWhiteFinal,
  onPixels,
}: {
  targetLabel: string;
  onIcModel: (index: number) => void;
  onWhite: (value: number) => void;
  onWhiteFinal: (value: number) => void;
  onPixels: (count: number) => void;
}) {
  const [white, setWhite] = useState(0);
  const [pixels, setPixels] = useState(60);
  const [icIndex, setIcIndex] = useState<number | null>(null);

  return (
    <View>
      <Text style={styles.applies}>Applies to: {targetLabel}</Text>

      <Text style={styles.label}>White channel (RGBW) — drag to 0 to remove white wash</Text>
      <Slider
        minimumValue={0}
        maximumValue={255}
        step={1}
        value={white}
        minimumTrackTintColor={theme.text}
        maximumTrackTintColor={theme.surfaceHi}
        thumbTintColor={theme.text}
        onValueChange={(v) => {
          setWhite(v);
          onWhite(v);
        }}
        onSlidingComplete={(v) => onWhiteFinal(v)}
        style={styles.slider}
      />

      <Text style={styles.label}>Pixel / pod count · {pixels}</Text>
      <Slider
        minimumValue={1}
        maximumValue={300}
        step={1}
        value={pixels}
        minimumTrackTintColor={theme.accent}
        maximumTrackTintColor={theme.surfaceHi}
        thumbTintColor={theme.text}
        onValueChange={setPixels}
        onSlidingComplete={(v) => onPixels(v)}
        style={styles.slider}
      />

      <Text style={styles.label}>LED chip type — tap different ones until color looks right</Text>
      <View style={styles.grid}>
        {IC_MODELS.map((m, i) => (
          <Pressable
            key={m}
            onPress={() => {
              setIcIndex(i);
              onIcModel(i);
            }}
            style={({ pressed }) => [
              styles.chip,
              icIndex === i && styles.chipActive,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={[styles.chipText, icIndex === i && styles.chipTextActive]}>{m}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  applies: { color: theme.accent, fontSize: size.fontSm, fontWeight: '800', marginTop: size.gap, marginBottom: 4 },
  label: { color: theme.textDim, fontSize: size.fontSm, fontWeight: '700', marginTop: 14, marginBottom: 2 },
  slider: { width: '100%', height: 48 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  chip: {
    minHeight: 44,
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: theme.surfaceHi,
    borderWidth: 2,
    borderColor: theme.border,
  },
  chipActive: { backgroundColor: theme.accentDim, borderColor: theme.accent },
  chipText: { color: theme.text, fontSize: 13, fontWeight: '700' },
  chipTextActive: { color: theme.text },
});
