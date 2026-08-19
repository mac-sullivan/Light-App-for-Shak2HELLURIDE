import React from 'react';
import { StyleSheet, View } from 'react-native';
import { theme } from '../theme';
import type { ConnState } from '../ble/types';

export function connColor(state: ConnState): string {
  switch (state) {
    case 'connected':
      return theme.ok;
    case 'connecting':
    case 'reconnecting':
      return theme.warn;
    default:
      return theme.err;
  }
}

export function connLabel(state: ConnState): string {
  switch (state) {
    case 'connected':
      return 'LINKED';
    case 'connecting':
      return 'LINKING…';
    case 'reconnecting':
      return 'RETRYING…';
    case 'error':
      return 'FAILED';
    default:
      return 'OFFLINE';
  }
}

export function StatusDot({ state, size = 22 }: { state: ConnState; size?: number }) {
  return (
    <View
      style={[
        styles.dot,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: connColor(state) },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  dot: { borderWidth: 2, borderColor: '#00000066' },
});
