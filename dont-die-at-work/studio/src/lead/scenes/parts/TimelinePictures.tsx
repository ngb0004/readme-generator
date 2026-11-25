import React from 'react';
import {C, FONT} from '../../../engine/theme';
import {clamp, lerp, rnd} from '../../../engine/time';
import {BARREL, BARREL_DARK} from '../../draw/Bunker';
import {PAPER, W} from '../../kit';

// Small drawings for the timeline's stops. All of them are SVG fragments that go inside the
// scene's one full-frame <svg>; none of them carries a word or a number.

export const STEEL = {body: '#6d7684', band: '#444c58', lid: '#535b68'};
export const PLASTIC = {body: BARREL, band: BARREL_DARK, lid: '#1c2f4a'};

/** A storage drum standing on a line at `base`. `ghost` draws the outline of one that is gone. */
export const Drum: React.FC<{x: number; base: number; h: number; look?: typeof STEEL; a?: number; ghost?: boolean; dull?: number}> = ({x, base, h, look = STEEL, a = 1, ghost, dull = 0}) => {
  if (a <= 0.001) return null;
  const w = h * 0.66;
  const y = base - h;
  if (ghost) return <rect x={x - w / 2} y={y} width={w} height={h} rx={w * 0.16} fill="rgba(91,118,159,0.07)" stroke="#5b769f" strokeWidth={2.5} strokeDasharray="10 9" opacity={a * 0.85} />;
  return (
    <g opacity={a}>
      <rect x={x - w / 2} y={y} width={w} height={h} rx={w * 0.16} fill={look.body} stroke="#0a1220" strokeWidth={2.5} />
      {[0.3, 0.66].map((k) => (
        <rect key={k} x={x - w / 2} y={y + h * k} width={w} height={h * 0.05} fill={look.band} />
      ))}
      <rect x={x - w * 0.47} y={y - h * 0.045} width={w * 0.94} height={h * 0.09} rx={h * 0.03} fill={look.lid} stroke="#0a1220" strokeWidth={1.5} />
      <rect x={x - w * 0.36} y={y + h * 0.1} width={w * 0.1} height={h * 0.74} rx={w * 0.05} fill="rgba(255,255,255,0.18)" />
      {dull > 0.01 ? <rect x={x - w / 2} y={y} width={w} height={h} rx={w * 0.16} fill="#05080f" opacity={0.42 * dull} /> : null}
    </g>
  );
};

/** A sheet of paper with ruled lines for text. `children` are drawn on the sheet, in its own coordinates. */
export const Page: React.FC<{x: number; y: number; w: number; h: number; tilt?: number; a?: number; drop?: number; children?: React.ReactNode}> = ({x, y, w, h, tilt = 0, a = 1, drop = 0, children}) => {
  if (a <= 0.001) return null;
  const rows = Math.max(1, Math.floor((h - 96) / 34));
  return (
    <g transform={`translate(${x} ${y + drop}) rotate(${tilt})`} opacity={a}>
      <rect x={10} y={16} width={w} height={h} fill="rgba(0,0,0,0.5)" />
      <rect width={w} height={h} rx={3} fill={PAPER} />
      <rect x={w * 0.1} y={30} width={w * 0.46} height={14} fill="#1b1d22" />
      {Array.from({length: rows}, (_, i) => (
        <rect key={i} x={w * 0.1} y={72 + i * 34} width={w * (0.46 + 0.34 * rnd(i * 3.3 + w))} height={10} rx={2} fill="#cfc8b2" />
      ))}
      {children}
    </g>
  );
};

/** A tick. (x, y) is its centre; `s` is its half-width. */
export const Tick: React.FC<{x: number; y: number; s: number; color?: string; w?: number}> = ({x, y, s, color = C.yellow, w = 5}) => (
  <path d={`M ${x - s} ${y} L ${x - s * 0.25} ${y + s * 0.72} L ${x + s} ${y - s * 0.78}`} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
);

/** A drop of liquid. (x, y) is its centre; `s` is its half-height. */
export const Drop: React.FC<{x: number; y: number; s: number; color?: string; a?: number}> = ({x, y, s, color = '#57b4ff', a = 1}) => (
  <g opacity={a}>
    <path d={`M ${x} ${y - s} C ${x + s * 0.95} ${y - s * 0.05} ${x + s * 0.78} ${y + s} ${x} ${y + s} C ${x - s * 0.78} ${y + s} ${x - s * 0.95} ${y - s * 0.05} ${x} ${y - s} Z`} fill={color} stroke="#04060a" strokeWidth={2.5} />
    <path d={`M ${x - s * 0.3} ${y + s * 0.2} q ${s * 0.02} ${s * 0.4} ${s * 0.32} ${s * 0.48}`} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={3} strokeLinecap="round" />
  </g>
);

