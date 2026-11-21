import {HIP, Look2D, Pose2D, mix, pose, walk} from '../engine2d/Pictogram';
import {C} from '../engine/theme';
import {E, Ease, clamp, lerp, ramp} from '../engine/time';
import {TRAY_Y} from './dims';
import {T} from './timeline';

export const LOOKS: Record<string, Look2D> = {
  A: {color: C.yellow, band: '#0b0f16'}, // the first man
  B: {color: '#eef2f8', band: '#93a1b8'}, // his foreman
  C: {color: '#7ea6e8'}, // the contract administrator
  P: {color: '#86cfa0'}, // the pipefitter who saw the tape
  R: {color: '#ff7a45', tank: '#e7ebf2'}, // emergency responders, on air
};

const TRAY = TRAY_Y + 0.06; // top of the bubble caps
type Key = {at: number; p: Pose2D; dur?: number; ease?: Ease};
const seq = (t: number, keys: Key[]): Pose2D => {
  let cur = keys[0].p;
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (t <= k.at) break;
    cur = mix(cur, k.p, ramp(t, k.at, k.at + (k.dur ?? 0.45), k.ease ?? E.inOut));
  }
  return cur;
};
const alive = (p: Pose2D, t: number, seed: number): Pose2D => ({
  ...p,
  lean: p.lean + Math.sin(t * 1.4 + seed) * 0.9,
  head: p.head + Math.sin(t * 0.7 + seed * 2.1) * 2.2,
  armA: p.armA + Math.sin(t * 1.4 + seed) * 1.2,
});

// ------------------------------------------------------------------ A, the first man (faces right)
const A_WORK = pose({x: -1.02, lean: 16, head: 22, armA: 44, foreA: 30, armB: 36, foreB: 36});
const A_STAND = pose({x: -1.05});
const A_LOOKUP = pose({x: -1.08, lean: -5, head: -24, armA: 4, armB: -6});
const A_LEAN = pose({x: -0.92, lean: 40, head: 24, armA: 34, foreA: 22, armB: 24, foreB: 30, legA: 8, legB: -10});
const A_LOOKDOWN = pose({x: -0.98, lean: 22, head: 30, armA: 20, foreA: 10, armB: 10, foreB: 10});
const A_TALK = pose({x: -1.05, lean: 4, head: -4, armA: 36, foreA: 72, armB: 4});
const A_BEND = pose({x: -1.08, lean: 12, head: 26, armA: 34, foreA: 66, armB: 28, foreB: 74});
const A_FISH = pose({x: -1.0, lean: 24, head: 26, armA: 58, foreA: 26, armB: 44, foreB: 30, legA: 10, shinA: -6, legB: -12, shinB: 4});
const A_KNEEL = pose({x: -1.16, y: 0.5, lean: 36, head: 22, armA: 72, foreA: 10, armB: 62, foreB: 14, legA: 82, shinA: -82, legB: 4, shinB: -88});
const A_SIT = pose({x: -0.4, y: 0.12, lean: 34, head: 30, armA: 30, foreA: -8, armB: -38, foreB: 22, legA: 84, shinA: -82, legB: 76, shinB: -80});
const A_DOWN = pose({x: -0.82, y: TRAY + 0.14, rot: -90, lean: 0, head: 8, armA: 24, foreA: 30, armB: -12, foreB: 14, legA: 12, shinA: -22, legB: -8, shinB: -8});

export const actorA = (t: number): Pose2D => {
  if (t >= T.i7 - 0.6) return A_DOWN;
  const p = seq(t, [
    {at: 0, p: A_WORK},
    {at: T.i1 - 0.1, p: A_LOOKUP, dur: 0.01},
    {at: T.out - 0.05, p: A_WORK, dur: 0.01},
    {at: T.lean - 0.1, p: A_LEAN, dur: 0.8, ease: E.inOutQuad},
    {at: T.f1 - 0.05, p: A_WORK, dur: 0.01},
    {at: T.i2 - 0.1, p: A_LOOKDOWN, dur: 0.5},
    {at: T.i3, p: A_TALK, dur: 0.5},
    {at: T.wire - 0.2, p: A_BEND, dur: 0.45},
    {at: T.fishing - 0.25, p: A_FISH, dur: 0.5},
    {at: T.kneel, p: A_KNEEL, dur: 0.42},
    {at: T.sits - 0.55, p: A_SIT, dur: 0.75, ease: E.inOutQuad},
  ]);
  const over = Math.sin(clamp((t - (T.sits - 0.55)) / 0.75) * Math.PI);
  const atWork = t < T.h3 || (t >= T.out && t < T.lean - 0.3) || (t >= T.f1 && t < T.i2 - 0.4);
  const turning = atWork ? Math.sin(t * 5.2) * 5 : 0; // working a wrench
  return alive({...p, y: p.y + over * 0.42, foreA: p.foreA + turning}, t, 1);
};

