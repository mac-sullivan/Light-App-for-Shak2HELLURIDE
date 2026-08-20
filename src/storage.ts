import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LightState } from './ble/types';

const NAMES_KEY = 'artcar.deviceDefs.v2';
const SCENES_KEY = 'artcar.scenes.v1';
const GROUPS_KEY = 'artcar.groups.v2';

/**
 * A strip the app controls. `name` is the exact BLE broadcast name we connect
 * by (stable key). `label` is an optional friendly display name the user sets
 * (e.g. broadcast "RHS DL" shown as "Right Siding").
 */
export interface DeviceDef {
  name: string;
  label?: string;
}

// Fresh installs start empty and discover lights via the Nearby scanner — no
// pre-seeded ghost names to clutter things up.
export const DEFAULT_DEVICE_DEFS: DeviceDef[] = [];

export async function loadDeviceDefs(): Promise<DeviceDef[]> {
  try {
    const raw = await AsyncStorage.getItem(NAMES_KEY);
    if (!raw) return [...DEFAULT_DEVICE_DEFS];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Migrate old string[] format, and accept the new object form.
      return parsed
        .map((x): DeviceDef | null => {
          if (typeof x === 'string') return { name: x };
          if (x && typeof x.name === 'string') {
            return { name: x.name, label: typeof x.label === 'string' ? x.label : undefined };
          }
          return null;
        })
        .filter((x): x is DeviceDef => x !== null);
    }
  } catch {
    // fall through to defaults
  }
  return [...DEFAULT_DEVICE_DEFS];
}

export async function saveDeviceDefs(defs: DeviceDef[]): Promise<void> {
  try {
    await AsyncStorage.setItem(NAMES_KEY, JSON.stringify(defs));
  } catch {
    // best-effort
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
    // ignore
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

/** A named set of strips (by broadcast name) controlled together. */
export interface Group {
  id: string;
  name: string;
  members: string[];
}

// Start with no groups; the user builds them from their real lights.
export const DEFAULT_GROUPS: Group[] = [];

export async function loadGroups(): Promise<Group[]> {
  try {
    const raw = await AsyncStorage.getItem(GROUPS_KEY);
    if (raw === null) return [...DEFAULT_GROUPS];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as Group[];
  } catch {
    // ignore
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
