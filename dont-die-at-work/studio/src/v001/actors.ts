import {Look, Pose, STAND, mix, pose, walk} from '../engine/Figure';
import {E, Ease, V3, clamp, lerp, lerp3, ramp} from '../engine/time';
import {TAPE, TRAY_Y} from './dims';
import {LADDER_IN, LADDER_LEN} from './Props';
import {T} from './timeline';

const F = -0.02; // deck
const HALF = Math.PI / 2;
const TRAY = TRAY_Y + 0.06; // on top of the bubble caps
const face = (x: number, z: number, tx = 0, tz = 0) => Math.atan2(tx - x, tz - z);

export const LOOKS: Record<string, Look> = {
  A: {suit: '#2a3b5c', vest: '#ff7417', hat: '#ffd21f'}, // the first man
  B: {suit: '#2a3b5c', vest: '#cfe01a', hat: '#f3f5f8'}, // his foreman
  C: {suit: '#434b5a', vest: '#ff7417', hat: '#3585ea'}, // the contract administrator
  P: {suit: '#2a3b5c', vest: '#cfe01a', hat: '#43c06f'}, // the pipefitter who saw the tape
  R: {suit: '#23272e', vest: '#f0c61c', hat: '#e3362b', tank: true}, // emergency responders
};

type Key = {at: number; p: Pose; dur?: number; ease?: Ease};
/** Hold each pose until the next key, then blend into it over `dur`. */
const seq = (t: number, keys: Key[]): Pose => {
  let cur = keys[0].p;
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (t <= k.at) break;
    cur = mix(cur, k.p, ramp(t, k.at, k.at + (k.dur ?? 0.45), k.ease ?? E.inOut));
  }
  return cur;
};
/** Nobody stands perfectly still. */
const alive = (p: Pose, t: number, seed: number): Pose => ({
  ...p,
  spine: p.spine + Math.sin(t * 1.5 + seed) * 0.012,
  headYaw: p.headYaw + Math.sin(t * 0.6 + seed * 2.1) * 0.05,
  lSh: p.lSh + Math.sin(t * 1.5 + seed) * 0.012,
  rSh: p.rSh + Math.sin(t * 1.5 + seed + 1) * 0.012,
});

// ------------------------------------------------------------------ A, the first man
const A_AT = {x: -1.0, y: F, z: -0.08, yaw: HALF};
const A_STAND = pose({...A_AT});
const A_LOOK = pose({...A_AT, x: -0.94, spine: 0.34, head: 0.55, lSh: 0.2, rSh: 0.15});
const A_TALK = pose({...A_AT, yaw: HALF - 0.25, headYaw: -0.3, rSh: 0.55, rEl: 1.0, rShOut: 0.2, spine: 0.06});
const A_FISH = pose({...A_AT, x: -0.9, hip: 0.95, spine: 0.44, head: 0.5, lSh: 1.02, lShOut: 0.03, lEl: 0.5, rSh: 0.84, rShOut: 0.03, rEl: 0.8, lKn: 0.14, rKn: 0.14, lHip: 0.12, rHip: -0.1});
const A_KNEEL = pose({...A_AT, x: -1.13, hip: 0.535, spine: 0.6, head: 0.42, lHip: 1.45, lKn: 1.45, rHip: 0.05, rKn: 1.6, lSh: 1.2, lEl: 0.35, rSh: 1.0, rEl: 0.5});
const A_SIT = pose({x: -0.385, y: 0, z: 0, yaw: HALF, hip: 0.115, spine: 0.52, head: 0.5, lHip: 1.5, lKn: 1.42, rHip: 1.5, rKn: 1.42, lHipOut: 0.06, rHipOut: 0.06, lSh: -0.25, lShOut: 0.4, lEl: 0.25, rSh: 0.95, rShOut: 0.0, rEl: 0.15});
const A_DOWN = pose({x: -0.3, y: TRAY, z: -0.42, yaw: 0.12, hip: 0.19, roll: 1.5, spine: 0.22, head: 0.3, lHip: 0.6, lKn: 0.85, rHip: 0.3, rKn: 0.5, lSh: 0.7, lShOut: 0.1, lEl: 0.95, rSh: 0.35, rEl: 0.55});

