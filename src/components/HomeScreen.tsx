import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { size, theme } from '../theme';
import { useLightManager } from '../hooks/useLightManager';
import { BigButton } from './BigButton';
import { ControlPanel } from './ControlPanel';
import { DevicesPanel } from './DevicesPanel';

export function HomeScreen() {
  const { snapshot, manager } = useLightManager();
  const [tab, setTab] = useState<'control' | 'devices'>('control');

  const connected = snapshot.devices.filter((d) => d.state === 'connected').length;
  const total = snapshot.devices.length;

  const summaryColor = useMemo(() => {
    if (total === 0) return theme.textDim;
    if (connected === 0) return theme.err;
    if (connected < total) return theme.warn;
    return theme.ok;
  }, [connected, total]);

  return (
    <View style={styles.root}>
      {/* Shared header: connection state + reconnect, visible on both tabs */}
      <View style={styles.header}>
        <View style={[styles.summaryBar, { borderColor: summaryColor }]}>
          <Text style={[styles.summaryNum, { color: summaryColor }]}>
            {connected}/{total}
          </Text>
          <Text style={styles.summaryLabel}>LINKED</Text>
          {snapshot.scanning ? <Text style={styles.scanning}>scanning…</Text> : null}
        </View>
        <BigButton label="Reconnect all" onPress={() => manager.reconnectAll()} tone="accent" small style={styles.reconnect} />
      </View>

      {/* Tab switcher */}
      <View style={styles.tabs}>
        <BigButton label="Control" onPress={() => setTab('control')} active={tab === 'control'} tone="accent" small style={styles.flex} />
        <BigButton
          label={total ? `Devices · ${connected}/${total}` : 'Devices'}
          onPress={() => setTab('devices')}
          active={tab === 'devices'}
          tone="accent"
          small
          style={styles.flex}
        />
      </View>

      <View style={styles.body}>
        {tab === 'control' ? <ControlPanel /> : <DevicesPanel />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  header: {
    flexDirection: 'row',
    gap: size.gap,
    alignItems: 'stretch',
    paddingHorizontal: size.gap,
    paddingTop: size.gap,
  },
  summaryBar: {
    flex: 1,
    borderRadius: size.radius,
    borderWidth: 3,
    backgroundColor: theme.surface,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  summaryNum: { fontSize: size.fontXl, fontWeight: '900' },
  summaryLabel: { color: theme.textDim, fontSize: size.fontMd, fontWeight: '800', letterSpacing: 2 },
  scanning: { color: theme.warn, fontSize: size.fontSm, marginLeft: 'auto', fontWeight: '700' },
  reconnect: { justifyContent: 'center' },
  tabs: { flexDirection: 'row', gap: size.gap, paddingHorizontal: size.gap, paddingTop: size.gap },
  flex: { flex: 1 },
  body: { flex: 1, marginTop: size.gap },
});
