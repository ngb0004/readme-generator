import React from 'react';
import {C} from '../engine/theme';
import {noise, rnd} from '../engine/time';
import {D, FLANGE_R, FLANGE_T, TRAY_Y, WALL, YC, innerR} from '../v001/dims';

/**
 * The reactor top as an engineering cross-section, to the report's dimensions.
 * World metres -> pixels: x' = cx + x*s, y' = cy - y*s (origin: centre of the manway, flange face).
 */
export type View = {cx: number; cy: number; s: number};
export const at = (v: View, x: number, y: number): [number, number] => [v.cx + x * v.s, v.cy - y * v.s];

const STEEL = '#1d2b40';
const LINE = '#8db1e6';
const LINE_DIM = '#4b648c';

/** (r, y) outline of the wall on one side: outside going up, across the flange, inside going down. */
const wallOutline = (bottom: number) => {
  const R = D.reactorR;
  const Ro = R + WALL;
  const neckIn = D.manwayR;
  const neckOut = neckIn + 0.075;
  const pts: [number, number][] = [[Ro, bottom], [Ro, YC]];
  const aO = Math.acos(neckOut / Ro);
  for (let i = 1; i <= 40; i++) pts.push([Ro * Math.cos((aO * i) / 40), YC + Ro * Math.sin((aO * i) / 40)]);
  pts.push([neckOut, -FLANGE_T], [FLANGE_R, -FLANGE_T], [FLANGE_R, 0], [neckIn, 0]);
  const aI = Math.acos(neckIn / R);
  for (let i = 40; i >= 0; i--) pts.push([R * Math.cos((aI * i) / 40), YC + R * Math.sin((aI * i) / 40)]);
  pts.push([R, bottom]);
  return pts;
};
/** Inside of the vessel between two heights, as a closed polygon (both sides). */
const cavity = (yLo: number, yHi: number) => {
  const right: [number, number][] = [];
  for (let i = 0; i <= 60; i++) {
    const y = yLo + ((yHi - yLo) * i) / 60;
    right.push([y > -0.327 ? D.manwayR : innerR(y), y]);
  }
  return [...right, ...right.map(([r, y]) => [-r, y] as [number, number]).reverse()];
};
const poly = (v: View, pts: [number, number][]) => pts.map(([x, y]) => at(v, x, y).join(',')).join(' ');

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
    <radialGradient id="puff">
      <stop offset="0" stopColor={C.cyan} stopOpacity={0.5} />
      <stop offset="0.55" stopColor={C.cyan} stopOpacity={0.16} />
      <stop offset="1" stopColor={C.cyan} stopOpacity={0} />
    </radialGradient>
    <linearGradient id="gasfill" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stopColor="#0f6f8f" stopOpacity={0.92} />
      <stop offset="1" stopColor="#1fb6da" stopOpacity={0.62} />
    </linearGradient>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#04060c" />
      <stop offset="0.5" stopColor="#081020" />
      <stop offset="1" stopColor="#05080f" />
    </linearGradient>
    <linearGradient id="fadeDown" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#05080f" stopOpacity={0} />
      <stop offset="1" stopColor="#05080f" stopOpacity={1} />
    </linearGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="14" />
    </filter>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="5" result="b" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

