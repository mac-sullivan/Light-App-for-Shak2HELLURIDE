import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

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

type Tab = 'control' | 'scenes' | 'devices';

const SECTIONS: [Mode, string][] = [
  ['map', 'Map'],
  ['color', 'Color'],
  ['effects', 'Effects'],
  ['shows', 'Shows'],
];

type Heart = {
  id: number; x: number; sizePx: number; delay: number; duration: number; emoji: string;
  anim: Animated.Value; jitterX: number[]; flicker: number[]; stretch: number[];
};
const HEART_EMOJI = ['💜', '💖', '💗', '💝', '💕', '🩷']; // pink & purple only
const STEPS = Array.from({ length: 14 }, (_, i) => i / 13); // keyframe positions 0..1

function makeHeart(id: number, width: number): Heart {
  const drift = (Math.random() * 2 - 1) * 42;
  // Horizontal path with a glitchy stutter (random jumps) layered over a gentle sway.
  const jitterX = STEPS.map((s, idx) => {
    const sway = drift * Math.sin(s * Math.PI);
    const jump = idx === 0 || idx === STEPS.length - 1 ? 0 : (Math.random() * 2 - 1) * 18;
    return sway + jump;
  });
  // Flicker on/off like a glitch, fading out over the last stretch of the fall.
  const flicker = STEPS.map((s, idx) => {
    if (idx === 0) return 0;
    if (s > 0.86) return Math.max(0, 1 - (s - 0.86) / 0.14);
    return Math.random() < 0.32 ? 0.15 : 1;
  });
  // Occasional horizontal stretch for a digital-glitch feel.
  const stretch = STEPS.map(() => {
    const r = Math.random();
    return r < 0.15 ? 0.65 : r > 0.85 ? 1.35 : 1;
  });
  return {
    id,
    x: Math.random() * width,
    sizePx: 18 + Math.random() * 30,
    delay: Math.random() * 500,
    duration: 1600 + Math.random() * 1500,
    emoji: HEART_EMOJI[Math.floor(Math.random() * HEART_EMOJI.length)]!,
    anim: new Animated.Value(0),
    jitterX,
    flicker,
    stretch,
  };
}

// Full-screen shower of pink/purple hearts glitching their way down — fired on quick-save.
function HeartsBurst({ fireKey }: { fireKey: number }) {
  const { width, height } = useWindowDimensions();
  const [hearts, setHearts] = useState<Heart[]>([]);

  useEffect(() => {
    if (fireKey === 0) return;
    const items = Array.from({ length: 36 }, (_, i) => makeHeart(fireKey * 100 + i, width));
    setHearts(items);
    Animated.parallel(
      items.map((h) =>
        Animated.timing(h.anim, { toValue: 1, duration: h.duration, delay: h.delay, easing: Easing.in(Easing.quad), useNativeDriver: true })
      )
    ).start(() => setHearts([]));
  }, [fireKey, width]);

  if (hearts.length === 0) return null;
  return (
    <View pointerEvents="none" style={styles.burst}>
      {hearts.map((h) => {
        const translateY = h.anim.interpolate({ inputRange: [0, 1], outputRange: [-60, height + 60] });
        const translateX = h.anim.interpolate({ inputRange: STEPS, outputRange: h.jitterX });
        const scaleX = h.anim.interpolate({ inputRange: STEPS, outputRange: h.stretch });
        const opacity = h.anim.interpolate({ inputRange: STEPS, outputRange: h.flicker });
        return (
          <Animated.Text
            key={h.id}
            style={{ position: 'absolute', left: h.x, fontSize: h.sizePx, transform: [{ translateY }, { translateX }, { scaleX }], opacity }}
          >
            {h.emoji}
          </Animated.Text>
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

  const goSection = (m: Mode) => { setMode(m); setTab('control'); };
  const toggleTab = (t: Tab) => { Haptics.selectionAsync().catch(() => {}); setTab((cur) => (cur === t ? 'control' : t)); };

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
      </View>

      {/* Fixed top-left: quick-save heart + Scenes shortcut */}
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

      {/* Fixed top-right: connection pill — tap to open Devices */}
      <Pressable
        onPress={() => toggleTab('devices')}
        hitSlop={8}
        style={({ pressed }) => [styles.statusPill, { opacity: pressed ? 0.75 : 1 }]}
      >
        <View style={[styles.pill, { borderColor: summaryColor }]}>
          <Ionicons name="bluetooth" size={17} color={summaryColor} />
          <Text style={[styles.count, { color: summaryColor }]}>
            {connected}/{total}
          </Text>
          {snapshot.scanning ? <Text style={styles.scan}>⟳</Text> : null}
        </View>
      </Pressable>

      {/* Bottom control bar — compact power toggle + the main sections, by the thumb */}
      <View style={styles.tabs}>
        {tab === 'control' ? (
          <Pressable onPress={() => goSection('map')} style={styles.targetLine} hitSlop={6}>
            <Ionicons name="locate" size={13} color={theme.textDim} />
            <Text style={styles.targetText}>
              Controlling <Text style={styles.targetStrong}>{controlling}</Text>
              {mode === 'shows' ? '' : '  ›  tap to change'}
            </Text>
          </Pressable>
        ) : null}
        <View style={styles.bottomRow}>
          <Pressable
            onPress={() => { Haptics.selectionAsync().catch(() => {}); manager.masterPower(!allOn); }}
            style={[styles.powerBtn, allOn ? styles.powerOn : styles.powerOff]}
          >
            <Ionicons name="power" size={26} color={allOn ? '#000' : theme.textDim} />
          </Pressable>
          <View style={styles.flex}>
            <SectionSwitcher current={tab === 'control' ? mode : null} onSelect={goSection} />
          </View>
        </View>
      </View>

      <HeartsBurst fireKey={fireKey} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  body: { flex: 1 },
  burst: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 },
  topLeft: { position: 'absolute', top: PILL_TOP, left: PILL_SIDE, zIndex: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
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
  statusPill: { position: 'absolute', top: PILL_TOP, right: PILL_SIDE, zIndex: 10 },
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
  targetLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  targetText: { color: theme.textDim, fontSize: 13, fontWeight: '700' },
  targetStrong: { color: theme.text, fontWeight: '800' },
  bottomRow: { flexDirection: 'row', gap: 8, alignItems: 'stretch' },
  powerBtn: { width: 62, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  powerOn: { backgroundColor: theme.ok, borderColor: theme.ok },
  powerOff: { backgroundColor: theme.surfaceHi, borderColor: theme.border },
  flex: { flex: 1 },
  seg: { flexDirection: 'row', backgroundColor: theme.surfaceHi, borderRadius: 14, padding: 4, gap: 4 },
  segItem: { flex: 1, paddingVertical: 15, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  segItemActive: { backgroundColor: theme.accent },
  segText: { color: theme.textDim, fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
  segTextActive: { color: '#000' },
});
