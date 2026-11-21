// Pure helpers. Everything on screen is a function of time, never of state,
// so any frame can be rendered on its own and in any order.
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const inv = (a: number, b: number, x: number) => (a === b ? (x >= b ? 1 : 0) : clamp((x - a) / (b - a)));

export type Ease = (t: number) => number;
export const E = {
  lin: (t: number) => t,
  in: (t: number) => t * t * t,
  out: (t: number) => 1 - Math.pow(1 - t, 3),
  inOut: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  inOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  outExpo: (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  outQuint: (t: number) => 1 - Math.pow(1 - t, 5),
  outBack: (t: number) => 1 + 2.4 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2),
};

/** 0 before t0, 1 after t1, eased between. */
export const ramp = (t: number, t0: number, t1: number, e: Ease = E.inOut) => e(inv(t0, t1, t));
/** Rises over [t0, t0+a], holds, falls over [t1-b, t1]. */
export const window = (t: number, t0: number, t1: number, a = 0.25, b = 0.25, e: Ease = E.out) =>
  Math.min(ramp(t, t0, t0 + a, e), 1 - ramp(t, t1 - b, t1, E.in));

/** Damped spring response to a step at t=0; overshoots once, settles ~0.6s. */
export const spring = (t: number, freq = 3.2, damp = 0.55) => {
  if (t <= 0) return 0;
  const w = freq * Math.PI * 2;
  return 1 - Math.exp(-damp * w * t) * Math.cos(w * Math.sqrt(1 - damp * damp) * t);
};

/** Deterministic pseudo-random in [0,1). */
export const rnd = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
};
export const rnd2 = (a: number, b: number) => rnd(a * 1.618 + b * 57.31 + 3.3);

/** Smooth 1D value noise, for drift and flicker. */
export const noise = (x: number, seed = 0) => {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return lerp(rnd(i + seed * 91.7), rnd(i + 1 + seed * 91.7), u) * 2 - 1;
};

export type V3 = [number, number, number];
export const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

/** Keyframed number: [[time, value, easeIntoThisKey?], ...]. */
export const track = (t: number, keys: [number, number, Ease?][]) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, v0] = keys[i - 1];
      const [t1, v1, e] = keys[i];
      return lerp(v0, v1, (e ?? E.inOut)(inv(t0, t1, t)));
    }
  }
  return keys[keys.length - 1][1];
};
