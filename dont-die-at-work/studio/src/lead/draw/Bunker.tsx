import React from 'react';
import {C} from '../../engine/theme';
import {clamp, lerp, noise, rnd} from '../../engine/time';
import {P, View} from './view';

/**
 * An earth-covered magazine in cross-section: a reinforced concrete arch under a mound of earth,
 * with barrels on the floor. The Army describes the structure ("earth-covered magazines - a
 * reinforced structure made of concrete") but gives no dimensions, so this is a schematic and
 * the scenes label it as one. Metres; origin at the centre of the floor; +y up.
 */
export const M = {
  r: 4.0, // inside radius of the arch
  wall: 0.38,
  moundH: 5.4,
  moundW: 5.8, // width parameter of the earth cover
  floor: 0.32,
  barrelW: 0.6,
  barrelH: 0.92,
  barrelGap: 0.82,
  barrels: 7,
};
export const BARREL = '#3f74b4';
export const BARREL_DARK = '#274b78';
export const EARTH = '#1c2418';
export const CONCRETE = '#6b7686';

/** Height of the earth cover at x. */
export const mound = (x: number) => M.moundH * Math.exp(-((x / M.moundW) ** 2));
/** Barrel centres across the floor. */
export const barrelXs = () => Array.from({length: M.barrels}, (_, i) => (i - (M.barrels - 1) / 2) * M.barrelGap);

const pts = (v: View, list: [number, number][]) => list.map(([x, y]) => P(v, x, y).join(',')).join(' ');

/** One plastic drum, seen from the side. (x, y) is the centre of its base. */
export const Drum: React.FC<{v: View; x: number; y: number; scale?: number; color?: string; crust?: number; dim?: number}> = ({v, x, y, scale = 1, color = BARREL, crust = 0, dim = 0}) => {
  const w = M.barrelW * scale;
  const h = M.barrelH * scale;
  const [px, py] = P(v, x - w / 2, y + h);
  const pw = w * v.s;
  const ph = h * v.s;
  return (
    <g opacity={1 - dim}>
      <rect x={px} y={py} width={pw} height={ph} rx={pw * 0.16} fill={color} stroke="#0a1220" strokeWidth={Math.max(1, pw * 0.03)} />
      {[0.3, 0.66].map((k) => (
        <rect key={k} x={px} y={py + ph * k} width={pw} height={ph * 0.05} fill={BARREL_DARK} />
      ))}
      <rect x={px + pw * 0.06} y={py - ph * 0.045} width={pw * 0.88} height={ph * 0.09} rx={ph * 0.03} fill="#1c2f4a" stroke="#0a1220" strokeWidth={1} />
      <rect x={px + pw * 0.14} y={py + ph * 0.1} width={pw * 0.1} height={ph * 0.74} rx={pw * 0.05} fill="rgba(255,255,255,0.18)" />
      {crust > 0.01
        ? Array.from({length: 9}, (_, i) => {
            const a = rnd(i * 3.7 + x) * Math.PI - Math.PI;
            const cx = px + pw * (0.1 + rnd(i * 5.1 + x * 2) * 0.8);
            const len = pw * (0.1 + rnd(i * 9.3) * 0.16) * crust;
            return <line key={i} x1={cx} y1={py - ph * 0.02} x2={cx + Math.cos(a) * len} y2={py - ph * 0.02 + Math.sin(a) * len} stroke="#f1f6ff" strokeWidth={Math.max(1.2, pw * 0.025)} strokeLinecap="round" opacity={0.9 * crust} />;
          })
        : null}
    </g>
  );
};

type Props = {
  v: View;
  time: number;
  /** 0 = a mound of earth; 1 = cut open so you can see the arch and the barrels. */
  cut?: number;
  /** Crystals on the lids, 0..1. */
  crust?: number;
  /** The Army's works round the bunker: barriers, water tanks, foam, gel, misters. Each 0..1. */
  works?: {barriers?: number; tanks?: number; foam?: number; gel?: number; mist?: number};
  /** 0..1: the detonation. A flash, then a rising cloud that carries lead (drawn cyan). */
  blast?: number;
  /** Which way the cloud leans: -1 left, +1 right. */
  wind?: number;
  /** Stars and distant lights behind. */
  sky?: boolean;
};

