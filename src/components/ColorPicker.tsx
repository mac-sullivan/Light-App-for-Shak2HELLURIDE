import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HapticSlider as Slider } from './HapticSlider';
import { LinearGradient } from 'expo-linear-gradient';
import { size, theme } from '../theme';
import type { RGB } from '../protocol';
import { hsvToRgb, rgbCss, rgbToHsv } from '../util/color';

const HUE_STOPS = ['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ff0000'] as const;

/**
 * Precise, scroll-safe hue picker. Saturation is locked at 100% (vivid LED
 * color) and brightness lives just below, in the panel. Horizontal slider so
 * it never fights the vertical page scroll.
 */
export function ColorPicker({
  color,
  onChange,
  onComplete,
}: {
  color: RGB;
  onChange: (c: RGB) => void;
  onComplete: (c: RGB) => void;
}) {
  const [hue, setHue] = useState(rgbToHsv(color).h);
  const current = hsvToRgb(hue, 1, 1);

  return (
    <View>
      <View style={[styles.preview, { backgroundColor: rgbCss(current) }]} />

      <Text style={styles.label}>Hue</Text>
      <View style={styles.sliderWrap}>
        <LinearGradient
          colors={HUE_STOPS as unknown as readonly [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.track}
        />
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={360}
          step={1}
          value={hue}
          minimumTrackTintColor="transparent"
          maximumTrackTintColor="transparent"
          thumbTintColor="#ffffff"
          onValueChange={(v) => {
            setHue(v);
            onChange(hsvToRgb(v, 1, 1));
          }}
          onSlidingComplete={(v) => onComplete(hsvToRgb(v, 1, 1))}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  preview: {
    height: 72,
    borderRadius: size.radius,
    borderWidth: 2,
    borderColor: theme.border,
    marginBottom: 6,
  },
  label: { color: theme.textDim, fontSize: size.fontSm, fontWeight: '800', letterSpacing: 1, marginTop: 12, marginBottom: 2 },
  sliderWrap: { justifyContent: 'center', height: 48 },
  track: {
    position: 'absolute',
    left: 6,
    right: 6,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#00000055',
  },
  slider: { width: '100%', height: 48 },
});
