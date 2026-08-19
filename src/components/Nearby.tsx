import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { size, theme } from '../theme';

/**
 * Shows every BLE name the phone can currently see that isn't already in the
 * device list, so the user can add the controllers' REAL broadcast names.
 */
export function Nearby({
  discovered,
  known,
  scanning,
  onScan,
  onAdd,
}: {
  discovered: string[];
  known: string[];
  scanning: boolean;
  onScan: () => void;
  onAdd: (name: string) => void;
}) {
  const knownSet = new Set(known);
  const fresh = discovered.filter((n) => !knownSet.has(n));

  return (
    <View>
      <Text style={styles.hint}>
        Tap a name to add it as a strip. These are the real names your lights broadcast.
      </Text>

      {fresh.length === 0 ? (
        <Text style={styles.empty}>
          {scanning ? 'Scanning…' : 'Nothing new seen yet.'} Make sure the controllers are powered
          on, then tap Scan.
        </Text>
      ) : (
        <View style={styles.grid}>
          {fresh.map((n) => (
            <Pressable
              key={n}
              onPress={() => onAdd(n)}
              style={({ pressed }) => [styles.item, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={styles.plus}>+</Text>
              <Text style={styles.itemText} numberOfLines={1}>
                {n}
              </Text>
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
  grid: { gap: 8, marginBottom: 12 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: size.touchMd,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: theme.surfaceHi,
    borderWidth: 2,
    borderColor: theme.accent,
  },
  plus: { color: theme.accent, fontSize: 28, fontWeight: '900' },
  itemText: { color: theme.text, fontSize: size.fontMd, fontWeight: '800', flex: 1 },
  scanBtn: {
    minHeight: size.touchMd,
    borderRadius: 12,
    backgroundColor: theme.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanText: { color: '#000', fontSize: size.fontMd, fontWeight: '800' },
});
