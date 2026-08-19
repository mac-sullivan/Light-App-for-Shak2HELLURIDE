import { BleManager, Device, State as BlePlxState } from 'react-native-ble-plx';
import {
  CHAR_UUID,
  SERVICE_UUID,
  SP110E,
  bytesToBase64,
  type RGB,
} from '../protocol';
import {
  DEFAULT_LIGHT_STATE,
  type BtState,
  type DeviceEntry,
  type LightState,
  type Snapshot,
} from './types';

const SCAN_WINDOW_MS = 12_000; // how long a single scan sweep runs
const RESCAN_IDLE_MS = 4_000; // pause between sweeps while devices are missing
const MAX_BACKOFF_MS = 20_000;
const BASE_BACKOFF_MS = 600;

// Second characteristic used by the documented wake-up handshake.
const CHAR2_UUID = '0000ffe2-0000-1000-8000-00805f9b34fb';
// Documented init sequence (from the LED Hue command gist): write 01 00 to
// 0xFFE2, then CHECK_DEVICE (01 b7 e3 -> d5) to 0xFFE1. Some SP110E firmware
// ignores all commands until this "wake" is sent. Best-effort; failures ignored.
const WAKE_FFE2 = Uint8Array.from([0x01, 0x00]);
const WAKE_FFE1 = Uint8Array.from([0x01, 0xb7, 0xe3, 0xd5]);

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
  private snapshot: Snapshot = {
    devices: [],
    bt: 'Unknown',
    started: false,
    scanning: false,
    selected: [],
    lastWrite: '',
  };

  // Per-device write method, chosen from the characteristic's actual properties.
  private writeMode = new Map<string, 'withoutResponse' | 'withResponse'>();
  private lastWrite = '';

  // Which strips the master controls target. Empty => all devices.
  private selected = new Set<string>();

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
      selected: [...this.selected],
      lastWrite: this.lastWrite,
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
          ...DEFAULT_LIGHT_STATE,
          color: { ...DEFAULT_LIGHT_STATE.color },
          name,
          state: 'idle',
          retry: 0,
        });
      }
    }
    // Drop removed entries (and tear down their connections).
    for (const name of [...this.byName.keys()]) {
      if (!wanted.has(name)) {
        this.teardownDevice(name);
        this.byName.delete(name);
        this.selected.delete(name);
      }
    }
    this.emit();
    if (this.started && this.bt === 'PoweredOn') this.ensureScanning();
  }

  addDevice(name: string) {
    const n = name.trim();
    if (!n || this.byName.has(n)) return;
    this.byName.set(n, {
      ...DEFAULT_LIGHT_STATE,
      color: { ...DEFAULT_LIGHT_STATE.color },
      name: n,
      state: 'idle',
      retry: 0,
    });
    this.emit();
    if (this.started && this.bt === 'PoweredOn') this.ensureScanning();
  }

  removeDevice(name: string) {
    if (!this.byName.has(name)) return;
    this.teardownDevice(name);
    this.byName.delete(name);
    this.selected.delete(name);
    this.emit();
  }

  // ------------------------------------------------------------ selection
  /** Toggle whether a strip is in the master-control selection. */
  toggleSelect(name: string) {
    if (this.selected.has(name)) this.selected.delete(name);
    else this.selected.add(name);
    this.emit();
  }

  /** Clear the selection -> master controls target ALL strips. */
  selectAll() {
    this.selected.clear();
    this.emit();
  }

  selectOnly(names: string[]) {
    this.selected = new Set(names.filter((n) => this.byName.has(n)));
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
      await this.finishConnect(entry, connected);
    } catch (e) {
      entry.state = 'error';
      entry.lastError = errMsg(e);
      this.emit();
      this.scheduleReconnect(entry.name);
    }
  }

  /** Shared post-connect setup: write method, disconnect handler, wake-up. */
  private async finishConnect(entry: DeviceEntry, dev: Device) {
    entry.id = dev.id;

    // Pick the write method the characteristic actually supports. If we send
    // "without response" to a characteristic that only allows "with response"
    // (or vice-versa), iOS silently drops the write -> looks connected, does
    // nothing. This is the usual cause of "connected but buttons don't work".
    let mode: 'withoutResponse' | 'withResponse' = 'withoutResponse';
    try {
      const chars = await dev.characteristicsForService(SERVICE_UUID);
      const c = chars.find((x) => x.uuid.toLowerCase() === CHAR_UUID.toLowerCase());
      if (c) {
        if (c.isWritableWithoutResponse) mode = 'withoutResponse';
        else if (c.isWritableWithResponse) mode = 'withResponse';
      }
    } catch {
      /* keep default */
    }
    this.writeMode.set(entry.name, mode);

    entry.state = 'connected';
    entry.retry = 0;
    entry.lastError = undefined;

    this.disconnectSubs.get(entry.name)?.remove();
    const sub = dev.onDisconnected(() => this.onDisconnected(entry.name));
    this.disconnectSubs.set(entry.name, sub);
    this.emit();

    // Best-effort wake-up handshake; never blocks or fails the connection.
    void this.wake(entry);
  }

  /** Documented SP110E init handshake. Errors are swallowed on purpose. */
  private async wake(entry: DeviceEntry) {
    if (!this.ble || !entry.id) return;
    try {
      await this.ble.writeCharacteristicWithoutResponseForDevice(
        entry.id,
        SERVICE_UUID,
        CHAR2_UUID,
        bytesToBase64(WAKE_FFE2)
      );
    } catch {
      /* char 0xFFE2 may not exist on this unit */
    }
    try {
      await this.writeTo(entry, WAKE_FFE1);
    } catch {
      /* ignore */
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
        await this.finishConnect(entry, dev);
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
    const b64 = bytesToBase64(bytes);
    const mode = this.writeMode.get(entry.name) ?? 'withoutResponse';
    if (mode === 'withResponse') {
      await this.ble.writeCharacteristicWithResponseForDevice(
        entry.id,
        SERVICE_UUID,
        CHAR_UUID,
        b64
      );
    } else {
      await this.ble.writeCharacteristicWithoutResponseForDevice(
        entry.id,
        SERVICE_UUID,
        CHAR_UUID,
        b64
      );
    }
  }

  private connectedDevices(): DeviceEntry[] {
    return [...this.byName.values()].filter((d) => d.state === 'connected');
  }

  /** Connected strips the master controls target (empty selection => all). */
  private targets(): DeviceEntry[] {
    const connected = this.connectedDevices();
    if (this.selected.size === 0) return connected;
    return connected.filter((d) => this.selected.has(d.name));
  }

  /** Fan one frame out to the given strips in parallel; record the result. */
  private async sendTo(targets: DeviceEntry[], bytes: Uint8Array): Promise<void> {
    const results = await Promise.allSettled(targets.map((t) => this.writeTo(t, bytes)));
    const ok = results.filter((r) => r.status === 'fulfilled').length;
    const fail = results.length - ok;
    const firstErr = results.find((r) => r.status === 'rejected') as
      | PromiseRejectedResult
      | undefined;
    this.lastWrite =
      results.length === 0
        ? 'no strips targeted'
        : `sent ✓${ok}${fail ? ` ✗${fail}: ${errMsg(firstErr?.reason)}` : ''}`;
    this.emit();
  }

  // ---- Master controls: apply to the current selection (or all strips). ----
  async masterPower(on: boolean) {
    const t = this.targets();
    t.forEach((d) => (d.power = on));
    this.emit();
    await this.sendTo(t, SP110E.power(on));
  }

  async masterColor(color: RGB) {
    const t = this.targets();
    t.forEach((d) => {
      d.color = color;
      d.mode = 'solid';
    });
    this.emit();
    // Static mode first, then the color, or an animation would swallow it.
    await this.sendTo(t, SP110E.staticMode());
    await delay(60);
    await this.sendTo(t, SP110E.color(color));
  }

  async masterBrightness(value: number) {
    const t = this.targets();
    t.forEach((d) => (d.brightness = value));
    this.emit();
    await this.sendTo(t, SP110E.brightness(value));
  }

  async masterEffect(mode: number) {
    const t = this.targets();
    t.forEach((d) => {
      d.effect = mode;
      d.mode = mode === 0 ? 'auto' : 'effect';
    });
    this.emit();
    await this.sendTo(t, SP110E.effect(mode));
  }

  async masterSpeed(value: number) {
    const t = this.targets();
    t.forEach((d) => (d.speed = value));
    this.emit();
    await this.sendTo(t, SP110E.speed(value));
  }

  async masterAutoCycle() {
    const t = this.targets();
    t.forEach((d) => (d.mode = 'auto'));
    this.emit();
    await this.sendTo(t, SP110E.autoCycle());
  }

  /** Per-strip power quick-toggle from the device row. */
  async devicePower(name: string, on: boolean) {
    const entry = this.byName.get(name);
    if (!entry) return;
    entry.power = on;
    this.emit();
    try {
      await this.writeTo(entry, SP110E.power(on));
    } catch {
      /* stays optimistic; connection state is shown separately */
    }
  }

  // ---------------------------------------------------------------- scenes
  /** Snapshot every strip's current light state (for saving a Scene). */
  getLightStates(): Record<string, LightState> {
    const out: Record<string, LightState> = {};
    for (const d of this.byName.values()) {
      out[d.name] = {
        power: d.power,
        mode: d.mode,
        color: { ...d.color },
        effect: d.effect,
        brightness: d.brightness,
        speed: d.speed,
      };
    }
    return out;
  }

  /** Apply a saved Scene: push each strip's saved state to what's connected. */
  async applyStates(states: Record<string, LightState>): Promise<void> {
    const targets = this.connectedDevices().filter((d) => states[d.name]);
    await Promise.allSettled(targets.map((d) => this.applyOneState(d, states[d.name]!)));
    this.lastWrite = `scene applied to ${targets.length}`;
    this.emit();
  }

  private async applyOneState(entry: DeviceEntry, s: LightState): Promise<void> {
    entry.power = s.power;
    entry.mode = s.mode;
    entry.color = { ...s.color };
    entry.effect = s.effect;
    entry.brightness = s.brightness;
    entry.speed = s.speed;
    this.emit();
    try {
      await this.writeTo(entry, SP110E.power(s.power));
      if (s.power) {
        if (s.mode === 'solid') {
          await this.writeTo(entry, SP110E.staticMode());
          await delay(40);
          await this.writeTo(entry, SP110E.color(s.color));
        } else if (s.mode === 'effect') {
          await this.writeTo(entry, SP110E.effect(s.effect));
          await delay(20);
          await this.writeTo(entry, SP110E.speed(s.speed));
        } else {
          await this.writeTo(entry, SP110E.autoCycle());
        }
        await delay(20);
        await this.writeTo(entry, SP110E.brightness(s.brightness));
      }
    } catch {
      /* one strip failing never blocks the others */
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
    this.writeMode.delete(name);
    this.selected.delete(name);
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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
