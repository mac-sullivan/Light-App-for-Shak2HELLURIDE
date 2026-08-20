import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { size, theme } from '../theme';
import { useLightManager } from '../hooks/useLightManager';
import { SWATCHES, EFFECT_FAVORITES, effectName } from '../effects';
import { rgbCss } from '../util/color';
import { BigButton } from './BigButton';
import { ShackMap } from './ShackMap';

export function ShackMapPanel() {
  const { snapshot, manager } = useLightManager();

  const allSelected = snapshot.selected.length === 0;
  const selectedSet = useMemo(() => new Set(snapshot.selected), [snapshot.selected]);
  const targetDevices = snapshot.devices.filter(
    (d) => d.state === 'connected' && (allSelected || selectedSet.has(d.name))
  );
  const allOn = targetDevices.length > 0 && targetDevices.every((d) => d.power);
  const targetLabel = allSelected ? 'All strips' : `${snapshot.selected.length} selected`;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.hint}>Tap the shack — pick the strips you're looking at.</Text>

      <ShackMap
        devices={snapshot.devices}
        selected={snapshot.selected}
        onToggle={(name) => manager.toggleSelect(name)}
      />

      <View style={styles.controlBar}>
        <Text style={styles.controlling}>Controlling · {targetLabel}</Text>
        <BigButton label="All" onPress={() => manager.selectAll()} active={allSelected} tone="accent" small style={styles.allBtn} />
      </View>

      <View style={styles.rowGap}>
        <BigButton label="ON" onPress={() => manager.masterPower(true)} tone="on" active={allOn} style={styles.flex} />
        <BigButton label="OFF" onPress={() => manager.masterPower(false)} tone="off" style={styles.flex} />
      </View>

      <Text style={styles.label}>Color</Text>
      <View style={styles.swatches}>
        {SWATCHES.map((s) => (
          <Pressable
            key={s.name}
            onPress={() => manager.masterColor(s.rgb)}
            style={({ pressed }) => [styles.swatch, { backgroundColor: rgbCss(s.rgb), opacity: pressed ? 0.7 : 1 }]}
          />
        ))}
      </View>

      <Text style={styles.label}>Effects</Text>
      <View style={styles.effects}>
        {EFFECT_FAVORITES.map((mode) => (
          <BigButton key={mode} label={effectName(mode)} onPress={() => manager.masterEffect(mode)} small style={styles.effect} />
        ))}
        <BigButton label="Auto" onPress={() => manager.masterAutoCycle()} small tone="accent" style={styles.effect} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  content: { paddingHorizontal: size.gap, paddingTop: 54, paddingBottom: 48 },
  hint: { color: theme.textDim, fontSize: size.fontSm, marginBottom: 10 },
  controlBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: size.gap, marginBottom: size.gap },
  controlling: { color: theme.text, fontSize: size.fontMd, fontWeight: '800' },
  allBtn: { minWidth: 90 },
  rowGap: { flexDirection: 'row', gap: size.gap, marginBottom: size.gap },
  flex: { flex: 1 },
  label: { color: theme.textDim, fontSize: size.fontSm, fontWeight: '800', letterSpacing: 1, marginTop: 8, marginBottom: 8 },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  swatch: { width: '14.5%', aspectRatio: 1, borderRadius: 10, borderWidth: 2, borderColor: '#00000055' },
  effects: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  effect: { minWidth: '30%', flexGrow: 1 },
});
