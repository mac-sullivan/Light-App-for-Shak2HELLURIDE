import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { size, theme } from '../theme';
import { useLightManager } from '../hooks/useLightManager';
import { SectionCard } from './SectionCard';
import { BigButton } from './BigButton';
import { DeviceList } from './DeviceList';
import { Nearby } from './Nearby';

export function DevicesPanel() {
  const { snapshot, manager, addDevice, removeDevice, resetDefaults } = useLightManager();
  const [editing, setEditing] = useState(false);

  const connected = snapshot.devices.filter((d) => d.state === 'connected').length;
  const total = snapshot.devices.length;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Nearby scanner — find the controllers' real broadcast names */}
      <SectionCard title="Nearby lights">
        <Nearby
          discovered={snapshot.discovered}
          known={snapshot.devices.map((d) => d.name)}
          scanning={snapshot.scanning}
          onScan={() => manager.scanNow()}
          onAdd={(name) => addDevice(name)}
        />
      </SectionCard>

      {/* The strips this app controls */}
      <SectionCard title={`My strips · ${connected}/${total} linked`}>
        <View style={styles.header}>
          <Text style={styles.hint}>
            {editing ? 'Add / remove strip names' : 'Names must match what the light broadcasts'}
          </Text>
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
          selected={snapshot.selected}
          onToggleSelect={(name) => manager.toggleSelect(name)}
          onTogglePower={(name, on) => manager.devicePower(name, on)}
          onRemove={removeDevice}
          onAdd={addDevice}
          onReset={resetDefaults}
        />
      </SectionCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  content: { padding: size.gap, paddingBottom: 48 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  hint: { color: theme.textDim, fontSize: size.fontSm, flex: 1 },
  editBtn: { minWidth: 96 },
});
