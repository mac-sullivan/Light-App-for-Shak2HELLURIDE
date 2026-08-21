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

const SECTIONS: [Mode, string][] = [
  ['map', 'Map'],
  ['color', 'Color'],
  ['effects', 'Effects'],
  ['shows', 'Shows'],
];

function SectionSwitcher({ current, onSelect }: { current: Mode | null; onSelect: (m: Mode) => void }) {
  return (
    <View style={styles.seg}>
      {SECTIONS.map(([m, label]) => {
        const active = current === m;
        return (
          <Pressable
            key={m}
            onPress={() => { Haptics.selectionAsync().catch(() => {}); onSelect(m); }}
            style={[styles.segItem, active && styles.segItemActive]}
          >
            <Text style={[styles.segText, active && styles.segTextActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
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
    Haptics.selectionAsync().catch(() => {});
    saveCurrent(`Look ${scenes.length + 1}`);
    setSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), 1400);
  };

  const goSection = (m: Mode) => { setMode(m); setTab('control'); };
  const toggleTab = (t: Tab) => { Haptics.selectionAsync().catch(() => {}); setTab((cur) => (cur === t ? 'control' : t)); };

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

      {/* Fixed top-left: quick-save heart + Scenes shortcut */}
      <View style={styles.topLeft}>
        <Pressable onPress={quickSave} hitSlop={8} style={styles.heart}>
          <Text style={[styles.heartIcon, { color: saved ? theme.err : theme.text }]}>{saved ? '♥' : '♡'}</Text>
          {saved ? <Text style={styles.savedText}>Saved</Text> : null}
        </Pressable>
        <Pressable
          onPress={() => toggleTab('scenes')}
          hitSlop={8}
          style={[styles.iconBtn, tab === 'scenes' && styles.iconBtnActive]}
        >
          <Ionicons name="albums-outline" size={22} color={tab === 'scenes' ? '#000' : theme.text} />
        </Pressable>
      </View>

      {/* Fixed top-right: connection pill — tap to open Devices */}
      <Pressable
        onPress={() => toggleTab('devices')}
        hitSlop={8}
        style={({ pressed }) => [styles.statusPill, { opacity: pressed ? 0.75 : 1 }]}
      >
        <View style={[styles.pill, { borderColor: summaryColor }]}>
          <View style={[styles.dot, { backgroundColor: summaryColor }]} />
          <Text style={[styles.count, { color: summaryColor }]}>
            {connected}/{total}
          </Text>
          {snapshot.scanning ? <Text style={styles.scan}>⟳</Text> : null}
        </View>
      </Pressable>

      {/* Bottom control bar — the main sections, right by the thumb */}
      <View style={styles.tabs}>
        <SectionSwitcher current={tab === 'control' ? mode : null} onSelect={goSection} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  body: { flex: 1 },
  topLeft: { position: 'absolute', top: 6, left: size.gap, zIndex: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  heart: {
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
  iconBtn: {
    width: 44,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnActive: { backgroundColor: theme.accent, borderColor: theme.accent },
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
    paddingHorizontal: size.gap,
    paddingTop: 8,
    paddingBottom: 6,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    backgroundColor: theme.surface,
  },
  seg: { flexDirection: 'row', backgroundColor: theme.surfaceHi, borderRadius: 14, padding: 4, gap: 4 },
  segItem: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  segItemActive: { backgroundColor: theme.accent },
  segText: { color: theme.textDim, fontSize: 15, fontWeight: '800', letterSpacing: 0.2 },
  segTextActive: { color: '#000' },
});
