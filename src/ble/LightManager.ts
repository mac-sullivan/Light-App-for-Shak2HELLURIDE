import { BleManager, Device, State as BlePlxState } from 'react-native-ble-plx';
import {
  CHAR_UUID,
  SERVICE_UUID,
  SP110E,
  bytesToBase64,
  type RGB,
} from '../protocol';
import type { BtState, DeviceEntry, Snapshot } from './types';

const SCAN_WINDOW_MS = 12_000; // how long a single scan sweep runs
const RESCAN_IDLE_MS = 4_000; // pause between sweeps while devices are missing
const MAX_BACKOFF_MS = 20_000;
const BASE_BACKOFF_MS = 600;

/**
 * Owns all BLE state for the art car. One instance for the whole app.
 *
 * Design rules that matter in the field:
 *  - Every device is independent. One failing connect/write never blocks others
 *    (all fan-out uses Promise.allSettled; each device has its own timers).
 *  - Reconnect is automatic with exponential backoff + jitter.
 *  - The BleManager (and therefore the iOS permission prompt) is created lazily
 *    in start(), so it fires only after the user reads the rationale screen.
 */
export class LightManager {
  private ble: BleManager | null = null;
  private bt: BtState = 'Unknown';
  private started = false;
  private scanning = false;

  private byName = new Map<string, DeviceEntry>();
  private disconnectSubs = new Map<string, { remove: () => void }>();
  private reconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private scanTimer: ReturnType<typeof setTimeout> | null = null;

  private listeners = new Set<() => void>();
  private snapshot: Snapshot = { devices: [], bt: 'Unknown', started: false, scanning: false };

  // ---------------------------------------------------------------- store API
  subscribe = (cb: () => void): (() => void) => {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  };

  getSnapshot = (): Snapshot => this.snapshot;

  private emit() {
    this.snapshot = {
      devices: [...this.byName.values()].map((d) => ({ ...d })),
      bt: this.bt,
      started: this.started,
      scanning: this.scanning,
    };
    this.listeners.forEach((cb) => cb());
  }

  // ------------------------------------------------------------- device list
  setWantedNames(names: string[]) {
    const wanted = new Set(names.map((n) => n.trim()).filter(Boolean));

    // Add new entries.
    for (const name of wanted) {
      if (!this.byName.has(name)) {
        this.byName.set(name, {
          name,
          state: 'idle',
          power: true,
          color: { r: 255, g: 255, b: 255 },
          retry: 0,
        });
      }
    }
    // Drop removed entries (and tear down their connections).
    for (const name of [...this.byName.keys()]) {
      if (!wanted.has(name)) {
        this.teardownDevice(name);
        this.byName.delete(name);
      }
    }
    this.emit();
    if (this.started && this.bt === 'PoweredOn') this.ensureScanning();
  }

  addDevice(name: string) {
    const n = name.trim();
    if (!n || this.byName.has(n)) return;
    this.byName.set(n, {
      name: n,
      state: 'idle',
      power: true,
      color: { r: 255, g: 255, b: 255 },
      retry: 0,
    });
    this.emit();
    if (this.started && this.bt === 'PoweredOn') this.ensureScanning();
  }

  removeDevice(name: string) {
    if (!this.byName.has(name)) return;
    this.teardownDevice(name);
    this.byName.delete(name);
    this.emit();
  }

  currentNames(): string[] {
    return [...this.byName.keys()];
  }

  // ------------------------------------------------------------------- start
  /** Create the BleManager and begin. Triggers the iOS Bluetooth prompt. */
  start() {
    if (this.started) return;
    this.started = true;
    this.ble = new BleManager();
    this.ble.onStateChange((s) => this.onBtState(mapState(s)), true);
    this.emit();
  }

  private onBtState(next: BtState) {
    this.bt = next;
    if (next === 'PoweredOn') {
      this.ensureScanning();
    } else {
      // Radio went away: mark everything down but keep entries + retry state.
      this.stopScan();
      for (const d of this.byName.values()) {
        if (d.state === 'connected') d.state = 'reconnecting';
      }
    }
    this.emit();
  }

