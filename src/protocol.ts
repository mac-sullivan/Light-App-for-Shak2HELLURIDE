/**
 * SP110E BLE protocol.
 *
 * Ported VERBATIM from the roslovets/SP110E Python driver
 * (sp110e/driver.py -> Driver.send_command / _write_parameter) and
 * cross-checked against the reverse-engineered LED Hue command gist.
 *
 * Wire format, from send_command():
 *
 *   async def send_command(self, command_byte, data_bytes=(0x00, 0x00, 0x00)):
 *       if type(data_bytes) not in [list, tuple]:
 *           data_bytes = (data_bytes, 0, 0)          # scalar -> [value, 0, 0]
 *       data_to_write = tuple(data_bytes) + tuple([command_byte])
 *       await client.write_gatt_char(CHARACTERISTIC, bytearray(data_to_write))
 *
 * => Every frame is exactly 4 bytes: [data0, data1, data2, commandByte].
 *    The command byte is LAST. Written WITHOUT response.
 *
 * See README "Protocol verification" for what is verified vs. uncertain.
 */

// 128-bit forms of the 16-bit UUIDs (0xFFE0 / 0xFFE1). ble-plx wants full UUIDs.
export const SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb';
export const CHAR_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb';

// Command bytes. Every one below appears in the driver's send path AND the gist.
const CMD = {
  ON: 0xaa, // send_command(0xAA)                 -> 00 00 00 AA
  OFF: 0xab, // send_command(0xAB)                 -> 00 00 00 AB
  COLOR: 0x1e, // send_command(0x1E, [r, g, b])      -> RR GG BB 1E
  BRIGHTNESS: 0x2a, // send_command(0x2A, value)          -> VV 00 00 2A
  MODE: 0x2c, // send_command(0x2C, value)          -> MM 00 00 2C
  AUTO: 0x06, // mode == 0 -> send_command(0x06)     -> 00 00 00 06
  SPEED: 0x03, // send_command(0x03, value)          -> VV 00 00 03
  IC_MODEL: 0x1c, // send_command(0x1C, idx)            -> II 00 00 1C
  SEQUENCE: 0x3c, // send_command(0x3C, idx)            -> II 00 00 3C
  PIXELS: 0x2d, // send_command(0x2D, [hi, lo, 0])     -> HH LL 00 2D
  WHITE: 0x69, // send_command(0x69, value)          -> VV 00 00 69
  INFO: 0x10, // send_command(0x10)                 -> 00 00 00 10 (read-back)
} as const;

// IC model + RGB sequence tables, verbatim order from the driver (index is the
// value sent on the wire). Only needed for one-time setup.
export const IC_MODELS = [
  'SM16703', 'TM1804', 'UCS1903', 'WS2811', 'WS2801', 'SK6812', 'LPD6803',
  'LPD8806', 'APA102', 'APA105', 'DMX512', 'TM1914', 'TM1913', 'P9813',
  'INK1003', 'P943S', 'P9411', 'P9413', 'TX1812', 'TX1813', 'GS8206',
  'GS8208', 'SK9822', 'TM1814', 'SK6812_RGBW', 'P9414', 'PG412',
] as const;

export const SEQUENCES = ['RGB', 'RBG', 'GRB', 'GBR', 'BRG', 'BGR'] as const;

export type RGB = { r: number; g: number; b: number };

// Modes 1..120 are the built-in animations (the gist caps at 120; the driver's
// MODES range goes to 121). We stay inside both by capping the UI at 120.
export const MIN_EFFECT = 1;
export const MAX_EFFECT = 120;

const clampByte = (n: number) => Math.max(0, Math.min(255, Math.round(n))) & 0xff;

/** Build a 4-byte frame: [d0, d1, d2, cmd]. */
function frame(cmd: number, d0 = 0, d1 = 0, d2 = 0): Uint8Array {
  return Uint8Array.from([d0 & 0xff, d1 & 0xff, d2 & 0xff, cmd & 0xff]);
}

export const Commands = {
  powerOn: () => frame(CMD.ON),
  powerOff: () => frame(CMD.OFF),
  power: (on: boolean) => (on ? frame(CMD.ON) : frame(CMD.OFF)),

  /** Static color. Actual on-strip order depends on the SEQUENCE setting. */
  color: (c: RGB) => frame(CMD.COLOR, clampByte(c.r), clampByte(c.g), clampByte(c.b)),

  brightness: (value: number) => frame(CMD.BRIGHTNESS, clampByte(value)),

  /** Effect / preset animation. mode 0 is special: it emits the AUTO byte. */
  effect: (mode: number) => {
    if (mode === 0) return frame(CMD.AUTO);
    const m = Math.max(MIN_EFFECT, Math.min(MAX_EFFECT, Math.round(mode)));
    return frame(CMD.MODE, m & 0xff);
  },

  /** Auto-cycle through all built-in effects (driver's mode 0). */
  autoCycle: () => frame(CMD.AUTO),

  speed: (value: number) => frame(CMD.SPEED, clampByte(value)),

  white: (value: number) => frame(CMD.WHITE, clampByte(value)),

  // ---- one-time setup commands (advanced) ----
  icModel: (index: number) => frame(CMD.IC_MODEL, index & 0xff),
  sequence: (index: number) => frame(CMD.SEQUENCE, index & 0xff),

  /** Pixel count 1..1024, big-endian split exactly as the driver does it. */
  pixels: (count: number) => {
    const n = Math.max(1, Math.min(1024, Math.round(count)));
    const hi = (n >> 8) & 0xff;
    const lo = n & 0xff;
    return frame(CMD.PIXELS, hi, lo, 0);
  },

  getInfo: () => frame(CMD.INFO),
};

// ble-plx writes base64. RN has no reliable btoa for byte arrays, so encode by
// hand. For our fixed 4-byte frames this always yields 8 chars.
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
export function bytesToBase64(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i]!;
    const has1 = i + 1 < bytes.length;
    const has2 = i + 2 < bytes.length;
    const b1 = has1 ? bytes[i + 1]! : 0;
    const b2 = has2 ? bytes[i + 2]! : 0;
    out += B64[b0 >> 2]!;
    out += B64[((b0 & 3) << 4) | (b1 >> 4)]!;
    out += has1 ? B64[((b1 & 15) << 2) | (b2 >> 6)]! : '=';
    out += has2 ? B64[b2 & 63]! : '=';
  }
  return out;
}
