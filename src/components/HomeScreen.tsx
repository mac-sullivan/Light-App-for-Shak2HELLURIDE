import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { size, theme } from '../theme';
import { useLightManager } from '../hooks/useLightManager';
import { BigButton } from './BigButton';
import { ControlPanel } from './ControlPanel';
import { ScenesPanel } from './ScenesPanel';
import { DevicesPanel } from './DevicesPanel';

type Tab = 'control' | 'scenes' | 'devices';

export function HomeScreen() {
  const { snapshot, manager } = useLightManager();
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

      {/* Compact bottom bar: status dot + count, reconnect icon, tabs */}
      <View style={styles.bar}>
        <View style={styles.statusRow}>
          <View style={[styles.pill, { borderColor: summaryColor }]}>
            <View style={[styles.dot, { backgroundColor: summaryColor }]} />
            <Text style={[styles.count, { color: summaryColor }]}>
              {connected}/{total}
            </Text>
          </View>
          <Pressable
            onPress={() => manager.reconnectAll()}
            hitSlop={8}
            style={({ pressed }) => [styles.reconnect, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={styles.reconnectIcon}>↻</Text>
          </Pressable>
          {snapshot.scanning ? <Text style={styles.scanning}>scanning…</Text> : null}
        </View>

        <View style={styles.tabs}>
          <Tab label="Control" active={tab === 'control'} onPress={() => setTab('control')} />
          <Tab label="Scenes" active={tab === 'scenes'} onPress={() => setTab('scenes')} />
          <Tab label="Devices" active={tab === 'devices'} onPress={() => setTab('devices')} />
        </View>
      </View>
    </View>
  );
}

function Tab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <BigButton label={label} active={active} onPress={onPress} tone="accent" small style={styles.flex} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  body: { flex: 1 },
  bar: {
    borderTopWidth: 1,
    borderTopColor: theme.border,
    backgroundColor: theme.surface,
    paddingHorizontal: size.gap,
    paddingTop: 8,
    paddingBottom: 6,
    gap: 8,
  },
  statusRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderRadius: 22,
    backgroundColor: theme.surfaceAlt,
    paddingHorizontal: 14,
    height: 44,
  },
  dot: { width: 14, height: 14, borderRadius: 7 },
  count: { fontSize: size.fontMd, fontWeight: '900' },
  reconnect: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.surfaceHi,
    borderWidth: 2,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reconnectIcon: { color: theme.text, fontSize: 24, fontWeight: '900', marginTop: -2 },
  scanning: { color: theme.warn, fontSize: size.fontSm, fontWeight: '700', marginLeft: 'auto' },
  tabs: { flexDirection: 'row', gap: size.gap },
  flex: { flex: 1 },
});