/** An artillery shell from the side, pointing right. `dead` greys it and strikes it out. */
export const Shell: React.FC<{x: number; y: number; len: number; a?: number; dead?: number}> = ({x, y, len, a = 1, dead = 0}) => {
  if (a <= 0.001) return null;
  const r = len * 0.135;
  const mix = (live: [number, number, number], off: [number, number, number]) => `rgb(${live.map((v, i) => Math.round(lerp(v, off[i], dead))).join(',')})`;
  const body = `M 0 ${-r} L ${len * 0.58} ${-r} Q ${len * 0.86} ${-r * 0.92} ${len} 0 Q ${len * 0.86} ${r * 0.92} ${len * 0.58} ${r} L 0 ${r} Z`;
  return (
    <g transform={`translate(${x} ${y})`} opacity={a}>
      <path d={body} fill={mix([154, 168, 189], [44, 52, 64])} stroke="#0a1220" strokeWidth={4} strokeLinejoin="round" />
      <path d={`M ${len * 0.83} ${-r * 0.55} Q ${len * 0.93} ${-r * 0.3} ${len} 0 Q ${len * 0.93} ${r * 0.3} ${len * 0.83} ${r * 0.55} Z`} fill={mix([255, 194, 26], [70, 76, 86])} stroke="#0a1220" strokeWidth={3} />
      <rect x={len * 0.09} y={-r} width={len * 0.04} height={r * 2} fill={mix([201, 139, 58], [58, 64, 74])} />
      <rect x={len * 0.02} y={-r * 0.62} width={len * 0.5} height={r * 0.2} rx={r * 0.1} fill="rgba(255,255,255,0.22)" />
      {dead > 0.01 ? <line x1={len * 0.06} y1={r * 2.1} x2={lerp(len * 0.06, len * 0.96, clamp(dead * 1.4))} y2={lerp(r * 2.1, -r * 2.1, clamp(dead * 1.4))} stroke={C.red} strokeWidth={13} strokeLinecap="round" /> : null}
    </g>
  );
};

/** The mound of an earth-covered bunker, as a small icon. (x, base) is the middle of its foot. */
const Mound: React.FC<{x: number; base: number; w: number}> = ({x, base, w}) => (
  <g>
    <path d={`M ${x - w / 2} ${base} C ${x - w * 0.3} ${base} ${x - w * 0.22} ${base - w * 0.34} ${x} ${base - w * 0.34} C ${x + w * 0.22} ${base - w * 0.34} ${x + w * 0.3} ${base} ${x + w / 2} ${base} Z`} fill="#1c2418" stroke="#4c6b45" strokeWidth={3} />
    <path d={`M ${x - w * 0.15} ${base} a ${w * 0.15} ${w * 0.15} 0 0 1 ${w * 0.3} 0 Z`} fill="#6b7686" stroke="#aab4c4" strokeWidth={2} />
    <line x1={x - w * 0.62} y1={base} x2={x + w * 0.62} y2={base} stroke="#3c5a3a" strokeWidth={3} />
  </g>
);

/** The option that was dropped: the bunker, and no cloud over it. */
export const NoBlast: React.FC<{x: number; base: number; w: number; a?: number; cut?: number}> = ({x, base, w, a = 1, cut = 0}) => {
  if (a <= 0.001) return null;
  const cy = base - w * 0.72;
  return (
    <g opacity={a * (1 - 0.6 * cut)}>
      <Mound x={x} base={base} w={w} />
      {[[-0.16, 0.04, 0.15], [0.03, -0.07, 0.19], [0.2, 0.05, 0.14]].map(([dx, dy, r], i) => (
        <circle key={i} cx={x + dx * w} cy={cy + dy * w} r={r * w} fill="none" stroke="#8b96a8" strokeWidth={3} strokeDasharray="9 9" />
      ))}
      <line x1={x - w * 0.36} y1={cy + w * 0.24} x2={x + w * 0.38} y2={cy - w * 0.26} stroke={C.white} strokeWidth={9} strokeLinecap="round" />
    </g>
  );
};

/** The option that was chosen: the bunker under a rising cloud, with lead in it (cyan). */
export const Blast: React.FC<{x: number; base: number; w: number; time: number; a?: number}> = ({x, base, w, time, a = 1}) => {
  if (a <= 0.001) return null;
  return (
    <g opacity={a}>
      {Array.from({length: 22}, (_, i) => {
        const life = (rnd(i * 2.7) + time * (0.1 + rnd(i * 5.1) * 0.08)) % 1;
        const lead = i % 4 === 0;
        const cx = x + (rnd(i * 3.9) - 0.5) * w * (0.22 + life * 0.7) + life * w * 0.16;
        const cy = base - w * 0.3 - Math.pow(life, 0.7) * w * 0.86;
        return <circle key={i} cx={cx} cy={cy} r={(lead ? 0.035 : 0.07 + life * 0.13) * w} fill={lead ? C.cyan : '#8f8a80'} opacity={(lead ? 0.9 : 0.42) * Math.min(1, life * 6) * (1 - life * 0.55)} />;
      })}
      <Mound x={x} base={base} w={w} />
    </g>
  );
};

