import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Linking, StyleSheet, Text, View } from 'react-native';
import { size, theme } from '../theme';
import { BigButton } from './BigButton';
import type { BtState } from '../ble/types';

const FLAME_COLORS = ['#ff2d00', '#ff6a00', '#ff2d00', '#ffab00', '#ff4d00', '#ff8400', '#ff2d00'];

// A row of flickering flames along the bottom — a little poof-rig vibe.
function FireStrip() {
  const anims = useRef(FLAME_COLORS.map(() => new Animated.Value(Math.random()))).current;

  useEffect(() => {
    const loops = anims.map((v, i) => {
      const dur = 420 + ((i * 130) % 380);
      return Animated.loop(
        Animated.sequence([
          Animated.timing(v, { toValue: 1, duration: dur, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: dur * 0.85, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])
      );
    });
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [anims]);

  return (
    <View style={styles.fireRow} pointerEvents="none">
      {anims.map((v, i) => {
        const scaleY = v.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1.35] });
        const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [10, -10] });
        const opacity = v.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.95] });
        return (
          <Animated.View
            key={i}
            style={[
              styles.flame,
              { backgroundColor: FLAME_COLORS[i], opacity, transform: [{ translateY }, { scaleY }] },
            ]}
          />
        );
      })}
    </View>
  );
}

// A random one drops onto the intro each launch. Fun, kind, a little cheeky.
const QUOTES = [
  'Warning: may cause spontaneous dance parties.',
  'Consent is sexy. So are your LEDs.',
  'If the shack’s rockin’… crank the brightness.',
  'Dust happens. Sparkle anyway.',
  'Hydrate, then illuminate.',
  'Leave no trace, leave lots of glow.',
  'Radical self-expression, now in RGB.',
  'You look fantastic in ultraviolet.',
  'Some like it hot. Try the Hawty scene. 🔥',
  'Bright lights, questionable decisions.',
  'Turn it up until the neighbors send friend requests.',
  'Slaps harder than a dust storm.',
  'Be the light you want to see on the playa.',
  'Your aura is showing. It’s gorgeous.',
  'Trust the dust. Trust the funk.',
  'Come for the lights, stay for the shenanigans.',
];

/**
 * Shown before the main UI. Explains why we need Bluetooth (no modals), then
 * lets the user start — which lazily creates the BleManager and triggers the
 * OS permission prompt. Also handles the not-authorized / radio-off states
 * inline (never a blocking dialog).
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

  // Once we're started and the radio is on, show the app.
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

  // Not started yet -> rationale + start button.
  return (
    <Gate
      title="Shack-To-Hell-U-Ride LED Controls"
      body="This app connects to your SP110E LED controllers over Bluetooth to run every strip on the shack at once."
      quote={quote}
      button="🔥  Light it up  🔥"
      onPress={onStart}
    />
  );
}

function Gate({
  title,
  body,
  quote,
  button,
  onPress,
}: {
  title: string;
  body: string;
  quote?: string;
  button?: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>✷</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {quote ? <Text style={styles.quote}>“{quote}”</Text> : null}
      {button && onPress ? (
        <BigButton label={button} onPress={onPress} tone="accent" active style={styles.btn} />
      ) : null}
      <FireStrip />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.bg, padding: 28, justifyContent: 'center' },
  badge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    borderWidth: 2,
    borderColor: theme.accent,
  },
  badgeText: { color: theme.accent, fontSize: 48, fontWeight: '900' },
  title: { color: theme.text, fontSize: size.fontXl, fontWeight: '900', marginBottom: 16 },
  body: { color: theme.textDim, fontSize: size.fontMd, lineHeight: 26, marginBottom: 20 },
  quote: {
    color: theme.accent,
    fontSize: size.fontMd,
    fontStyle: 'italic',
    fontWeight: '700',
    lineHeight: 26,
    marginBottom: 32,
  },
  btn: { marginTop: 8, backgroundColor: '#ff6a00', borderColor: '#ffb300', minHeight: 76 },
  fireRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 90,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
  },
  flame: {
    flex: 1,
    marginHorizontal: 3,
    height: 60,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
});
