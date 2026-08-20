import React, { useMemo, useState } from 'react';
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
import { Groups } from './Groups';
import { AdvancedSetup } from './AdvancedSetup';

export function ControlPanel() {
  const { snapshot, manager } = useLightManager();
  const { groups, saveGroup, deleteGroup } = useGroups();
  const { scenes, applyScene } = useScenes();

  const [tab, setTab] = useState<'color' | 'effects'>('color');
  const [color, setColor] = useState<RGB>({ r: 255, g: 60, b: 140 });
  const [brightness, setBrightness] = useState(200);
  const [effect, setEffect] = useState<number | undefined>(undefined);
  const [speed, setSpeed] = useState(180);
  const [showAllEffects, setShowAllEffects] = useState(false);
  const [showStrips, setShowStrips] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const allSelected = snapshot.selected.length === 0;
  const selectedSet = useMemo(() => new Set(snapshot.selected), [snapshot.selected]);
  const targetDevices = snapshot.devices.filter(
    (d) => d.state === 'connected' && (allSelected || selectedSet.has(d.name))
  );
  const allOn = targetDevices.length > 0 && targetDevices.every((d) => d.power);
  const targetLabel = allSelected ? 'All strips' : `${snapshot.selected.length} selected`;

  const sendColor = useThrottledCallback((c: RGB) => manager.masterColor(c), 90);
  const sendBrightness = useThrottledCallback((v: number) => manager.masterBrightness(v), 70);
  const sendSpeed = useThrottledCallback((v: number) => manager.masterSpeed(v), 70);
  const sendWhite = useThrottledCallback((v: number) => manager.masterWhite(v), 80);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* What am I controlling */}
      <SectionCard title={`Controlling · ${targetLabel}`}>
        <View style={styles.rowGap}>
          <BigButton label="All strips" onPress={() => manager.selectAll()} active={allSelected} tone="accent" small style={styles.flex} />
          <BigButton label={showStrips ? 'Hide strips' : 'Pick strips'} onPress={() => setShowStrips((s) => !s)} active={showStrips} tone="accent" small style={styles.flex} />
        </View>
        {showStrips ? (
          <SelectionChips devices={snapshot.devices} selected={snapshot.selected} onToggle={(name) => manager.toggleSelect(name)} />
        ) : null}
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
        <BigButton label="Auto" onPress={() => { setEffect(0); manager.masterAutoCycle(); }} tone="accent" small style={styles.flex} />
      </View>

      {tab === 'color' ? (
        <SectionCard title={`Color · ${targetLabel}`}>
          <ColorPicker
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
          <Text style={styles.sliderLabel}>Color order — tap until red looks red</Text>
          <View style={styles.quickRow}>
            {SEQUENCES.map((s, i) => (
              <BigButton
                key={s}
                label={s}
                onPress={() => manager.masterSequence(i)}
                small
                style={styles.quick}
              />
            ))}
          </View>
        </SectionCard>
      ) : (
        <SectionCard title={`Effects · ${targetLabel}`}>
          {scenes.length > 0 ? (
            <>
              <Text style={styles.sliderLabel}>♥ Your scenes</Text>
              <View style={styles.quickRow}>
                {scenes.map((s) => (
                  <BigButton
                    key={s.id}
                    label={`♥ ${s.name}`}
                    onPress={() => applyScene(s)}
                    small
                    tone="accent"
                    active
                    style={styles.quick}
                  />
                ))}
              </View>
            </>
          ) : null}
          <EffectPad
            selected={effect}
            showAll={showAllEffects}
            onToggleAll={() => setShowAllEffects((s) => !s)}
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
            onWhite={sendWhite}
            onWhiteFinal={(v) => manager.masterWhite(v)}
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
  flex: { flex: 1 },
  slider: { width: '100%', height: 56 },
  sliderLabel: { color: theme.textDim, fontSize: size.fontSm, fontWeight: '800', marginTop: 12, letterSpacing: 1 },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  quick: { flexGrow: 1, minWidth: '30%' },
  saveRow: { marginTop: 10 },
  debug: { color: theme.textDim, textAlign: 'center', marginTop: 12, fontSize: 13, opacity: 0.7 },
});
