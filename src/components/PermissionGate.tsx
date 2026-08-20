import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { size, theme } from '../theme';
import type { BtState } from '../ble/types';

const ICON = require('../../assets/icon.png');

// A random one drops onto the intro each launch. Funny, a little naughty, kind.
const QUOTES = [
  'You didn’t come this far to blend in.',
  'Consent first. Then chaos.',
  'Be so bright they need sunglasses at 3am.',
  'Warning: contents may cause bad decisions and great memories.',
  'Flirt with everyone, commit to the light show.',
  'Your ex isn’t thinking about you. The lights are. Focus.',
  'Hotter than the playa at noon, sweeter than the dawn.',
  'Somebody’s having the night of their life tonight. Might be you.',
  'Radically yourself, aggressively lit.',
  'Shine like you mean it. Touch like you’re asked.',
  'Leave ’em glowing. Leave no trace.',
  'Sweaty, dusty, glowing, unstoppable.',
  'Be the reason someone believes in magic tonight.',
  'Turn it up. The desert can take it.',
  'You’re a whole vibe. Go be loud about it.',
  'Dust in your teeth, stars in your eyes, fire on your shack.',
];

// Full-screen fire that fades to dark at the top so text stays readable.
function FireBackground() {
  const a = useRef(new Animated.Value(0)).current;
  const b = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const mk = (v: Animated.Value, dur: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, { toValue: 1, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );
    const l1 = mk(a, 2300);
    const l2 = mk(b, 1500);
    l1.start();
    l2.start();
    return () => { l1.stop(); l2.stop(); };
  }, [a, b]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={['#000000', '#0a0400', '#2a0d00', '#5e2100']}
        locations={[0, 0.42, 0.72, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View
        style={[
          styles.glow,
          {
            opacity: a.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.72] }),
            transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [24, -12] }) }],
          },
        ]}
      >
        <LinearGradient colors={['transparent', '#ff6a0077', '#ff2200cc']} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View
        style={[
          styles.glow,
          {
            opacity: b.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.6] }),
            transform: [{ translateY: b.interpolate({ inputRange: [0, 1], outputRange: [12, -24] }) }],
          },
        ]}
      >
        <LinearGradient colors={['transparent', '#ffb30055', '#ff7a0099']} locations={[0, 0.6, 1]} style={StyleSheet.absoluteFill} />
      </Animated.View>
    </View>
  );
}

// Sleek dark + gold luxury button.
function LuxuryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1, marginTop: 4 })}>
      <LinearGradient
        colors={['#2b2118', '#191411', '#0c0a09']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.luxBtn}
      >
        <Text style={styles.luxText}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

/**
 * Shown before the main UI. Explains why we need Bluetooth (no modals), then
 * lets the user start — which lazily creates the BleManager and triggers the
 * OS permission prompt. Also handles the not-authorized / radio-off states.
 */
export function PermissionGate({
  bt,
  started,
  onStart,
  children,
}: {
  bt: BtState;
  started: boolean;
  onStart: () => void;
  children: React.ReactNode;
}) {
  const quote = useMemo(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]!, []);

  if (started && bt === 'PoweredOn') return <>{children}</>;

  if (started && bt === 'Unauthorized') {
    return (
      <Gate
        title="Bluetooth is blocked"
        body="Enable Bluetooth for this app in Settings so it can reach the LED controllers."
        button="Open Settings"
        onPress={() => Linking.openSettings()}
      />
    );
  }
  if (started && bt === 'PoweredOff') {
    return (
      <Gate
        title="Bluetooth is off"
        body="Turn on Bluetooth (Control Center or Settings) to connect to the shack lights."
        button="Open Settings"
        onPress={() => Linking.openSettings()}
      />
    );
  }
  if (started && bt === 'Unsupported') {
    return <Gate title="No Bluetooth LE" body="This device can't do Bluetooth Low Energy." />;
  }

  return (
    <Gate
      title="Shack-To-Hell-U-Ride"
      subtitle="LED Controls"
      body="Runs every strip on the shack over Bluetooth."
      quote={quote}
      button="Light it up"
      onPress={onStart}
    />
  );
}

function Gate({
  title,
  subtitle,
  body,
  quote,
  button,
  onPress,
}: {
  title: string;
  subtitle?: string;
  body: string;
  quote?: string;
  button?: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <FireBackground />
      <View style={styles.content}>
        <Image source={ICON} style={styles.icon} />
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <Text style={styles.body}>{body}</Text>
        {quote ? <Text style={styles.quote}>“{quote}”</Text> : null}
        {button && onPress ? <LuxuryButton label={button} onPress={onPress} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#000' },
  content: { flex: 1, padding: 32, justifyContent: 'center' },
  glow: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '65%' },
  icon: { width: 104, height: 104, borderRadius: 26, marginBottom: 24 },
  title: { color: theme.text, fontSize: 40, fontWeight: '900', letterSpacing: 0.5 },
  subtitle: { color: '#ffb37a', fontSize: 22, fontWeight: '800', letterSpacing: 3, textTransform: 'uppercase', marginTop: 2, marginBottom: 16 },
  body: { color: '#e8d9cf', fontSize: size.fontMd, lineHeight: 26, marginBottom: 18 },
  quote: { color: '#ffcaa0', fontSize: size.fontMd, fontStyle: 'italic', fontWeight: '600', lineHeight: 26, marginBottom: 34 },
  luxBtn: {
    paddingVertical: 22,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#c9a24b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  luxText: { color: '#e8c67a', fontSize: 20, fontWeight: '800', letterSpacing: 4, textTransform: 'uppercase' },
});