  // ---------------------------------------------------------------- scanning
  private ensureScanning() {
    if (!this.ble || this.bt !== 'PoweredOn' || this.scanning) return;
    const missing = [...this.byName.values()].some(
      (d) => d.state !== 'connected' && d.state !== 'connecting'
    );
    if (!missing) return;

    this.scanning = true;
    this.emit();
    try {
      this.ble.startDeviceScan(null, { allowDuplicates: false }, (err, device) => {
        if (err) {
          this.stopScan();
          this.scheduleRescan();
          return;
        }
        if (!device) return;
        const advertised = device.name ?? device.localName ?? undefined;
        if (!advertised) return;
        const entry = this.byName.get(advertised);
        if (!entry) return;
        if (entry.state === 'idle' || entry.state === 'error' || entry.state === 'reconnecting') {
          void this.connect(entry, device);
        }
        if (!this.hasMissing()) this.stopScan();
      });
    } catch {
      this.scanning = false;
      this.scheduleRescan();
      this.emit();
      return;
    }

    // Bounded sweep; rescan later if devices are still missing.
    this.scanTimer = setTimeout(() => {
      this.stopScan();
      if (this.hasMissing()) this.scheduleRescan();
    }, SCAN_WINDOW_MS);
  }

  private hasMissing(): boolean {
    return [...this.byName.values()].some(
      (d) => d.state !== 'connected' && d.state !== 'connecting'
    );
  }

  private stopScan() {
    if (this.scanTimer) {
      clearTimeout(this.scanTimer);
      this.scanTimer = null;
    }
    if (this.scanning && this.ble) {
      try {
        this.ble.stopDeviceScan();
      } catch {
        /* ignore */
      }
    }
    this.scanning = false;
    this.emit();
  }

  private scheduleRescan() {
    if (this.scanTimer) return;
    this.scanTimer = setTimeout(() => {
      this.scanTimer = null;
      this.ensureScanning();
    }, RESCAN_IDLE_MS);
  }

  // ------------------------------------------------------------- connecting
  private async connect(entry: DeviceEntry, device: Device) {
    if (entry.state === 'connecting' || entry.state === 'connected') return;
    entry.state = 'connecting';
    this.emit();
    try {
      const connected = await device.connect();
      await connected.discoverAllServicesAndCharacteristics();
      entry.id = connected.id;
      entry.state = 'connected';
      entry.retry = 0;
      entry.lastError = undefined;

      // Independent disconnect handler per device -> backoff reconnect.
      this.disconnectSubs.get(entry.name)?.remove();
      const sub = connected.onDisconnected(() => this.onDisconnected(entry.name));
      this.disconnectSubs.set(entry.name, sub);
      this.emit();
    } catch (e) {
      entry.state = 'error';
      entry.lastError = errMsg(e);
      this.emit();
      this.scheduleReconnect(entry.name);
    }
  }

  private onDisconnected(name: string) {
    const entry = this.byName.get(name);
    if (!entry) return;
    entry.state = 'reconnecting';
    this.disconnectSubs.get(name)?.remove();
    this.disconnectSubs.delete(name);
    this.emit();
    this.scheduleReconnect(name);
  }

  private scheduleReconnect(name: string) {
    if (this.reconnectTimers.has(name)) return;
    const entry = this.byName.get(name);
    if (!entry) return;
    const backoff = Math.min(
      MAX_BACKOFF_MS,
      BASE_BACKOFF_MS * 2 ** Math.min(entry.retry, 6)
    );
    const jitter = backoff * 0.3 * pseudoJitter(name, entry.retry);
    entry.retry += 1;
    const timer = setTimeout(() => {
      this.reconnectTimers.delete(name);
      void this.attemptReconnect(name);
    }, backoff + jitter);
    this.reconnectTimers.set(name, timer);
  }

  /** Fast path: reconnect by cached id. Falls back to a fresh scan. */
  private async attemptReconnect(name: string) {
    const entry = this.byName.get(name);
    if (!entry || !this.ble || this.bt !== 'PoweredOn') return;
    if (entry.state === 'connected' || entry.state === 'connecting') return;

    if (entry.id) {
      entry.state = 'connecting';
      this.emit();
      try {
        const dev = await this.ble.connectToDevice(entry.id);
        await dev.discoverAllServicesAndCharacteristics();
        entry.state = 'connected';
        entry.retry = 0;
        entry.lastError = undefined;
        this.disconnectSubs.get(name)?.remove();
        const sub = dev.onDisconnected(() => this.onDisconnected(name));
        this.disconnectSubs.set(name, sub);
        this.emit();
        return;
      } catch (e) {
        entry.state = 'reconnecting';
        entry.lastError = errMsg(e);
        this.emit();
      }
    }
    // Rediscover by name.
    this.ensureScanning();
    this.scheduleReconnect(name);
  }

