import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { size, theme } from '../theme';
import { SEQUENCES, type RGB } from '../protocol';
import { useLightManager } from '../hooks/useLightManager';
import { useGroups } from '../hooks/useGroups';
import { useScenes } from '../hooks/useScenes';
import { useThrottledCallback } from '../util/throttle';
import { BigButton } from './BigButton';
import { SectionCard } from './SectionCard';
import { ColorPicker } from './ColorPicker';
import { EffectPad } from './EffectPad';
import { SelectionChips } from './SelectionChips';
import { ShackMap } from './ShackMap';
import { Groups } from './Groups';
import { AdvancedSetup } from './AdvancedSetup';

const SHOWS: { id: string; label: string }[] = [
  { id: 'rainbow', label: 'Rainbow' },
  { id: 'sweep', label: 'Sweep' },
  { id: 'pulse', label: 'Pulse' },
  { id: 'fire', label: 'Fire' },
  { id: 'strobe', label: 'Strobe' },
  { id: 'music', label: 'Music 🎵' },
];

export function ControlPanel() {
  const { snapshot, manager } = useLightManager();
  const { groups, saveGroup, deleteGroup } = useGroups();
  const { scenes, applyScene } = useScenes();

  const [tab, setTab] = useState<'color' | 'effects'>('color');
  const [color, setColor] = useState<RGB>({ r: 255, g: 0, b: 0 });
  const [brightness, setBrightness] = useState(255);
  const [white, setWhite] = useState(0);
  const [effect, setEffect] = useState<number | undefined>(undefined);
  const [speed, setSpeed] = useState(180);
  const [showAllEffects, setShowAllEffects] = useState(false);
  const [pickMode, setPickMode] = useState<'map' | 'list'>('map');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const allSelected = snapshot.selected.length === 0;
  const selectedSet = useMemo(() => new Set(snapshot.selected), [snapshot.selected]);
  const targetDevices = snapshot.devices.filter(
    (d) => d.state === 'connected' && (allSelected || selectedSet.has(d.name))
  );
  const allOn = targetDevices.length > 0 && targetDevices.every((d) => d.power);
  const targetLabel = allSelected ? 'All strips' : `${snapshot.selected.length} selected`;

  // Representative device — the controls reflect (and save to) the selection.
  const rep = targetDevices[0];
  const selKey = allSelected ? 'all' : snapshot.selected.join(',');
  const repRef = useRef(rep);
  repRef.current = rep;
  // When the selection changes, load that strip's saved profile into the UI.
  useEffect(() => {
    const r = repRef.current;
    if (r) {
      setColor(r.color);
      setBrightness(r.brightness);
      setWhite(r.white);
      setSpeed(r.speed);
      setEffect(r.mode === 'effect' ? r.effect : undefined);
      setTab(r.mode === 'effect' || r.mode === 'auto' ? 'effects' : 'color');
    }
  }, [selKey]);

  const sendColor = useThrottledCallback((c: RGB) => manager.masterColor(c), 90);
  const sendBrightness = useThrottledCallback((v: number) => manager.masterBrightness(v), 70);
  const sendSpeed = useThrottledCallback((v: number) => manager.masterSpeed(v), 70);
  const sendWhite = useThrottledCallback((v: number) => manager.masterWhite(v), 80);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* What am I controlling */}
      <SectionCard title={`Controlling · ${targetLabel}`}>
        <BigButton label="Select all strips" onPress={() => manager.selectAll()} active={allSelected} tone="accent" small style={styles.selectAll} />
        <View style={styles.rowGap}>
          <BigButton label="Map" onPress={() => setPickMode('map')} active={pickMode === 'map'} tone="accent" small style={styles.flex} />
          <BigButton label="List" onPress={() => setPickMode('list')} active={pickMode === 'list'} tone="accent" small style={styles.flex} />
        </View>
        {pickMode === 'map' ? (
          <ShackMap devices={snapshot.devices} selected={snapshot.selected} onToggle={(name) => manager.toggleSelect(name)} />
        ) : (
          <SelectionChips devices={snapshot.devices} selected={snapshot.selected} onToggle={(name) => manager.toggleSelect(name)} />
        )}
        <Groups
          groups={groups}
          selected={snapshot.selected}
          onApply={(members) => manager.selectOnly(members)}
          onSave={(name) => saveGroup(name, snapshot.selected)}
          onDelete={deleteGroup}
        />
      </SectionCard>

      {/* Power */}
      <SectionCard title={`Power · ${targetLabel}`}>
        <View style={styles.rowGap}>
          <BigButton label="ON" onPress={() => manager.masterPower(true)} tone="on" active={allOn} style={styles.flex} />
          <BigButton label="OFF" onPress={() => manager.masterPower(false)} tone="off" style={styles.flex} />
        </View>
      </SectionCard>

      {/* Color / Effects switch */}
      <View style={styles.rowGap}>
        <BigButton label="Color" onPress={() => setTab('color')} active={tab === 'color'} tone="accent" small style={styles.flex} />
        <BigButton label="Effects" onPress={() => setTab('effects')} active={tab === 'effects'} tone="accent" small style={styles.flex} />
        <BigButton label="Auto" onPress={() => { setEffect(0); manager.masterAutoCycle(); }} active={rep?.mode === 'auto'} tone="accent" small style={styles.flex} />
      </View>

      {tab === 'color' ? (
        <SectionCard title={`Color · ${targetLabel}`}>
          <ColorPicker
            key={selKey}
            color={color}
            onChange={(c) => {
              setColor(c);
              sendColor(c);
            }}
            onComplete={(c) => manager.masterColor(c)}
          />
          <Text style={styles.sliderLabel}>Brightness · {Math.round((brightness / 255) * 100)}%</Text>
          <Slider
            minimumValue={0}
            maximumValue={255}
            value={brightness}
            step={1}
            minimumTrackTintColor={theme.warn}
            maximumTrackTintColor={theme.surfaceHi}
            thumbTintColor={theme.text}
            onValueChange={(v) => { setBrightness(v); sendBrightness(v); }}
            onSlidingComplete={(v) => manager.masterBrightness(v)}
            style={styles.slider}
          />
          <Text style={styles.sliderLabel}>White · {Math.round((white / 255) * 100)}%  (RGBW pods only)</Text>
          <Slider
            minimumValue={0}
            maximumValue={255}
            value={white}
            step={1}
            minimumTrackTintColor={theme.text}
            maximumTrackTintColor={theme.surfaceHi}
            thumbTintColor={theme.text}
            onValueChange={(v) => { setWhite(v); sendWhite(v); }}
            onSlidingComplete={(v) => manager.masterWhite(v)}
            style={styles.slider}
          />
          <Text style={styles.sliderLabel}>Color order — tap until red looks red</Text>
          <View style={styles.quickRow}>
            {SEQUENCES.map((s, i) => (
              <BigButton
                key={s}
                label={s}
                onPress={() => manager.masterSequence(i)}
                active={rep?.sequence === i}
                tone="accent"
                small
                style={styles.quick}
              />
            ))}
          </View>
        </SectionCard>
      ) : (
        <SectionCard title={`Effects · ${targetLabel}`}>
          <EffectPad
            selected={effect}
            showAll={showAllEffects}
            onToggleAll={() => setShowAllEffects((s) => !s)}
            onPick={(m) => {
              setEffect(m);
              manager.masterEffect(m);
            }}
            scenes={scenes}
            onApplyScene={applyScene}
          />
          <Text style={styles.sliderLabel}>Speed</Text>
          <Slider
            minimumValue={0}
            maximumValue={255}
            value={speed}
            step={1}
            minimumTrackTintColor={theme.accent}
            maximumTrackTintColor={theme.surfaceHi}
            thumbTintColor={theme.text}
            onValueChange={(v) => { setSpeed(v); sendSpeed(v); }}
            onSlidingComplete={(v) => manager.masterSpeed(v)}
            style={styles.slider}
          />
          <Text style={styles.sliderLabel}>Brightness · {Math.round((brightness / 255) * 100)}%</Text>
          <Slider
            minimumValue={0}
            maximumValue={255}
            value={brightness}
            step={1}
            minimumTrackTintColor={theme.warn}
            maximumTrackTintColor={theme.surfaceHi}
            thumbTintColor={theme.text}
            onValueChange={(v) => { setBrightness(v); sendBrightness(v); }}
            onSlidingComplete={(v) => manager.masterBrightness(v)}
            style={styles.slider}
          />
        </SectionCard>
      )}

      {/* App-driven car-wide shows */}
      <SectionCard title="Shows — whole shack">
        <View style={styles.quickRow}>
          {SHOWS.map((s) => (
            <BigButton
              key={s.id}
              label={s.label}
              onPress={() => (snapshot.show === s.id ? manager.stopShow() : manager.startShow(s.id))}
              active={snapshot.show === s.id}
              tone="accent"
              small
              style={styles.quick}
            />
          ))}
        </View>
        {snapshot.show ? (
          <BigButton label="■ Stop show" onPress={() => manager.stopShow()} tone="off" small style={styles.stopShow} />
        ) : null}
      </SectionCard>

      {/* Advanced hardware setup (for odd strips like the Back Step pods) */}
      <SectionCard title="Advanced setup">
        <BigButton
          label={showAdvanced ? 'Hide advanced' : 'LED type · white · pixel count'}
          onPress={() => setShowAdvanced((s) => !s)}
          active={showAdvanced}
          tone="accent"
          small
        />
        {showAdvanced ? (
          <AdvancedSetup
            targetLabel={targetLabel}
            onIcModel={(i) => manager.masterIcModel(i)}
            onPixels={(n) => manager.masterPixels(n)}
          />
        ) : null}
      </SectionCard>

      {snapshot.lastWrite ? <Text style={styles.debug}>last command: {snapshot.lastWrite}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  content: { paddingHorizontal: size.gap, paddingTop: 54, paddingBottom: 48 },
  rowGap: { flexDirection: 'row', gap: size.gap, marginBottom: size.gap },
  selectAll: { marginBottom: size.gap },
  stopShow: { marginTop: size.gap },
  flex: { flex: 1 },
  slider: { width: '100%', height: 56 },
  sliderLabel: { color: theme.textDim, fontSize: size.fontSm, fontWeight: '800', marginTop: 12, letterSpacing: 1 },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  quick: { flexGrow: 1, minWidth: '30%' },
  saveRow: { marginTop: 10 },
  debug: { color: theme.textDim, textAlign: 'center', marginTop: 12, fontSize: 13, opacity: 0.7 },
});
