import type { RGB } from '../protocol';

export type ConnState =
  | 'idle' // never attempted / not in range yet
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

export type LightMode = 'solid' | 'effect' | 'auto';

/** The full controllable state of one strip. Also what a Scene snapshots. */
export interface LightState {
  power: boolean;
  mode: LightMode;
  color: RGB;
  effect: number; // last selected effect mode (1..120)
  brightness: number; // 0..255
  speed: number; // 0..255
}

export interface DeviceEntry extends LightState {
  /** Advertised BLE name we match on. Stable key. */
  name: string;
  /** BLE peripheral id once discovered (iOS-assigned UUID). */
  id?: string;
  state: ConnState;
  lastError?: string;
  retry: number;
}

export type BtState =
  | 'Unknown'
  | 'Resetting'
  | 'Unsupported'
  | 'Unauthorized'
  | 'PoweredOff'
  | 'PoweredOn';

export interface Snapshot {
  devices: DeviceEntry[];
  bt: BtState;
  started: boolean;
  scanning: boolean;
  /** Names the master controls target. Empty array means "all devices". */
  selected: string[];
  /** Human-readable result of the last command fan-out (for the debug line). */
  lastWrite: string;
}

export const DEFAULT_LIGHT_STATE: LightState = {
  power: true,
  mode: 'solid',
  color: { r: 255, g: 60, b: 140 },
  effect: 1,
  brightness: 200,
  speed: 180,
};
