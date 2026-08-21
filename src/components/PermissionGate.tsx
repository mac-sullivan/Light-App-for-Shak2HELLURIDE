import React, { useMemo } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { size, theme } from '../theme';
import { BigButton } from './BigButton';
import type { BtState } from '../ble/types';

const ICON = require('../../assets/icon.png');

const QUOTES = [
  'Give more than you take. Glow more than you burn.',
  'Slow down. This is the good part.',
  'Home is wherever the lights find you.',
  'Leave the playa better, leave the people brighter.',
  'The dust settles. The stars don’t.',
  'Be the reason someone believes in magic tonight.',
  'Tonight the desert belongs to the ones who show up.',
  'Say yes to the weird, beautiful thing.',
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
      <Gate title="Bluetooth is off" body="Turn on Bluetooth to connect to the shack lights." button="Open Settings" onPress={() => Linking.openSettings()} />
    );
  }
  if (started && bt === 'Unsupported') {
    return <Gate title="No Bluetooth LE" body="This device can't do Bluetooth Low Energy." />;
  }

  return <Intro quote={quote} onStart={onStart} />;
}

function Intro({ quote, onStart }: { quote: string; onStart: () => void }) {
  return (
    <View style={styles.wrap}>
      <LinearGradient colors={['#000000', '#070311', '#0e0720']} style={StyleSheet.absoluteFill} />

      <View style={styles.hero}>
        <View style={styles.iconGlow}>
          <Image source={ICON} style={styles.icon} />
        </View>
        <Text style={styles.name} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
          Shack-To-Hell-U-Ride
        </Text>
        <Text style={styles.subtitle}>LED CONTROLS</Text>
        <View style={styles.rule} />
        <Text style={styles.quote}>{quote}</Text>
      </View>

      <Pressable onPress={onStart} style={({ pressed }) => [styles.ctaGlow, { opacity: pressed ? 0.9 : 1 }]}>
        <LinearGradient colors={['#8A5CFF', '#6E3BFF', '#A64BFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
          <Text style={styles.ctaText}>LIGHT IT UP</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

function Gate({ title, body, button, onPress }: { title: string; body: string; button?: string; onPress?: () => void }) {
  return (
    <View style={[styles.wrap, { backgroundColor: theme.bg }]}>
      <View style={styles.hero}>
        <Text style={styles.gateTitle}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>
      {button && onPress ? <BigButton label={button} onPress={onPress} tone="accent" active /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#000', paddingHorizontal: 32, paddingTop: 48, paddingBottom: 48, justifyContent: 'space-between' },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconGlow: {
    marginBottom: 32,
    shadowColor: '#8A5CFF',
    shadowOpacity: 0.7,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
    elevation: 20,
  },
  icon: { width: 116, height: 116, borderRadius: 28 },
  name: { color: '#fff', fontSize: 34, fontWeight: '800', letterSpacing: 0.5, textAlign: 'center', alignSelf: 'stretch' },
  subtitle: { color: '#b9a7ff', fontSize: 13, fontWeight: '700', letterSpacing: 7, marginTop: 14 },
  rule: { width: 54, height: 1, backgroundColor: '#ffffff33', marginVertical: 28 },
  quote: { color: theme.textDim, fontSize: 15, fontStyle: 'italic', lineHeight: 22, textAlign: 'center', maxWidth: 300, opacity: 0.85 },
  ctaGlow: {
    borderRadius: 999,
    shadowColor: '#7C4DFF',
    shadowOpacity: 0.6,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  cta: { paddingVertical: 22, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 5 },
  gateTitle: { color: theme.text, fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 14 },
  body: { color: theme.textDim, fontSize: size.fontMd, lineHeight: 26, textAlign: 'center' },
});
