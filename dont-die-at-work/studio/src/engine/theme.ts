// Channel look. Every video uses these; change them here, not per video.
export const C = {
  bg: '#04060a',
  night: '#070b13',
  steel: '#27303d',
  steelDark: '#141a23',
  steelLight: '#51607a',
  yellow: '#ffc21a', // brand accent: hazard yellow
  red: '#ff3b2f', // danger
  cyan: '#45e3ff', // "the invisible made visible" (gas)
  white: '#f4f6fa',
  mute: '#8b96a8',
  warm: '#ffb561', // sodium work lights
};

export const FONT = {
  display: "'Anton', 'Impact', sans-serif",
  label: "'Barlow Condensed', 'Arial Narrow', sans-serif",
  mono: "'JetBrains Mono', 'DejaVu Sans Mono', monospace",
};

export const W = 1080;
export const H = 1920;
export const FPS = 30;

// YouTube Shorts covers the bottom ~20% (title, channel) and a strip down the
// right edge (like/comment/share). Keep anything that must be read inside this box.
export const SAFE = {left: 70, right: 930, top: 210, bottom: 1500};
