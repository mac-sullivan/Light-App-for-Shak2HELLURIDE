import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LightState } from './ble/types';

const NAMES_KEY = 'artcar.deviceDefs.v2';
const SCENES_KEY = 'artcar.scenes.v1';
const GROUPS_KEY = 'artcar.groups.v2';
const LASTLOOK_KEY = 'artcar.lastLook.v1';
const MAPASSIGN_KEY = 'artcar.mapAssign.v1';

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

/**
 * A saved whole-car look. `states` maps each strip name -> its light state.
 * `uniform`, if set, applies one state to EVERY connected strip (used by
 * pre-made scenes that don't know your device names yet).
 */
export interface Scene {
  id: string;
  name: string;
  states: Record<string, LightState>;
  uniform?: LightState;
}

// A pre-made scene for testing: a warm orange/red fire animation on all strips.
export const DEFAULT_SCENES: Scene[] = [
  {
    id: 'scene-hawty',
    name: 'Hawty',
    states: {},
    uniform: {
      power: true,
      mode: 'effect',
      color: { r: 255, g: 40, b: 0 }, // base warm ember for monochrome fire effects
      effect: 40, // "Lava Flow" — a fire-family animation
      brightness: 255,
      speed: 200,
      sequence: 2,
      white: 0,
      icModel: null,
      pixels: null,
    },
  },
];

export async function loadScenes(): Promise<Scene[]> {
  try {
    const raw = await AsyncStorage.getItem(SCENES_KEY);
    if (raw === null) return [...DEFAULT_SCENES];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as Scene[];
  } catch {
    // ignore
  }
  return [...DEFAULT_SCENES];
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

/** The last look (each strip's state) so we can restore it on next launch. */
export async function loadLastLook(): Promise<Record<string, LightState> | null> {
  try {
    const raw = await AsyncStorage.getItem(LASTLOOK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed as Record<string, LightState>;
  } catch {
    // ignore
  }
  return null;
}

export async function saveLastLook(states: Record<string, LightState>): Promise<void> {
  try {
    await AsyncStorage.setItem(LASTLOOK_KEY, JSON.stringify(states));
  } catch {
    // best-effort
  }
}

/** Map slot name -> device name, so the shack map works regardless of BLE names. */
export async function loadMapAssign(): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(MAPASSIGN_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed as Record<string, string>;
    }
  } catch {
    // ignore
  }
  return {};
}

export async function saveMapAssign(assign: Record<string, string>): Promise<void> {
  try {
    await AsyncStorage.setItem(MAPASSIGN_KEY, JSON.stringify(assign));
  } catch {
    // best-effort
  }
}
