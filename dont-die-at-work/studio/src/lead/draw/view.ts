import {P, View} from '../../engine2d/view';
import {E, Ease, inv, lerp, noise} from '../../engine/time';
import {W} from '../kit';

export {P};
export type {View};

/** Keyframe: put world point (x, y) (metres) at the focus of the frame, at `s` pixels per metre. */
export type ViewKey = {at: number; x: number; y: number; s: number; ease?: Ease; cut?: boolean};
/** Where the camera's subject sits in the 16:9 frame: centre, a little above the captions. */
export const FOCUS = {x: W / 2, y: 520};

export const viewAt = (t: number, keys: ViewKey[], drift = 1, focus = FOCUS): View => {
  let a = keys[0];
  let b = keys[0];
  for (let i = 0; i < keys.length; i++) {
    if (keys[i].at <= t) {
      a = keys[i];
      b = keys[i + 1] && !keys[i + 1].cut ? keys[i + 1] : keys[i];
    }
  }
  const k = a === b ? 0 : (b.ease ?? E.inOut)(inv(a.at, b.at, t));
  const s = Math.exp(lerp(Math.log(a.s), Math.log(b.s), k));
  const x = lerp(a.x, b.x, k) + noise(t * 0.4, 11) * (3 / s) * drift;
  const y = lerp(a.y, b.y, k) + noise(t * 0.33, 12) * (3 / s) * drift;
  return {cx: focus.x - x * s, cy: focus.y + y * s, s};
};
