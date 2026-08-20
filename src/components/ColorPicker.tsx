import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { size, theme } from '../theme';
import type { RGB } from '../protocol';
import { hsvToRgb, rgbCss, rgbToHsv } from '../util/color';

const HUE_STOPS = ['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ff0000'] as const;

/**
 * Precise, scroll-safe color picker: a rainbow Hue slider + a Saturation
 * slider, with a large live preview. Horizontal sliders never fight the
 * vertical page scroll (the old drag-on-a-wheel control did).
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
  const initial = rgbToHsv(color);
  const [hue, setHue] = useState(initial.h);
  const [sat, setSat] = useState(initial.s);

  const current = hsvToRgb(hue, sat, 1);
  const fullHue = hsvToRgb(hue, 1, 1);

  const emit = (h: number, s: number, done: boolean) => {
    const rgb = hsvToRgb(h, s, 1);
    (done ? onComplete : onChange)(rgb);
  };

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
            emit(v, sat, false);
          }}
          onSlidingComplete={(v) => emit(v, sat, true)}
        />
      </View>

      <Text style={styles.label}>Saturation</Text>
      <View style={styles.sliderWrap}>
        <LinearGradient
          colors={['#ffffff', rgbCss(fullHue)] as readonly [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.track}
        />
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={1}
          step={0.01}
          value={sat}
          minimumTrackTintColor="transparent"
          maximumTrackTintColor="transparent"
          thumbTintColor="#ffffff"
          onValueChange={(v) => {
            setSat(v);
            emit(hue, v, false);
          }}
          onSlidingComplete={(v) => emit(hue, v, true)}
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
