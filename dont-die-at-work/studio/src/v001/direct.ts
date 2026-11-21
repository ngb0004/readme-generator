import {View, ViewKey, viewAt} from '../engine2d/view';
import {E, lerp, ramp, window as win} from '../engine/time';
import {T} from './timeline';

// One list, in time order. `cut` starts a new shot; otherwise the camera travels from the key before.
// x, y: the world point (metres) held at the focus of the frame. s: pixels per metre.
const VIEWS: ViewKey[] = [
  // HOOK: two men at work. Then down, to what they are standing over.
  {at: 0, cut: true, x: 0.08, y: 0.86, s: 196},
  {at: T.h2, x: 0.08, y: 0.84, s: 232, ease: E.out},
  {at: T.h3, x: 0, y: -0.62, s: 196, ease: E.inOutQuad},
  // "a giant steel tank": pull back from the two men to all of it
  {at: T.standing, cut: true, x: 0.06, y: 0.84, s: 236},
  {at: T.ma2, x: 0, y: -2.2, s: 112, ease: E.inOutQuad},
  // THE JOB: the lid that has to go back on
  {at: T.i1, cut: true, x: 0.25, y: 1.2, s: 168},
  {at: T.out, x: 0.2, y: 1.12, s: 182, ease: E.out},
  // the gas keeps leaking out of the open hole; then in on the man leaning over it
  {at: T.out, cut: true, x: 0, y: 0.5, s: 200},
  {at: T.lean, x: 0, y: 0.56, s: 218, ease: E.lin},
  {at: T.lean + 1.0, x: -0.36, y: 0.9, s: 320, ease: E.inOutQuad},
  {at: T.f1, x: -0.36, y: 0.92, s: 336, ease: E.lin},
  // nothing warns them: wide enough to see where a sign and a barrier would be
  {at: T.f1, cut: true, x: 0.35, y: 0.8, s: 150},
  {at: T.permit, x: 0.35, y: 0.78, s: 158, ease: E.lin},
  // what the training covered: inside the tank. What it never covered: the air outside it.
  {at: T.tr, cut: true, x: 0, y: -0.2, s: 150},
  {at: T.i2, x: 0, y: -0.16, s: 158, ease: E.lin},
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
  // on the rim; then closer, to the air round his head
  {at: T.i5, cut: true, x: -0.12, y: 0.5, s: 300},
  {at: T.calm, x: -0.06, y: 0.56, s: 366, ease: E.out},
  {at: T.i6, x: -0.02, y: 0.62, s: 430, ease: E.inOutQuad},
  // the foreman looks in
  {at: T.i7, cut: true, x: 0.2, y: -0.34, s: 208},
  {at: T.i8, x: 0.24, y: -0.3, s: 222, ease: E.out},
  // who he is
  {at: T.i8, cut: true, x: 0.62, y: 1.0, s: 372},
  {at: T.br1, x: 0.68, y: 1.06, s: 452, ease: E.lin},
  // the ladder
  {at: T.i9, cut: true, x: 0.45, y: 0.4, s: 186},
  {at: T.climbs, x: 0.2, y: 0.1, s: 196, ease: E.out},
  {at: T.i10, x: 0.1, y: -0.55, s: 214, ease: E.inOutQuad},
  // on the tray, both of them
  {at: T.i10, cut: true, x: 0.12, y: -1.02, s: 286},
  {at: T.i11, x: 0.1, y: -1.1, s: 330, ease: E.out},
  // rescue: wide as they arrive, then in on the oxygen meter going down the hole
  {at: T.i11, cut: true, x: 0.5, y: 0.2, s: 172},
  {at: T.meter, x: 0.45, y: 0.16, s: 180, ease: E.lin},
  {at: T.meter + 1.1, x: 0.3, y: -0.05, s: 280, ease: E.inOutQuad},
  {at: T.i12, x: 0.28, y: -0.12, s: 300, ease: E.lin},
  // AFTERWARDS: the empty platform
  {at: T.af, cut: true, x: 0.55, y: 0.75, s: 168},
  {at: T.l2, x: 0.5, y: 0.78, s: 186, ease: E.lin},
  // the picture to remember: on his knees at the open hole (the attempt again, slowed down)
  {at: T.l2, cut: true, x: -0.6, y: 0.45, s: 276},
  {at: T.l3, x: -0.52, y: 0.52, s: 306, ease: E.lin},
  // LESSON: the third man at the ladder
  {at: T.l3, cut: true, x: 0.75, y: 0.98, s: 286},
  {at: T.tribute, x: 0.8, y: 1.02, s: 318, ease: E.out},
  // TRIBUTE
  {at: T.tribute, cut: true, x: -1.5, y: 0.22, s: 600},
  {at: T.end, x: -1.5, y: 0.2, s: 660, ease: E.lin},
];

