import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { size, theme } from '../theme';
import { BigButton } from './BigButton';
import type { BtState } from '../ble/types';

/**
 * Shown before the main UI. Explains why we need Bluetooth (no modals), then
 * lets the user start — which lazily creates the BleManager and triggers the
 * iOS permission prompt. Also handles the not-authorized / radio-off states
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
  // Once we're started and the radio is on, show the app.
  if (started && bt === 'PoweredOn') return <>{children}</>;

  // Started but blocked -> explain inline.
  if (started && bt === 'Unauthorized') {
    return (
      <Gate
        title="Bluetooth is blocked"
        body="Enable Bluetooth for this app in iOS Settings so it can reach the LED controllers."
        button="Open Settings"
        onPress={() => Linking.openSettings()}
      />
    );
  }
  if (started && bt === 'PoweredOff') {
    return (
      <Gate
        title="Bluetooth is off"
        body="Turn on Bluetooth (Control Center or Settings) to connect to the art car lights."
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
      title="Art Car Lights"
      body={
        'This app connects to your SP110E LED controllers over Bluetooth to run every strip on the car at once.\n\nIt never uses the internet — no accounts, no network, no tracking. Bluetooth is the only permission it needs.'
      }
      button="Enable Bluetooth & Connect"
      onPress={onStart}
    />
  );
}

function Gate({
  title,
  body,
  button,
  onPress,
}: {
  title: string;
  body: string;
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
      {button && onPress ? (
        <BigButton label={button} onPress={onPress} tone="accent" active style={styles.btn} />
      ) : null}
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
  body: { color: theme.textDim, fontSize: size.fontMd, lineHeight: 26, marginBottom: 32 },
  btn: { marginTop: 8 },
});
