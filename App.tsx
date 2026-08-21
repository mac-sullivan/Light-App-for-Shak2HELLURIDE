import React from 'react';
import { Platform, SafeAreaView, StatusBar as RNStatusBar, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake';
import { theme } from './src/theme';
import { useLightManager } from './src/hooks/useLightManager';
import { PermissionGate } from './src/components/PermissionGate';
import { HomeScreen } from './src/components/HomeScreen';

export default function App() {
  // Screen never sleeps while the app is foregrounded (night desert use).
  useKeepAwake();
  const { snapshot, manager } = useLightManager();

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      <PermissionGate bt={snapshot.bt} started={snapshot.started} onStart={() => manager.start()}>
        <HomeScreen />
      </PermissionGate>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.bg,
    // SafeAreaView only insets the notch on iOS; on Android push content below
    // the status bar so the pinned pills don't overlap the battery/clock.
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
});
