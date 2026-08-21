import React, { useMemo } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { size, theme } from '../theme';
import { BigButton } from './BigButton';
import type { BtState } from '../ble/types';

const ICON = require('../../assets/icon.png');

// One subtle line on the intro each launch — quiet, not cheesy.
const QUOTES = [
  'Give more than you take. Glow more than you burn.',
  'Slow down. This is the good part.',
  'Home is wherever the lights find you.',
  'Leave the playa better, leave the people brighter.',
  'The dust settles. The stars don’t.',
  'Be the reason someone believes in magic tonight.',
  'Tonight the desert belongs to the ones who show up.',
  'Say yes to the weird, beautiful thing.',
  'Somewhere out here, a stranger becomes a friend.',
  'Built in the dark, made to shine.',
];

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
        body="Turn on Bluetooth to connect to the shack lights."
        button="Open Settings"
        onPress={() => Linking.openSettings()}
      />
    );
  }
  if (started && bt === 'Unsupported') {
    return <Gate title="No Bluetooth LE" body="This device can't do Bluetooth Low Energy." />;
  }

  return <Intro quote={quote} onStart={onStart} />;
}

// Clean, centered, premium intro.
function Intro({ quote, onStart }: { quote: string; onStart: () => void }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.hero}>
        <Image source={ICON} style={styles.icon} />
        <Text style={styles.title}>Shack-To-Hell-U-Ride</Text>
        <Text style={styles.subtitle}>LED CONTROLS</Text>
        <View style={styles.rule} />
        <Text style={styles.quote}>{quote}</Text>
      </View>

      <Pressable onPress={onStart} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}>
        <LinearGradient
          colors={['#9a6bff', '#7C4DFF', '#5a34c9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cta}
        >
          <Text style={styles.ctaText}>LIGHT IT UP</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

// Plain gate used for the Bluetooth-off / blocked states.
function Gate({ title, body, button, onPress }: { title: string; body: string; button?: string; onPress?: () => void }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.hero}>
        <Text style={styles.gateTitle}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>
      {button && onPress ? <BigButton label={button} onPress={onPress} tone="accent" active /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#08080A', paddingHorizontal: 32, paddingTop: 40, paddingBottom: 40, justifyContent: 'space-between' },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  icon: { width: 112, height: 112, borderRadius: 28, marginBottom: 32 },
  title: { color: theme.text, fontSize: 30, fontWeight: '800', letterSpacing: 0.5, textAlign: 'center' },
  subtitle: { color: theme.textDim, fontSize: 13, fontWeight: '700', letterSpacing: 6, marginTop: 10 },
  rule: { width: 40, height: 2, borderRadius: 1, backgroundColor: theme.accent, marginVertical: 28, opacity: 0.9 },
  quote: { color: theme.textDim, fontSize: 16, fontStyle: 'italic', lineHeight: 24, textAlign: 'center', maxWidth: 300 },
  gateTitle: { color: theme.text, fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 14 },
  body: { color: theme.textDim, fontSize: size.fontMd, lineHeight: 26, textAlign: 'center' },
  cta: { paddingVertical: 22, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 4 },
});