export const viewOf = (t: number): View => viewAt(t, VIEWS);

/** While the lesson line plays, the picture goes back to the attempt at the hole and runs it slowly. */
export const worldTime = (t: number) => (t >= T.l2 && t < T.l3 ? T.cant - 0.35 + (t - T.l2) * 0.22 : t);

export type Direction = {
  view: View;
  world: boolean; // is the drawing on screen at all (a full-screen card may cover it)
  gas: {level: number; fill: number; cloud: number; spill: number};
  o2out: number;
  supply: number; // the nitrogen supply line and valve, shown while explaining the purge
  redTape: number;
  day: number;
  cast: 'none' | 'main';
  showP: boolean;
  showC: boolean;
  fallen: number; // 0..1: how far the men on the tray have lost their colour
  wire: boolean;
  ladder: boolean;
  lid: number;
  responders: boolean;
  meter: boolean; // the responders' oxygen meter, lowered through the manway
  ghost: {sign: number; barrier: number}; // what the site's own procedure called for and was not there
  after: boolean; // the sign and the barricade that went up after the incident
  hats: number;
  grey: number; // desaturate the picture (the frozen moment)
  dim: number; // darken and soften behind a card
  flash: number; // red flash on "die"
};

export const direct = (t: number): Direction => {
  const inCard = (t >= T.h3 && t < T.standing) || (t >= T.ma2 && t < T.i1) || (t >= T.permit && t < T.tr) || (t >= T.i6 && t < T.i7) || (t >= T.br1 && t < T.i9) || (t >= T.i12 && t < T.af);
  const safeWay = t >= T.i3 && t < T.wire;
  const after = t >= T.af && t < T.l2;

  // The gas is colourless. The viewer is shown it; the men are not.
  let level = 1;
  if (t < T.h2) level = 0.9 * win(t, T.die - 0.02, T.die + 0.28, 0.03, 0.2);
  else if (t < T.h3) level = ramp(t, T.h2 + 0.15, T.h2 + 0.9, E.out);
  else if (t >= T.i1 && t < T.f1) level = lerp(0.18, 1, ramp(t, T.leaking - 0.55, T.leaking + 0.45, E.out)); // how it looks to them, then how it is
  else if (after) level = 0; // the purge was shut off that night
  else if (t >= T.l3 && t < T.tribute) level = 0.85;
  else if (t >= T.tribute) level = 0;

  // how hard the drawing shows it coming out of the hole
  let spill = 0;
  if (t >= T.i1 && t < T.i2) spill = ramp(t, T.leaking - 0.55, T.leaking + 0.6, E.out);
  else if (t >= T.i2 && t < T.af) spill = 0.45;

  const cast: Direction['cast'] = t < T.ma2 ? 'main' : t < T.i1 - 0.1 ? 'none' : t < T.af ? 'main' : t < T.l3 ? 'none' : t < T.tribute ? 'main' : 'none';
  return {
    view: viewOf(t),
    world: !inCard,
    gas: {level, fill: 1, cloud: 1, spill},
    o2out: 0,
    supply: 0,
    redTape: 1,
    day: after ? 0.62 : 0,
    cast,
    showP: t >= T.i2 - 1.6 && t < T.i3 + 1.4,
    showC: t >= T.i7 - 0.2 && t < T.tribute,
    fallen: ramp(t, T.lying + 0.2, T.lying + 1.6),
    wire: t >= T.wire - 0.1 && t < T.i6,
    ladder: (t >= T.i7 - 0.2 && t < T.af) || (t >= T.l3 && t < T.tribute),
    lid: win(t, T.i1 + 0.5, T.out, 0.4, 0.2),
    responders: t >= T.i11 - 0.2 && t < T.i12,
    meter: t >= T.meter && t < T.i12,
    ghost: {sign: win(t, T.noSign, T.permit, 0.12, 0.1), barrier: win(t, T.noBarrier, T.permit, 0.12, 0.1)},
    after,
    hats: t >= T.tribute ? 1 : 0,
    grey: win(t, T.stop + 0.1, T.i9, 0.3, 0.15),
    dim: Math.max(safeWay ? win(t, T.i3, T.wire, 0.25, 0.2) : 0, ramp(t, T.signoff, T.signoff + 0.4) * 0.9),
    flash: win(t, T.die - 0.02, T.die + 0.3, 0.03, 0.22),
  };
};

/** The direction for the drawing itself, which during the lesson replays an earlier moment. */
export const directWorld = (t: number): Direction => {
  const tw = worldTime(t);
  if (tw === t) return direct(t);
  return {...direct(tw), view: viewOf(t), gas: {level: 1, fill: 1, cloud: 1, spill: 1}, grey: 0, dim: 0};
};
