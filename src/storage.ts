import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LightState } from './ble/types';

// v2: switched the default strip list to the 9 real broadcast names.
const NAMES_KEY = 'artcar.deviceNames.v2';
const SCENES_KEY = 'artcar.scenes.v1';
const GROUPS_KEY = 'artcar.groups.v1';

// The names the controllers advertise over BLE. Editable + persisted in-app so
// new strips can be added in the field without a rebuild.
export const DEFAULT_DEVICE_NAMES = [
  'Front Siding',
  'Front Skirt',
  'Right Skirt',
  'Left Skirt',
  'Right Siding',
  'Left Siding',
  'Balcony',
  'We Will Assist',
  'Back Stairs',
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

/** A named set of strips controlled together. Members may overlap groups. */
export interface Group {
  id: string;
  name: string;
  members: string[];
}

// Pre-built from the car's physical layout. Some strips appear in two groups
// (e.g. Front Siding is in both "Front" and "Sidings") — that's intentional.
export const DEFAULT_GROUPS: Group[] = [
  { id: 'g-front', name: 'Front', members: ['Front Siding', 'Front Skirt'] },
  { id: 'g-sidings', name: 'Sidings', members: ['Front Siding', 'Left Siding', 'Right Siding'] },
  { id: 'g-skirting', name: 'Skirting', members: ['Front Skirt', 'Left Skirt', 'Right Skirt'] },
  { id: 'g-balcony', name: 'Balcony', members: ['Balcony'] },
  { id: 'g-assist', name: 'Assist Sign', members: ['We Will Assist'] },
  { id: 'g-stairs', name: 'Stairs', members: ['Back Stairs'] },
];

export async function loadGroups(): Promise<Group[]> {
  try {
    const raw = await AsyncStorage.getItem(GROUPS_KEY);
    if (raw === null) return [...DEFAULT_GROUPS];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as Group[];
  } catch {
    // ignore corruption
  }
  return [...DEFAULT_GROUPS];
}

export async function saveGroups(groups: Group[]): Promise<void> {
  try {
    await AsyncStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
  } catch {
    // best-effort
  }
}
