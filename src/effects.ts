import type { RGB } from './protocol';

// Big, glove-friendly color swatches. A full spectrum plus warm/cool whites.
// Ordered so the grid reads like a rainbow with the whites at the end.
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
 * Curated effect picks.
 *
 * IMPORTANT: the SP110E's mode->animation mapping is NOT documented in either
 * source, so these names are just friendly labels for mode numbers spread
 * across the 1..120 range — not verified descriptions. Tap around to find the
 * looks you like; the full 1..120 grid is also available in the UI.
 */
export const EFFECT_PICKS: { name: string; mode: number }[] = [
  { name: 'Rainbow', mode: 1 },
  { name: 'Flow', mode: 9 },
  { name: 'Chase', mode: 17 },
  { name: 'Comet', mode: 25 },
  { name: 'Sparkle', mode: 34 },
  { name: 'Pulse', mode: 42 },
  { name: 'Fire', mode: 51 },
  { name: 'Wave', mode: 60 },
  { name: 'Strobe', mode: 68 },
  { name: 'Twinkle', mode: 77 },
  { name: 'Meteor', mode: 90 },
  { name: 'Party', mode: 110 },
];
