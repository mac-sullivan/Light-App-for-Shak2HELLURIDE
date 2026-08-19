// Night-in-the-desert palette. No white backgrounds anywhere. High contrast,
// large-by-default sizing tuned for gloved hands at arm's length.
export const theme = {
  bg: '#000000',
  surface: '#0E0E12',
  surfaceAlt: '#17171F',
  surfaceHi: '#20202B',
  border: '#2A2A36',
  text: '#F6F6F8',
  textDim: '#9C9CAB',
  ok: '#00E676', // connected
  warn: '#FFB300', // connecting / partial
  err: '#FF453A', // error / disconnected
  accent: '#8A5CFF',
  accentDim: '#3A2E66',
};

// Touch-target sizing. Everything tappable should hit at least LG.
export const size = {
  gap: 12,
  radius: 16,
  touchMd: 64,
  touchLg: 84,
  fontSm: 15,
  fontMd: 19,
  fontLg: 26,
  fontXl: 40,
};
