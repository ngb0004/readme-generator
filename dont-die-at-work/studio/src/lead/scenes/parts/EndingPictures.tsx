import React from 'react';
import {C} from '../../../engine/theme';
import {E, clamp, lerp, ramp, rnd, spring} from '../../../engine/time';
import {BarrelCut} from '../../draw/Barrel';
import {Drum, EARTH, M, mound} from '../../draw/Bunker';
import {P, View} from '../../draw/view';
import {H, W} from '../../kit';

// Pictures for the ending. No words in any of them: the captions carry the lines.

/** end-4. A coin goes up, comes down, and lies there. Luck. */
export const Coin: React.FC<{t: number; toss: number; land: number; cx: number; y: number; r?: number; dull?: number}> = ({t, toss, land, cx, y, r = 96, dull = 0}) => {
  if (t < toss) return null;
  const u = clamp((t - toss) / (land - toss));
  const air = t < land;
  const bounce = air ? 0 : Math.exp(-(t - land) * 7) * Math.abs(Math.sin((t - land) * 13)) * 52;
  const lift = air ? 4 * 350 * u * (1 - u) : bounce;
  const turn = air ? Math.cos(u * Math.PI * 7) : -1;
  const rx = r * Math.max(0.07, Math.abs(turn));
  const back = turn > 0;
  const face = dull > 0 ? `rgb(${Math.round(lerp(255, 122, dull))},${Math.round(lerp(194, 104, dull))},${Math.round(lerp(26, 52, dull))})` : C.yellow;
  return (
    <g opacity={Math.min(1, (t - toss) / 0.15)}>
      <ellipse cx={cx} cy={y + r + 18} rx={r * (1 - 0.45 * clamp(lift / 350))} ry={12} fill="#000" opacity={0.55 * (1 - 0.6 * clamp(lift / 350))} />
      <ellipse cx={cx} cy={y - lift} rx={rx} ry={r} fill={back ? '#c99400' : face} stroke="#8a6500" strokeWidth={8} />
      <ellipse cx={cx} cy={y - lift} rx={rx * 0.72} ry={r * 0.72} fill="none" stroke="#8a6500" strokeWidth={4} opacity={0.8} />
      {!air ? <ellipse cx={cx - r * 0.3} cy={y - lift - r * 0.34} rx={r * 0.22} ry={r * 0.12} fill="#fff" opacity={0.22 * (1 - dull)} transform={`rotate(-32 ${cx - r * 0.3} ${y - lift - r * 0.34})`} /> : null}
    </g>
  );
};

const LINE = '#9fb3d1';
const FILL = '#132038';
const GROUND = '#3c5a3a';
type Picto = {x: number; y: number; k: number; a: number};
const frame = (p: Picto) => `translate(${p.x} ${p.y}) scale(${p.k})`;

/** end-5. Somebody's farm. Local coordinates: the origin is the middle of the ground line. */
export const Barn: React.FC<Picto> = (p) => (
  <g transform={frame(p)} opacity={clamp(p.a)} stroke={LINE} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" fill={FILL}>
    <line x1={-200} y1={0} x2={200} y2={0} stroke={GROUND} strokeWidth={4} />
    <rect x={-150} y={-140} width={200} height={140} />
    <polygon points="-166,-140 -134,-200 -50,-244 34,-200 66,-140" />
    <rect x={-84} y={-88} width={68} height={88} fill="#0b1422" />
    <path d="M -84 -88 L -16 0 M -16 -88 L -84 0" fill="none" strokeWidth={3} />
    <rect x={88} y={-214} width={66} height={214} />
    <path d="M 88 -214 A 33 28 0 0 1 154 -214 Z" />
    {[-160, -108, -56].map((yy) => (
      <line key={yy} x1={88} y1={yy} x2={154} y2={yy} strokeWidth={3} />
    ))}
  </g>
);
export const BARN_TOP = {x: -50, y: -258};

