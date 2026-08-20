import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { size, theme } from '../theme';
import type { DiscoveredDevice } from '../ble/types';

// RSSI (dBm) -> 0..4 bars. Closer/stronger = more bars.
function bars(rssi: number): number {
  if (rssi >= -55) return 4;
  if (rssi >= -67) return 3;
  if (rssi >= -78) return 2;
  if (rssi >= -90) return 1;
  return 0;
}

function Signal({ rssi }: { rssi: number }) {
  const n = bars(rssi);
  return (
    <View style={styles.signal}>
      {[0, 1, 2, 3].map((i) => (
        <View
          key={i}
          style={[
            styles.bar,
            { height: 6 + i * 4, backgroundColor: i < n ? theme.ok : theme.border },
          ]}
        />
      ))}
    </View>
  );
}

/**
 * Lists nearby BLE names (strongest signal first) that aren't already added.
 * Your controllers are physically closest, so they sort to the top.
 */
export function Nearby({
  discovered,
  known,
  scanning,
  onScan,
  onAdd,
}: {
  discovered: DiscoveredDevice[];
  known: string[];
  scanning: boolean;
  onScan: () => void;
  onAdd: (name: string) => void;
}) {
  const knownSet = new Set(known);
  const fresh = discovered.filter((d) => !knownSet.has(d.name));

  return (
    <View>
      <Text style={styles.hint}>Closest lights are at the top. Tap one to add it as a strip.</Text>

      {fresh.length === 0 ? (
        <Text style={styles.empty}>
          {scanning ? 'Scanning…' : 'Nothing new nearby.'} Power on the controllers, then tap Scan.
        </Text>
      ) : (
        <View style={styles.list}>
          {fresh.map((d) => (
            <Pressable
              key={d.name}
              onPress={() => onAdd(d.name)}
              style={({ pressed }) => [styles.item, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Signal rssi={d.rssi} />
              <Text style={styles.itemText} numberOfLines={1}>
                {d.name}
              </Text>
              <Text style={styles.plus}>+</Text>
            </Pressable>
          ))}
        </View>
      )}

      <Pressable onPress={onScan} style={styles.scanBtn} hitSlop={8}>
        <Text style={styles.scanText}>{scanning ? 'Scanning…' : 'Scan for lights'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  hint: { color: theme.textDim, fontSize: size.fontSm, marginBottom: 12 },
  empty: { color: theme.textDim, fontSize: size.fontSm, marginBottom: 12 },
  list: { gap: 8, marginBottom: 12 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: size.touchMd,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: theme.surfaceHi,
    borderWidth: 2,
    borderColor: theme.border,
  },
  itemText: { color: theme.text, fontSize: size.fontMd, fontWeight: '800', flex: 1 },
  plus: { color: theme.accent, fontSize: 28, fontWeight: '900' },
  signal: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 20, width: 26 },
  bar: { width: 5, borderRadius: 1 },
  scanBtn: {
    minHeight: size.touchMd,
    borderRadius: 12,
    backgroundColor: theme.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanText: { color: '#000', fontSize: size.fontMd, fontWeight: '800' },
});
