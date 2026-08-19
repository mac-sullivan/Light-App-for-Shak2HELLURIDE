# Art Car Lights

An offline iOS app that drives seven (or more) **SP110E** Bluetooth LED
controllers on a Burning Man art car — all at once, from one phone, with no
internet at runtime. No network calls, no remote assets, no analytics.

- **Stack:** Expo (dev build) · react-native-ble-plx · TypeScript
- **Runtime connectivity:** Bluetooth LE only. Nothing else leaves the phone.
- **Build:** locally, signed with your own Apple Developer account, so the app
  lasts ~1 year on your device.

---

## What it does

- Connects to every named controller at once and keeps the links alive, with
  **automatic reconnect (exponential backoff + jitter)** on any drop. One
  device failing never blocks the others — every fan-out uses
  `Promise.allSettled`, every device has independent timers.
- **Master controls** applied to all connected strips: power, color, brightness,
  effect, effect speed, and an auto-cycle button.
- **Per-device rows:** name, live connection status (color-coded), and an
  individual ON/OFF.
- **Editable device list**, persisted with AsyncStorage — add controllers in the
  field without a rebuild.
- **Night/desert UI:** pure-black background, huge touch targets, status legible
  at arm's length, screen kept awake while foregrounded, and **no modal dialogs**
  that could trap you if a connection hangs.

---

## Requirements

- macOS with **Xcode** installed (and its command-line tools).
- **Node.js 18+** and **CocoaPods** (`sudo gem install cocoapods` or `brew install cocoapods`).
- An **Apple ID** (a free one works; a paid Developer account gives the full
  1-year signing certificate instead of 7-day).
- A physical **iPhone** (BLE doesn't work in the simulator).

---

## Build, sign, and install to your iPhone

Run these from the project folder (`artcar-lights/`):

```bash
# 1. Install JS dependencies
npm install

# 2. (Recommended) let Expo pin native module versions to this SDK
npx expo install --fix

# 3. Plug in your iPhone via USB and trust the computer.
#    Generate the native iOS project and build/run on the device:
npx expo run:ios --device
```

`expo run:ios` runs `expo prebuild` for you the first time (creating the `ios/`
folder from `app.json`), installs pods, then builds. When it asks, pick your
connected iPhone.

### Signing with your Apple account

The first build needs a signing team. Easiest path:

```bash
# open the generated workspace in Xcode
open ios/ArtCarLights.xcworkspace
```

In Xcode: select the **ArtCarLights** target → **Signing & Capabilities** →
check **Automatically manage signing** → choose your **Team** (your Apple ID).
If the bundle id `com.artcar.lights` is taken, change it to something unique
(e.g. `com.<yourname>.artcarlights`) here *and* in `app.json`
(`expo.ios.bundleIdentifier`). Then re-run `npx expo run:ios --device`, or press
Run in Xcode.

On the iPhone the first time: **Settings → General → VPN & Device Management →**
trust your developer certificate.

- **Paid Apple Developer account:** the install lasts ~1 year.
- **Free Apple ID:** it works but expires after 7 days; re-run
  `npx expo run:ios --device` to refresh.

### Rebuilding later

Day-to-day JS changes: `npm start` (dev client) and reload. Native/permission
changes: re-run `npx expo run:ios --device`.

---

## Using it at the car

1. Launch → read the one rationale screen → **Enable Bluetooth & Connect**
   (this is when iOS asks for Bluetooth permission).
2. It scans and links every controller by its advertised name. Watch the
   `X/Y LINKED` bar up top — green = all up, amber = partial, red = none.
3. Master **ALL ON / ALL OFF**, pick a **Color** or an **Effect** (+ speed), set
   **Brightness**. **Auto** cycles the built-in animations.
4. **Reconnect all** forces an immediate retry of anything that dropped.
5. **Devices → Edit** to add/remove controller names (persisted).

Default device names (editable in-app): `RHS DL`, `RHS SKIRT`, `LHS SKIRT`,
`Back Step`, `Front Side`, `LHS DL`.

---

## Protocol verification (verified vs. uncertain)

Command bytes were **ported verbatim** — not guessed — from:

- `roslovets/SP110E` Python driver (`Driver.send_command` / `_write_parameter`)
- the reverse-engineered LED Hue command gist

Wire format (from `send_command`): every frame is **4 bytes** —
`[data0, data1, data2, commandByte]`, command byte **last**, written **without
response** to characteristic **`0xFFE1`** on service **`0xFFE0`**. See
`src/protocol.ts`; each command has the source line it came from in a comment.

### ✅ Verified (both sources agree)

| Feature | Frame | Source |
|---|---|---|
| Power ON | `00 00 00 AA` | `send_command(0xAA)` |
| Power OFF | `00 00 00 AB` | `send_command(0xAB)` |
| Static color | `RR GG BB 1E` | `send_command(0x1E, [r,g,b])` |
| Brightness (0–255) | `VV 00 00 2A` | `send_command(0x2A, value)` |
| Effect/mode | `MM 00 00 2C` | `send_command(0x2C, value)` |
| Auto-cycle (mode 0) | `00 00 00 06` | `mode==0 -> send_command(0x06)` |
| Effect speed (0–255) | `VV 00 00 03` | `send_command(0x03, value)` |
| White channel (0–255) | `VV 00 00 69` | `send_command(0x69, value)` |
| IC model (index) | `II 00 00 1C` | `send_command(0x1C, idx)` |
| RGB sequence (index) | `II 00 00 3C` | `send_command(0x3C, idx)` |
| Pixel count (1–1024) | `HH LL 00 2D` | `send_command(0x2D, [hi,lo,0])`, big-endian |
| Get info (read-back) | `00 00 00 10` | `send_command(0x10)` |

### ⚠️ Uncertain / deliberately not used

- **Effect count top-end.** The driver's `MODES` range implies up to 121; the
  gist says 1–120 (121 = static). The app caps effects at **120** to stay inside
  both. Not a bricking risk — just the max selectable animation.
- **Init handshake.** The gist mentions writing `01 00` to a *second*
  characteristic `0xFFE2`, then `01 b7 e3 d5` (a `CHECK_DEVICE 0xD5`) to
  `0xFFE1`. The Python driver does **not** do this and writes commands directly,
  so the app **skips it**. If your controllers ever ignore commands until
  "woken", this is the first thing to try — but it's unverified across sources.
- **`RENAME 0xBB` / `CHECK_DEVICE 0xD5`.** Present in the gist only, not in the
  driver's send path. Not needed for control; **excluded**.

Color note: `0x1E` sends literal `[R,G,B]`; what the strip shows depends on the
per-controller **RGB sequence** (`0x3C`) — a one-time setup value, not a runtime
concern.

---

## Project layout

```
App.tsx                     keep-awake + permission gate + home
index.js                    entry point
app.json                    Expo config, ble-plx plugin, Info.plist strings
src/
  protocol.ts               SP110E command bytes (verbatim port) + base64
  effects.ts                color swatches + curated effect picks
  storage.ts                AsyncStorage device-name persistence
  theme.ts                  dark palette + touch sizing
  ble/
    LightManager.ts         scan/connect/reconnect/backoff + fan-out writes
    types.ts
  hooks/useLightManager.ts  React binding (useSyncExternalStore)
  util/throttle.ts          slider write rate-limiting
  components/               UI (home, color pad, effect pad, device list, …)
```

## Notes

- No background BLE mode is requested; the app controls lights while
  foregrounded (screen stays awake by design).
- The BleManager — and therefore the iOS permission prompt — is created only
  after you tap through the rationale screen.
