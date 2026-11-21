import {W} from '../engine/theme';
import {E, Ease, inv, lerp, noise} from '../engine/time';

/** A 2D camera over a world measured in metres. */
export type View = {cx: number; cy: number; s: number};
export const P = (v: View, x: number, y: number): [number, number] => [v.cx + x * v.s, v.cy - y * v.s];

/** Keyframe: put world point (x, y) at the focus point of the frame, at `s` pixels per metre. */
export type ViewKey = {at: number; x: number; y: number; s: number; ease?: Ease; cut?: boolean};
export const FOCUS_Y = 760; // a little above centre: captions and the Shorts UI own the bottom of the frame

export const viewAt = (t: number, keys: ViewKey[], drift = 1): View => {
  let a = keys[0];
  let b = keys[0];
  for (let i = 0; i < keys.length; i++) {
    if (keys[i].at <= t) {
      a = keys[i];
      b = keys[i + 1] && !keys[i + 1].cut ? keys[i + 1] : keys[i];
    }
  }
  const k = a === b ? 0 : (b.ease ?? E.inOut)(inv(a.at, b.at, t));
  const s = Math.exp(lerp(Math.log(a.s), Math.log(b.s), k)); // zoom is perceptually even in log space
  const x = lerp(a.x, b.x, k) + noise(t * 0.4, 11) * (3 / s) * drift;
  const y = lerp(a.y, b.y, k) + noise(t * 0.33, 12) * (3 / s) * drift;
  return {cx: W / 2 - x * s, cy: FOCUS_Y + y * s, s};
};
