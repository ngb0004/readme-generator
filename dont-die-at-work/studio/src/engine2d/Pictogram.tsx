import React from 'react';
import {lerp} from '../engine/time';
import {P, View} from './view';

/**
 * The figure from a safety sign, brought to life: round head, thick rounded
 * limbs, a hard hat. Faceless on purpose. 2D forward-kinematic rig.
 * Positions in metres; angles in degrees, 0 = hanging straight down, positive
 * swings toward the way the figure faces.
 */
export type Pose2D = {
  x: number; y: number; // hip, world metres
  rot: number; // whole body rotation about the hip (for lying down); + tips it face-forward
  lean: number; // torso lean from vertical
  head: number; // head tilt relative to torso
  armA: number; foreA: number; // near arm: shoulder, then elbow relative to the upper arm
  armB: number; foreB: number; // far arm
  legA: number; shinA: number; // near leg: hip, then knee relative to the thigh
  legB: number; shinB: number;
};

export const HEIGHT = 1.78;
/** Hip height of a figure standing on a floor at y = 0. */
export const HIP = 0.905;

export const STAND: Pose2D = {x: 0, y: HIP, rot: 0, lean: 2, head: 0, armA: 8, foreA: 8, armB: -8, foreB: 6, legA: 5, shinA: 0, legB: -5, shinB: 0};
export const pose = (over: Partial<Pose2D>, base: Pose2D = STAND): Pose2D => ({...base, ...over});
export const mix = (a: Pose2D, b: Pose2D, t: number): Pose2D => {
  const o = {} as Pose2D;
  (Object.keys(a) as (keyof Pose2D)[]).forEach((k) => (o[k] = lerp(a[k], b[k], t)));
  return o;
};
/** Walk cycle laid over a pose; `phase` advances by 1 per stride. */
export const walk = (base: Pose2D, phase: number, amount = 1): Pose2D => {
  const s = Math.sin(phase * Math.PI * 2) * amount;
  const c = Math.cos(phase * Math.PI * 2) * amount;
  return {
    ...base,
    y: base.y - 0.02 * amount + Math.abs(c) * 0.025 * amount,
    lean: base.lean + 5 * amount,
    legA: 26 * s, legB: -26 * s,
    shinA: -Math.max(0, -c) * 42 - 4, shinB: -Math.max(0, c) * 42 - 4,
    armA: -24 * s, armB: 24 * s, foreA: 18, foreB: 18,
  };
};

const rad = (d: number) => (d * Math.PI) / 180;
const down = (x: number, y: number, len: number, a: number): [number, number] => [x + Math.sin(rad(a)) * len, y + Math.cos(rad(a)) * len];
const up = (x: number, y: number, len: number, a: number): [number, number] => [x + Math.sin(rad(a)) * len, y - Math.cos(rad(a)) * len];
const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(v * k));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};

export type Look2D = {color: string; band?: string; tank?: string};

/** Screen-space joints, for attaching props (a wire in the hand, a radio at the mouth). */
export const joints = (v: View, p: Pose2D, faceLeft = false) => {
  const h = HEIGHT * v.s;
  const s = faceLeft ? -1 : 1;
  const [ox, oy] = P(v, p.x, p.y);
  const rot = (pt: [number, number]): [number, number] => {
    const a = rad(s * p.rot);
    return [ox + pt[0] * Math.cos(a) - pt[1] * Math.sin(a), oy + pt[0] * Math.sin(a) + pt[1] * Math.cos(a)];
  };
  const sh = up(0, 0, h * 0.27, s * p.lean);
  const neck = up(0, 0, h * 0.3, s * p.lean);
  const elA = down(sh[0], sh[1], h * 0.165, s * p.armA);
  const handA = down(elA[0], elA[1], h * 0.16, s * (p.armA + p.foreA));
  const headC = up(neck[0], neck[1], h * 0.066 * 1.55, s * (p.lean + p.head));
  return {hand: rot(handA), head: rot(headC), shoulder: rot(sh), hip: [ox, oy] as [number, number]};
};