/** end-5. Somebody's playground. */
export const Swings: React.FC<Picto & {t: number}> = (p) => {
  const seat = (sx: number, sway: number) => {
    const len = 152;
    const ex = sx + Math.sin(sway) * len;
    const ey = -216 + Math.cos(sway) * len;
    return (
      <g key={sx}>
        <line x1={sx - 20} y1={-216} x2={ex - 20} y2={ey} stroke="#c9d2de" strokeWidth={3} />
        <line x1={sx + 20} y1={-216} x2={ex + 20} y2={ey} stroke="#c9d2de" strokeWidth={3} />
        <rect x={ex - 33} y={ey - 5} width={66} height={12} rx={5} fill={C.yellow} stroke="none" />
      </g>
    );
  };
  return (
    <g transform={frame(p)} opacity={clamp(p.a)} stroke={LINE} strokeWidth={10} strokeLinecap="round" fill="none">
      <line x1={-200} y1={0} x2={200} y2={0} stroke={GROUND} strokeWidth={4} />
      <line x1={-152} y1={0} x2={-106} y2={-218} />
      <line x1={-60} y1={0} x2={-106} y2={-218} />
      <line x1={152} y1={0} x2={106} y2={-218} />
      <line x1={60} y1={0} x2={106} y2={-218} />
      <line x1={-118} y1={-218} x2={118} y2={-218} strokeWidth={13} />
      {seat(-42, 0)}
      {seat(42, Math.sin(p.t * 1.6) * 0.07)}
    </g>
  );
};
export const SWING_SEAT = {x: -42, y: -80};

/** end-5. Somebody's kid: a small figure with one hand held out. Faceless, still. */
export const Kid: React.FC<Picto> = (p) => (
  <g transform={frame(p)} opacity={clamp(p.a)}>
    <line x1={-200} y1={0} x2={200} y2={0} stroke={GROUND} strokeWidth={4} strokeLinecap="round" />
    <g fill="#dfe7f3" stroke="#dfe7f3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx={0} cy={-198} r={35} stroke="none" />
      <path d="M -30 -152 Q 0 -162 30 -152 L 25 -80 Q 0 -72 -25 -80 Z" strokeWidth={6} />
      <line x1={-13} y1={-78} x2={-16} y2={-13} strokeWidth={22} />
      <line x1={13} y1={-78} x2={16} y2={-13} strokeWidth={22} />
      <line x1={-29} y1={-144} x2={-45} y2={-90} strokeWidth={17} />
      <line x1={29} y1={-144} x2={80} y2={-130} strokeWidth={17} />
      <circle cx={90} cy={-130} r={12} stroke="none" />
    </g>
  </g>
);
export const KID_HAND = {x: 90, y: -146};

/** One speck of lead dust settling at (x, y), touching down at `land`. Lead is cyan. */
export const Speck: React.FC<{t: number; land: number; x: number; y: number; from?: number}> = ({t, land, x, y, from = 130}) => {
  const fall = 2.5;
  const u = clamp((t - (land - fall)) / fall);
  if (u <= 0) return null;
  const sx = x + Math.sin(u * 5 + x) * 30 * (1 - u);
  const sy = lerp(from, y, E.inOutQuad(u));
  const down = t >= land;
  const ring = down ? clamp((t - land) / 0.8) : 1;
  return (
    <g>
      {down && ring < 1 ? <circle cx={x} cy={y} r={12 + ring * 54} fill="none" stroke={C.cyan} strokeWidth={3} opacity={(1 - ring) * 0.85} /> : null}
      <circle cx={sx} cy={sy} r={24} fill={C.cyan} opacity={0.17 + (down ? 0.07 * Math.sin((t - land) * 4) : 0)} />
      <circle cx={sx} cy={sy} r={10} fill={C.cyan} />
    </g>
  );
};

/**
 * end-6 and end-7. Earth-covered magazines in a row, as far as the frame goes: "every weapons
 * storage site it has". `scan` is the world x the review has reached; `hot(i)` is a red pulse
 * on mound i. With `only="hot"` just the pulses are drawn (to lay them over a veil).
 */