export const actorA = (t: number): Pose => {
  if (t >= T.air) return A_DOWN;
  const p = seq(t, [
    {at: 0, p: A_LOOK},
    {at: T.est, p: A_STAND, dur: 0.01},
    {at: T.spot, p: A_LOOK, dur: 0.5},
    {at: T.goingIn, p: A_TALK, dur: 0.5},
    {at: T.hook - 0.5, p: A_FISH, dur: 0.6},
    {at: T.kneel, p: A_KNEEL, dur: 0.42},
    {at: T.sit, p: A_SIT, dur: 0.5, ease: E.inOutQuad},
  ]);
  // stepping over the studs on the way to the ledge
  const over = Math.sin(clamp((t - T.sit) / 0.5) * Math.PI);
  return alive({...p, y: p.y + over * 0.34}, t, 1);
};

// ------------------------------------------------------------------ B, the foreman
const B_AT = {x: 1.06, y: F, z: -0.34, yaw: face(1.06, -0.34)};
const B_STAND = pose({...B_AT, lSh: 0.1, rSh: 0.1});
const B_TALK = pose({...B_AT, headYaw: 0.25, lSh: 0.5, lEl: 1.1, lShOut: 0.25});
const B_WATCH = pose({...B_AT, spine: 0.16, head: 0.36, lSh: 0.3, lEl: 1.5, rSh: 0.3, rEl: 1.5, lShOut: -0.25, rShOut: -0.25});
const B_PEER = pose({...B_AT, x: 0.9, z: -0.2, yaw: face(0.9, -0.2), spine: 0.62, head: 0.6, lSh: 0.5, rSh: 0.5, lKn: 0.2, rKn: 0.2, hip: 0.94});
const B_REACH = pose({x: 1.25, y: F, z: -1.0, yaw: 2.6, spine: 0.5, head: 0.3, lSh: 1.0, rSh: 1.0, lEl: 0.3, rEl: 0.3, lKn: 0.25, rKn: 0.25, hip: 0.93});
const B_CARRY = pose({x: 0.98, y: F, z: -0.16, yaw: face(0.98, -0.16) - 0.05, spine: 0.1, head: 0.2, lSh: 1.35, rSh: 1.35, lEl: 0.7, rEl: 0.7});
const B_SHOVE = pose({x: 0.92, y: F, z: -0.12, yaw: face(0.92, -0.12) - 0.05, spine: 0.5, head: 0.5, lSh: 0.9, rSh: 0.9, lEl: 0.2, rEl: 0.2, lKn: 0.3, rKn: 0.3, hip: 0.92});
const B_FLOOR = pose({x: 0.46, y: TRAY, z: 0.34, yaw: face(0.46, 0.34, -0.3, -0.42), spine: 0.12, head: 0.3});
const B_STOOP = pose({x: 0.3, y: TRAY, z: 0.2, yaw: face(0.3, 0.2, -0.3, -0.42), spine: 0.75, head: 0.3, lSh: 1.1, rSh: 1.1, lEl: 0.2, rEl: 0.2, lKn: 0.5, rKn: 0.5, lHip: 0.5, rHip: 0.4, hip: 0.86});
const B_SAG = pose({x: 0.36, y: TRAY, z: 0.26, yaw: face(0.3, 0.2, -0.3, -0.42), hip: 0.5, spine: 0.9, head: 0.75, lHip: 1.3, lKn: 1.7, rHip: 0.2, rKn: 1.6, lSh: 0.5, rSh: 0.4, lEl: 0.2, rEl: 0.2});
const B_DOWN = pose({x: 0.66, y: TRAY, z: 0.46, yaw: -0.25, hip: 0.19, roll: -1.52, spine: 0.24, head: 0.3, lHip: 0.22, lKn: 0.4, rHip: 0.42, rKn: 0.62, lSh: 0.3, lEl: 0.5, rSh: 0.9, rShOut: 0.05, rEl: 0.35});

const ladderX = (y: number) => LADDER_IN.pos[0] - (y - LADDER_IN.pos[1]) * Math.sin(LADDER_IN.rot[2]);