/** Night refinery, far behind the drawing: just enough to say where we are. */
export const Backdrop: React.FC<{w: number; h: number; horizon: number; time: number}> = ({w, h, horizon, time}) => {
  const towers = Array.from({length: 13}, (_, i) => ({x: rnd(i * 3.1) * w, wd: 26 + rnd(i * 5.7) * 60, ht: 120 + rnd(i * 9.3) * 420}));
  return (
    <g>
      <rect width={w} height={h} fill="url(#sky)" />
      <rect width={w} height={h} fill="url(#grid)" opacity={0.75} />
      {Array.from({length: 70}, (_, i) => (
        <circle key={i} cx={rnd(i * 1.7) * w} cy={rnd(i * 4.3) * horizon * 0.9} r={0.8 + rnd(i * 7.7) * 1.3} fill="#9fb8e6" opacity={0.25 + 0.3 * rnd(i * 2.9)} />
      ))}
      {towers.map((t, i) => (
        <g key={i} opacity={0.9}>
          <rect x={t.x} y={horizon - t.ht} width={t.wd} height={t.ht + 400} fill="#0a111d" />
          <path d={`M ${t.x} ${horizon - t.ht} a ${t.wd / 2} ${t.wd / 2} 0 0 1 ${t.wd} 0 Z`} fill="#0a111d" />
          {Array.from({length: 4}, (_, k) => (
            <circle key={k} cx={t.x + rnd(i * 13 + k) * t.wd} cy={horizon - t.ht * (0.15 + 0.25 * k)} r={2.6} fill={C.warm} opacity={0.5 + 0.3 * Math.sin(time * 0.8 + i + k)} />
          ))}
          <circle cx={t.x + t.wd / 2} cy={horizon - t.ht - t.wd / 2 - 6} r={3} fill={C.red} opacity={0.75} />
        </g>
      ))}
    </g>
  );
};