export const MoundRow: React.FC<{v: View; t: number; n: number; gap: number; scan?: number; hot?: (i: number) => number; only?: 'hot'}> = ({v, t, n, gap, scan, hot, only}) => {
  const gy = P(v, 0, 0)[1];
  const outline = (cx: number) => {
    const pts: string[] = [P(v, cx - 14, 0).join(',')];
    for (let x = -14; x <= 14.001; x += 0.5) pts.push(P(v, cx + x, mound(x)).join(','));
    pts.push(P(v, cx + 14, 0).join(','));
    return pts.join(' ');
  };
  const onScreen = (cx: number) => {
    const sx = P(v, cx, 0)[0];
    return sx > -15 * v.s && sx < W + 15 * v.s;
  };
  if (only === 'hot') {
    return (
      <g>
        {Array.from({length: n}, (_, i) => {
          const h = hot ? hot(i) : 0;
          return h > 0.001 && onScreen(i * gap) ? <polygon key={i} points={outline(i * gap)} fill={C.red} stroke={C.red} strokeWidth={4} strokeLinejoin="round" opacity={0.75 * h} /> : null;
        })}
      </g>
    );
  }
  const bar = scan === undefined ? null : P(v, scan, 0)[0];
  return (
    <g>
      {Array.from({length: 70}, (_, i) => (
        <circle key={i} cx={rnd(i * 1.7) * W} cy={rnd(i * 4.3) * Math.max(160, gy - 50)} r={0.8 + rnd(i * 7.7) * 1.4} fill="#9fb8e6" opacity={0.2 + 0.3 * rnd(i * 2.9)} />
      ))}
      <rect x={0} y={gy} width={W} height={Math.max(0, H - gy) + 10} fill="#0c120d" />
      <line x1={0} y1={gy} x2={W} y2={gy} stroke="#3c5a3a" strokeWidth={3} />
      {Array.from({length: n}, (_, i) => {
        const cx = i * gap;
        if (!onScreen(cx)) return null;
        const pass = scan === undefined ? 0 : clamp((scan - (cx - 14)) / 28);
        const seen = scan !== undefined && scan > cx + 14;
        const arch = Array.from({length: 21}, (_, j) => P(v, cx + Math.cos((Math.PI * j) / 20) * (M.r + M.wall), Math.sin((Math.PI * j) / 20) * (M.r + M.wall)).join(',')).join(' ');
        const [tx, ty] = P(v, cx, mound(0));
        return (
          <g key={i}>
            <polygon points={outline(cx)} fill={EARTH} stroke={pass > 0 && pass < 1 ? C.yellow : '#4c6b45'} strokeWidth={pass > 0 && pass < 1 ? 5 : 3} strokeLinejoin="round" />
            {/* what is under it */}
            <polyline points={arch} fill="none" stroke="#6b7686" strokeWidth={Math.max(1.5, v.s * 0.12)} opacity={0.8} />
            {seen ? <circle cx={tx} cy={ty - 22} r={9} fill={C.yellow} opacity={clamp((scan! - cx - 14) / 6)} /> : null}
          </g>
        );
      })}
      {bar !== null && bar > -40 && bar < W + 40 ? (
        <g>
          <rect x={bar - 90} y={gy - 16 * v.s} width={90} height={16 * v.s} fill={C.yellow} opacity={0.09} />
          <line x1={bar} y1={gy} x2={bar} y2={gy - 16 * v.s} stroke={C.yellow} strokeWidth={4} opacity={0.9} />
        </g>
      ) : null}
    </g>
  );
};

/**
 * end-8. The three instructions from 1984, as three pictures, each landing on its words:
 * the bath kept over the powder; someone looking at the level; a steel drum rusting through.
 */
