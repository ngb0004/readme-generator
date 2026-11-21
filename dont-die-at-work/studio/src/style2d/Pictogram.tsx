import React from 'react';

/**
 * The figure from a safety sign, brought to life: round head, thick rounded
 * limbs, a hard hat. Faceless on purpose. 2D forward-kinematic rig; angles in
 * degrees, 0 = hanging straight down, positive swings toward +x (screen right).
 */
export type Pose2D = {
  x: number; y: number; // hip position, px
  lean: number; // torso lean from vertical (+ = toward +x)
  head: number; // head tilt relative to torso
  armA: number; foreA: number; // near arm: shoulder angle, then elbow bend relative to upper arm
  armB: number; foreB: number; // far arm
  legA: number; shinA: number; // near leg: hip angle, then knee bend relative to thigh
  legB: number; shinB: number;
};

const rad = (d: number) => (d * Math.PI) / 180;
const step = (x: number, y: number, len: number, angle: number): [number, number] => [x + Math.sin(rad(angle)) * len, y + Math.cos(rad(angle)) * len];
const up = (x: number, y: number, len: number, angle: number): [number, number] => [x + Math.sin(rad(angle)) * len, y - Math.cos(rad(angle)) * len];

export const Pictogram: React.FC<{p: Pose2D; h: number; color: string; hat?: string; band?: string; flip?: boolean; opacity?: number; glow?: string}> = ({p, h, color, hat, band, flip, opacity = 1, glow}) => {
  // proportions of the ISO-style figure, as fractions of standing height
  const torso = h * 0.3;
  const thigh = h * 0.235;
  const shin = h * 0.235;
  const upper = h * 0.165;
  const fore = h * 0.16;
  const headR = h * 0.066;
  const limb = h * 0.082;
  const s = flip ? -1 : 1;

  const hip: [number, number] = [0, 0];
  const neck = up(0, 0, torso, s * p.lean);
  const shoulder = up(0, 0, torso * 0.9, s * p.lean);
  const headC = up(neck[0], neck[1], headR * 1.55, s * (p.lean + p.head));
  const elbowA = step(shoulder[0], shoulder[1], upper, s * p.armA);
  const handA = step(elbowA[0], elbowA[1], fore, s * (p.armA + p.foreA));
  const elbowB = step(shoulder[0], shoulder[1], upper, s * p.armB);
  const handB = step(elbowB[0], elbowB[1], fore, s * (p.armB + p.foreB));
  const kneeA = step(0, 0, thigh, s * p.legA);
  const footA = step(kneeA[0], kneeA[1], shin, s * (p.legA + p.shinA));
  const kneeB = step(0, 0, thigh, s * p.legB);
  const footB = step(kneeB[0], kneeB[1], shin, s * (p.legB + p.shinB));
  const line = (a: [number, number], b: [number, number], c: [number, number], w: number, col: string) => (
    <polyline points={`${a[0]},${a[1]} ${b[0]},${b[1]} ${c[0]},${c[1]}`} fill="none" stroke={col} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
  );
  const far = shade(color, 0.72);
  const headAngle = s * (p.lean + p.head);
  return (
    <g transform={`translate(${p.x} ${p.y})`} opacity={opacity} style={glow ? {filter: `drop-shadow(0 0 ${h * 0.05}px ${glow})`} : undefined}>
      {/* far limbs, a shade darker, behind the body */}
      {line(hip, kneeB, footB, limb, far)}
      {line(shoulder, elbowB, handB, limb * 0.86, far)}
      {/* torso */}
      <line x1={0} y1={0} x2={shoulder[0]} y2={shoulder[1]} stroke={color} strokeWidth={h * 0.16} strokeLinecap="round" />
      {band ? (
        <>
          {[0.42, 0.64].map((k) => {
            const cxk = shoulder[0] * k;
            const cyk = shoulder[1] * k;
            const nx = Math.cos(rad(s * p.lean)) * h * 0.079;
            const ny = Math.sin(rad(s * p.lean)) * h * 0.079;
            return <line key={k} x1={cxk - nx} y1={cyk - ny} x2={cxk + nx} y2={cyk + ny} stroke={band} strokeWidth={h * 0.024} />;
          })}
        </>
      ) : null}
      {/* near limbs */}
      {line(hip, kneeA, footA, limb, color)}
      {line(shoulder, elbowA, handA, limb * 0.86, color)}
      {/* head + hard hat */}
      <circle cx={headC[0]} cy={headC[1]} r={headR} fill={color} />
      <g transform={`translate(${headC[0]} ${headC[1]}) rotate(${headAngle})`}>
        <path d={`M ${-headR * 1.12} ${-headR * 0.18} A ${headR * 1.12} ${headR * 1.05} 0 0 1 ${headR * 1.12} ${-headR * 0.18} Z`} fill={hat ?? color} />
        <rect x={s < 0 ? -headR * 1.75 : -headR * 1.2} y={-headR * 0.34} width={headR * 2.95} height={headR * 0.3} rx={headR * 0.15} fill={hat ?? color} />
      </g>
    </g>
  );
};

const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(v * k));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};

export const STAND2D: Pose2D = {x: 0, y: 0, lean: 0, head: 0, armA: 6, foreA: 6, armB: -6, foreB: 4, legA: 4, shinA: 0, legB: -4, shinB: 0};
