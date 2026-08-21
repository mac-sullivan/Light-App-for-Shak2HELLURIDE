import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Breathing room above the top pills. iOS sits below the safe-area notch inset;
// Android sits below its status bar (root already pads for that) — both get space.
const PILL_TOP = Platform.OS === 'ios' ? 12 : 6;
// Side inset so the corner pills aren't jammed against the screen edges.
const PILL_SIDE = 18;
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { size, theme } from '../theme';
import { useLightManager } from '../hooks/useLightManager';
import { useScenes } from '../hooks/useScenes';
import { ControlPanel, type Mode } from './ControlPanel';
import { ScenesPanel } from './ScenesPanel';
import { DevicesPanel } from './DevicesPanel';
import { StripSelector } from './StripSelector';

type Tab = 'control' | 'scenes' | 'devices';

const SECTIONS: [Mode, string][] = [
  ['color', 'Color'],
  ['effects', 'Effects'],
  ['shows', 'Shows'],
];

type Particle = { angle: number; distance: number; size: number; color: string };
type Burst = { id: number; x: number; y: number; delay: number; duration: number; anim: Animated.Value; color: string; particles: Particle[] };
const FW_COLORS = ['#FFD166', '#FF5DA2', '#8A5CFF', '#4CD6E3', '#00E676', '#FF453A', '#FFFFFF'];

function makeBurst(id: number, width: number, height: number): Burst {
  const color = FW_COLORS[Math.floor(Math.random() * FW_COLORS.length)]!;
  const count = 24 + Math.floor(Math.random() * 14);
  const radius = 110 + Math.random() * 130;
  const jitter = Math.random() * 0.3;
  const particles: Particle[] = Array.from({ length: count }, (_, i) => ({
    angle: (i / count) * Math.PI * 2 + jitter,
    distance: radius * (0.7 + Math.random() * 0.6),
    size: 5 + Math.random() * 5,
    // Mostly the burst colour with an occasional white sparkle.
    color: Math.random() < 0.2 ? '#FFFFFF' : color,
  }));
  return {
    id,
    x: width * (0.12 + Math.random() * 0.76),
    y: height * (0.1 + Math.random() * 0.58),
    delay: Math.random() * 1500,
    duration: 1200 + Math.random() * 700,
    anim: new Animated.Value(0),
    color,
    particles,
  };
}

