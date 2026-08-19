import React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { size, theme } from '../theme';

type Props = {
  label: string;
  onPress: () => void;
  active?: boolean;
  tone?: 'default' | 'on' | 'off' | 'accent';
  small?: boolean;
  style?: ViewStyle;
  disabled?: boolean;
};

// Large, high-contrast pressable. Everything the user taps is one of these.
export function BigButton({ label, onPress, active, tone = 'default', small, style, disabled }: Props) {
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
      onPress={onPress}
      disabled={disabled}
      android_disableSound
      hitSlop={8}
      style={({ pressed }) => [
        styles.base,
        small ? styles.small : styles.large,
        { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
        active && styles.activeBorder,
        style,
      ]}
    >
      <View pointerEvents="none">
        <Text style={[styles.label, { color: fg, fontSize: small ? size.fontMd : size.fontLg }]}>
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
    borderWidth: 2,
    borderColor: theme.border,
  },
  large: { minHeight: size.touchLg, paddingHorizontal: 20 },
  small: { minHeight: size.touchMd, paddingHorizontal: 16 },
  activeBorder: { borderColor: '#ffffff33' },
  label: { fontWeight: '800', letterSpacing: 0.5 },
});
