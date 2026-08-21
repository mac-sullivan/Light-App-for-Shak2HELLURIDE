import React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { shadow, size, theme } from '../theme';

type Props = {
  label: string;
  onPress: () => void;
  active?: boolean;
  tone?: 'default' | 'on' | 'off' | 'accent';
  small?: boolean;
  style?: ViewStyle;
  disabled?: boolean;
  /** Fixed font size — use when a row of buttons must all render at the same size. */
  labelSize?: number;
};

// Large, high-contrast pressable. Everything the user taps is one of these.
export function BigButton({ label, onPress, active, tone = 'default', small, style, disabled, labelSize }: Props) {
  const bg = active
    ? tone === 'on'
      ? theme.ok
      : tone === 'off'
        ? theme.err
        : theme.accent
    : theme.surfaceHi;
  const fg = active ? '#000' : theme.text;

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      disabled={disabled}
      android_disableSound
      hitSlop={8}
      style={({ pressed }) => [
        styles.base,
        small ? styles.small : styles.large,
        active ? shadow.glow(bg) : shadow.button,
        { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
        style,
      ]}
    >
      <View pointerEvents="none">
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
          style={[styles.label, { color: fg, fontSize: labelSize ?? (small ? size.fontMd : size.fontLg) }]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: size.radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  large: { minHeight: size.touchLg, paddingHorizontal: 20 },
  small: { minHeight: size.touchMd, paddingHorizontal: 16 },
  label: { fontWeight: '800', letterSpacing: 0.5 },
});
