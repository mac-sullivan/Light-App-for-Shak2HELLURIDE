import React, { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { size, theme } from '../theme';
import { useLightManager } from '../hooks/useLightManager';
import { useScenes } from '../hooks/useScenes';
import { ControlPanel, type Mode } from './ControlPanel';
import { ScenesPanel } from './ScenesPanel';
import { DevicesPanel } from './DevicesPanel';

type Tab = 'control' | 'scenes' | 'devices';
type IconName = React.ComponentProps<typeof Ionicons>['name'];

function SectionSwitcher({ mode, onMode }: { mode: Mode; onMode: (m: Mode) => void }) {
  const items: [Mode, string][] = [['color', 'Color'], ['effects', 'Effects'], ['shows', 'Shows']];
  return (
    <View style={styles.seg}>
      {items.map(([m, label]) => {
        const active = mode === m;
        return (
          <Pressable
            key={m}
            onPress={() => { Haptics.selectionAsync().catch(() => {}); onMode(m); }}
            style={[styles.segItem, active && styles.segItemActive]}
          >
            <Text style={[styles.segText, active && styles.segTextActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function NavTab({ icon, label, active, onPress }: { icon: IconName; label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => { Haptics.selectionAsync().catch(() => {}); onPress(); }}
      style={({ pressed }) => [styles.navTab, active && styles.navTabActive, { opacity: pressed ? 0.8 : 1 }]}
    >
      <Ionicons name={icon} size={22} color={active ? '#000' : theme.text} />
      <Text style={[styles.navLabel, { color: active ? '#000' : theme.text }]}>{label}</Text>
    </Pressable>
  );
}

export function HomeScreen() {
  const { snapshot } = useLightManager();
  const { scenes, saveCurrent } = useScenes();
  const [tab, setTab] = useState<Tab>('control');
  const [mode, setMode] = useState<Mode>('color');
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const quickSave = () => {
    saveCurrent(`Look ${scenes.length + 1}`);
    setSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), 1400);
  };

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
        {tab === 'control' ? <ControlPanel mode={mode} onMode={setMode} /> : tab === 'scenes' ? <ScenesPanel /> : <DevicesPanel />}
      </View>

      {/* Fixed heart quick-save, pinned to the top-left corner */}
      <Pressable onPress={quickSave} hitSlop={10} style={styles.heart}>
        <Text style={[styles.heartIcon, { color: saved ? theme.err : theme.text }]}>{saved ? '♥' : '♡'}</Text>
        {saved ? <Text style={styles.savedText}>Saved</Text> : null}
      </Pressable>

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

      {/* Bottom bars — the most-tapped switcher sits right above the nav, by the thumb */}
      <View style={styles.tabs}>
        {tab === 'control' ? <SectionSwitcher mode={mode} onMode={setMode} /> : null}
        <View style={styles.tabRow}>
          <NavTab icon="bookmark" label="Scenes" active={tab === 'scenes'} onPress={() => setTab('scenes')} />
          <NavTab icon="options" label="Control" active={tab === 'control'} onPress={() => setTab('control')} />
          <NavTab icon="bluetooth" label="Devices" active={tab === 'devices'} onPress={() => setTab('devices')} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  body: { flex: 1 },
  heart: {
    position: 'absolute',
    top: 6,
    left: size.gap,
    zIndex: 10,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heartIcon: { fontSize: 22, fontWeight: '900', marginTop: -2 },
  savedText: { color: theme.err, fontSize: size.fontSm, fontWeight: '800' },
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
    gap: 8,
    paddingHorizontal: size.gap,
    paddingTop: 8,
    paddingBottom: 6,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    backgroundColor: theme.surface,
  },
  tabRow: { flexDirection: 'row', gap: size.gap },
  flex: { flex: 1 },
  seg: { flexDirection: 'row', backgroundColor: theme.surfaceHi, borderRadius: 14, padding: 4, gap: 4 },
  segItem: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  segItemActive: { backgroundColor: theme.accent },
  segText: { color: theme.textDim, fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  segTextActive: { color: '#000' },
  navTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 8,
    minHeight: size.touchMd,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: theme.border,
    backgroundColor: theme.surfaceHi,
  },
  navTabActive: { backgroundColor: theme.accent, borderColor: '#ffffff33' },
  navLabel: { fontSize: 13, fontWeight: '800' },
});
