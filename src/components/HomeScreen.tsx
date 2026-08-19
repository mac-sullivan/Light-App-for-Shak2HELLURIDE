import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { size, theme } from '../theme';
import type { RGB } from '../protocol';
import { useLightManager } from '../hooks/useLightManager';
import { useThrottledCallback } from '../util/throttle';
import { BigButton } from './BigButton';
import { SectionCard } from './SectionCard';
import { ColorPad } from './ColorPad';
import { EffectPad } from './EffectPad';
import { DeviceList } from './DeviceList';

export function HomeScreen() {
  const { snapshot, manager, addDevice, removeDevice } = useLightManager();

  const [tab, setTab] = useState<'color' | 'effects'>('color');
  const [color, setColor] = useState<RGB>({ r: 255, g: 60, b: 140 });
  const [brightness, setBrightness] = useState(200);
  const [effect, setEffect] = useState<number | undefined>(undefined);
  const [speed, setSpeed] = useState(180);
  const [showAll, setShowAll] = useState(false);
  const [editing, setEditing] = useState(false);

  const connected = snapshot.devices.filter((d) => d.state === 'connected').length;
  const total = snapshot.devices.length;
  const allOn = connected > 0 && connected === total;

  const summaryColor = useMemo(() => {
    if (total === 0) return theme.textDim;
    if (connected === 0) return theme.err;
    if (connected < total) return theme.warn;
    return theme.ok;
  }, [connected, total]);

  const sendBrightness = useThrottledCallback((v: number) => manager.masterBrightness(v), 70);
  const sendSpeed = useThrottledCallback((v: number) => manager.masterSpeed(v), 70);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Connection summary — readable at arm's length */}
      <View style={styles.header}>
        <View style={[styles.summaryBar, { borderColor: summaryColor }]}>
          <Text style={[styles.summaryNum, { color: summaryColor }]}>
            {connected}/{total}
          </Text>
          <Text style={styles.summaryLabel}>LINKED</Text>
          {snapshot.scanning ? <Text style={styles.scanning}>scanning…</Text> : null}
        </View>
        <BigButton
          label="Reconnect all"
          onPress={() => manager.reconnectAll()}
          tone="accent"
          small
          style={styles.reconnect}
        />
      </View>

      {/* Master power */}
      <SectionCard title="Master power">
        <View style={styles.rowGap}>
          <BigButton
            label="ALL ON"
            onPress={() => manager.masterPower(true)}
            tone="on"
            active={allOn}
            style={styles.flex}
          />
          <BigButton
            label="ALL OFF"
            onPress={() => manager.masterPower(false)}
            tone="off"
            style={styles.flex}
          />
        </View>
      </SectionCard>

      {/* Mode switch */}
      <View style={styles.rowGap}>
        <BigButton label="Color" onPress={() => setTab('color')} active={tab === 'color'} tone="accent" small style={styles.flex} />
        <BigButton label="Effects" onPress={() => setTab('effects')} active={tab === 'effects'} tone="accent" small style={styles.flex} />
        <BigButton label="Auto" onPress={() => { setEffect(0); manager.masterAutoCycle(); }} tone="accent" small style={styles.flex} />
      </View>

      {tab === 'color' ? (
        <SectionCard title="Color">
          <ColorPad
            selected={color}
            onPick={(c) => {
              setColor(c);
              manager.masterColor(c);
            }}
          />
        </SectionCard>
      ) : (
        <SectionCard title="Effects">
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
      <SectionCard title={`Brightness  ·  ${Math.round((brightness / 255) * 100)}%`}>
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

      {/* Per-device */}
      <SectionCard title="Devices">
        <View style={styles.deviceHeader}>
          <Text style={styles.deviceHint}>Tap a strip to control it</Text>
          <BigButton
            label={editing ? 'Done' : 'Edit'}
            onPress={() => setEditing((e) => !e)}
            small
            active={editing}
            tone="accent"
            style={styles.editBtn}
          />
        </View>
        <DeviceList
          devices={snapshot.devices}
          editing={editing}
          onTogglePower={(name, on) => manager.devicePower(name, on)}
          onRemove={removeDevice}
          onAdd={addDevice}
          onDeviceColor={(name, c) => manager.deviceColor(name, c)}
          onDeviceEffect={(name, m) => manager.deviceEffect(name, m)}
          onDeviceBrightness={(name, v) => manager.deviceBrightness(name, v)}
        />
      </SectionCard>

      <Text style={styles.footer}>Offline · Bluetooth only · {total} controllers</Text>
      {snapshot.lastWrite ? (
        <Text style={styles.debug}>last command: {snapshot.lastWrite}</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  content: { padding: size.gap, paddingBottom: 48 },
  header: { flexDirection: 'row', gap: size.gap, marginBottom: size.gap, alignItems: 'stretch' },
  summaryBar: {
    flex: 1,
    borderRadius: size.radius,
    borderWidth: 3,
    backgroundColor: theme.surface,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  summaryNum: { fontSize: size.fontXl, fontWeight: '900' },
  summaryLabel: { color: theme.textDim, fontSize: size.fontMd, fontWeight: '800', letterSpacing: 2 },
  scanning: { color: theme.warn, fontSize: size.fontSm, marginLeft: 'auto', fontWeight: '700' },
  reconnect: { justifyContent: 'center' },
  rowGap: { flexDirection: 'row', gap: size.gap, marginBottom: size.gap },
  flex: { flex: 1 },
  slider: { width: '100%', height: 56 },
  sliderLabel: { color: theme.textDim, fontSize: size.fontSm, fontWeight: '800', marginTop: 12, letterSpacing: 1 },
  deviceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  deviceHint: { color: theme.textDim, fontSize: size.fontSm },
  editBtn: { minWidth: 96 },
  footer: { color: theme.textDim, textAlign: 'center', marginTop: 20, fontSize: size.fontSm },
  debug: { color: theme.textDim, textAlign: 'center', marginTop: 6, fontSize: 13, opacity: 0.7 },
});