export const actorB = (t: number): Pose => {
  if (t < T.climbs) {
    return alive(
      seq(t, [
        {at: 0, p: B_PEER},
        {at: T.est, p: B_STAND, dur: 0.01},
        {at: T.goingIn, p: B_TALK, dur: 0.5},
        {at: T.hook, p: B_WATCH, dur: 0.6},
        {at: T.foreman - 0.25, p: B_PEER, dur: 0.3, ease: E.out},
        {at: T.grabs - 0.22, p: B_REACH, dur: 0.34, ease: E.inOutQuad},
        {at: T.grabs + 0.2, p: B_CARRY, dur: 0.42, ease: E.inOutQuad},
        {at: T.climbs - 0.34, p: B_SHOVE, dur: 0.22, ease: E.in},
      ]),
      t, 2,
    );
  }
  // over the studs, onto the ladder, and down
  const mount = ramp(t, T.climbs, T.climbs + 0.5, E.inOutQuad);
  const descend = ramp(t, T.climbs + 0.42, T.few + 0.1, E.inOutQuad);
  if (t < T.few + 0.1) {
    const feet = lerp(lerp(F, 0.66, Math.sin(mount * HALF)), TRAY, descend);
    const x = lerp(B_SHOVE.x, ladderX(feet + 0.9) + 0.25, mount);
    const ph = t * 3.4;
    const s = Math.sin(ph * Math.PI * 2);
    const climb = pose({
      x, y: feet, z: lerp(B_SHOVE.z, -0.02, mount), yaw: -HALF, hip: 0.9, spine: 0.16, head: 0.5,
      lSh: 2.0 + s * 0.35, rSh: 2.0 - s * 0.35, lEl: 0.75 - s * 0.3, rEl: 0.75 + s * 0.3, lShOut: 0.1, rShOut: 0.1,
      lHip: 0.75 + s * 0.45, rHip: 0.75 - s * 0.45, lKn: 1.15 + s * 0.5, rKn: 1.15 - s * 0.5,
    });
    return mix(B_SHOVE, climb, ramp(t, T.climbs, T.climbs + 0.3));
  }
  // on the tray: he turns to his man, reaches, and goes down
  const base = pose({x: ladderX(TRAY + 0.9) + 0.25, y: TRAY, z: -0.02, yaw: -HALF, hip: 0.9, spine: 0.16, head: 0.5, lSh: 2.0, rSh: 2.0, lEl: 0.75, rEl: 0.75, lHip: 0.75, rHip: 0.75, lKn: 1.15, rKn: 1.15});
  return seq(t, [
    {at: 0, p: base},
    {at: T.few + 0.1, p: B_FLOOR, dur: 0.4},
    {at: T.few + 0.5, p: B_STOOP, dur: 0.5},
    {at: T.downToo - 0.25, p: B_SAG, dur: 0.5, ease: E.in},
    {at: T.downToo + 0.2, p: B_DOWN, dur: 0.55, ease: E.inOutQuad},
  ]);
};

// ------------------------------------------------------------------ C, the contract administrator
const C_HOME = pose({x: 1.86, y: F, z: -1.5, yaw: face(1.86, -1.5)});
const C_PEER = pose({x: 0.42, y: F, z: -0.95, yaw: face(0.42, -0.95), spine: 0.55, head: 0.6, lSh: 0.4, rSh: 0.4, hip: 0.94, lKn: 0.2, rKn: 0.2});
const C_BACK = pose({x: 1.5, y: F, z: -1.2, yaw: face(1.5, -1.2), spine: 0.05, head: 0.15});
const C_NEAR = pose({x: 0.98, y: F, z: 0.02, yaw: face(0.98, 0.02, -0.15, 0)});
const C_REACH = pose({...C_NEAR, x: 0.9, spine: 0.34, head: 0.45, rSh: 1.25, rEl: 0.25, lSh: 0.3, lKn: 0.16, rKn: 0.16});
const C_STOP = pose({...C_NEAR, x: 1.1, spine: -0.1, head: 0.35, rSh: 0.5, rEl: 1.1, lSh: -0.2, lShOut: 0.3, lEl: 0.4});
const C_RADIO = pose({...C_NEAR, x: 1.12, yaw: C_NEAR.yaw + 0.45, spine: -0.03, head: -0.05, headYaw: -0.4, rSh: 0.75, rShOut: 0.25, rEl: 2.3, lSh: 0.5, lShOut: 0.35, lEl: 0.5});

