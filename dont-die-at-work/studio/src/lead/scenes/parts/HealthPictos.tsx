import React from 'react';
import {C, FONT} from '../../../engine/theme';
import {E, clamp, lerp, ramp, rnd} from '../../../engine/time';
import {PAPER, fadeIn, pop} from '../../kit';

// Pictograms for the health scene (and the jar, which the farm scene borrows). Flat, faceless,
// safety-sign shapes. Nothing here carries a fact: every word and number stays in script.json.

export type Pt = [number, number];
export const GLASS = '#16243b';
export const GLASS_LINE = '#93a8c9';
export const LEAD_OLD = '#3f7f92';

/* -------------------------------------------------------------------------------------------
 * A quote set anywhere in the frame (the kit's QuoteCard is always centred and full-screen).
 * `hiFrom` is an index into the quote: everything after it gets a marker line at `hiAt`.
 * ----------------------------------------------------------------------------------------- */
export const QuoteBlock: React.FC<{
  t: number; at: number; quote: string; by: string; x: number; y: number; w: number; size?: number; bySize?: number; accent?: string; a?: number; dim?: number; hiFrom?: number; hiAt?: number;
}> = ({t, at, quote, by, x, y, w, size = 60, bySize = 28, accent = C.yellow, a = 1, dim = 0, hiFrom, hiAt}) => {
  const k = pop(t, at, 2.6, 0.8);
  const vis = clamp(a) * (t >= at ? Math.min(1, k * 2.2) : 0);
  if (vis <= 0.001) return null;
  const byA = fadeIn(t, at + 0.45, 0.4);
  const hi = hiAt === undefined ? 0 : ramp(t, hiAt, hiAt + 0.9, E.inOutQuad);
  const cut = hiFrom === undefined || hiFrom < 0 ? quote.length : hiFrom;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: vis}}>
      {dim > 0 ? <div style={{position: 'absolute', inset: 0, background: `rgba(3,5,9,${dim})`}} /> : null}
      <div style={{position: 'absolute', left: x, top: y + (1 - Math.min(1, k)) * 26, width: w, display: 'flex', gap: Math.round(size * 0.44)}}>
        <div style={{width: 12, background: accent, flex: 'none'}} />
        <div>
          <div style={{fontFamily: FONT.label, fontWeight: 600, fontSize: size, lineHeight: 1.14, color: C.white, letterSpacing: '0.005em', textShadow: '0 3px 14px rgba(0,0,0,0.85)'}}>
            {quote.slice(0, cut)}
            {cut < quote.length ? (
              <span style={{backgroundImage: 'linear-gradient(rgba(255,194,26,0.42), rgba(255,194,26,0.42))', backgroundRepeat: 'no-repeat', backgroundSize: `${hi * 100}% 100%`, boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone'}}>{quote.slice(cut)}</span>
            ) : null}
          </div>
          <div style={{marginTop: Math.round(size * 0.44), fontFamily: FONT.mono, fontWeight: 700, fontSize: bySize, letterSpacing: '0.16em', color: accent, opacity: byA, textShadow: '0 2px 10px rgba(0,0,0,0.85)'}}>{by}</div>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------------------------
 * A standing figure seen from the front, drawn as glass so what is inside can be shown.
 * (x, y) is the ground between the feet, h the height in pixels. Hands can be sent somewhere
 * (pixels, same space as x and y); the elbow follows.
 * ----------------------------------------------------------------------------------------- */
const BODY = {
  adult: {head: 0.068, headY: 0.915, top: 0.815, bot: 0.45, half: 0.118, rx: 0.06, shX: 0.166, shY: 0.778, arm: 0.066, upper: 0.175, fore: 0.17, hipX: 0.062, footX: 0.072, leg: 0.09},
  child: {head: 0.122, headY: 0.858, top: 0.705, bot: 0.37, half: 0.132, rx: 0.08, shX: 0.188, shY: 0.668, arm: 0.078, upper: 0.15, fore: 0.14, hipX: 0.07, footX: 0.082, leg: 0.108},
};
export type Kind = keyof typeof BODY;

export const body = (kind: Kind, x: number, y: number, h: number, handL?: Pt, handR?: Pt) => {
  const p = BODY[kind];
  const X = (u: number) => x + u * h;
  const Y = (u: number) => y - u * h;
  const arm = (sd: -1 | 1, target?: Pt) => {
    const S: Pt = [X(sd * p.shX), Y(p.shY)];
    const want: Pt = target ?? [X(sd * (p.shX + 0.03)), Y(p.shY - (p.upper + p.fore) * 0.985)];
    const l1 = p.upper * h;
    const l2 = p.fore * h;
    const dx = want[0] - S[0];
    const dy = want[1] - S[1];
    const d0 = Math.hypot(dx, dy) || 1;
    const d = clamp(d0, Math.abs(l1 - l2) + 0.5, l1 + l2 - 0.5);
    const ux = dx / d0;
    const uy = dy / d0;
    const along = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
    const off = Math.sqrt(Math.max(0, l1 * l1 - along * along));
    // two places the elbow could be: take the one that points away from the body, then down
    const cand: Pt[] = [[-uy, ux], [uy, -ux]];
    const n = cand[0][0] * sd + cand[0][1] * 0.3 >= cand[1][0] * sd + cand[1][1] * 0.3 ? cand[0] : cand[1];
    const el: Pt = [S[0] + ux * along + n[0] * off, S[1] + uy * along + n[1] * off];
    const hand: Pt = [S[0] + ux * d, S[1] + uy * d];
    return {S, el, hand};
  };
  return {
    p, X, Y,
    head: [X(0), Y(p.headY)] as Pt,
    headR: p.head * h,
    torso: {x: X(-p.half), y: Y(p.top), w: 2 * p.half * h, h: (p.top - p.bot) * h, rx: p.rx * h},
    arms: [arm(-1, handL), arm(1, handR)],
    legs: ([-1, 1] as const).map((sd) => ({a: [X(sd * p.hipX), Y(p.bot + 0.03)] as Pt, b: [X(sd * p.footX), Y(p.leg / 2)] as Pt})),
    armW: p.arm * h,
    legW: p.leg * h,
  };
};

/** What is lit inside the figure, each 0..1. */
export type Organs = {brain?: number; nerves?: number; kidneys?: number; heart?: number; vessels?: number};

export const Person: React.FC<{
  x: number; y: number; h: number; kind?: Kind; a?: number; fill?: string; line?: string; handL?: Pt; handR?: Pt; organs?: Organs; anatomy?: boolean;
}> = ({x, y, h, kind = 'adult', a = 1, fill = GLASS, line = GLASS_LINE, handL, handR, organs = {}, anatomy = false}) => {
  if (a <= 0.004) return null;
  const g = body(kind, x, y, h, handL, handR);
  const o = Math.max(2.5, h * 0.0075) * 2;
  const trunk = (extra: number, col: string) => (
    <g>
      {g.legs.map((l, i) => (
        <line key={i} x1={l.a[0]} y1={l.a[1]} x2={l.b[0]} y2={l.b[1]} stroke={col} strokeWidth={g.legW + extra} strokeLinecap="round" />
      ))}
      <rect x={g.torso.x - extra / 2} y={g.torso.y - extra / 2} width={g.torso.w + extra} height={g.torso.h + extra} rx={g.torso.rx + extra / 2} fill={col} />
      <circle cx={g.head[0]} cy={g.head[1]} r={g.headR + extra / 2} fill={col} />
    </g>
  );
  const arms = (extra: number, col: string) =>
    g.arms.map((m, i) => <polyline key={i} points={`${m.S.join(',')} ${m.el.join(',')} ${m.hand.join(',')}`} fill="none" stroke={col} strokeWidth={g.armW + extra} strokeLinecap="round" strokeLinejoin="round" />);

  const {X, Y, p} = g;
  const {brain = 0, nerves = 0, kidneys = 0, heart = 0, vessels = 0} = organs;
  const glow = (k: number): React.CSSProperties => (k > 0.02 ? {filter: `drop-shadow(0 0 ${h * 0.018}px rgba(255,59,47,${0.85 * k}))`} : {});
  const faint = '#3a4f77';
  const thin = Math.max(2, h * 0.006);
  const child = kind === 'child';
  const bx = X(0);
  const by = Y(p.headY + (child ? 0.01 : 0.006));
  const brx = h * (child ? 0.085 : 0.047);
  const bry = h * (child ? 0.07 : 0.04);
  const hs = h * 0.031;
  const hx = X(0.03);
  const hy = Y(0.705);
  const heartPath = `M ${hx} ${hy + hs * 0.95} C ${hx - hs * 1.7} ${hy - hs * 0.15} ${hx - hs * 0.85} ${hy - hs * 1.35} ${hx} ${hy - hs * 0.5} C ${hx + hs * 0.85} ${hy - hs * 1.35} ${hx + hs * 1.7} ${hy - hs * 0.15} ${hx} ${hy + hs * 0.95} Z`;
  const kid = (sd: number, fillCol: string, strokeCol: string, sw: number) => (
    <ellipse cx={X(sd * 0.05)} cy={Y(0.562)} rx={h * 0.021} ry={h * 0.035} transform={`rotate(${sd * -14} ${X(sd * 0.05)} ${Y(0.562)})`} fill={fillCol} stroke={strokeCol} strokeWidth={sw} />
  );
  const limbLine = (pts: Pt[]) => pts.map((q) => q.join(',')).join(' ');
  const nervePaths: Pt[][] = child
    ? []
    : [
        [[X(0), Y(p.headY - 0.045)], [X(0), Y(0.47)]],
        ...g.arms.map((m): Pt[] => [[X(0), Y(p.shY - 0.004)], m.S, m.el, m.hand]),
        ...g.legs.map((l): Pt[] => [[X(0), Y(0.47)], l.a, l.b]),
      ];
  const v = h * 0.014;
  const vesselPaths: Pt[][] = child
    ? []
    : [
        [[hx, hy], [X(0.016), Y(0.79)], [X(0.016), Y(p.headY - 0.03)]],
        [[hx, hy], [X(0.016), Y(0.5)]],
        ...g.arms.map((m, i): Pt[] => [[X(0.016), Y(0.752)], [m.S[0], m.S[1] + v * 1.2], [m.el[0] + (i ? -v : v), m.el[1]], [m.hand[0] + (i ? -v : v), m.hand[1]]]),
        ...g.legs.map((l, i): Pt[] => [[X(0.016), Y(0.5)], [l.a[0] + (i ? -v : v), l.a[1]], [l.b[0] + (i ? -v : v), l.b[1]]]),
      ];
  return (
    <g opacity={a}>
      {trunk(o, line)}
      {trunk(0, fill)}
      {arms(o, line)}
      {arms(0, fill)}
      {anatomy ? (
        <g fill="none" stroke={faint} strokeWidth={thin}>
          <ellipse cx={bx} cy={by} rx={brx} ry={bry} />
          {child ? null : <path d={heartPath} />}
          {child ? null : kid(-1, 'none', faint, thin)}
          {child ? null : kid(1, 'none', faint, thin)}
        </g>
      ) : null}
      {nerves > 0.01 ? (
        <g opacity={nerves} style={glow(nerves)} fill="none" stroke={C.red} strokeWidth={Math.max(2, h * 0.0065)} strokeLinecap="round" strokeLinejoin="round">
          {nervePaths.map((pts, i) => (
            <polyline key={i} points={limbLine(pts)} />
          ))}
        </g>
      ) : null}
      {vessels > 0.01 ? (
        <g opacity={vessels} style={glow(vessels)} fill="none" stroke="#ff5a3c" strokeWidth={Math.max(3, h * 0.011)} strokeLinecap="round" strokeLinejoin="round">
          {vesselPaths.map((pts, i) => (
            <polyline key={i} points={limbLine(pts)} />
          ))}
        </g>
      ) : null}
      {brain > 0.01 ? (
        <g opacity={brain} style={glow(brain)}>
          <ellipse cx={bx} cy={by} rx={brx} ry={bry} fill={C.red} />
          <g fill="none" stroke="#7d1711" strokeWidth={Math.max(1.5, thin * 0.8)} strokeLinecap="round">
            <path d={`M ${bx} ${by - bry * 0.92} q ${brx * 0.16} ${bry * 0.9} 0 ${bry * 1.84}`} />
            <path d={`M ${bx - brx * 0.72} ${by - bry * 0.2} q ${brx * 0.3} ${-bry * 0.5} ${brx * 0.5} ${bry * 0.1}`} />
            <path d={`M ${bx + brx * 0.22} ${by + bry * 0.2} q ${brx * 0.3} ${-bry * 0.5} ${brx * 0.5} ${bry * 0.1}`} />
          </g>
        </g>
      ) : null}
      {kidneys > 0.01 ? (
        <g opacity={kidneys} style={glow(kidneys)}>
          {kid(-1, C.red, 'none', 0)}
          {kid(1, C.red, 'none', 0)}
        </g>
      ) : null}
      {heart > 0.01 ? (
        <g opacity={heart} style={glow(heart)}>
          <path d={heartPath} fill={C.red} />
        </g>
      ) : null}
    </g>
  );
};

/** One speck of lead dust. */
export const Speck: React.FC<{x: number; y: number; r?: number; a?: number; color?: string}> = ({x, y, r = 5, a = 1, color = C.cyan}) => (a <= 0.01 ? null : <circle cx={x} cy={y} r={r} fill={color} opacity={a} />);

/* -------------------------------------------------------------------------------------------
 * Ground in cross-section: grass on top, soil underneath. Pixels; `y` is the surface.
 * ----------------------------------------------------------------------------------------- */
export const Soil: React.FC<{x0: number; x1: number; y: number; depth: number; seed?: number; grass?: boolean}> = ({x0, x1, y, depth, seed = 0, grass = true}) => {
  const w = x1 - x0;
  const tufts = Math.round(w / 24);
  const stones = Math.round((w * Math.min(depth, 500)) / 11000);
  const strata = (k: number, key: number) => {
    const yy = y + depth * k;
    const n = Math.max(2, Math.round(w / 260));
    let d = `M ${x0} ${yy}`;
    for (let i = 1; i <= n; i++) d += ` q ${w / n / 2} ${(rnd(seed + key * 7.1 + i * 3.3) - 0.5) * 26} ${w / n} ${(rnd(seed + key * 2.9 + i * 5.1) - 0.5) * 10}`;
    return <path key={key} d={d} fill="none" stroke="#2b2015" strokeWidth={3} />;
  };
  return (
    <g>
      <rect x={x0} y={y} width={w} height={depth} fill="#1a140e" />
      <rect x={x0} y={y} width={w} height={22} fill="#241b12" />
      {[0.22, 0.45, 0.72].map(strata)}
      {Array.from({length: stones}, (_, i) => (
        <ellipse key={i} cx={x0 + rnd(seed + i * 2.3) * w} cy={y + 30 + rnd(seed + i * 5.9) * (Math.min(depth, 500) - 40)} rx={5 + rnd(seed + i * 7.7) * 10} ry={3 + rnd(seed + i * 4.1) * 5} fill="#2e2418" />
      ))}
      <line x1={x0} y1={y} x2={x1} y2={y} stroke="#3c5a3a" strokeWidth={4} />
      {grass
        ? Array.from({length: tufts}, (_, i) => {
            const gx = x0 + ((i + rnd(seed + i * 4.1)) / tufts) * w;
            const len = 7 + rnd(seed + i * 7.9) * 9;
            return <line key={`t${i}`} x1={gx} y1={y} x2={gx + (rnd(seed + i * 2.2) - 0.5) * len * 0.9} y2={y - len} stroke="#5d8254" strokeWidth={2.5} strokeLinecap="round" />;
          })
        : null}
    </g>
  );
};

/* -------------------------------------------------------------------------------------------
 * A playground slide in side view. Ground at y = 0, pixels, +x to the right.
 * `chute(u)` is the point u of the way down the sliding surface (0 top, 1 the end of the run-out).
 * ----------------------------------------------------------------------------------------- */
const CH: Pt[] = [[-170, -296], [-40, -292], [70, -44], [190, -22]];
const RUN: Pt = [286, -18];
export const chute = (u: number): Pt => {
  const k = clamp(u);
  if (k > 0.82) {
    const q = (k - 0.82) / 0.18;
    return [lerp(CH[3][0], RUN[0], q), lerp(CH[3][1], RUN[1], q)];
  }
  const s = k / 0.82;
  const m = 1 - s;
  return [0, 1].map((i) => m * m * m * CH[0][i] + 3 * m * m * s * CH[1][i] + 3 * m * s * s * CH[2][i] + s * s * s * CH[3][i]) as Pt;
};
export const Slide: React.FC<{wet?: number}> = ({wet = 0}) => {
  const frame = '#8fa3c2';
  const pathTo = (u1: number) => 'M ' + Array.from({length: 25}, (_, i) => chute((u1 * i) / 24).join(',')).join(' L ');
  return (
    <g strokeLinecap="round" strokeLinejoin="round" fill="none">
      {/* ladder */}
      <line x1={-336} y1={0} x2={-262} y2={-306} stroke={frame} strokeWidth={12} />
      <line x1={-292} y1={0} x2={-222} y2={-306} stroke={frame} strokeWidth={12} />
      {[0.16, 0.34, 0.52, 0.7, 0.88].map((k) => (
        <line key={k} x1={lerp(-336, -262, k)} y1={-306 * k} x2={lerp(-292, -222, k)} y2={-306 * k} stroke="#aab8d2" strokeWidth={8} />
      ))}
      {/* platform, its posts and guard rail */}
      <line x1={-270} y1={-306} x2={-160} y2={-306} stroke="#aab8d2" strokeWidth={16} />
      <line x1={-180} y1={-300} x2={-180} y2={0} stroke={frame} strokeWidth={12} />
      <line x1={-262} y1={-306} x2={-262} y2={-392} stroke={frame} strokeWidth={10} />
      <line x1={-172} y1={-306} x2={-172} y2={-392} stroke={frame} strokeWidth={10} />
      <line x1={-266} y1={-392} x2={-168} y2={-392} stroke="#aab8d2" strokeWidth={10} />
      {/* the leg under the end of the chute */}
      <line x1={196} y1={-16} x2={196} y2={0} stroke={frame} strokeWidth={12} />
      {/* the chute */}
      <path d={pathTo(1)} stroke="#04060a" strokeWidth={30} />
      <path d={pathTo(1)} stroke={C.yellow} strokeWidth={22} />
      {wet > 0.01 ? <path d={pathTo(wet)} stroke="#9fd4ff" strokeWidth={10} opacity={0.75} /> : null}
    </g>
  );
};

/* -------------------------------------------------------------------------------------------
 * A sample jar with a tag that has no result on it yet. (x, y) is the middle of its base.
 * ----------------------------------------------------------------------------------------- */
export const Jar: React.FC<{x: number; y: number; k?: number; fill?: 'soil' | 'water' | 'wipe' | 'hay'; a?: number; tag?: number; time?: number; seed?: number}> = ({x, y, k = 1, fill = 'soil', a = 1, tag = 0, time = 0, seed = 0}) => {
  if (a <= 0.004) return null;
  const w = 104 * k;
  const h = 142 * k;
  const left = x - w / 2;
  const top = y - h;
  const id = `jar${Math.round(x)}_${Math.round(y)}_${seed}`;
  const level = top + h * 0.46;
  const swing = Math.sin(time * 1.3 + seed) * 2.5 * tag;
  const tw = 78 * k;
  const th = 50 * k;
  return (
    <g opacity={a}>
      <defs>
        <clipPath id={id}>
          <rect x={left + 4 * k} y={top + 4 * k} width={w - 8 * k} height={h - 8 * k} rx={14 * k} />
        </clipPath>
      </defs>
      <rect x={left} y={top} width={w} height={h} rx={16 * k} fill="rgba(140,180,235,0.10)" stroke="#aac4e6" strokeWidth={4 * k} />
      <g clipPath={`url(#${id})`}>
        {fill === 'soil' ? (
          <>
            <rect x={left} y={level} width={w} height={h} fill="#4a3524" />
            {Array.from({length: 14}, (_, i) => (
              <circle key={i} cx={left + rnd(seed + i * 2.7) * w} cy={level + 8 * k + rnd(seed + i * 5.3) * h * 0.46} r={(2 + rnd(seed + i * 8.1) * 3) * k} fill="#2e2015" />
            ))}
          </>
        ) : null}
        {fill === 'water' ? <rect x={left} y={level - 10 * k} width={w} height={h} fill="rgba(70,150,230,0.5)" /> : null}
        {fill === 'water' ? <line x1={left} y1={level - 10 * k} x2={left + w} y2={level - 10 * k} stroke="#bfe0ff" strokeWidth={3 * k} /> : null}
        {fill === 'hay'
          ? Array.from({length: 26}, (_, i) => {
              const sx = left + rnd(seed + i * 3.1) * w;
              const sy = level + rnd(seed + i * 6.7) * h * 0.5;
              const ang = rnd(seed + i * 9.9) * Math.PI;
              return <line key={i} x1={sx} y1={sy} x2={sx + Math.cos(ang) * 22 * k} y2={sy + Math.sin(ang) * 10 * k} stroke={i % 3 ? '#a58d4f' : '#7d6a36'} strokeWidth={3 * k} strokeLinecap="round" />;
            })
          : null}
        {fill === 'wipe' ? <path d={`M ${left + w * 0.16} ${top + h * 0.9} L ${left + w * 0.3} ${top + h * 0.42} L ${left + w * 0.62} ${top + h * 0.56} L ${left + w * 0.86} ${top + h * 0.38} L ${left + w * 0.8} ${top + h * 0.92} Z`} fill="#e8edf4" stroke="#9aa6b8" strokeWidth={2 * k} /> : null}
      </g>
      <rect x={left + w * 0.14} y={top + h * 0.1} width={w * 0.1} height={h * 0.62} rx={w * 0.05} fill="rgba(255,255,255,0.16)" />
      <rect x={left - 3 * k} y={top - 20 * k} width={w + 6 * k} height={24 * k} rx={6 * k} fill="#8b96a8" stroke="#0a1220" strokeWidth={2.5 * k} />
      {tag > 0.01 ? (
        <g opacity={clamp(tag * 2)} transform={`rotate(${swing + (1 - clamp(tag)) * -24} ${left + w} ${top + 6 * k})`}>
          <line x1={left + w} y1={top + 6 * k} x2={left + w + 26 * k} y2={top + 52 * k} stroke="#c9d2de" strokeWidth={2.5 * k} />
          <g transform={`rotate(8 ${left + w + 26 * k} ${top + 52 * k})`}>
            <rect x={left + w + 26 * k - tw * 0.18} y={top + 52 * k} width={tw} height={th} rx={5 * k} fill={PAPER} stroke="#0a1220" strokeWidth={2} />
            <circle cx={left + w + 26 * k - tw * 0.18 + 10 * k} cy={top + 52 * k + 10 * k} r={3.2 * k} fill="#0a1220" />
            {/* where a result would be written: nothing yet */}
            <rect x={left + w + 26 * k - tw * 0.18 + 12 * k} y={top + 52 * k + 22 * k} width={tw - 24 * k} height={th - 32 * k} rx={3 * k} fill="none" stroke="#8a8676" strokeWidth={2.4 * k} strokeDasharray={`${7 * k} ${6 * k}`} strokeDashoffset={-time * 9} />
          </g>
        </g>
      ) : null}
    </g>
  );
};