// ------------------------------------------------------------------ B, the foreman (faces left)
const B_WORK = pose({x: 1.12, lean: 14, head: 20, armA: 40, foreA: 34, armB: 30, foreB: 40});
const B_STAND = pose({x: 1.2});
const B_LOOKUP = pose({x: 1.22, lean: -4, head: -22});
const B_TALK = pose({x: 1.2, lean: 3, armA: 42, foreA: 58});
const B_WATCH = pose({x: 1.28, lean: 4, head: 12, armA: 14, foreA: 96, armB: 6, foreB: 100});
const B_PEER = pose({x: 0.98, y: HIP - 0.04, lean: 40, head: 26, armA: 34, foreA: 8, armB: 22, foreB: 10, legA: 8, shinA: -10, legB: -10, shinB: -4});
const B_FREEZE = pose({x: 0.98, lean: 24, head: 32, armA: 16, foreA: 24, armB: 8, foreB: 18});
const B_GRAB = pose({x: 1.2, lean: -8, head: -10, armA: -46, foreA: -18, armB: -58, foreB: -8});
const B_CARRY = pose({x: 0.98, lean: 12, head: 10, armA: 96, foreA: 26, armB: 84, foreB: 30});
const B_FLOOR = pose({x: 0.34, y: TRAY + HIP, lean: 8, head: 20});
const B_STOOP = pose({x: 0.3, y: TRAY + HIP - 0.1, lean: 58, head: 14, armA: 72, foreA: 8, armB: 60, foreB: 8, legA: 16, shinA: -30, legB: -10, shinB: -20});
const B_SAG = pose({x: 0.42, y: TRAY + 0.5, lean: 66, head: 30, armA: 60, foreA: 10, armB: 40, foreB: 10, legA: 80, shinA: -84, legB: 6, shinB: -88});
const B_DOWN = pose({x: 1.02, y: TRAY + 0.14, rot: -90, lean: 0, head: 10, armA: 30, foreA: 26, armB: -10, foreB: 12, legA: 22, shinA: -52, legB: 4, shinB: -30});

/** Where the ladder ends up: down through the manway, feet on the tray. (x at height y) */
export const LADDER = {top: [-0.1, 1.62] as [number, number], foot: [-0.27, TRAY] as [number, number]};
const ladderX = (y: number) => lerp(LADDER.foot[0], LADDER.top[0], (y - LADDER.foot[1]) / (LADDER.top[1] - LADDER.foot[1]));

export const actorB = (t: number): Pose2D => {
  if (t < T.climbs) {
    return alive(
      seq(t, [
        {at: 0, p: B_WORK},
        {at: T.i1 - 0.1, p: B_LOOKUP, dur: 0.01},
        {at: T.out - 0.05, p: B_WORK, dur: 0.01},
        {at: T.i2, p: B_STAND, dur: 0.5},
        {at: T.i3, p: B_TALK, dur: 0.5},
        {at: T.wire, p: B_WATCH, dur: 0.6},
        {at: T.i7 - 0.2, p: B_PEER, dur: 0.01},
        {at: T.i8, p: B_FREEZE, dur: 0.9, ease: E.out},
        {at: T.i9 + 0.05, p: B_GRAB, dur: 0.3, ease: E.inOutQuad},
        {at: T.i9 + 0.5, p: B_CARRY, dur: 0.4, ease: E.inOutQuad},
      ]),
      t, 2,
    );
  }
  const mount = ramp(t, T.climbs, T.climbs + 0.5, E.inOutQuad);
  const descend = ramp(t, T.climbs + 0.42, T.i10 + 0.25, E.inOutQuad);
  if (t < T.i10 + 0.25) {
    const feet = lerp(lerp(0, 0.68, Math.sin(mount * Math.PI * 0.5)), TRAY, descend);
    const s = Math.sin(t * 3.4 * Math.PI * 2);
    const climb = pose({
      x: lerp(B_CARRY.x, ladderX(feet + 0.9) + 0.26, mount), y: feet + HIP - 0.06, lean: 8, head: 16,
      armA: 150 + s * 16, foreA: -34 - s * 12, armB: 150 - s * 16, foreB: -34 + s * 12,
      legA: 44 + s * 26, shinA: -62 - s * 24, legB: 44 - s * 26, shinB: -62 + s * 24,
    });
    return mix(B_CARRY, climb, ramp(t, T.climbs, T.climbs + 0.3));
  }
  const base = pose({x: ladderX(TRAY + 0.9) + 0.26, y: TRAY + HIP - 0.06, lean: 8, head: 16, armA: 150, foreA: -34, armB: 150, foreB: -34, legA: 44, shinA: -62, legB: 44, shinB: -62});
  return seq(t, [
    {at: 0, p: base},
    {at: T.i10 + 0.25, p: B_FLOOR, dur: 0.35},
    {at: T.i10 + 0.6, p: B_STOOP, dur: 0.5},
    {at: T.lying - 0.35, p: B_SAG, dur: 0.5, ease: E.in},
    {at: T.lying + 0.1, p: B_DOWN, dur: 0.6, ease: E.inOutQuad},
  ]);
};

