import React from 'react';
import {P, View} from '../engine2d/view';
import {C} from '../engine/theme';
import {lerp, noise, rnd} from '../engine/time';
import {D, FLANGE_R, FLANGE_T, TRAY_Y, WALL, YC, innerR} from './dims';

/**
 * The top of reactor R1 as an engineering cross-section, drawn to the
 * dimensions in CSB Figures 6 and 7. Origin: centre of the manway at the
 * flange face (which is also platform level). Metres, +y up.
 */
const STEEL = '#1d2b40';
const LINE = '#8db1e6';
const LINE_DIM = '#4b648c';
const BOTTOM = -9;

const wallOutline = () => {
  const R = D.reactorR;
  const Ro = R + WALL;
  const neckIn = D.manwayR;
  const neckOut = neckIn + 0.075;
  const pts: [number, number][] = [[Ro, BOTTOM], [Ro, YC]];
  const aO = Math.acos(neckOut / Ro);
  for (let i = 1; i <= 40; i++) pts.push([Ro * Math.cos((aO * i) / 40), YC + Ro * Math.sin((aO * i) / 40)]);
  pts.push([neckOut, -FLANGE_T], [FLANGE_R, -FLANGE_T], [FLANGE_R, 0], [neckIn, 0]);
  const aI = Math.acos(neckIn / R);
  for (let i = 40; i >= 0; i--) pts.push([R * Math.cos((aI * i) / 40), YC + R * Math.sin((aI * i) / 40)]);
  pts.push([R, BOTTOM]);
  return pts;
};
const WALL_PTS = wallOutline();
/** Half-width of the inside of the vessel at height y. */
export const half = (y: number) => (y > -0.327 ? D.manwayR : innerR(y));
/** Inside of the vessel between two heights, as a closed polygon. */
const cavity = (yLo: number, yHi: number) => {
  const right: [number, number][] = [];
  for (let i = 0; i <= 60; i++) {
    const y = yLo + ((yHi - yLo) * i) / 60;
    right.push([half(y), y]);
  }
  return [...right, ...right.map(([r, y]) => [-r, y] as [number, number]).reverse()];
};
const poly = (v: View, pts: [number, number][]) => pts.map(([x, y]) => P(v, x, y).join(',')).join(' ');

export const Defs: React.FC = () => (
  <defs>
    <pattern id="hatch" width={11} height={11} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width={11} height={11} fill={STEEL} />
      <line x1={0} y1={0} x2={0} y2={11} stroke="#33496b" strokeWidth={3} />
    </pattern>
    <pattern id="catalyst" width={22} height={19} patternUnits="userSpaceOnUse">
      <rect width={22} height={19} fill="#1b140d" />
      <circle cx={5} cy={5} r={3.6} fill="#a8793f" />
      <circle cx={16} cy={14} r={3.6} fill="#8d6433" />
      <circle cx={16} cy={3.5} r={2.2} fill="#6b4b27" />
      <circle cx={5} cy={14.5} r={2.2} fill="#6b4b27" />
    </pattern>
    <pattern id="grid" width={48} height={48} patternUnits="userSpaceOnUse">
      <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#18243a" strokeWidth={1} />
    </pattern>
    <pattern id="deck" width={26} height={10} patternUnits="userSpaceOnUse">
      <rect width={26} height={10} fill="#2a3a55" />
      <path d="M 3 7 l 8 -4 M 16 3 l 8 4" stroke="#3d5278" strokeWidth={2} strokeLinecap="round" />
    </pattern>
    <radialGradient id="puff">
      <stop offset="0" stopColor={C.cyan} stopOpacity={0.5} />
      <stop offset="0.55" stopColor={C.cyan} stopOpacity={0.16} />
      <stop offset="1" stopColor={C.cyan} stopOpacity={0} />
    </radialGradient>
    <linearGradient id="gasfill" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stopColor="#0f6f8f" stopOpacity={0.92} />
      <stop offset="1" stopColor="#1fb6da" stopOpacity={0.62} />
    </linearGradient>
    <linearGradient id="skyNight" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#04060c" />
      <stop offset="0.5" stopColor="#081020" />
      <stop offset="1" stopColor="#05080f" />
    </linearGradient>
    <linearGradient id="skyDay" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#123058" />
      <stop offset="0.55" stopColor="#3f6a9a" />
      <stop offset="1" stopColor="#0b1626" />
    </linearGradient>
    <linearGradient id="fadeDown" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#05080f" stopOpacity={0} />
      <stop offset="1" stopColor="#05080f" stopOpacity={1} />
    </linearGradient>
    <filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="16" />
    </filter>
  </defs>
);