export const Instructions: React.FC<{t: number; wet: number; check: number; drums: number}> = ({t, wet, check, drums}) => {
  const tiles = [
    {x: 96, at: wet},
    {x: 700, at: check},
    {x: 1304, at: drums},
  ];
  const TY = 318;
  const TW = 520;
  const TH = 462;
  const S = 400;
  const w = 0.62 * S;
  const h = 0.92 * S;
  return (
    <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
      {tiles.map((tile, i) => {
        if (t < tile.at) return null;
        const k = Math.min(1.06, spring(t - tile.at, 3, 0.62));
        const cx = tile.x + TW / 2;
        const by = TY + TH - 34;
        const top = by - h;
        const wall = w * 0.045;
        const innerY = top + wall * 1.4;
        const innerH = h - wall * 2.4;
        const powderTop = innerY + innerH * 0.7;
        const bath = (level: number) => lerp(powderTop + innerH * 0.3 * 0.55, innerY + innerH * 0.16, level);
        const mx = cx + 46 + Math.sin(t * 1.3) * 10;
        const my = bath(0.86) + 4 + Math.cos(t * 1.1) * 5;
        return (
          <g key={i} opacity={Math.min(1, k * 2.5)} transform={`translate(${cx} ${by}) scale(${0.9 + 0.1 * Math.min(1, k)}) translate(${-cx} ${-by})`}>
            <rect x={tile.x} y={TY} width={TW} height={TH} fill="rgba(6,10,18,0.94)" stroke="rgba(141,177,230,0.26)" strokeWidth={1.5} />
            <rect x={tile.x} y={TY + TH - 8} width={TW * clamp((t - tile.at) / 0.35)} height={8} fill={i === 2 ? C.red : C.yellow} />
            {i === 0 ? (
              <>
                <BarrelCut x={cx} y={by} s={S} time={t} level={1} />
                {/* the depth of bath over the powder */}
                <g stroke={C.yellow} strokeWidth={5} strokeLinecap="round" opacity={clamp((t - tile.at - 0.25) / 0.3)}>
                  <line x1={cx + w / 2 + 34} y1={bath(1)} x2={cx + w / 2 + 34} y2={powderTop} />
                  <line x1={cx + w / 2 + 18} y1={bath(1)} x2={cx + w / 2 + 50} y2={bath(1)} />
                  <line x1={cx + w / 2 + 18} y1={powderTop} x2={cx + w / 2 + 50} y2={powderTop} />
                </g>
              </>
            ) : null}
            {i === 1 ? (
              <>
                <BarrelCut x={cx} y={by} s={S} time={t} level={0.86} />
                {/* someone looking at the level */}
                <g opacity={clamp((t - tile.at - 0.2) / 0.3)}>
                  <line x1={mx + 46} y1={my + 46} x2={mx + 104} y2={my + 104} stroke={C.yellow} strokeWidth={15} strokeLinecap="round" />
                  <circle cx={mx} cy={my} r={64} fill="rgba(255,194,26,0.09)" stroke={C.yellow} strokeWidth={9} />
                  <path d={`M ${mx - 40} ${my - 22} A 46 46 0 0 1 ${mx - 6} ${my - 45}`} fill="none" stroke="#fff" strokeWidth={5} strokeLinecap="round" opacity={0.5} />
                </g>
              </>
            ) : null}
            {i === 2 ? <BarrelCut x={cx} y={by} s={S} time={t} level={0.72} steel rust={ramp(t, tile.at + 0.1, tile.at + 1.2, E.out)} /> : null}
          </g>
        );
      })}
    </svg>
  );
};

/** end-9. All sixty-eight of them, crystals on the lids. Seventeen across, four deep. */
export const DrumGrid: React.FC<{t: number; start: number}> = ({t, start}) => {
  const s = 132 * (1 + 0.035 * clamp((t - start) / 9));
  return (
    <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
      <defs>
        <radialGradient id="endingHeat" cx="50%" cy="48%" r="60%">
          <stop offset="0%" stopColor={C.red} stopOpacity={0.2} />
          <stop offset="100%" stopColor={C.red} stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill="url(#endingHeat)" opacity={0.6 + 0.3 * Math.sin((t - start) * 2.2)} />
      {Array.from({length: 4}, (_, r) => {
        const v: View = {cx: W / 2, cy: 314 + r * 162, s};
        return (
          <g key={r}>
            <line x1={90} y1={v.cy} x2={W - 90} y2={v.cy} stroke="#22324c" strokeWidth={3} />
            {Array.from({length: 17}, (_, i) => (
              <Drum key={i} v={v} x={(i - 8) * 0.76} y={0} crust={1} />
            ))}
          </g>
        );
      })}
    </svg>
  );
};
