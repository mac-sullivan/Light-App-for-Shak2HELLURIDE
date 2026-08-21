import React, { useState } from 'react';
import { Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { size, theme } from '../theme';
import { useLightManager } from '../hooks/useLightManager';
import {
  loadDeviceDefs, saveDeviceDefs,
  loadMapAssign, saveMapAssign,
  loadGroups, saveGroups,
  loadScenes, saveScenes,
} from '../storage';

/**
 * Export the whole setup (device names, map assignment, groups, scenes) to a
 * shareable blob, or import one — so a backup / friend's phone is an instant
 * replica. Works fully offline (AirDrop, message, or copy/paste the text).
 */
export function Backup() {
  const { manager } = useLightManager();
  const [paste, setPaste] = useState('');
  const [status, setStatus] = useState('');

  const doExport = async () => {
    const config = {
      v: 1,
      deviceDefs: await loadDeviceDefs(),
      mapAssign: await loadMapAssign(),
      groups: await loadGroups(),
      scenes: await loadScenes(),
    };
    const json = JSON.stringify(config);
    try {
      await Clipboard.setStringAsync(json);
    } catch {
      /* ignore */
    }
    setStatus('Copied to clipboard — share it or save it somewhere safe.');
    try {
      await Share.share({ message: json });
    } catch {
      /* user cancelled share sheet */
    }
  };

  const doPaste = async () => {
    try {
      const t = await Clipboard.getStringAsync();
      if (t) setPaste(t);
    } catch {
      /* ignore */
    }
  };

  const doImport = async () => {
    try {
      const c = JSON.parse(paste.trim());
      if (Array.isArray(c.deviceDefs)) {
        await saveDeviceDefs(c.deviceDefs);
        manager.setDevices(c.deviceDefs);
      }
      if (c.mapAssign && typeof c.mapAssign === 'object') await saveMapAssign(c.mapAssign);
      if (Array.isArray(c.groups)) await saveGroups(c.groups);
      if (Array.isArray(c.scenes)) await saveScenes(c.scenes);
      setPaste('');
      setStatus('Imported! Reopen the app to load the groups, scenes & map.');
    } catch {
      setStatus('That doesn’t look like a valid backup code.');
    }
  };

  return (
    <View>
      <Text style={styles.hint}>
        Copies your strip names, map layout, groups & scenes. Send it to a backup phone so it’s a full replica.
      </Text>

      <Pressable onPress={doExport} style={styles.exportBtn} hitSlop={8}>
        <Text style={styles.exportText}>Export / share my setup</Text>
      </Pressable>

      <Text style={styles.label}>Import a setup</Text>
      <TextInput
        value={paste}
        onChangeText={setPaste}
        placeholder="Paste a backup code here…"
        placeholderTextColor={theme.textDim}
        autoCorrect={false}
        multiline
        style={styles.input}
      />
      <View style={styles.row}>
        <Pressable onPress={doPaste} style={styles.pasteBtn} hitSlop={8}>
          <Text style={styles.pasteText}>Paste</Text>
        </Pressable>
        <Pressable onPress={doImport} style={[styles.importBtn, !paste && styles.dim]} disabled={!paste} hitSlop={8}>
          <Text style={styles.importText}>Import</Text>
        </Pressable>
      </View>

      {status ? <Text style={styles.status}>{status}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hint: { color: theme.textDim, fontSize: size.fontSm, marginBottom: 12, lineHeight: 20 },
  exportBtn: { minHeight: size.touchLg, borderRadius: size.radius, backgroundColor: theme.accent, alignItems: 'center', justifyContent: 'center' },
  exportText: { color: '#000', fontWeight: '800', fontSize: size.fontMd },
  label: { color: theme.textDim, fontSize: size.fontSm, fontWeight: '800', letterSpacing: 1, marginTop: 20, marginBottom: 8, textTransform: 'uppercase' },
  input: {
    minHeight: 72,
    borderRadius: 12,
    backgroundColor: theme.surfaceAlt,
    borderWidth: 2,
    borderColor: theme.border,
    color: theme.text,
    fontSize: size.fontSm,
    paddingHorizontal: 14,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  row: { flexDirection: 'row', gap: 12, marginTop: 12 },
  pasteBtn: { minHeight: size.touchMd, paddingHorizontal: 22, borderRadius: 12, backgroundColor: theme.surfaceHi, borderWidth: 2, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' },
  pasteText: { color: theme.text, fontWeight: '800', fontSize: size.fontMd },
  importBtn: { flex: 1, minHeight: size.touchMd, borderRadius: 12, backgroundColor: theme.ok, alignItems: 'center', justifyContent: 'center' },
  importText: { color: '#000', fontWeight: '800', fontSize: size.fontMd },
  dim: { opacity: 0.4 },
  status: { color: theme.accent, fontSize: size.fontSm, fontWeight: '700', marginTop: 12, lineHeight: 20 },
});