/** Night refinery far behind the drawing. `day` (0..1) lightens the sky for the time-lapse. */
export const Backdrop: React.FC<{w: number; h: number; v: View; time: number; day?: number}> = ({w, h, v, time, day = 0}) => {
  const horizon = P(v, 0, -0.5)[1];
  // distant towers drift a little against the drawing as the camera moves: cheap depth
  const par = (v.cx - w / 2) * 0.18;
  const towers = Array.from({length: 15}, (_, i) => ({x: rnd(i * 3.1) * (w + 300) - 150 + par, wd: 26 + rnd(i * 5.7) * 60, ht: 110 + rnd(i * 9.3) * 420}));
  return (
    <g>
      <rect width={w} height={h} fill="url(#skyNight)" />
      {day > 0.01 ? <rect width={w} height={h} fill="url(#skyDay)" opacity={day * 0.85} /> : null}
      <rect width={w} height={h} fill="url(#grid)" opacity={0.7} />
      {Array.from({length: 70}, (_, i) => (
        <circle key={i} cx={rnd(i * 1.7) * w} cy={rnd(i * 4.3) * Math.max(200, horizon) * 0.9} r={0.8 + rnd(i * 7.7) * 1.3} fill="#9fb8e6" opacity={(0.25 + 0.3 * rnd(i * 2.9)) * (1 - day)} />
      ))}
      {towers.map((t, i) => (
        <g key={i}>
          <rect x={t.x} y={horizon - t.ht} width={t.wd} height={t.ht + 900} fill={day > 0.5 ? '#0d1a2c' : '#0a111d'} />
          <path d={`M ${t.x} ${horizon - t.ht} a ${t.wd / 2} ${t.wd / 2} 0 0 1 ${t.wd} 0 Z`} fill={day > 0.5 ? '#0d1a2c' : '#0a111d'} />
          {Array.from({length: 4}, (_, k) => (
            <circle key={k} cx={t.x + rnd(i * 13 + k) * t.wd} cy={horizon - t.ht * (0.15 + 0.25 * k)} r={2.6} fill={C.warm} opacity={(0.5 + 0.3 * Math.sin(time * 0.8 + i + k)) * (1 - day * 0.8)} />
          ))}
          <circle cx={t.x + t.wd / 2} cy={horizon - t.ht - t.wd / 2 - 6} r={3} fill={C.red} opacity={0.75 * (1 - day * 0.6)} />
        </g>
      ))}
    </g>
  );
};

/**
 * Nitrogen, drawn so you can see it (it is colourless in life).
 *   level  how visible the drawing of it is
 *   fill   how full the vessel is, 0..1 (for "pumped full")
 *   cloud  how much hangs over the open manway
 */
