import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { HapticSlider as Slider } from './HapticSlider';
import { size, theme } from '../theme';
import { SEQUENCES, type RGB } from '../protocol';
import { useLightManager } from '../hooks/useLightManager';
import { useGroups } from '../hooks/useGroups';
import { useScenes } from '../hooks/useScenes';
import { useMapAssign } from '../hooks/useMapAssign';
import { useThrottledCallback } from '../util/throttle';
import { BigButton } from './BigButton';
import { SectionCard } from './SectionCard';
import { ColorPicker } from './ColorPicker';
import { EffectPad } from './EffectPad';
import { SelectionChips } from './SelectionChips';
import { ShackMap } from './ShackMap';
import { Groups } from './Groups';
import { AdvancedSetup } from './AdvancedSetup';
import type { DeviceEntry } from '../ble/types';

// Ordered by vibe with the crowd-pleasers up top: hot/red first, then colorful,
// then the calm ones, then party/alarm, then music.
const SHOWS: { id: string; label: string }[] = [
  { id: 'fire', label: 'Fire' },
  { id: 'ember', label: 'Ember' },
  { id: 'lava', label: 'Lava' },
  { id: 'heartbeat', label: 'Heartbeat' },
  { id: 'meteor', label: 'Meteor' },
  { id: 'siren', label: 'Siren' },
  { id: 'spin', label: 'Spin' },
  { id: 'rainbow', label: 'Rainbow' },
  { id: 'sweep', label: 'Sweep' },
  { id: 'chase', label: 'Chase' },
  { id: 'comet', label: 'Comet' },
  { id: 'wave', label: 'Wave' },
  { id: 'confetti', label: 'Confetti' },
  { id: 'alternate', label: 'Alternate' },
  { id: 'pulse', label: 'Pulse' },
  { id: 'breathe', label: 'Breathe' },
  { id: 'candle', label: 'Candle' },
  { id: 'sunset', label: 'Sunset' },
  { id: 'twinkle', label: 'Twinkle' },
  { id: 'police', label: 'Police' },
  { id: 'strobe', label: 'Strobe' },
  { id: 'music', label: 'Music' },
];

export type Mode = 'map' | 'color' | 'effects' | 'shows';

