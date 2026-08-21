import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { size, theme } from '../theme';
import { useLightManager } from '../hooks/useLightManager';
import { useMapAssign } from '../hooks/useMapAssign';
import { useGroups } from '../hooks/useGroups';
import { BigButton } from './BigButton';
import { SectionCard } from './SectionCard';
import { SelectionChips } from './SelectionChips';
import { ShackMap } from './ShackMap';
import { Groups } from './Groups';
import { AdvancedSetup } from './AdvancedSetup';
import type { DeviceEntry } from '../ble/types';

/**
 * The strip-selection sheet — opened from the top "Controlling…" indicator.
 * Pick which strips the Color/Effects controls target (map or list), manage the
 * map assignment, groups, and per-strip advanced setup.
 */
export function StripSelector({ onDone }: { onDone: () => void }) {
  const { snapshot, manager } = useLightManager();
  const { assign, setSlot } = useMapAssign();
  const { groups, saveGroup, deleteGroup } = useGroups();
  const [pickMode, setPickMode] = useState<'map' | 'list'>('map');
  const [assignMode, setAssignMode] = useState(false);
  const [pendingSlot, setPendingSlot] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const allSelected = snapshot.selected.length === 0;
  const targetLabel = allSelected ? 'All strips' : `${snapshot.selected.length} selected`;

  const onSlotPress = (slot: string, dev?: DeviceEntry) => {
    if (assignMode) setPendingSlot((p) => (p === slot ? null : slot));
    else if (dev) manager.toggleSelect(dev.name);
  };

  return (
    <>
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

      <SectionCard title="Advanced setup">
        <BigButton label={showAdvanced ? 'Hide advanced' : 'LED type · pixel count'} onPress={() => setShowAdvanced((s) => !s)} active={showAdvanced} tone="accent" small />
        {showAdvanced ? <AdvancedSetup targetLabel={targetLabel} onIcModel={(i) => manager.masterIcModel(i)} onPixels={(n) => manager.masterPixels(n)} /> : null}
      </SectionCard>

      <BigButton label="Done" onPress={onDone} tone="accent" active style={styles.done} />
    </>
  );
}

const styles = StyleSheet.create({
  selectAll: { marginBottom: size.gap },
  rowGap: { flexDirection: 'row', gap: size.gap, marginBottom: size.gap },
  flex: { flex: 1 },
  assignToggle: { marginTop: 10 },
  assignBox: { marginTop: 10, padding: 10, borderRadius: size.radius, backgroundColor: theme.surfaceAlt, borderWidth: 1, borderColor: theme.accent },
  assignTitle: { color: theme.text, fontSize: size.fontSm, fontWeight: '800', marginBottom: 6 },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  quick: { flexGrow: 1, minWidth: '30%' },
  done: { marginTop: 4 },
});