export const Nitrogen: React.FC<{v: View; time: number; level: number; fill?: number; cloud?: number; part?: 'body' | 'wisps' | 'cloud'}> = ({v, time, level, fill = 1, cloud = 1, part = 'body'}) => {
  if (level <= 0.003) return null;
  const top = lerp(TRAY_Y + 0.05, 0, fill);
  const body = cavity(TRAY_Y + 0.02, top);
  const wisps = Array.from({length: 80}, (_, i) => {
    const rise = (rnd(i * 1.37) + time * (0.05 + rnd(i * 2.9) * 0.05)) % 1;
    const y = TRAY_Y + 0.1 + rise * (top - TRAY_Y - 0.1);
    const x = (rnd(i * 5.1) * 2 - 1) * half(y) * 0.9 + noise(time * 0.5 + i, i) * 0.05;
    return {x, y, r: 0.05 + rnd(i * 7.3) * 0.11, o: Math.min(1, rise * 6) * Math.min(1, (1 - rise) * 6)};
  });
  const puffs = Array.from({length: 44}, (_, i) => {
    const life = (rnd(i * 3.3 + 1) + time * (0.045 + rnd(i * 6.1) * 0.035)) % 1;
    const side = rnd(i * 8.7) * 2 - 1;
    const spread = Math.pow(life, 1.3) * (0.5 + rnd(i * 2.2) * 1.15);
    return {
      x: side * (0.22 + spread) + noise(time * 0.3 + i, i + 9) * 0.08,
      y: 0.05 + Math.pow(life, 0.8) * (0.55 + rnd(i * 4.4) * 0.75) - spread * 0.1,
      r: 0.3 + life * 0.5 + rnd(i * 9.9) * 0.2,
      o: Math.min(1, life * 5) * Math.pow(1 - life, 1.1),
    };
  });
  const [gx, gy] = P(v, 0, lerp(TRAY_Y, -0.6, fill) + 0.35);
  return (
    <g opacity={level}>
      {part === 'body' ? (
        <>
          <polygon points={poly(v, body)} fill="url(#gasfill)" />
          <g filter="url(#soft)" opacity={0.7 * fill}>
            <ellipse cx={gx} cy={gy} rx={1.25 * v.s} ry={0.55 * v.s} fill={C.cyan} opacity={0.42} />
          </g>
        </>
      ) : null}
      {part === 'wisps'
        ? wisps.map((w, i) => {
            const [x, y] = P(v, w.x, w.y);
            return <circle key={i} cx={x} cy={y} r={w.r * v.s} fill="url(#puff)" opacity={0.75 * w.o} />;
          })
        : null}
      {part === 'cloud' && cloud > 0.01 ? (
        <g opacity={cloud * (fill > 0.97 ? 1 : 0)}>
          {puffs.map((p, i) => {
            const [x, y] = P(v, p.x, p.y);
            return <circle key={i} cx={x} cy={y} r={p.r * v.s} fill="url(#puff)" opacity={0.6 * p.o} />;
          })}
        </g>
      ) : null}
    </g>
  );
};

/** Oxygen being pushed up and out as the nitrogen comes in. Shown only during the fill. */
export const OxygenOut: React.FC<{v: View; time: number; amount: number}> = ({v, time, amount}) => {
  if (amount <= 0.01) return null;
  return (
    <g opacity={amount}>
      {Array.from({length: 34}, (_, i) => {
        const k = (rnd(i * 2.3) + time * (0.16 + rnd(i * 4.1) * 0.1)) % 1;
        const y = lerp(TRAY_Y + 0.3, 1.5, k);
        const x = (rnd(i * 6.7) * 2 - 1) * (y > 0 ? 0.25 + (y * 0.5) : half(y) * 0.8);
        const [px, py] = P(v, x, y);
        return <circle key={i} cx={px} cy={py} r={0.03 * v.s} fill="#ffffff" opacity={0.85 * Math.sin(k * Math.PI)} />;
      })}
    </g>
  );
};

