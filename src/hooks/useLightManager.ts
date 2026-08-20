import { useEffect, useSyncExternalStore } from 'react';
import { lightManager } from '../ble/LightManager';
import { DEFAULT_DEVICE_DEFS, loadDeviceDefs, saveDeviceDefs } from '../storage';
import type { Snapshot } from '../ble/types';

let loadedOnce = false;

/**
 * React binding for the singleton LightManager. Loads the persisted device
 * list on first mount and keeps AsyncStorage in sync with edits.
 */
export function useLightManager(): {
  snapshot: Snapshot;
  manager: typeof lightManager;
  addDevice: (name: string, label?: string) => void;
  removeDevice: (name: string) => void;
  removeOffline: () => void;
  setLabel: (name: string, label: string) => void;
  resetDefaults: () => void;
} {
  const snapshot = useSyncExternalStore(lightManager.subscribe, lightManager.getSnapshot);

  useEffect(() => {
    if (loadedOnce) return;
    loadedOnce = true;
    loadDeviceDefs().then((defs) => lightManager.setDevices(defs));
  }, []);

  const persist = () => void saveDeviceDefs(lightManager.currentDefs());

  const addDevice = (name: string, label?: string) => {
    lightManager.addDevice(name, label);
    persist();
  };

  const removeDevice = (name: string) => {
    lightManager.removeDevice(name);
    persist();
  };

  const removeOffline = () => {
    lightManager.removeOffline();
    persist();
  };

  const setLabel = (name: string, label: string) => {
    lightManager.setLabel(name, label);
    persist();
  };

  const resetDefaults = () => {
    lightManager.setDevices(DEFAULT_DEVICE_DEFS);
    void saveDeviceDefs(DEFAULT_DEVICE_DEFS);
  };

  return { snapshot, manager: lightManager, addDevice, removeDevice, removeOffline, setLabel, resetDefaults };
}
