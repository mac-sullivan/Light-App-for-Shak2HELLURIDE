import { useEffect, useSyncExternalStore } from 'react';
import { lightManager } from '../ble/LightManager';
import { DEFAULT_DEVICE_NAMES, loadDeviceNames, saveDeviceNames } from '../storage';
import type { Snapshot } from '../ble/types';

let loadedOnce = false;

/**
 * React binding for the singleton LightManager. Loads the persisted device
 * names on first mount and keeps AsyncStorage in sync with edits.
 */
export function useLightManager(): {
  snapshot: Snapshot;
  manager: typeof lightManager;
  addDevice: (name: string) => void;
  removeDevice: (name: string) => void;
  resetDefaults: () => void;
} {
  const snapshot = useSyncExternalStore(lightManager.subscribe, lightManager.getSnapshot);

  useEffect(() => {
    if (loadedOnce) return;
    loadedOnce = true;
    loadDeviceNames().then((names) => lightManager.setWantedNames(names));
  }, []);

  const addDevice = (name: string) => {
    lightManager.addDevice(name);
    void saveDeviceNames(lightManager.currentNames());
  };

  const removeDevice = (name: string) => {
    lightManager.removeDevice(name);
    void saveDeviceNames(lightManager.currentNames());
  };

  const resetDefaults = () => {
    lightManager.setWantedNames(DEFAULT_DEVICE_NAMES);
    void saveDeviceNames(DEFAULT_DEVICE_NAMES);
  };

  return { snapshot, manager: lightManager, addDevice, removeDevice, resetDefaults };
}
