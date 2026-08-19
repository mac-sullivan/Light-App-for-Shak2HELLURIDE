import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { size, theme } from '../theme';
import type { RGB } from '../protocol';
import { useLightManager } from '../hooks/useLightManager';
import { useScenes } from '../hooks/useScenes';
import { useGroups } from '../hooks/useGroups';
import { useThrottledCallback } from '../util/throttle';
import { BigButton } from './BigButton';
import { SectionCard } from './SectionCard';
import { ColorPad } from './ColorPad';
import { EffectPad } from './EffectPad';
import { SelectionChips } from './SelectionChips';
import { Groups } from './Groups';
import { Scenes } from './Scenes';

export function ControlPanel() {
  const { snapshot, manager } = useLightManager();
  const { scenes, saveCurrent, applyScene, deleteScene } = useScenes();
  const { groups, saveGroup, deleteGroup } = useGroups();

  const [tab, setTab] = useState<'color' | 'effects'>('color');
  const [color, setColor] = useState<RGB>({ r: 255, g: 60, b: 140 });
  const [brightness, setBrightness] = useState(200);
  const [effect, setEffect] = useState<number | undefined>(undefined);
  const [speed, setSpeed] = useState(180);
  const [showAll, setShowAll] = useState(false);

  const allSelected = snapshot.selected.length === 0;
  const selectedSet = useMemo(() => new Set(snapshot.selected), [snapshot.selected]);
  const targetDevices = snapshot.devices.filter(
    (d) => d.state === 'connected' && (allSelected || selectedSet.has(d.name))
  );
  const allOn = targetDevices.length > 0 && targetDevices.every((d) => d.power);
  const targetLabel = allSelected ? 'All strips' : `${snapshot.selected.length} selected`;

  const sendBrightness = useThrottledCallback((v: number) => manager.masterBrightness(v), 70);
  const sendSpeed = useThrottledCallback((v: number) => manager.masterSpeed(v), 70);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Groups (zones) — one tap selects a saved set of strips */}
      <SectionCard title="Groups">
        <Groups
          groups={groups}
          selected={snapshot.selected}
          onApply={(members) => manager.selectOnly(members)}
          onSave={(name) => saveGroup(name, snapshot.selected)}
          onDelete={deleteGroup}
        />
      </SectionCard>

      {/* Which strips the controls below target */}
      <SectionCard title="Controlling">
        <SelectionChips
          devices={snapshot.devices}
          selected={snapshot.selected}
          onToggle={(name) => manager.toggleSelect(name)}
          onAll={() => manager.selectAll()}
        />
      </SectionCard>

      {/* Power for the current target */}
      <SectionCard title={`Power · ${targetLabel}`}>
        <View style={styles.rowGap}>
          <BigButton label="ON" onPress={() => manager.masterPower(true)} tone="on" active={allOn} style={styles.flex} />
          <BigButton label="OFF" onPress={() => manager.masterPower(false)} tone="off" style={styles.flex} />
        </View>
      </SectionCard>

      {/* Mode switch */}
      <View style={styles.rowGap}>
        <BigButton label="Color" onPress={() => setTab('color')} active={tab === 'color'} tone="accent" small style={styles.flex} />
        <BigButton label="Effects" onPress={() => setTab('effects')} active={tab === 'effects'} tone="accent" small style={styles.flex} />
        <BigButton label="Auto" onPress={() => { setEffect(0); manager.masterAutoCycle(); }} tone="accent" small style={styles.flex} />
      </View>

      {tab === 'color' ? (
        <SectionCard title={`Color · ${targetLabel}`}>
          <ColorPad
            selected={color}
            onPick={(c) => {
              setColor(c);
              manager.masterColor(c);
            }}
          />
        </SectionCard>
      ) : (
        <SectionCard title={`Effects · ${targetLabel}`}>
          <EffectPad
            selected={effect}
            showAll={showAll}
            onToggleAll={() => setShowAll((s) => !s)}
            onPick={(m) => {
              setEffect(m);
              manager.masterEffect(m);
            }}
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
            onValueChange={(v) => {
              setSpeed(v);
              sendSpeed(v);
            }}
            onSlidingComplete={(v) => manager.masterSpeed(v)}
            style={styles.slider}
          />
        </SectionCard>
      )}

      {/* Brightness — always visible */}
      <SectionCard title={`Brightness · ${Math.round((brightness / 255) * 100)}%`}>
        <Slider
          minimumValue={0}
          maximumValue={255}
          value={brightness}
          step={1}
          minimumTrackTintColor={theme.warn}
          maximumTrackTintColor={theme.surfaceHi}
          thumbTintColor={theme.text}
          onValueChange={(v) => {
            setBrightness(v);
            sendBrightness(v);
          }}
          onSlidingComplete={(v) => manager.masterBrightness(v)}
          style={styles.slider}
        />
      </SectionCard>

      {/* Scenes — saved whole-car looks */}
      <SectionCard title="Scenes">
        <Scenes scenes={scenes} onSave={saveCurrent} onApply={applyScene} onDelete={deleteScene} />
      </SectionCard>

      {snapshot.lastWrite ? (
        <Text style={styles.debug}>last command: {snapshot.lastWrite}</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  content: { padding: size.gap, paddingBottom: 48 },
  rowGap: { flexDirection: 'row', gap: size.gap, marginBottom: size.gap },
  flex: { flex: 1 },
  slider: { width: '100%', height: 56 },
  sliderLabel: { color: theme.textDim, fontSize: size.fontSm, fontWeight: '800', marginTop: 12, letterSpacing: 1 },
  debug: { color: theme.textDim, textAlign: 'center', marginTop: 12, fontSize: 13, opacity: 0.7 },
});