export const Bunker: React.FC<Props> = ({v, time, cut = 1, crust = 0, works = {}, blast = 0, wind = 0.5, sky = true}) => {
  const px = (m: number) => m * v.s;
  const [gx0, gy] = P(v, -40, 0);
  const [gx1] = P(v, 40, 0);
  const moundPts: [number, number][] = [];
  for (let x = -14; x <= 14.001; x += 0.25) moundPts.push([x, mound(x)]);
  const arch = (r: number): [number, number][] => Array.from({length: 41}, (_, i) => [Math.cos((Math.PI * i) / 40) * r, Math.sin((Math.PI * i) / 40) * r] as [number, number]);
  const xs = barrelXs();
  const {barriers = 0, tanks = 0, foam = 0, gel = 0, mist = 0} = works;
  const flash = blast > 0 ? Math.max(0, 1 - blast * 7) : 0;
  const cloud = clamp((blast - 0.04) / 0.96);
  return (
    <g>
      {sky
        ? Array.from({length: 60}, (_, i) => <circle key={i} cx={rnd(i * 1.7) * 1920} cy={rnd(i * 4.3) * Math.max(160, gy - 60)} r={0.8 + rnd(i * 7.7) * 1.4} fill="#9fb8e6" opacity={0.22 + 0.3 * rnd(i * 2.9)} />)
        : null}
      {/* the plant on the horizon: low sheds, a water tower, work lights */}
      {sky
        ? Array.from({length: 13}, (_, i) => {
            const bx = ((rnd(i * 3.1) * 2600 + (v.cx - 960) * 0.22) % 2600) - 340;
            const bw = 70 + rnd(i * 5.7) * 190;
            const bh = (i % 5 === 0 ? 120 : 34) + rnd(i * 9.3) * 46;
            return (
              <g key={`sk${i}`}>
                <rect x={bx} y={gy - bh} width={i % 5 === 0 ? 16 : bw} height={bh} fill="#0a111d" />
                {i % 5 === 0 ? <ellipse cx={bx + 8} cy={gy - bh} rx={30} ry={20} fill="#0a111d" /> : null}
                <circle cx={bx + (i % 5 === 0 ? 8 : bw * 0.3)} cy={gy - bh - 4} r={3.4} fill={C.warm} opacity={0.5 + 0.3 * Math.sin(time * 0.8 + i)} />
              </g>
            );
          })
        : null}
      {/* ground */}
      <rect x={gx0} y={gy} width={gx1 - gx0} height={900} fill="#0c120d" />
      <line x1={gx0} y1={gy} x2={gx1} y2={gy} stroke="#3c5a3a" strokeWidth={3} />

      {/* barriers: sand-filled cells stacked two storeys high, both sides */}
      {barriers > 0.01
        ? [-1, 1].map((sd) =>
            [0, 1, 2].map((row) => {
              const k = clamp(barriers * 3 - row);
              if (k <= 0) return null;
              const x = sd * 16.2 - 1.3;
              const [bx, by] = P(v, x, (row + 1) * 2.05);
              return (
                <g key={`${sd}${row}`} opacity={k} transform={`translate(0 ${(1 - k) * -px(2)})`}>
                  <rect x={bx} y={by} width={px(2.6)} height={px(2.0)} fill="#8a7a55" stroke="#2a2416" strokeWidth={2} />
                  {[0.5, 1.0, 1.5].map((g) => <line key={g} x1={bx} y1={by + px(g)} x2={bx + px(2.6)} y2={by + px(g)} stroke="rgba(0,0,0,0.3)" strokeWidth={1.5} />)}
                  {[0.65, 1.3, 1.95].map((g) => <line key={g} x1={bx + px(g)} y1={by} x2={bx + px(g)} y2={by + px(2.0)} stroke="rgba(0,0,0,0.3)" strokeWidth={1.5} />)}
                </g>
              );
            }),
          )
        : null}
      {/* water tanks */}
      {tanks > 0.01
        ? [-1, 1].map((sd) =>
            [0, 1].map((i) => {
              const k = clamp(tanks * 2 - i * 0.6);
              const x = sd * (11.4 + i * 0.0) - 1.0;
              const [tx, ty] = P(v, x + (i ? sd * -0.0 : 0), 2.6 + i * 2.7);
              return (
                <g key={`${sd}${i}`} opacity={k}>
                  <rect x={tx} y={ty} width={px(2.0)} height={px(2.6)} rx={px(0.12)} fill="rgba(60,140,220,0.5)" stroke="#8fc0ff" strokeWidth={2.5} />
                  <path d={`M ${tx + 4} ${ty + px(0.5)} q ${px(0.5)} ${-px(0.14)} ${px(1.0)} 0 t ${px(1.0) - 8} 0`} fill="none" stroke="#cfe6ff" strokeWidth={2} opacity={0.8} />
                </g>
              );
            }),
          )
        : null}

      {/* the mound */}
      <polygon points={pts(v, [[-14, 0], ...moundPts, [14, 0]])} fill={EARTH} stroke="#4c6b45" strokeWidth={3} strokeLinejoin="round" />
      {Array.from({length: 46}, (_, i) => {
        const x = -12 + rnd(i * 2.3) * 24;
        const y = rnd(i * 5.9) * Math.max(0.2, mound(x) - 0.4);
        const [dx, dy] = P(v, x, y);
        return Math.hypot(x, y) > M.r + M.wall + 0.3 || cut < 0.5 ? <circle key={i} cx={dx} cy={dy} r={px(0.07)} fill="#2e3a27" /> : null;
      })}

      {Array.from({length: 60}, (_, i) => {
        const x = -13.4 + (i / 59) * 26.8 + (rnd(i * 4.1) - 0.5) * 0.3;
        const [tx, ty] = P(v, x, mound(x));
        const h = px(0.22 + rnd(i * 7.9) * 0.2);
        return <line key={`g${i}`} x1={tx} y1={ty} x2={tx + (rnd(i * 2.2) - 0.5) * h * 0.8} y2={ty - h} stroke="#5d8254" strokeWidth={Math.max(1.5, px(0.035))} strokeLinecap="round" />;
      })}

      {/* the cutaway: concrete arch, floor, barrels */}
      <g opacity={clamp(cut)}>
        <polygon points={pts(v, [...arch(M.r + M.wall), [-(M.r + M.wall), -M.floor], [M.r + M.wall, -M.floor]])} fill={CONCRETE} stroke="#aab4c4" strokeWidth={2.5} />
        <polygon points={pts(v, [...arch(M.r), [-M.r, 0], [M.r, 0]])} fill="#0a1019" />
        <rect x={P(v, -(M.r + M.wall), 0)[0]} y={gy} width={px(2 * (M.r + M.wall))} height={px(M.floor)} fill="#59636f" />
        {/* a second row behind, in shadow */}
        {xs.map((x) => (
          <Drum key={`b${x}`} v={v} x={x + 0.34} y={0.16} scale={0.9} color="#1d3454" dim={0.25} />
        ))}
        {xs.map((x) => (
          <React.Fragment key={x}>
            <rect x={P(v, x - 0.36, 0.1)[0]} y={P(v, 0, 0.1)[1]} width={px(0.72)} height={px(0.1)} fill="#4a3a26" />
            <Drum v={v} x={x} y={0.1} crust={crust} />
          </React.Fragment>
        ))}
        {flash > 0 ? <polygon points={pts(v, [...arch(M.r), [-M.r, 0], [M.r, 0]])} fill="#fff6d8" opacity={flash} /> : null}
      </g>

      {/* foam laid over the top */}
      {foam > 0.01
        ? Array.from({length: 26}, (_, i) => {
            const x = -8.6 + (i / 25) * 17.2;
            const k = clamp(foam * 1.6 - Math.abs(x) / 16);
            const [fx, fy] = P(v, x, mound(x) + 0.12);
            return <circle key={i} cx={fx} cy={fy} r={px(0.42 + rnd(i * 3.1) * 0.22) * k} fill="#eef3f8" opacity={0.92 * k} />;
          })
        : null}
      {/* gel blocks beside the structure */}
      {gel > 0.01
        ? [-1, 1].map((sd) =>
            [0, 1, 2].map((i) => {
              const [bx, by] = P(v, sd * (8.4 + i * 0.75) - 0.32, 0.72);
              return <rect key={`${sd}${i}`} x={bx} y={by} width={px(0.64)} height={px(0.72)} rx={px(0.08)} fill="rgba(120,230,170,0.75)" stroke="#bff5d7" strokeWidth={2} opacity={clamp(gel * 3 - i)} />;
            }),
          )
        : null}
      {/* misters */}
      {mist > 0.01
        ? [-9.6, -5.2, 5.2, 9.6].map((x, i) => {
            const top = mound(x) + 3.4;
            const [mx, my] = P(v, x, top);
            const [bx, by] = P(v, x, mound(x));
            return (
              <g key={x} opacity={mist}>
                <line x1={bx} y1={by} x2={mx} y2={my} stroke="#aab4c4" strokeWidth={3} />
                {Array.from({length: 14}, (_, j) => {
                  const k = (rnd(j * 2.3 + i) + time * (0.5 + rnd(j * 4.1) * 0.4)) % 1;
                  const sx = mx + (rnd(j * 6.7 + i) - 0.5) * px(3.4) * k;
                  const sy = my + k * px(3.2);
                  return <circle key={j} cx={sx} cy={sy} r={px(0.06)} fill="#bfe3ff" opacity={(1 - k) * 0.9} />;
                })}
              </g>
            );
          })
        : null}

      {/* the cloud: dust, with lead in it */}
      {cloud > 0
        ? Array.from({length: 70}, (_, i) => {
            const born = rnd(i * 1.9) * 0.55;
            const life = clamp((cloud - born) / (1 - born));
            if (life <= 0) return null;
            const rise = Math.pow(life, 0.62) * (9 + rnd(i * 3.3) * 16);
            const drift = wind * Math.pow(life, 1.4) * (6 + rnd(i * 7.1) * 20) + (rnd(i * 5.3) - 0.5) * (3 + life * 9) + noise(time * 0.35 + i, i) * 0.6;
            const [cx, cy] = P(v, drift, M.moundH * 0.7 + rise);
            const lead = i % 4 === 0;
            const r = px(lead ? 0.5 + life * 0.9 : 1.2 + life * 3.0 + rnd(i * 9.1) * 1.2);
            return <circle key={i} cx={cx} cy={cy} r={r} fill={lead ? C.cyan : '#8f8a80'} opacity={(lead ? 0.75 : 0.32) * Math.min(1, life * 5) * lerp(1, 0.45, life)} />;
          })
        : null}
      {flash > 0 ? <rect x={0} y={0} width={1920} height={1080} fill="#fff6d8" opacity={flash * 0.5} /> : null}
    </g>
  );
};