/** Vessel, tray, catalyst, platform, studs. Draw the gas between `back` and `front`. */
export const Reactor: React.FC<{v: View; part: 'back' | 'front'; tape?: number; rails?: boolean}> = ({v, part, tape = 1, rails = true}) => {
  const right = poly(v, WALL_PTS);
  const left = poly(v, WALL_PTS.map(([r, y]) => [-r, y] as [number, number]));
  const trayR = innerR(TRAY_Y) - 0.01;
  const caps: number[] = [];
  for (let x = -trayR + 0.16; x < trayR - 0.1; x += 0.2) if (Math.abs(x - 0.12) > 0.14) caps.push(x);
  const studs = Array.from({length: D.studCount}, (_, i) => ((i + 0.5) / D.studCount) * Math.PI * 2).map((a) => ({x: Math.sin(a) * D.studCircleR, depth: Math.cos(a)}));
  const px = (m: number) => m * v.s;
  if (part === 'back') {
    return (
      <g>
        <polygon points={poly(v, cavity(BOTTOM, 0))} fill="#0b1422" />
        {rails
          ? [-3.0, -2.2, -1.4, 1.4, 2.2, 3.0].map((x) => (
              <line key={x} x1={P(v, x, 0)[0]} y1={P(v, x, 0)[1]} x2={P(v, x, 1.07)[0]} y2={P(v, x, 1.07)[1]} stroke="#8f7214" strokeWidth={px(0.04)} />
            ))
          : null}
        {rails
          ? [1.07, 0.56].map((y) => (
              <line key={y} x1={P(v, -3.6, y)[0]} y1={P(v, -3.6, y)[1]} x2={P(v, 3.6, y)[0]} y2={P(v, 3.6, y)[1]} stroke="#8f7214" strokeWidth={px(0.04)} />
            ))
          : null}
        {studs.filter((s) => s.depth < 0).map((s, i) => (
          <rect key={i} x={P(v, s.x - D.studR, 0)[0]} y={P(v, 0, D.studH)[1]} width={px(D.studR * 2)} height={px(D.studH)} rx={px(0.012)} fill="#27364d" stroke={LINE_DIM} strokeWidth={1.5} />
        ))}
        <polygon points={poly(v, cavity(BOTTOM, TRAY_Y - 0.3))} fill="url(#catalyst)" />
      </g>
    );
  }
  return (
    <g>
      <rect x={P(v, -trayR, 0)[0]} y={P(v, 0, TRAY_Y)[1]} width={px(trayR * 2)} height={px(0.05)} fill="#3a4b66" stroke={LINE} strokeWidth={1.5} />
      {caps.map((x) => (
        <rect key={x} x={P(v, x - 0.058, 0)[0]} y={P(v, 0, TRAY_Y + 0.06)[1]} width={px(0.116)} height={px(0.06)} rx={px(0.014)} fill="#51688d" stroke={LINE} strokeWidth={1.2} />
      ))}
      <polygon points={right} fill="url(#hatch)" stroke={LINE} strokeWidth={2.5} strokeLinejoin="round" />
      <polygon points={left} fill="url(#hatch)" stroke={LINE} strokeWidth={2.5} strokeLinejoin="round" />
      {[-1, 1].map((sd) => (
        <rect key={sd} x={sd > 0 ? P(v, FLANGE_R + 0.02, 0)[0] : P(v, -3.7, 0)[0]} y={P(v, 0, -0.015)[1]} width={px(3.7 - FLANGE_R - 0.02)} height={px(0.1)} fill="url(#deck)" stroke={LINE} strokeWidth={2} />
      ))}
      {studs.filter((s) => s.depth >= 0 && Math.abs(s.x) > 0.36).map((s, i) => (
        <rect key={i} x={P(v, s.x - D.studR, 0)[0]} y={P(v, 0, D.studH)[1]} width={px(D.studR * 2)} height={px(D.studH)} rx={px(0.012)} fill="#3b4f70" stroke={LINE} strokeWidth={2} />
      ))}
      {/* the red "danger" tape wrapped round the studs: the only warning on the manway */}
      {tape > 0.01
        ? [-1, 1].map((sd) =>
            [0.36, 0.445].map((y) => (
              <rect key={`${sd}${y}`} x={P(v, sd > 0 ? 0.36 : -D.studCircleR - D.studR - 0.01, 0)[0]} y={P(v, 0, y + 0.035)[1]} width={px(D.studCircleR + D.studR + 0.01 - 0.36)} height={px(0.07)} fill={C.red} opacity={0.95 * tape} />
            )),
          )
        : null}
    </g>
  );
};

/** The roll of duct tape lying on the tray. */
export const Tape: React.FC<{v: View}> = ({v}) => {
  const [x, y] = P(v, 0.12, TRAY_Y + 0.06);
  const w = 0.128 * v.s;
  const h = 0.05 * v.s;
  return (
    <g>
      <rect x={x - w / 2} y={y - h} width={w} height={h} rx={h * 0.22} fill="#cfd5de" stroke="#f1f4f8" strokeWidth={Math.max(1, v.s * 0.004)} />
      <rect x={x - w * 0.29} y={y - h} width={w * 0.58} height={h} fill="#8b6a40" opacity={0.85} />
      <path d={`M ${x + w / 2} ${y - h * 0.5} l ${w * 0.3} ${-h * 0.35}`} stroke="#cfd5de" strokeWidth={Math.max(1.5, h * 0.22)} strokeLinecap="round" />
    </g>
  );
};