/** Nitrogen: a filled body inside the vessel, wisps rising through the neck, and a cloud hanging over the opening. */
export const Nitrogen: React.FC<{v: View; time: number; level: number; cloud: number}> = ({v, time, level, cloud}) => {
  if (level <= 0) return null;
  const inside = cavity(TRAY_Y + 0.02, 0);
  const wisps = Array.from({length: 90}, (_, i) => {
    const rise = (rnd(i * 1.37) + time * (0.05 + rnd(i * 2.9) * 0.05)) % 1;
    const y = TRAY_Y + 0.1 + rise * (-TRAY_Y - 0.1);
    const lim = (y > -0.33 ? D.manwayR : innerR(y)) * 0.9;
    const x = (rnd(i * 5.1) * 2 - 1) * lim + noise(time * 0.5 + i, i) * 0.05;
    return {x, y, r: 0.05 + rnd(i * 7.3) * 0.11, o: Math.min(1, rise * 6) * Math.min(1, (1 - rise) * 6)};
  });
  const puffs = Array.from({length: 46}, (_, i) => {
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
  return (
    <g opacity={level}>
      <polygon points={poly(v, inside)} fill="url(#gasfill)" />
      <g filter="url(#soft)" opacity={0.7}>
        <ellipse cx={v.cx} cy={v.cy + 0.9 * v.s} rx={1.25 * v.s} ry={0.55 * v.s} fill={C.cyan} opacity={0.42} />
      </g>
      {wisps.map((w, i) => {
        const [x, y] = at(v, w.x, w.y);
        return <circle key={i} cx={x} cy={y} r={w.r * v.s} fill="url(#puff)" opacity={0.75 * w.o} />;
      })}
      <g opacity={cloud}>
        {puffs.map((p, i) => {
          const [x, y] = at(v, p.x, p.y);
          return <circle key={i} cx={x} cy={y} r={p.r * v.s} fill="url(#puff)" opacity={0.6 * p.o} />;
        })}
      </g>
    </g>
  );
};

/** Vessel, tray, catalyst, platform, studs. Draw the gas between `back` and `front`. */
export const Reactor: React.FC<{v: View; part: 'back' | 'front'; bottom?: number; tapeAt?: number}> = ({v, part, bottom = -9, tapeAt = 0.12}) => {
  const wall = wallOutline(bottom);
  const right = poly(v, wall);
  const left = poly(v, wall.map(([r, y]) => [-r, y] as [number, number]));
  const trayR = innerR(TRAY_Y) - 0.01;
  const caps: number[] = [];
  for (let x = -trayR + 0.16; x < trayR - 0.1; x += 0.2) if (Math.abs(x - tapeAt) > 0.14) caps.push(x);
  const studs = Array.from({length: D.studCount}, (_, i) => ((i + 0.5) / D.studCount) * Math.PI * 2).map((a) => ({x: Math.sin(a) * D.studCircleR, depth: Math.cos(a)}));
  const px = (m: number) => m * v.s;
  if (part === 'back') {
    return (
      <g>
        {/* inside of the head, empty */}
        <polygon points={poly(v, cavity(bottom, 0))} fill="#0b1422" />
        {/* handrail behind */}
        {[-3.0, -2.2, -1.4, 1.4, 2.2, 3.0].map((x) => (
          <line key={x} x1={at(v, x, 0)[0]} y1={at(v, x, 0)[1]} x2={at(v, x, 1.07)[0]} y2={at(v, x, 1.07)[1]} stroke="#8f7214" strokeWidth={px(0.04)} />
        ))}
        {[1.07, 0.56].map((y) => (
          <line key={y} x1={at(v, -3.4, y)[0]} y1={at(v, -3.4, y)[1]} x2={at(v, 3.4, y)[0]} y2={at(v, 3.4, y)[1]} stroke="#8f7214" strokeWidth={px(0.04)} />
        ))}
        {/* far studs */}
        {studs.filter((s) => s.depth < 0).map((s, i) => (
          <rect key={i} x={at(v, s.x - D.studR, 0)[0]} y={at(v, 0, D.studH)[1]} width={px(D.studR * 2)} height={px(D.studH)} rx={px(0.012)} fill="#27364d" stroke={LINE_DIM} strokeWidth={1.5} />
        ))}
        {/* catalyst bed */}
        <polygon points={poly(v, cavity(bottom, TRAY_Y - 0.3))} fill="url(#catalyst)" />
      </g>
    );
  }
  return (
    <g>
      {/* tray and bubble caps */}
      <rect x={at(v, -trayR, 0)[0]} y={at(v, 0, TRAY_Y)[1]} width={px(trayR * 2)} height={px(0.05)} fill="#3a4b66" stroke={LINE} strokeWidth={1.5} />
      {caps.map((x) => (
        <rect key={x} x={at(v, x - 0.058, 0)[0]} y={at(v, 0, TRAY_Y + 0.06)[1]} width={px(0.116)} height={px(0.06)} rx={px(0.014)} fill="#51688d" stroke={LINE} strokeWidth={1.2} />
      ))}
      {/* the cut wall, hatched the way a section drawing is */}
      <polygon points={right} fill="url(#hatch)" stroke={LINE} strokeWidth={2.5} strokeLinejoin="round" />
      <polygon points={left} fill="url(#hatch)" stroke={LINE} strokeWidth={2.5} strokeLinejoin="round" />
      {/* platform, cut */}
      {[-1, 1].map((sd) => (
        <rect key={sd} x={sd > 0 ? at(v, FLANGE_R + 0.02, 0)[0] : at(v, -3.6, 0)[0]} y={at(v, 0, -0.015)[1]} width={px(3.6 - FLANGE_R - 0.02)} height={px(0.1)} fill="#2a3a55" stroke={LINE} strokeWidth={2} />
      ))}
      {/* near studs, with the red danger tape that was the only warning */}
      {studs.filter((s) => s.depth >= 0 && Math.abs(s.x) > 0.36).map((s, i) => (
        <rect key={i} x={at(v, s.x - D.studR, 0)[0]} y={at(v, 0, D.studH)[1]} width={px(D.studR * 2)} height={px(D.studH)} rx={px(0.012)} fill="#3b4f70" stroke={LINE} strokeWidth={2} />
      ))}
      {[-1, 1].map((sd) => (
        <g key={sd}>
          {[0.36, 0.445].map((y) => (
            <rect key={y} x={at(v, sd > 0 ? 0.36 : -D.studCircleR - D.studR - 0.01, 0)[0]} y={at(v, 0, y + 0.035)[1]} width={px(D.studCircleR + D.studR + 0.01 - 0.36)} height={px(0.07)} fill={C.red} opacity={0.95} />
          ))}
        </g>
      ))}
    </g>
  );
};
