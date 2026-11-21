import {View, ViewKey, viewAt} from '../engine2d/view';
import {E, clamp, lerp, ramp, window as win} from '../engine/time';
import {T} from './timeline';

// One list, in time order. `cut` starts a new shot; otherwise the camera travels from the key before.
// x, y: the world point (metres) held at the focus of the frame. s: pixels per metre.
const VIEWS: ViewKey[] = [
  // HOOK: two men at work. Then down, to what they are standing over.
  {at: 0, cut: true, x: 0.08, y: 0.86, s: 196},
  {at: T.h2, x: 0.08, y: 0.84, s: 232, ease: E.out},
  {at: T.h3, x: 0, y: -0.62, s: 196, ease: E.inOutQuad},
  // MECHANISM: the whole machine
  {at: T.m3, cut: true, x: 0, y: -0.75, s: 166},
  {at: T.n1, x: 0, y: -0.6, s: 178, ease: E.lin},
  // the days before
  {at: T.n1, cut: true, x: 0, y: 0.42, s: 150},
  {at: T.monitor, x: 0, y: 0.42, s: 158, ease: E.lin},
  {at: T.onlyWarning, x: 0, y: 0.36, s: 190, ease: E.inOutQuad},
  {at: T.onlyWarning + 0.7, x: 0, y: 0.34, s: 420, ease: E.inOutQuad},
  {at: T.n2, x: 0, y: 0.34, s: 440, ease: E.lin},
  // it stops looking like it can
  {at: T.n2, cut: true, x: 0, y: 0.28, s: 250},
  {at: T.i1, x: 0, y: 0.3, s: 270, ease: E.lin},
  // INCIDENT: the job
  {at: T.i1, cut: true, x: 0.25, y: 1.2, s: 168},
  {at: T.i2, x: 0.2, y: 1.12, s: 182, ease: E.out},
  // the tape: down the hole
  {at: T.i2, cut: true, x: -0.3, y: 0.55, s: 236},
  {at: T.five, x: -0.15, y: 0.3, s: 250, ease: E.out},
  {at: T.five + 0.9, x: 0.06, y: -1.02, s: 372, ease: E.inOutQuad},
  {at: T.i3, x: 0.08, y: -1.08, s: 392, ease: E.lin},
  // the wire
  {at: T.wire, cut: true, x: -0.35, y: 0.35, s: 232},
  {at: T.i4, x: -0.25, y: -0.1, s: 214, ease: E.inOutQuad},
  // the attempts
  {at: T.i4, cut: true, x: -0.22, y: -0.34, s: 200},
  {at: T.i5, x: -0.22, y: -0.3, s: 214, ease: E.lin},
  // on the rim
  {at: T.i5, cut: true, x: -0.12, y: 0.5, s: 300},
  {at: T.i6, x: -0.06, y: 0.56, s: 372, ease: E.out},
  // the foreman looks in
  {at: T.i7, cut: true, x: 0.2, y: -0.34, s: 208},
  {at: T.i8, x: 0.24, y: -0.3, s: 222, ease: E.out},
  // who he is
  {at: T.i8, cut: true, x: 0.62, y: 1.0, s: 372},
  {at: T.i9, x: 0.68, y: 1.06, s: 452, ease: E.lin},
  // the ladder
  {at: T.i9, cut: true, x: 0.45, y: 0.4, s: 186},
  {at: T.climbs, x: 0.2, y: 0.1, s: 196, ease: E.out},
  {at: T.i10, x: 0.1, y: -0.55, s: 214, ease: E.inOutQuad},
  // on the tray, both of them
  {at: T.i10, cut: true, x: 0.12, y: -1.02, s: 286},
  {at: T.i11, x: 0.1, y: -1.1, s: 330, ease: E.out},
  // rescue: wide, then the 24-inch opening
  {at: T.i11, cut: true, x: 0.5, y: 0.2, s: 172},
  {at: T.getting, x: 0.45, y: 0.16, s: 180, ease: E.lin},
  {at: T.getting + 0.8, x: 0.02, y: -0.1, s: 386, ease: E.inOutQuad},
  {at: T.i12, x: 0.02, y: -0.16, s: 410, ease: E.lin},
  // LESSON: the third man at the ladder
  {at: T.l3, cut: true, x: 0.75, y: 0.98, s: 286},
  {at: T.tribute, x: 0.8, y: 1.02, s: 318, ease: E.out},
  // TRIBUTE
  {at: T.tribute, cut: true, x: -1.5, y: 0.22, s: 600},
  {at: T.end, x: -1.5, y: 0.2, s: 660, ease: E.lin},
];