/**
 * An open house: rows of people from behind, facing a display board. On the board the bunker
 * and its cloud are drawn; the space beside them, where the reach of the dust would go, is
 * empty. `gap` (0..1) picks that empty space out in red.
 */
export const Hall: React.FC<{x: number; base: number; time: number; a?: number; gap?: number}> = ({x, base, time, a = 1, gap = 0}) => {
  if (a <= 0.001) return null;
  const bw = 560;
  const bh = 300;
  const by = base - 478;
  const rows = [
    {n: 7, y: base - 150, r: 23, fill: '#1c2c47', dx: 78},
    {n: 7, y: base - 92, r: 27, fill: '#24385a', dx: 86},
    {n: 6, y: base - 28, r: 31, fill: '#2d456e', dx: 100},
  ];
  return (
    <g opacity={a}>
      {/* the board */}
      {[0.22, 0.78].map((k) => (
        <line key={k} x1={x + bw * k} y1={by + bh} x2={x + bw * (k + (k < 0.5 ? -0.04 : 0.04))} y2={base - 120} stroke="#51607a" strokeWidth={8} strokeLinecap="round" />
      ))}
      <rect x={x} y={by} width={bw} height={bh} rx={6} fill="#0b1626" stroke="#8fa3c2" strokeWidth={4} />
      <Mound x={x + bw * 0.27} base={by + bh - 54} w={bw * 0.34} />
      {[[-0.05, 0, 0.055], [0.01, -0.045, 0.07], [0.075, 0.0, 0.05]].map(([dx, dy, r], i) => (
        <circle key={i} cx={x + bw * (0.27 + dx)} cy={by + bh * 0.3 + dy * bw} r={r * bw} fill="#8f8a80" opacity={0.75} />
      ))}
      <line x1={x + bw * 0.4} y1={by + bh * 0.3} x2={x + bw * 0.5} y2={by + bh * 0.3} stroke="#8fa3c2" strokeWidth={4} strokeDasharray="8 8" />
      <rect x={x + bw * 0.53} y={by + 34} width={bw * 0.41} height={bh - 68} rx={4} fill={`rgba(255,59,47,${0.1 * gap})`} stroke={gap > 0.01 ? C.red : '#51607a'} strokeWidth={gap > 0.01 ? 5 : 3} strokeDasharray="14 11" strokeDashoffset={-time * 18} opacity={0.6 + 0.4 * gap} />
      {/* the room */}
      {rows.map((row, ri) =>
        Array.from({length: row.n}, (_, i) => {
          const cx = x + bw / 2 + (i - (row.n - 1) / 2) * row.dx + (ri % 2 ? row.dx * 0.5 : 0) + Math.sin(time * 0.7 + i * 1.9 + ri) * 2.5;
          return (
            <g key={`${ri}-${i}`}>
              <path d={`M ${cx - row.r * 1.5} ${row.y + row.r * 3.4} L ${cx - row.r * 1.5} ${row.y + row.r * 1.7} Q ${cx - row.r * 1.5} ${row.y + row.r * 0.95} ${cx - row.r * 0.6} ${row.y + row.r * 0.95} L ${cx + row.r * 0.6} ${row.y + row.r * 0.95} Q ${cx + row.r * 1.5} ${row.y + row.r * 0.95} ${cx + row.r * 1.5} ${row.y + row.r * 1.7} L ${cx + row.r * 1.5} ${row.y + row.r * 3.4} Z`} fill={row.fill} stroke="#070c14" strokeWidth={2.5} />
              <circle cx={cx} cy={row.y} r={row.r} fill={row.fill} stroke="#070c14" strokeWidth={2.5} />
            </g>
          );
        }),
      )}
    </g>
  );
};

/** A permit: a sheet with a round stamp on it. `stamp` 0..1 brings the stamp down. */
export const Permit: React.FC<{x: number; y: number; a?: number; stamp?: number; tilt?: number}> = ({x, y, a = 1, stamp = 0, tilt = 3}) => (
  <Page x={x} y={y} w={290} h={370} tilt={tilt} a={a}>
    {stamp > 0.01 ? (
      <g transform={`translate(196 268) rotate(-14) scale(${1 + 1.3 * Math.pow(1 - clamp(stamp), 3)})`} opacity={Math.min(1, stamp * 3)}>
        <circle r={62} fill="rgba(255,59,47,0.1)" stroke={C.red} strokeWidth={9} />
        <circle r={46} fill="none" stroke={C.red} strokeWidth={3} />
        <Tick x={0} y={2} s={26} color={C.red} w={11} />
      </g>
    ) : null}
  </Page>
);

