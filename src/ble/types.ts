import type { RGB } from '../protocol';

export type ConnState =
  | 'idle' // never attempted / not in range yet
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

export interface DeviceEntry {
  /** Advertised BLE name we match on. Stable key. */
  name: string;
  /** BLE peripheral id once discovered (iOS-assigned UUID). */
  id?: string;
  state: ConnState;
  /** Optimistic last-known values, for the per-device UI. */
  power: boolean;
  color: RGB;
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
  /** Human-readable result of the last command fan-out (for the debug line). */
  lastWrite: string;
}
