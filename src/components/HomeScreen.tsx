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
      {/* Main content */}
      <View style={styles.body}>{tab === 'control' ? <ControlPanel /> : <DevicesPanel />}</View>

      {/* Bottom control bar: status + reconnect + tab switcher */}
      <View style={styles.bar}>
        <View style={styles.statusRow}>
          <View style={[styles.pill, { borderColor: summaryColor }]}>
            <View style={[styles.dot, { backgroundColor: summaryColor }]} />
            <Text style={[styles.count, { color: summaryColor }]}>
              {connected}/{total}
            </Text>
            <Text style={styles.linked}>{snapshot.scanning ? 'scanning…' : 'linked'}</Text>
          </View>
          <BigButton label="Reconnect all" onPress={() => manager.reconnectAll()} tone="accent" small style={styles.reconnect} />
        </View>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  body: { flex: 1 },
  bar: {
    borderTopWidth: 1,
    borderTopColor: theme.border,
    backgroundColor: theme.surface,
    paddingHorizontal: size.gap,
    paddingTop: 10,
    paddingBottom: 6,
    gap: 10,
  },
  statusRow: { flexDirection: 'row', gap: size.gap, alignItems: 'stretch' },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 2,
    borderRadius: size.radius,
    backgroundColor: theme.surfaceAlt,
    paddingHorizontal: 16,
    minHeight: size.touchMd,
  },
  dot: { width: 16, height: 16, borderRadius: 8 },
  count: { fontSize: size.fontLg, fontWeight: '900' },
  linked: { color: theme.textDim, fontSize: size.fontSm, fontWeight: '800', letterSpacing: 1 },
  reconnect: { justifyContent: 'center', minWidth: 150 },
  tabs: { flexDirection: 'row', gap: size.gap },
  flex: { flex: 1 },
});