/** A judge's gavel, for the lawsuit. (x, y) is the centre. */
export const Gavel: React.FC<{x: number; y: number; s: number; a?: number; hit?: number}> = ({x, y, s, a = 1, hit = 0}) => {
  if (a <= 0.001) return null;
  return (
    <g opacity={a}>
      <rect x={x - s * 0.62} y={y + s * 0.5} width={s * 1.0} height={s * 0.2} rx={s * 0.06} fill="#8fa3c2" stroke="#04060a" strokeWidth={2.5} />
      <g transform={`translate(${x + s * 0.5} ${y + s * 0.42}) rotate(${-38 + 26 * hit})`}>
        <rect x={-s * 1.05} y={-s * 0.07} width={s * 1.05} height={s * 0.14} rx={s * 0.05} fill="#c9d2de" stroke="#04060a" strokeWidth={2.5} />
        <rect x={-s * 1.22} y={-s * 0.3} width={s * 0.36} height={s * 0.6} rx={s * 0.08} fill={C.white} stroke="#04060a" strokeWidth={2.5} />
      </g>
    </g>
  );
};

/** A post on a phone screen, for the President's message. (x, y) is the centre. */
export const Post: React.FC<{x: number; y: number; s: number; a?: number}> = ({x, y, s, a = 1}) => {
  if (a <= 0.001) return null;
  return (
    <g opacity={a}>
      <rect x={x - s * 0.44} y={y - s * 0.78} width={s * 0.88} height={s * 1.56} rx={s * 0.13} fill="#0b1626" stroke={C.white} strokeWidth={4} />
      <circle cx={x - s * 0.2} cy={y - s * 0.42} r={s * 0.11} fill="#8fa3c2" />
      {[-0.44, -0.12, 0.08, 0.28].map((dy, i) => (
        <rect key={i} x={x + (i === 0 ? -s * 0.03 : -s * 0.3)} y={y + dy * s - s * 0.035} width={s * (i === 0 ? 0.34 : i === 3 ? 0.38 : 0.6)} height={s * 0.07} rx={s * 0.03} fill={i === 0 ? '#8fa3c2' : C.white} />
      ))}
    </g>
  );
};

/** A price tag on a string. (x, y) is where the string is tied. */
export const PriceTag: React.FC<{x: number; y: number; s: number; time: number; a?: number}> = ({x, y, s, time, a = 1}) => {
  if (a <= 0.001) return null;
  const sway = Math.sin(time * 1.6) * 5;
  return (
    <g opacity={a} transform={`translate(${x} ${y}) rotate(${sway})`}>
      <line x1={0} y1={0} x2={0} y2={s * 0.5} stroke="#c9d2de" strokeWidth={3} />
      <path d={`M 0 ${s * 0.42} L ${s * 0.5} ${s * 0.78} L ${s * 0.5} ${s * 1.78} L ${-s * 0.5} ${s * 1.78} L ${-s * 0.5} ${s * 0.78} Z`} fill={C.yellow} stroke="#04060a" strokeWidth={3} strokeLinejoin="round" />
      <circle cx={0} cy={s * 0.72} r={s * 0.075} fill="#04060a" />
      <text x={0} y={s * 1.56} textAnchor="middle" fontFamily={FONT.display} fontSize={s * 0.72} fill="#04060a">?</text>
    </g>
  );
};

/** A framed window onto something else (a map), clipped to its box. */
export const Inset: React.FC<{id: string; x: number; y: number; w: number; h: number; a: number; children: React.ReactNode}> = ({id, x, y, w, h, a, children}) => {
  if (a <= 0.001 || x > W + 40 || x + w < -40) return null;
  return (
    <g opacity={a}>
      <defs>
        <clipPath id={id}>
          <rect x={x} y={y} width={w} height={h} rx={10} />
        </clipPath>
      </defs>
      <rect x={x + 10} y={y + 14} width={w} height={h} rx={10} fill="rgba(0,0,0,0.5)" />
      <rect x={x} y={y} width={w} height={h} rx={10} fill="#060b14" />
      <g clipPath={`url(#${id})`}>{children}</g>
      <rect x={x} y={y} width={w} height={h} rx={10} fill="none" stroke="#8fa3c2" strokeWidth={3} />
    </g>
  );
};
