import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { size, theme } from '../theme';
import { useLightManager } from '../hooks/useLightManager';
import { SectionCard } from './SectionCard';
import { BigButton } from './BigButton';
import { DeviceList } from './DeviceList';
import { Nearby } from './Nearby';
import { Backup } from './Backup';

export function DevicesPanel() {
  const { snapshot, manager, addDevice, removeDevice, removeOffline, setLabel } = useLightManager();
  const [editing, setEditing] = useState(false);

  const connected = snapshot.devices.filter((d) => d.state === 'connected').length;
  const total = snapshot.devices.length;
  const offline = total - connected;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      automaticallyAdjustKeyboardInsets
    >
      <BigButton
        label={`↻  Reconnect all  ·  ${connected}/${total}`}
        onPress={() => manager.reconnectAll()}
        tone="accent"
        style={styles.reconnect}
      />

      {/* Find + add the real lights */}
      <SectionCard title="Add lights (nearby)">
        <Nearby
          discovered={snapshot.discovered}
          known={snapshot.devices.map((d) => d.name)}
          scanning={snapshot.scanning}
          onScan={() => manager.scanNow()}
          onAdd={(name) => addDevice(name)}
        />
      </SectionCard>

      {/* The strips this app controls */}
      <SectionCard title={`My lights · ${connected}/${total} linked`}>
        <View style={styles.header}>
          <Text style={styles.hint}>
            {editing ? 'Rename or remove strips' : 'Tap Edit to rename cryptic names'}
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

        {total === 0 ? (
          <Text style={styles.empty}>
            No strips yet. Use “Add lights (nearby)” above to scan and add your controllers.
          </Text>
        ) : (
          <DeviceList
            devices={snapshot.devices}
            editing={editing}
            selected={snapshot.selected}
            onToggleSelect={(name) => manager.toggleSelect(name)}
            onTogglePower={(name, on) => manager.devicePower(name, on)}
            onRemove={removeDevice}
            onAdd={addDevice}
            onSetLabel={setLabel}
          />
        )}

        {offline > 0 ? (
          <BigButton
            label={`Remove ${offline} offline / junk`}
            onPress={removeOffline}
            small
            tone="off"
            style={styles.cleanup}
          />
        ) : null}
      </SectionCard>

      <SectionCard title="Backup & share setup">
        <Backup />
      </SectionCard>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  content: { paddingHorizontal: size.gap, paddingTop: 98, paddingBottom: 320 },
  reconnect: { marginBottom: size.gap },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  hint: { color: theme.textDim, fontSize: size.fontSm, flex: 1 },
  editBtn: { minWidth: 96 },
  empty: { color: theme.textDim, fontSize: size.fontMd, lineHeight: 24, paddingVertical: 8 },
  cleanup: { marginTop: 16 },
});