// ------------------------------------------------------------------ C, the contract administrator (faces left)
const C_AWAY = pose({x: 2.55});
const C_PEER = pose({x: 1.72, lean: 30, head: 24, armA: 20, foreA: 10});
const C_BACK = pose({x: 3.05, lean: -2});
const C_NEAR = pose({x: 0.92, lean: 6});
const C_REACH = pose({x: 0.86, lean: 22, head: 18, armA: 78, foreA: 12});
const C_STOP = pose({x: 1.04, lean: -8, head: 14, armA: 34, foreA: 60, armB: -14});
const C_RADIO = pose({x: 1.06, lean: -2, head: -6, armA: 38, foreA: 118, armB: 6});

export const actorC = (t: number): Pose2D => {
  const p = seq(t, [
    {at: 0, p: C_AWAY},
    {at: T.i7 - 0.2, p: C_PEER, dur: 0.01},
    {at: T.i9 + 0.1, p: C_BACK, dur: 0.6},
    {at: T.l3 - 0.3, p: C_NEAR, dur: 1.2, ease: E.inOutQuad},
    {at: T.l3 + 1.0, p: C_REACH, dur: 0.4},
    {at: T.doNot + 0.25, p: C_STOP, dur: 0.3, ease: E.out},
    {at: T.callIt - 0.15, p: C_RADIO, dur: 0.38},
  ]);
  const walking = Math.min(ramp(t, T.l3 - 0.3, T.l3 - 0.05), 1 - ramp(t, T.l3 + 0.6, T.l3 + 0.9));
  return alive(walking > 0.01 ? mix(p, walk(p, t * 1.9, 1), walking) : p, t, 3);
};

// ------------------------------------------------------------------ P, the pipefitter who spotted the tape (faces right)
export const actorP = (t: number): Pose2D => {
  const away = pose({x: -4.4});
  const here = pose({x: -1.92});
  const point = pose({x: -1.86, lean: 14, head: 20, armA: 60, foreA: 6});
  const p = seq(t, [
    {at: 0, p: away},
    {at: T.i2 - 1.5, p: here, dur: 1.2, ease: E.out},
    {at: T.i2 + 0.1, p: point, dur: 0.4},
    {at: T.i3 - 0.2, p: away, dur: 1.6, ease: E.in},
  ]);
  const walking = Math.max(Math.min(ramp(t, T.i2 - 1.5, T.i2 - 1.3), 1 - ramp(t, T.i2 - 0.6, T.i2 - 0.3)), ramp(t, T.i3 - 0.1, T.i3 + 0.2));
  return alive(walking > 0.01 ? mix(p, walk(p, t * 2, 1), walking) : p, t, 4);
};

// ------------------------------------------------------------------ responders (face left), breathing air on their backs
const R_LOWER = pose({x: 1.0, lean: 30, head: 22, armA: 62, foreA: 4, armB: 18, foreB: 30, legA: 10, legB: -8});
export const responders = (t: number): Pose2D[] => {
  const k = ramp(t, T.i11 - 0.1, T.i11 + 1.9, E.out);
  return [[4.4, 1.0], [5.2, 2.0]].map(([from, to], i) => {
    const base = pose({x: lerp(from, to, k), lean: 6, head: 8});
    const stride = 1 - ramp(t, T.i11 + 1.5, T.i11 + 1.9);
    const p = mix(base, walk(base, t * 2.3 + i * 0.5, 1), stride);
    return i === 0 ? mix(p, R_LOWER, ramp(t, T.meter, T.meter + 0.6, E.inOutQuad)) : p;
  });
};
/** How far the meter has been let down (0 at the hand, 1 inside the vessel), and whether it is alarming. */
export const meterAt = (t: number) => ({drop: ramp(t, T.meter + 0.5, T.alarm - 0.15, E.inOutQuad), alarm: t >= T.alarm});

/** Where the hook is: lowered, then scraping around the tape without ever catching it. */
export const hookTip = (t: number): [number, number] => {
  const lowered = ramp(t, T.fishing - 0.1, T.fishing + 1.0, E.inOutQuad);
  return [0.02 + Math.sin(t * 2.3) * 0.12 + Math.sin(t * 4.1) * 0.04, lerp(0.5, TRAY + 0.1, lowered) + Math.sin(t * 2.9) * 0.03 * lowered];
};

/** The ladder as two end points over time: lying on the deck, swung up, dropped down the manway. */
export const ladderAt = (t: number): {top: [number, number]; foot: [number, number]} => {
  const rest = {top: [5.0, 0.07] as [number, number], foot: [1.9, 0.07] as [number, number]};
  const held = {top: [-0.02, 3.85] as [number, number], foot: [-0.2, 0.75] as [number, number]};
  const a = ramp(t, T.i9 + 0.1, T.climbs - 0.32, E.inOutQuad);
  const b = ramp(t, T.climbs - 0.32, T.climbs - 0.02, E.in);
  const m = (p: [number, number], q: [number, number], k: number): [number, number] => [lerp(p[0], q[0], k), lerp(p[1], q[1], k)];
  return {top: m(m(rest.top, held.top, a), LADDER.top, b), foot: m(m(rest.foot, held.foot, a), LADDER.foot, b)};
};
