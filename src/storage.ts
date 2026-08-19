import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'artcar.deviceNames.v1';

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
    const raw = await AsyncStorage.getItem(KEY);
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
    await AsyncStorage.setItem(KEY, JSON.stringify(names));
  } catch {
    // Persistence is best-effort; the in-memory list still works this session.
  }
}