export const viewOf = (t: number): View => viewAt(t, VIEWS);

export type Direction = {
  view: View;
  world: boolean; // is the drawing on screen at all (a full-screen card may cover it)
  gas: {level: number; fill: number; cloud: number};
  o2out: number;
  supply: number; // the nitrogen supply line and valve, shown while explaining the purge
  redTape: number;
  day: number;
  cast: 'none' | 'crews' | 'main';
  showP: boolean;
  showC: boolean;
  fallen: number; // 0..1: how far the men on the tray have lost their colour
  wire: boolean;
  ladder: boolean;
  lid: number;
  responders: boolean;
  hats: number;
  grey: number; // desaturate the picture (the frozen moment)
  dim: number; // darken and soften behind a card
  flash: number; // red flash on "die"
};

export const direct = (t: number): Direction => {
  const inCard = (t >= T.h3 && t < T.m3) || (t >= T.i6 && t < T.i7) || (t >= T.i12 && t < T.l3);
  const safeWay = t >= T.i3 && t < T.wire;

  // The gas is colourless. The viewer is shown it; the men are not.
  let level = 1;
  if (t < T.h2) level = 0.9 * win(t, T.die - 0.02, T.die + 0.28, 0.03, 0.2);
  else if (t < T.h3) level = ramp(t, T.h2 + 0.15, T.h2 + 0.9, E.out);
  else if (t >= T.n2 && t < T.i2) level = lerp(1, 0.06, ramp(t, T.stops - 0.3, T.stops + 0.6));
  else if (t >= T.i2 && t < T.i3) level = lerp(0.06, 0.9, ramp(t, T.five + 0.2, T.five + 1.0));
  else if (t >= T.l3 && t < T.tribute) level = 0.85;
  else if (t >= T.tribute) level = 0;
  const filling = t >= T.m3 && t < T.n1;
  const fill = filling ? ramp(t, T.m3 + 1.0, T.keepOxygen + 0.4, E.inOutQuad) : 1;

  // time-lapse over the days before: two day/night turns while the purge runs
  const u = clamp((t - T.n1) / (T.monitor - T.n1));
  const day = t >= T.n1 && t < T.monitor ? Math.pow(Math.max(0, Math.sin(u * Math.PI * 2 - 0.6)), 0.8) * (1 - ramp(t, T.monitor - 0.5, T.monitor)) : 0;

  const cast: Direction['cast'] = t < T.h3 ? 'main' : t < T.n1 ? 'none' : t < T.n2 ? 'crews' : t < T.i1 - 0.1 ? 'none' : t < T.tribute ? 'main' : 'none';
  return {
    view: viewOf(t),
    world: !inCard,
    gas: {level, fill, cloud: filling ? ramp(t, T.keepOxygen + 0.3, T.keepOxygen + 1.2) : 1},
    o2out: filling ? win(t, T.m3 + 1.2, T.keepOxygen + 1.4, 0.4, 0.6) : 0,
    supply: win(t, T.m3, T.monitor, 0.3, 0.6),
    redTape: t < T.h3 ? 1 : t < T.n1 ? 0 : t < T.n2 ? ramp(t, T.n1 + 2.9, T.n1 + 3.5) : 1,
    day,
    cast,
    showP: t >= T.i2 - 1.6 && t < T.i3 + 1.4,
    showC: t >= T.i7 - 0.2 && t < T.tribute,
    fallen: ramp(t, T.lying + 0.2, T.lying + 1.6),
    wire: t >= T.wire - 0.1 && t < T.i6,
    ladder: t >= T.i7 - 0.2 && t < T.tribute,
    lid: win(t, T.i1 + 0.5, T.i2, 0.4, 0.2),
    responders: t >= T.i11 - 0.2 && t < T.i12,
    hats: t >= T.tribute ? 1 : 0,
    grey: win(t, T.stop + 0.1, T.i9, 0.3, 0.15),
    dim: Math.max(safeWay ? win(t, T.i3, T.wire, 0.25, 0.2) : 0, ramp(t, T.signoff, T.signoff + 0.4) * 0.9),
    flash: win(t, T.die - 0.02, T.die + 0.3, 0.03, 0.22),
  };
};
