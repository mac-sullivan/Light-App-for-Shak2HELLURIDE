import React, { useRef } from 'react';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';

type SliderProps = React.ComponentProps<typeof Slider>;

/** A Slider that fires a subtle haptic "tick" every `hapticStep` units dragged. */
export function HapticSlider({ hapticStep = 8, onValueChange, ...props }: SliderProps & { hapticStep?: number }) {
  const last = useRef<number | null>(null);
  return (
    <Slider
      {...props}
      onValueChange={(v) => {
        if (last.current === null || Math.abs(v - last.current) >= hapticStep) {
          last.current = v;
          Haptics.selectionAsync().catch(() => {});
        }
        onValueChange?.(v);
      }}
    />
  );
}