  // ------------------------------------------------------------ user actions
  /** Manual "Reconnect all": reset backoff and aggressively retry everything. */
  reconnectAll() {
    for (const entry of this.byName.values()) {
      if (entry.state === 'connected') continue;
      entry.retry = 0;
      const t = this.reconnectTimers.get(entry.name);
      if (t) {
        clearTimeout(t);
        this.reconnectTimers.delete(entry.name);
      }
      void this.attemptReconnect(entry.name);
    }
    this.ensureScanning();
    this.emit();
  }

  // ----------------------------------------------------------------- writing
  private async writeTo(entry: DeviceEntry, bytes: Uint8Array): Promise<void> {
    if (!this.ble || entry.state !== 'connected' || !entry.id) {
      throw new Error(`${entry.name} not connected`);
    }
    await this.ble.writeCharacteristicWithoutResponseForDevice(
      entry.id,
      SERVICE_UUID,
      CHAR_UUID,
      bytesToBase64(bytes)
    );
  }

  private connectedDevices(): DeviceEntry[] {
    return [...this.byName.values()].filter((d) => d.state === 'connected');
  }

  /** Fan a single frame out to every connected device, never sequentially. */
  private async broadcast(bytes: Uint8Array): Promise<void> {
    const targets = this.connectedDevices();
    await Promise.allSettled(targets.map((t) => this.writeTo(t, bytes)));
  }

  // Master controls (optimistically update UI state, then fan out).
  async masterPower(on: boolean) {
    for (const d of this.byName.values()) d.power = on;
    this.emit();
    await this.broadcast(SP110E.power(on));
  }

  async masterColor(color: RGB) {
    for (const d of this.byName.values()) d.color = color;
    this.emit();
    await this.broadcast(SP110E.color(color));
  }

  async masterBrightness(value: number) {
    await this.broadcast(SP110E.brightness(value));
  }

  async masterEffect(mode: number) {
    await this.broadcast(SP110E.effect(mode));
  }

  async masterSpeed(value: number) {
    await this.broadcast(SP110E.speed(value));
  }

  async masterAutoCycle() {
    await this.broadcast(SP110E.autoCycle());
  }

  // Per-device controls.
  async devicePower(name: string, on: boolean) {
    const entry = this.byName.get(name);
    if (!entry) return;
    entry.power = on;
    this.emit();
    try {
      await this.writeTo(entry, SP110E.power(on));
    } catch {
      /* stays optimistic; UI shows connection state separately */
    }
  }

  async deviceColor(name: string, color: RGB) {
    const entry = this.byName.get(name);
    if (!entry) return;
    entry.color = color;
    this.emit();
    try {
      await this.writeTo(entry, SP110E.color(color));
    } catch {
      /* ignore */
    }
  }

  // ---------------------------------------------------------------- teardown
  private teardownDevice(name: string) {
    const t = this.reconnectTimers.get(name);
    if (t) {
      clearTimeout(t);
      this.reconnectTimers.delete(name);
    }
    this.disconnectSubs.get(name)?.remove();
    this.disconnectSubs.delete(name);
    const entry = this.byName.get(name);
    if (entry?.id && this.ble) {
      this.ble.cancelDeviceConnection(entry.id).catch(() => {});
    }
  }

  destroy() {
    this.stopScan();
    for (const name of [...this.byName.keys()]) this.teardownDevice(name);
    this.ble?.destroy();
    this.ble = null;
    this.started = false;
  }
}

// ------------------------------------------------------------------- helpers
function mapState(s: BlePlxState): BtState {
  switch (s) {
    case BlePlxState.PoweredOn:
      return 'PoweredOn';
    case BlePlxState.PoweredOff:
      return 'PoweredOff';
    case BlePlxState.Unauthorized:
      return 'Unauthorized';
    case BlePlxState.Unsupported:
      return 'Unsupported';
    case BlePlxState.Resetting:
      return 'Resetting';
    default:
      return 'Unknown';
  }
}

function errMsg(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e) return String((e as any).message);
  return String(e);
}

// Deterministic jitter (no Math.random needed): spreads retries so 7 devices
// don't all wake at the same instant after a group drop.
function pseudoJitter(name: string, retry: number): number {
  let h = retry * 2654435761;
  for (let i = 0; i < name.length; i++) h = (h ^ name.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}

// One shared instance for the whole app.
export const lightManager = new LightManager();