export function ControlPanel({ mode, onMode }: { mode: Mode; onMode: (m: Mode) => void }) {
  const { snapshot, manager } = useLightManager();
  const { groups, saveGroup, deleteGroup } = useGroups();
  const { scenes, applyScene } = useScenes();
  const { assign, setSlot } = useMapAssign();

  const [color, setColor] = useState<RGB>({ r: 255, g: 0, b: 0 });
  const [brightness, setBrightness] = useState(255);
  const [white, setWhite] = useState(0);
  const [effect, setEffect] = useState<number | undefined>(undefined);
  const [speed, setSpeed] = useState(180);
  const [pickMode, setPickMode] = useState<'map' | 'list'>('map');
  const [assignMode, setAssignMode] = useState(false);
  const [pendingSlot, setPendingSlot] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const allSelected = snapshot.selected.length === 0;
  const selectedSet = useMemo(() => new Set(snapshot.selected), [snapshot.selected]);
  const targetDevices = snapshot.devices.filter(
    (d) => d.state === 'connected' && (allSelected || selectedSet.has(d.name))
  );
  const targetLabel = allSelected ? 'All strips' : `${snapshot.selected.length} selected`;

  const rep = targetDevices[0];
  const selKey = allSelected ? 'all' : snapshot.selected.join(',');
  const repRef = useRef(rep);
  repRef.current = rep;
  useEffect(() => {
    const r = repRef.current;
    if (r) {
      setColor(r.color);
      setBrightness(r.brightness);
      setWhite(r.white);
      setSpeed(r.speed);
      setEffect(r.mode === 'effect' ? r.effect : undefined);
      if (r.mode === 'effect' || r.mode === 'auto') onMode('effects');
      else if (r.mode === 'solid') onMode('color');
    }
  }, [selKey]);

  const sendColor = useThrottledCallback((c: RGB) => manager.masterColor(c), 90);
  const sendBrightness = useThrottledCallback((v: number) => manager.masterBrightness(v), 70);
  const sendSpeed = useThrottledCallback((v: number) => manager.masterSpeed(v), 70);
  const sendWhite = useThrottledCallback((v: number) => manager.masterWhite(v), 80);

  const onSlotPress = (slot: string, dev?: DeviceEntry) => {
    if (assignMode) setPendingSlot((p) => (p === slot ? null : slot));
    else if (dev) manager.toggleSelect(dev.name);
  };

  const brightnessSlider = (
    <>
      <Text style={styles.sliderLabel}>Brightness · {Math.round((brightness / 255) * 100)}%</Text>
      <Slider minimumValue={0} maximumValue={255} value={brightness} step={1} minimumTrackTintColor={theme.warn} maximumTrackTintColor={theme.surfaceHi} thumbTintColor={theme.text}
        onValueChange={(v) => { setBrightness(v); sendBrightness(v); }} onSlidingComplete={(v) => manager.masterBrightness(v)} style={styles.slider} />
    </>
  );

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {mode === 'map' ? (
          <>
            {/* Map — pick which strips the color/effects controls will change */}
            <SectionCard title={`Select strips · ${targetLabel}`}>
              <BigButton label="Select all strips" onPress={() => manager.selectAll()} active={allSelected} tone="accent" small style={styles.selectAll} />
              <View style={styles.rowGap}>
                <BigButton label="Map" onPress={() => setPickMode('map')} active={pickMode === 'map'} tone="accent" small style={styles.flex} />
                <BigButton label="List" onPress={() => setPickMode('list')} active={pickMode === 'list'} tone="accent" small style={styles.flex} />
              </View>
              {pickMode === 'map' ? (
                <>
                  <ShackMap devices={snapshot.devices} selected={snapshot.selected} assign={assign} assignMode={assignMode} pendingSlot={pendingSlot} show={snapshot.show} onSlotPress={onSlotPress} />
                  <BigButton label={assignMode ? 'Done assigning' : 'Assign lights to map'} onPress={() => { setAssignMode((a) => !a); setPendingSlot(null); }} active={assignMode} tone="accent" small style={styles.assignToggle} />
                  {assignMode && pendingSlot ? (
                    <View style={styles.assignBox}>
                      <Text style={styles.assignTitle}>Assign “{pendingSlot}” to a light:</Text>
                      <View style={styles.quickRow}>
                        {snapshot.devices.map((d) => (
                          <BigButton key={d.name} label={d.label || d.name} onPress={() => { setSlot(pendingSlot, d.name); setPendingSlot(null); }} active={assign[pendingSlot] === d.name} tone="accent" small style={styles.quick} />
                        ))}
                        <BigButton label="Unassign" onPress={() => { setSlot(pendingSlot, null); setPendingSlot(null); }} tone="off" small style={styles.quick} />
                      </View>
                    </View>
                  ) : null}
                </>
              ) : (
                <SelectionChips devices={snapshot.devices} selected={snapshot.selected} onToggle={(name) => manager.toggleSelect(name)} />
              )}
              <Groups groups={groups} selected={snapshot.selected} onApply={(members) => manager.selectOnly(members)} onSave={(name) => saveGroup(name, snapshot.selected)} onDelete={deleteGroup} />
            </SectionCard>

            {/* Advanced setup lives with the map/selection tools */}
            <SectionCard title="Advanced setup">
              <BigButton label={showAdvanced ? 'Hide advanced' : 'LED type · pixel count'} onPress={() => setShowAdvanced((s) => !s)} active={showAdvanced} tone="accent" small />
              {showAdvanced ? <AdvancedSetup targetLabel={targetLabel} onIcModel={(i) => manager.masterIcModel(i)} onPixels={(n) => manager.masterPixels(n)} /> : null}
            </SectionCard>
          </>
        ) : null}

        {/* Color/Effects/Shows stay mounted and just toggle visibility, so their
            sliders never re-mount and animate the thumb up from zero. */}
        <View style={mode === 'color' ? undefined : styles.hidden}>
          <SectionCard title={`Color · ${targetLabel}`}>
            <ColorPicker key={selKey} color={color} onChange={(c) => { setColor(c); sendColor(c); }} onComplete={(c) => manager.masterColor(c)} />
            {brightnessSlider}
            <Text style={styles.sliderLabel}>White · {Math.round((white / 255) * 100)}%  (RGBW pods only)</Text>
            <Slider minimumValue={0} maximumValue={255} value={white} step={1} minimumTrackTintColor={theme.text} maximumTrackTintColor={theme.surfaceHi} thumbTintColor={theme.text}
              onValueChange={(v) => { setWhite(v); sendWhite(v); }} onSlidingComplete={(v) => manager.masterWhite(v)} style={styles.slider} />
            <Text style={styles.sliderLabel}>Color order — tap until red looks red</Text>
            <View style={styles.quickRow}>
              {SEQUENCES.map((s, i) => (
                <BigButton key={s} label={s} onPress={() => manager.masterSequence(i)} active={rep?.sequence === i} tone="accent" small style={styles.quick} />
              ))}
            </View>
          </SectionCard>
        </View>

        <View style={mode === 'effects' ? undefined : styles.hidden}>
          <SectionCard title={`Effects · ${targetLabel}`}>
            <BigButton label="Auto cycle (all effects)" onPress={() => { setEffect(0); manager.masterAutoCycle(); }} active={rep?.mode === 'auto'} tone="accent" small style={styles.autoBtn} />
            {brightnessSlider}
            <Text style={styles.sliderLabel}>Speed</Text>
            <Slider minimumValue={0} maximumValue={255} value={speed} step={1} minimumTrackTintColor={theme.accent} maximumTrackTintColor={theme.surfaceHi} thumbTintColor={theme.text}
              onValueChange={(v) => { setSpeed(v); sendSpeed(v); }} onSlidingComplete={(v) => manager.masterSpeed(v)} style={styles.slider} />
            <EffectPad selected={effect} onPick={(m) => { setEffect(m); manager.masterEffect(m); }} scenes={scenes} onApplyScene={applyScene} />
          </SectionCard>
        </View>

        <View style={mode === 'shows' ? undefined : styles.hidden}>
          <SectionCard title="Shows — whole shack">
            <Text style={styles.showHint}>Whole-car shows — they override color &amp; effect on every strip.</Text>
            <View style={styles.quickRow}>
              {SHOWS.map((s) => (
                <BigButton key={s.id} label={s.label} onPress={() => (snapshot.show === s.id ? manager.stopShow() : manager.startShow(s.id))} active={snapshot.show === s.id} tone="accent" small labelSize={size.fontSm} style={s.id === 'music' ? styles.showBtnFull : styles.showBtn} />
              ))}
            </View>
            <Text style={styles.sliderLabel}>Spin speed · {snapshot.showSpeed.toFixed(1)}s per lap</Text>
            <Slider minimumValue={1} maximumValue={5} value={snapshot.showSpeed} step={0.5} minimumTrackTintColor={theme.accent} maximumTrackTintColor={theme.surfaceHi} thumbTintColor={theme.text}
              onValueChange={(v) => manager.setSpinSpeed(v)} style={styles.slider} />
            {snapshot.show ? <BigButton label="Stop show" onPress={() => manager.stopShow()} tone="off" active small style={styles.stopShow} /> : null}
          </SectionCard>
        </View>

        {snapshot.lastWrite ? <Text style={styles.debug}>last command: {snapshot.lastWrite}</Text> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: size.gap, paddingTop: 104, paddingBottom: 40 },
  hidden: { display: 'none' },
  rowGap: { flexDirection: 'row', gap: size.gap, marginBottom: size.gap },
  selectAll: { marginBottom: size.gap },
  stopShow: { marginTop: size.gap },
  autoBtn: { marginBottom: 10 },
  assignToggle: { marginTop: 10 },
  assignBox: { marginTop: 10, padding: 10, borderRadius: size.radius, backgroundColor: theme.surfaceAlt, borderWidth: 1, borderColor: theme.accent },
  assignTitle: { color: theme.text, fontSize: size.fontSm, fontWeight: '800', marginBottom: 6 },
  flex: { flex: 1 },
  slider: { width: '100%', height: 56 },
  sliderLabel: { color: theme.textDim, fontSize: size.fontSm, fontWeight: '800', marginTop: 12, letterSpacing: 1 },
  showHint: { color: theme.textDim, fontSize: size.fontSm, marginBottom: 4 },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  quick: { flexGrow: 1, minWidth: '30%' },
  showBtn: { width: '31.5%' },
  showBtnFull: { width: '100%' },
  debug: { color: theme.textDim, textAlign: 'center', marginTop: 12, fontSize: 13, opacity: 0.7 },
});
