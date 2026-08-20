import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { size, theme } from '../theme';
import { useLightManager } from '../hooks/useLightManager';
import { BigButton } from './BigButton';
import { ControlPanel } from './ControlPanel';
import { ScenesPanel } from './ScenesPanel';
import { DevicesPanel } from './DevicesPanel';

type Tab = 'control' | 'scenes' | 'devices';

export function HomeScreen() {
  const { snapshot } = useLightManager();
  const [tab, setTab] = useState<Tab>('control');

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
      <View style={styles.body}>
        {tab === 'control' ? <ControlPanel /> : tab === 'scenes' ? <ScenesPanel /> : <DevicesPanel />}
      </View>

      {/* Fixed status pill, always pinned to the top-right corner */}
      <View style={styles.statusPill} pointerEvents="none">
        <View style={[styles.pill, { borderColor: summaryColor }]}>
          <View style={[styles.dot, { backgroundColor: summaryColor }]} />
          <Text style={[styles.count, { color: summaryColor }]}>
            {connected}/{total}
          </Text>
          {snapshot.scanning ? <Text style={styles.scan}>⟳</Text> : null}
        </View>
      </View>

      {/* Bottom tabs */}
      <View style={styles.tabs}>
        <BigButton label="Control" active={tab === 'control'} onPress={() => setTab('control')} tone="accent" small style={styles.flex} />
        <BigButton label="Scenes" active={tab === 'scenes'} onPress={() => setTab('scenes')} tone="accent" small style={styles.flex} />
        <BigButton label="Devices" active={tab === 'devices'} onPress={() => setTab('devices')} tone="accent" small style={styles.flex} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  body: { flex: 1 },
  statusPill: { position: 'absolute', top: 6, right: size.gap, zIndex: 10 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderRadius: 20,
    backgroundColor: theme.surface,
    paddingHorizontal: 12,
    height: 40,
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  count: { fontSize: size.fontMd, fontWeight: '900' },
  scan: { color: theme.warn, fontSize: 15, fontWeight: '900' },
  tabs: {
    flexDirection: 'row',
    gap: size.gap,
    paddingHorizontal: size.gap,
    paddingTop: 8,
    paddingBottom: 6,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    backgroundColor: theme.surface,
  },
  flex: { flex: 1 },
});
