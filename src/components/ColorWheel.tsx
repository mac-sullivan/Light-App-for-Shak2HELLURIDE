import React, { useMemo, useRef } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, Path, RadialGradient, Stop } from 'react-native-svg';
import type { RGB } from '../protocol';
import { theme } from '../theme';

export function hsvToRgb(h: number, s: number, v: number): RGB {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; } else if (h < 180) { g = c; b = x; } else if (h < 240) { g = x; b = c; } else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) };
}

function rgbToHsv({ r, g, b }: RGB): { h: number; s: number; v: number } {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rr) h = ((gg - bb) / d) % 6;
    else if (max === gg) h = (bb - rr) / d + 2;
    else h = (rr - gg) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

/**
 * HSV color wheel. Angle = hue, distance from center = saturation. Value is
 * fixed at full here — brightness is handled by the hardware brightness slider.
 */
export function ColorWheel({
  color,
  onChange,
  onSelect,
  size = 280,
}: {
  color: RGB;
  onChange: (c: RGB) => void;
  onSelect: (c: RGB) => void;
  size?: number;
}) {
  const R = size / 2;
  const cx = R;
  const cy = R;

  const wedges = useMemo(() => {
    const out: { d: string; fill: string }[] = [];
    const step = 6;
    for (let a = 0; a < 360; a += step) {
      const a0 = (a * Math.PI) / 180;
      const a1 = ((a + step + 0.5) * Math.PI) / 180; // overlap to avoid seams
      const x0 = cx + R * Math.cos(a0);
      const y0 = cy + R * Math.sin(a0);
      const x1 = cx + R * Math.cos(a1);
      const y1 = cy + R * Math.sin(a1);
      const rgb = hsvToRgb(a, 1, 1);
      out.push({
        d: `M ${cx} ${cy} L ${x0} ${y0} A ${R} ${R} 0 0 1 ${x1} ${y1} Z`,
        fill: `rgb(${rgb.r},${rgb.g},${rgb.b})`,
      });
    }
    return out;
  }, [R, cx, cy]);

  const { h, s } = rgbToHsv(color);
  const thumbAngle = (h * Math.PI) / 180;
  const thumbR = s * R;
  const thumbX = cx + thumbR * Math.cos(thumbAngle);
  const thumbY = cy + thumbR * Math.sin(thumbAngle);

  // Keep latest callbacks so the once-created PanResponder always calls current.
  const onChangeRef = useRef(onChange);
  const onSelectRef = useRef(onSelect);
  onChangeRef.current = onChange;
  onSelectRef.current = onSelect;
  const lastRef = useRef<RGB>(color);

  const compute = (lx: number, ly: number): RGB => {
    const dx = lx - cx;
    const dy = ly - cy;
    const dist = Math.hypot(dx, dy);
    const sat = Math.min(1, dist / R);
    let deg = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (deg < 0) deg += 360;
    return hsvToRgb(deg, sat, 1);
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const rgb = compute(e.nativeEvent.locationX, e.nativeEvent.locationY);
        lastRef.current = rgb;
        onChangeRef.current(rgb);
      },
      onPanResponderMove: (e) => {
        const rgb = compute(e.nativeEvent.locationX, e.nativeEvent.locationY);
        lastRef.current = rgb;
        onChangeRef.current(rgb);
      },
      onPanResponderRelease: () => onSelectRef.current(lastRef.current),
      onPanResponderTerminate: () => onSelectRef.current(lastRef.current),
    })
  ).current;

  return (
    <View style={styles.wrap}>
      <View {...pan.panHandlers} style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Defs>
            <RadialGradient id="sat" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <G>
            {wedges.map((w, i) => (
              <Path key={i} d={w.d} fill={w.fill} />
            ))}
          </G>
          <Circle cx={cx} cy={cy} r={R} fill="url(#sat)" />
          {/* selected-color thumb */}
          <Circle
            cx={thumbX}
            cy={thumbY}
            r={16}
            fill={`rgb(${color.r},${color.g},${color.b})`}
            stroke="#ffffff"
            strokeWidth={4}
          />
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 8, backgroundColor: theme.surface },
});
