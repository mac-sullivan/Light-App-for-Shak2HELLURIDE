import React, { useEffect, useRef, useState } from 'react';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';

type SliderProps = React.ComponentProps<typeof Slider>;

/**
 * A Slider that fires a subtle haptic "tick" every `hapticStep` units dragged.
 *
 * It also hides itself for the first few hundred ms after mounting: the native
 * iOS slider animates its thumb up from 0 to the initial value on first mount,
 * which looks like a glitchy jump. We let that settle while invisible, then fade in.
 */
export function HapticSlider({ hapticStep = 8, onValueChange, style, ...props }: SliderProps & { hapticStep?: number }) {
  const last = useRef<number | null>(null);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSettled(true), 380);
    return () => clearTimeout(t);
  }, []);

  return (
    <Slider
      {...props}
      style={[style, { opacity: settled ? 1 : 0 }]}
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