export const actorC = (t: number): Pose => {
  const p = seq(t, [
    {at: 0, p: C_HOME},
    {at: T.foreman - 0.6, p: C_PEER, dur: 0.5},
    {at: T.grabs + 0.05, p: C_BACK, dur: 0.55},
    {at: T.third + 0.2, p: C_NEAR, dur: T.reaches + 0.45 - (T.third + 0.2), ease: E.inOutQuad},
    {at: T.reaches + 0.4, p: C_REACH, dur: 0.38},
    {at: T.stops, p: C_STOP, dur: 0.3, ease: E.out},
    {at: T.radios - 0.2, p: C_RADIO, dur: 0.38},
  ]);
  const walking = Math.min(ramp(t, T.third + 0.2, T.third + 0.5), 1 - ramp(t, T.reaches + 0.15, T.reaches + 0.45));
  return alive(walking > 0.01 ? mix(p, walk(p, (t - T.third) * 1.9, 1), walking) : p, t, 3);
};

// ------------------------------------------------------------------ P, the pipefitter who spotted the tape
const P_HOME = pose({x: -0.3, y: F, z: -1.12, yaw: face(-0.3, -1.12, 0, 0.3)});
const P_POINT = pose({...P_HOME, z: -1.02, spine: 0.4, head: 0.55, rSh: 1.0, rShOut: 0.08, rEl: 0.08, lSh: 0.2});
const P_AWAY = pose({x: -2.5, y: F, z: -1.2, yaw: face(-2.5, -1.2), lSh: 0.3, lEl: 1.5, rSh: 0.3, rEl: 1.5, lShOut: -0.25, rShOut: -0.25});

export const actorP = (t: number): Pose => {
  const p = seq(t, [
    {at: 0, p: P_HOME},
    {at: T.spot - 0.2, p: P_POINT, dur: 0.45},
    {at: T.goingIn + 0.3, p: P_AWAY, dur: 1.9, ease: E.inOutQuad},
  ]);
  const walking = Math.min(ramp(t, T.goingIn + 0.3, T.goingIn + 0.6), 1 - ramp(t, T.goingIn + 1.8, T.goingIn + 2.2));
  return alive(walking > 0.01 ? mix(p, walk(p, t * 1.8, 1), walking) : p, t, 4);
};

// ------------------------------------------------------------------ responders
export const responders = (t: number): Pose[] => {
  const k = ramp(t, T.responders - 0.2, T.responders + 1.9, E.out);
  const ends: [V3, V3][] = [
    [[-0.9, F, -3.6], [-0.86, F, -0.66]],
    [[0.7, F, -3.9], [0.2, F, -1.12]],
  ];
  return ends.map(([from, to], i) => {
    const [x, y, z] = lerp3(from, to, k);
    const base = pose({x, y, z, yaw: face(x, z), spine: 0.12, head: 0.2});
    const stride = 1 - ramp(t, T.responders + 1.5, T.responders + 1.9);
    return mix(base, walk(base, t * 2.3 + i * 0.5, 1), stride);
  });
};

// ------------------------------------------------------------------ props
export const ladderAt = (t: number): {pos: V3; rot: V3} => {
  const rest: {pos: V3; rot: V3} = {pos: [1.5, F + 0.05, -1.75], rot: [HALF, 0, HALF - 0.25]};
  const held: {pos: V3; rot: V3} = {pos: [-0.14, 2.05, -0.04], rot: [0, 0, -0.09]};
  const a = ramp(t, T.grabs + 0.05, T.climbs - 0.34, E.inOutQuad);
  const b = ramp(t, T.climbs - 0.34, T.climbs - 0.04, E.in);
  const lift = Math.sin(a * Math.PI) * 0.5;
  const p1 = lerp3(rest.pos, held.pos, a);
  const r1 = lerp3(rest.rot, held.rot, a);
  return {pos: lerp3([p1[0], p1[1] + lift, p1[2]], LADDER_IN.pos, b), rot: lerp3(r1, LADDER_IN.rot, b)};
};

/** Where the hook is: lowered, then scraping around the tape without ever catching it. */
export const hookTip = (t: number): V3 => {
  const lowered = ramp(t, T.hook + 0.25, T.hook + 1.35, E.inOutQuad);
  const y = lerp(0.35, TAPE[1] + 0.07, lowered) + Math.sin(t * 2.9) * 0.025 * lowered;
  return [TAPE[0] - 0.1 + Math.sin(t * 2.3) * 0.11 + Math.sin(t * 4.1) * 0.04, y, TAPE[2] + 0.02 + Math.cos(t * 1.9) * 0.08];
};
export const LADDER_TOP: V3 = [LADDER_IN.pos[0] + 0.07, LADDER_IN.pos[1] + LADDER_LEN / 2 - 0.25, LADDER_IN.pos[2]];
export {STAND};