// Full-screen fireworks (iMessage-style) over a fading dark overlay — fired on quick-save.
function Fireworks({ fireKey }: { fireKey: number }) {
  const { width, height } = useWindowDimensions();
  const [bursts, setBursts] = useState<Burst[]>([]);
  const overlay = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (fireKey === 0) return;
    const items = Array.from({ length: 12 }, (_, i) => makeBurst(fireKey * 100 + i, width, height));
    const maxEnd = Math.max(...items.map((b) => b.delay + b.duration));
    setBursts(items);
    Animated.parallel(
      items.map((b) =>
        Animated.timing(b.anim, { toValue: 1, duration: b.duration, delay: b.delay, easing: Easing.out(Easing.cubic), useNativeDriver: true })
      )
    ).start(() => setBursts([]));

    // Dark gradient behind the fireworks: fades in fast, holds, fades out with the finale.
    overlay.setValue(0);
    Animated.sequence([
      Animated.timing(overlay, { toValue: 1, duration: 320, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.delay(Math.max(0, maxEnd - 320 - 850)),
      Animated.timing(overlay, { toValue: 0, duration: 850, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, [fireKey, width, height, overlay]);

  if (bursts.length === 0) return null;
  return (
    <View pointerEvents="none" style={styles.burst}>
      {/* Dimming gradient over the whole app; fireworks render on top of it */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: overlay }]}>
        <LinearGradient colors={['rgba(6,2,18,0.55)', 'rgba(0,0,0,0.82)']} style={StyleSheet.absoluteFill} />
      </Animated.View>

      {bursts.map((b) => {
        const flashOpacity = b.anim.interpolate({ inputRange: [0, 0.08, 0.34], outputRange: [1, 0.7, 0], extrapolate: 'clamp' });
        const flashScale = b.anim.interpolate({ inputRange: [0, 0.34], outputRange: [0.4, 3.2], extrapolate: 'clamp' });
        return (
          <View key={b.id} style={{ position: 'absolute', left: b.x, top: b.y }}>
            {/* Bright initial pop */}
            <Animated.View
              style={{ position: 'absolute', left: -16, top: -16, width: 32, height: 32, borderRadius: 16, backgroundColor: b.color, opacity: flashOpacity, transform: [{ scale: flashScale }] }}
            />
            {b.particles.map((p, i) => {
              const translateX = b.anim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(p.angle) * p.distance] });
              // Outward travel plus a bit of gravity so the tails droop as they fade.
              const translateY = b.anim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(p.angle) * p.distance + 75] });
              const opacity = b.anim.interpolate({ inputRange: [0, 0.12, 0.75, 1], outputRange: [1, 1, 0.85, 0] });
              const scale = b.anim.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0.2, 1, 0.5] });
              return (
                <Animated.View
                  key={i}
                  style={{ position: 'absolute', width: p.size, height: p.size, borderRadius: p.size / 2, backgroundColor: p.color, transform: [{ translateX }, { translateY }, { scale }], opacity }}
                />
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

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
  const { snapshot, manager } = useLightManager();
  const { scenes, saveCurrent } = useScenes();
  const [tab, setTab] = useState<Tab>('control');
  const [mode, setMode] = useState<Mode>('color');
  const [saved, setSaved] = useState(false);
  const [fireKey, setFireKey] = useState(0);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartScale = useRef(new Animated.Value(1)).current;

  const quickSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    saveCurrent(`Look ${scenes.length + 1}`);
    setFireKey((k) => k + 1);
    setSaved(true);
    heartScale.stopAnimation();
    heartScale.setValue(0.6);
    Animated.spring(heartScale, { toValue: 1, friction: 3, tension: 140, useNativeDriver: true }).start();
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), 900);
  };

  const goSection = (m: Mode) => { setMode(m); setTab('control'); setSelectorOpen(false); };
  const toggleTab = (t: Tab) => { Haptics.selectionAsync().catch(() => {}); setSelectorOpen(false); setTab((cur) => (cur === t ? 'control' : t)); };

  const connected = snapshot.devices.filter((d) => d.state === 'connected').length;
  const total = snapshot.devices.length;

  // Master power reflects the strips the controls currently target (all, or the selection)
  const allSelected = snapshot.selected.length === 0;
  const powerTargets = snapshot.devices.filter(
    (d) => d.state === 'connected' && (allSelected || snapshot.selected.includes(d.name))
  );
  const allOn = powerTargets.length > 0 && powerTargets.every((d) => d.power);

  // A plain-language summary of what the color/effects controls will change right now
  const controlling = useMemo(() => {
    if (mode === 'shows') return 'the whole car';
    if (allSelected) return 'all strips';
    const names = snapshot.selected.map((n) => {
      const d = snapshot.devices.find((x) => x.name === n);
      return d?.label || n;
    });
    if (names.length === 0) return 'all strips';
    if (names.length <= 2) return names.join(', ');
    return `${names.length} strips`;
  }, [mode, allSelected, snapshot.selected, snapshot.devices]);

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
        {selectorOpen && tab === 'control' ? (
          <View style={styles.selectorSheet}>
            <ScrollView contentContainerStyle={styles.selectorContent} keyboardShouldPersistTaps="handled">
              <StripSelector onDone={() => setSelectorOpen(false)} />
            </ScrollView>
          </View>
        ) : null}
      </View>

      {/* Fixed top area: full-width 'Controlling…' row, then heart/scenes (left) + BT pill (right) */}
      <View style={styles.topBar} pointerEvents="box-none">
        {tab === 'control' ? (
          <Pressable onPress={() => setSelectorOpen((o) => !o)} style={styles.topStatus} hitSlop={6}>
            <Ionicons name={selectorOpen ? 'chevron-up' : 'locate'} size={12} color={theme.textDim} />
            <Text style={styles.centerText} numberOfLines={1}>
              Controlling <Text style={styles.targetStrong}>{controlling}</Text>
              <Text style={styles.tapHint}>{selectorOpen ? '  ›  tap to close' : '  ›  tap to change'}</Text>
            </Text>
          </Pressable>
        ) : null}

        <View style={styles.pillsRow}>
          <View style={styles.topLeft}>
            <Pressable onPress={quickSave} hitSlop={8} style={styles.iconBtn}>
              <Animated.Text style={[styles.heartIcon, { color: saved ? theme.err : theme.text, transform: [{ scale: heartScale }] }]}>
                {saved ? '♥' : '♡'}
              </Animated.Text>
            </Pressable>
            <Pressable
              onPress={() => toggleTab('scenes')}
              hitSlop={8}
              style={[styles.iconBtn, tab === 'scenes' && styles.iconBtnActive]}
            >
              <Ionicons name="albums-outline" size={22} color={tab === 'scenes' ? '#000' : theme.text} />
            </Pressable>
          </View>

          <Pressable
            onPress={() => toggleTab('devices')}
            hitSlop={8}
            style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
          >
            <View style={[styles.pill, { borderColor: summaryColor }]}>
              <Ionicons name="bluetooth" size={17} color={summaryColor} />
              <Text style={[styles.count, { color: summaryColor }]}>
                {connected}/{total}
              </Text>
              {snapshot.scanning ? <Text style={styles.scan}>⟳</Text> : null}
            </View>
          </Pressable>
        </View>
      </View>

      {/* Bottom control bar — compact power toggle + the main sections, by the thumb */}
      <View style={styles.tabs}>
        <View style={styles.bottomRow}>
          <Pressable
            onPress={() => { Haptics.selectionAsync().catch(() => {}); manager.masterPower(!allOn); }}
            style={[styles.powerBtn, allOn ? styles.powerOn : styles.powerOff]}
          >
            <Ionicons name="power" size={28} color={allOn ? '#000' : theme.textDim} />
          </Pressable>
          <View style={styles.flex}>
            <SectionSwitcher current={tab === 'control' ? mode : null} onSelect={goSection} />
          </View>
        </View>
      </View>

      <Fireworks fireKey={fireKey} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  body: { flex: 1 },
  selectorSheet: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.bg, zIndex: 5 },
  selectorContent: { paddingHorizontal: size.gap, paddingTop: 104, paddingBottom: 40 },
  burst: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 },
  topBar: { position: 'absolute', top: PILL_TOP, left: 0, right: 0, zIndex: 10, paddingHorizontal: PILL_SIDE, gap: 16 },
  topStatus: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, alignSelf: 'stretch' },
  pillsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  centerText: { color: theme.textDim, fontSize: 13, fontWeight: '700', flexShrink: 1 },
  tapHint: { color: theme.textDim, fontWeight: '700', opacity: 0.7 },
  heartIcon: { fontSize: 24, fontWeight: '900', marginTop: -2 },
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
  targetStrong: { color: theme.text, fontWeight: '800' },
  bottomRow: { flexDirection: 'row', gap: 8, alignItems: 'stretch' },
  powerBtn: { width: 68, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  powerOn: { backgroundColor: theme.ok, borderColor: theme.ok },
  powerOff: { backgroundColor: theme.surfaceHi, borderColor: theme.border },
  flex: { flex: 1 },
  seg: { flexDirection: 'row', backgroundColor: theme.surfaceHi, borderRadius: 14, padding: 4, gap: 4 },
  segItem: { flex: 1, paddingVertical: 18, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  segItemActive: { backgroundColor: theme.accent },
  segText: { color: theme.textDim, fontSize: 17, fontWeight: '800', letterSpacing: 0.2 },
  segTextActive: { color: '#000' },
});
