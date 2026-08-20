import type { RGB } from './protocol';

// Big, glove-friendly color swatches (used by the quick-color row).
export const SWATCHES: { name: string; rgb: RGB }[] = [
  { name: 'Red', rgb: { r: 255, g: 0, b: 0 } },
  { name: 'Orange', rgb: { r: 255, g: 80, b: 0 } },
  { name: 'Amber', rgb: { r: 255, g: 160, b: 0 } },
  { name: 'Yellow', rgb: { r: 255, g: 235, b: 0 } },
  { name: 'Lime', rgb: { r: 140, g: 255, b: 0 } },
  { name: 'Green', rgb: { r: 0, g: 255, b: 0 } },
  { name: 'Mint', rgb: { r: 0, g: 255, b: 140 } },
  { name: 'Cyan', rgb: { r: 0, g: 230, b: 255 } },
  { name: 'Azure', rgb: { r: 0, g: 120, b: 255 } },
  { name: 'Blue', rgb: { r: 0, g: 20, b: 255 } },
  { name: 'Indigo', rgb: { r: 90, g: 0, b: 255 } },
  { name: 'Violet', rgb: { r: 160, g: 0, b: 255 } },
  { name: 'Magenta', rgb: { r: 255, g: 0, b: 220 } },
  { name: 'Pink', rgb: { r: 255, g: 60, b: 140 } },
  { name: 'Warm White', rgb: { r: 255, g: 170, b: 90 } },
  { name: 'Cool White', rgb: { r: 200, g: 220, b: 255 } },
];

/**
 * Friendly names for effects 1..120.
 *
 * IMPORTANT: the SP110E's mode -> animation mapping is NOT documented anywhere,
 * so these names are evocative LABELS, not verified descriptions of each mode.
 * They exist so you can read a vibe instead of memorising numbers — tap around
 * to learn which number looks like what on your strips.
 */
export const EFFECT_NAMES: string[] = [
  'Rainbow Flow', 'Rainbow Cycle', 'Rainbow Chase', 'Rainbow Comet', 'Rainbow Twinkle',
  'Rainbow Breathe', 'Rainbow Strobe', 'Rainbow Wave', 'Rainbow Fade', 'Rainbow Sparkle',
  'Spectrum Drift', 'Spectrum Pulse', 'Red Chase', 'Red Comet', 'Red Breathe',
  'Red Strobe', 'Red Sparkle', 'Red Wave', 'Green Chase', 'Green Comet',
  'Green Breathe', 'Green Strobe', 'Green Sparkle', 'Green Wave', 'Blue Chase',
  'Blue Comet', 'Blue Breathe', 'Blue Strobe', 'Blue Sparkle', 'Blue Wave',
  'Amber Chase', 'Amber Glow', 'Amber Pulse', 'Gold Shimmer', 'Sunset Fade',
  'Sunrise Glow', 'Fire Flicker', 'Fire Storm', 'Ember Glow', 'Lava Flow',
  'Inferno', 'Candle Flicker', 'Ocean Wave', 'Deep Sea', 'Aqua Flow',
  'Tide Pull', 'Ripple', 'Rainfall', 'Waterfall', 'Frost',
  'Ice Crystal', 'Glacier Drift', 'Aurora', 'Northern Lights', 'Cosmic Drift',
  'Starfield', 'Meteor Shower', 'Comet Tail', 'Shooting Star', 'Galaxy Spin',
  'Nebula', 'Pulse Wave', 'Heartbeat', 'Slow Breathe', 'Fast Breathe',
  'Throb', 'Bounce', 'Ping Pong', 'Runner', 'Sprint',
  'Chase Up', 'Chase Down', 'Dual Chase', 'Twin Comets', 'Color Wipe',
  'Paint Roll', 'Scanner', 'Larson Scan', 'Cylon', 'Night Rider',
  'White Strobe', 'Color Strobe', 'Police Lights', 'Emergency', 'Disco',
  'Party Mix', 'Club Strobe', 'Confetti', 'Twinkle Stars', 'Fairy Lights',
  'Glitter', 'Sparkle Burst', 'Firefly', 'Fireworks', 'Bloom',
  'Blossom', 'Kaleidoscope', 'Prism', 'Color Melt', 'Gradient Slide',
  'Fade In Out', 'Cross Fade', 'Color Swap', 'Flash Cycle', 'Random Pop',
  'Static Noise', 'TV Static', 'Glitch', 'Matrix Rain', 'Neon Pulse',
  'Cyber Wave', 'Laser Sweep', 'Plasma', 'Energy Field', 'Vortex',
  'Whirlpool', 'Spiral', 'Twister', 'Hyperdrive', 'Warp Speed',
];

/** Name for effect mode 1..120 (falls back to "Effect N" if out of range). */
export function effectName(mode: number): string {
  return EFFECT_NAMES[mode - 1] ?? `Effect ${mode}`;
}

// A handful of favorites for the quick row (labels come from EFFECT_NAMES).
export const EFFECT_FAVORITES: number[] = [1, 9, 17, 37, 43, 53, 57, 85, 94, 110, 113, 120];