export const Pictogram: React.FC<{v: View; p: Pose2D; look: Look2D; faceLeft?: boolean; opacity?: number; glow?: boolean; dead?: number}> = ({v, p, look, faceLeft, opacity = 1, glow, dead = 0}) => {
  const h = HEIGHT * v.s;
  const torso = h * 0.3;
  const thigh = h * 0.235;
  const shin = h * 0.235;
  const upper = h * 0.165;
  const fore = h * 0.16;
  const headR = h * 0.066;
  const limb = h * 0.082;
  const s = faceLeft ? -1 : 1;
  const [ox, oy] = P(v, p.x, p.y);

  // a figure that has gone down loses its colour
  const base = dead > 0 ? blend(look.color, '#5c6b80', dead) : look.color;
  const far = shade(base.startsWith('#') ? base : '#888888', 0.7);

  const hip: [number, number] = [0, 0];
  const shoulder = up(0, 0, torso * 0.9, s * p.lean);
  const neck = up(0, 0, torso, s * p.lean);
  const headC = up(neck[0], neck[1], headR * 1.55, s * (p.lean + p.head));
  const elbowA = down(shoulder[0], shoulder[1], upper, s * p.armA);
  const handA = down(elbowA[0], elbowA[1], fore, s * (p.armA + p.foreA));
  const elbowB = down(shoulder[0], shoulder[1], upper, s * p.armB);
  const handB = down(elbowB[0], elbowB[1], fore, s * (p.armB + p.foreB));
  const kneeA = down(0, 0, thigh, s * p.legA);
  const footA = down(kneeA[0], kneeA[1], shin, s * (p.legA + p.shinA));
  const kneeB = down(0, 0, thigh, s * p.legB);
  const footB = down(kneeB[0], kneeB[1], shin, s * (p.legB + p.shinB));
  const seg = (a: [number, number], b: [number, number], c: [number, number], w: number, col: string) => (
    <polyline points={`${a[0]},${a[1]} ${b[0]},${b[1]} ${c[0]},${c[1]}`} fill="none" stroke={col} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
  );
  const headAngle = s * (p.lean + p.head);
  const nx = Math.cos(rad(s * p.lean)) * h * 0.079;
  const ny = Math.sin(rad(s * p.lean)) * h * 0.079;
  return (
    <g transform={`translate(${ox} ${oy}) rotate(${s * p.rot})`} opacity={opacity} style={glow ? {filter: `drop-shadow(0 0 ${h * 0.045}px ${look.color}66)`} : undefined}>
      {seg(hip, kneeB, footB, limb, far)}
      {seg(shoulder, elbowB, handB, limb * 0.86, far)}
      {look.tank ? <line x1={shoulder[0] * 0.25 - s * h * 0.105} y1={shoulder[1] * 0.25} x2={shoulder[0] * 0.95 - s * h * 0.105} y2={shoulder[1] * 0.95} stroke={look.tank} strokeWidth={h * 0.085} strokeLinecap="round" /> : null}
      <line x1={0} y1={0} x2={shoulder[0]} y2={shoulder[1]} stroke={base} strokeWidth={h * 0.16} strokeLinecap="round" />
      {look.band
        ? [0.42, 0.64].map((k) => <line key={k} x1={shoulder[0] * k - nx} y1={shoulder[1] * k - ny} x2={shoulder[0] * k + nx} y2={shoulder[1] * k + ny} stroke={look.band} strokeWidth={h * 0.024} />)
        : null}
      {seg(hip, kneeA, footA, limb, base)}
      {seg(shoulder, elbowA, handA, limb * 0.86, base)}
      <circle cx={headC[0]} cy={headC[1]} r={headR} fill={base} />
      <g transform={`translate(${headC[0]} ${headC[1]}) rotate(${headAngle})`}>
        <path d={`M ${-headR * 1.12} ${-headR * 0.18} A ${headR * 1.12} ${headR * 1.05} 0 0 1 ${headR * 1.12} ${-headR * 0.18} Z`} fill={base} />
        <rect x={s < 0 ? -headR * 1.75 : -headR * 1.2} y={-headR * 0.34} width={headR * 2.95} height={headR * 0.3} rx={headR * 0.15} fill={base} />
      </g>
    </g>
  );
};

const blend = (a: string, b: string, t: number) => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (sh: number) => Math.round(lerp((pa >> sh) & 255, (pb >> sh) & 255, t));
  return `#${((1 << 24) + (ch(16) << 16) + (ch(8) << 8) + ch(0)).toString(16).slice(1)}`;
};
