import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LightState } from './ble/types';

const NAMES_KEY = 'artcar.deviceNames.v1';
const SCENES_KEY = 'artcar.scenes.v1';

// The names the controllers advertise over BLE. Editable + persisted in-app so
// new strips can be added in the field without a rebuild.
export const DEFAULT_DEVICE_NAMES = [
  'RHS DL',
  'RHS SKIRT',
  'LHS SKIRT',
  'Back Step',
  'Front Side',
  'LHS DL',
];

export async function loadDeviceNames(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(NAMES_KEY);
    if (!raw) return [...DEFAULT_DEVICE_NAMES];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((x) => typeof x === 'string')) {
      return parsed;
    }
  } catch {
    // fall through to defaults on any corruption
  }
  return [...DEFAULT_DEVICE_NAMES];
}

export async function saveDeviceNames(names: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(NAMES_KEY, JSON.stringify(names));
  } catch {
    // Persistence is best-effort; the in-memory list still works this session.
  }
}

/** A saved whole-car look: each strip name -> its light state. */
export interface Scene {
  id: string;
  name: string;
  states: Record<string, LightState>;
}

export async function loadScenes(): Promise<Scene[]> {
  try {
    const raw = await AsyncStorage.getItem(SCENES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as Scene[];
  } catch {
    // ignore corruption
  }
  return [];
}

export async function saveScenes(scenes: Scene[]): Promise<void> {
  try {
    await AsyncStorage.setItem(SCENES_KEY, JSON.stringify(scenes));
  } catch {
    // best-effort
  }
}
