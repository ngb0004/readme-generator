import React from 'react';
import {C, FONT} from '../../../engine/theme';
import {E, clamp, lerp, ramp, rnd} from '../../../engine/time';
import {INK, PAPER} from '../../kit';

// Pictograms for the farm scene: a farm in flat cross-section, and the paperwork. Pixels, with
// the ground at y = 0 and +x to the right, unless a component says otherwise. Flat, faceless,
// safety-sign shapes; nothing here carries a fact.

const TRIM = '#d9d2c4';
const STEEL = '#8b96a8';

/* ---------------------------------------------------------------- cattle */
/** One head of cattle in side view. `x` is the ground under the middle of the body. */
export const Cow: React.FC<{x: number; y?: number; k?: number; flip?: boolean; graze?: number; step?: number; time?: number; color?: string; shade?: string; a?: number; seed?: number}> = ({
  x, y = 0, k = 1, flip = false, graze = 0, step = 0, time = 0, color = '#d3dae6', shade = '#8894a8', a = 1, seed = 0,
}) => {
  if (a <= 0.004) return null;
  const sw = Math.sin(step * Math.PI * 2) * 15;
  const bob = -Math.abs(Math.sin(step * Math.PI * 2)) * 3;
  const leg = (lx: number, col: string, d: number) => <line x1={lx} y1={-66} x2={lx + d} y2={-8} stroke={col} strokeWidth={16} strokeLinecap="round" />;
  const g = clamp(graze);
  const hp: [number, number] = [lerp(108, 112, g), lerp(-138, -60, g)];
  const ang = lerp(12, 66, g);
  const tail = Math.sin(time * 1.5 + seed * 2.3) * 7;
  return (
    <g transform={`translate(${x} ${y + bob * k}) scale(${flip ? -k : k} ${k})`} opacity={a}>
      {leg(-44, shade, -sw)}
      {leg(42, shade, sw)}
      <g transform={`rotate(${tail} -74 -122)`}>
        <path d="M -74 -122 q -24 16 -17 64" fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" />
        <circle cx={-91} cy={-56} r={7} fill={shade} />
      </g>
      <line x1={50} y1={-108} x2={hp[0] - 8} y2={hp[1] + 4} stroke={color} strokeWidth={42} strokeLinecap="round" />
      <rect x={-78} y={-134} width={152} height={78} rx={30} fill={color} />
      <ellipse cx={-22} cy={-108} rx={30} ry={17} fill={shade} />
      <ellipse cx={36} cy={-84} rx={17} ry={12} fill={shade} />
      {leg(-60, color, sw)}
      {leg(58, color, -sw)}
      <g transform={`translate(${hp[0]} ${hp[1]}) rotate(${ang})`}>
        <ellipse cx={-4} cy={-19} rx={13} ry={6.5} fill={shade} transform="rotate(-28 -4 -19)" />
        <rect x={-14} y={-18} width={62} height={36} rx={14} fill={color} />
        <rect x={30} y={-16} width={19} height={32} rx={10} fill={shade} />
      </g>
    </g>
  );
};

/* ---------------------------------------------------------------- buildings */
export const BARN = {w: 360, wall: 220, doorX0: 110, doorX1: 250, doorH: 172};
const FACADE = `0,0 0,-220 44,-306 180,-384 316,-306 360,-220 360,0`;
/** The barn without its doors: wall, roof and the dark doorway. `x` is its left edge. */
export const BarnBody: React.FC<{x: number; lit?: number}> = ({x, lit = 0.5}) => (
  <g transform={`translate(${x} 0)`}>
    <polygon points={FACADE} fill="#54302a" stroke="#1d0f0c" strokeWidth={3} strokeLinejoin="round" />
    {Array.from({length: 11}, (_, i) => (
      <line key={i} x1={30 + i * 30} y1={-2} x2={30 + i * 30} y2={-216} stroke="#44251f" strokeWidth={2} />
    ))}
    <line x1={0} y1={-220} x2={360} y2={-220} stroke="#3a1f1b" strokeWidth={4} />
    <polyline points="-16,-212 40,-314 180,-398 320,-314 376,-212" fill="none" stroke="#2a3442" strokeWidth={17} strokeLinejoin="round" strokeLinecap="round" />
    <polyline points="-16,-218 40,-320 180,-404 320,-320 376,-218" fill="none" stroke="#5d6b82" strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" />
    <g stroke={TRIM} strokeWidth={3} strokeLinejoin="round">
      <rect x={152} y={-332} width={56} height={56} fill="#3a1f1b" />
      <path d="M 152 -332 L 208 -276 M 208 -332 L 152 -276" fill="none" />
    </g>
    <rect x={BARN.doorX0} y={-BARN.doorH} width={BARN.doorX1 - BARN.doorX0} height={BARN.doorH} fill="#07090d" />
    <rect x={BARN.doorX0} y={-BARN.doorH} width={BARN.doorX1 - BARN.doorX0} height={BARN.doorH} fill={C.warm} opacity={0.14 * lit} />
    <rect x={BARN.doorX0} y={-BARN.doorH} width={BARN.doorX1 - BARN.doorX0} height={BARN.doorH} fill="none" stroke={TRIM} strokeWidth={4} />
  </g>
);
/** The sliding doors. `shut` runs 0 (open) to 1. Draw after whatever walks in. */
export const BarnDoors: React.FC<{x: number; shut?: number}> = ({x, shut = 0}) => {
  const k = clamp(shut);
  const panel = (px: number, key: string) => (
    <g key={key} transform={`translate(${px} 0)`} stroke={TRIM} strokeWidth={3} strokeLinejoin="round">
      <rect x={0} y={-BARN.doorH} width={70} height={BARN.doorH} fill="#6a3b33" />
      <path d={`M 0 ${-BARN.doorH} L 70 ${-BARN.doorH / 2} L 0 0 M 70 ${-BARN.doorH} L 0 ${-BARN.doorH / 2} L 70 0`} fill="none" />
    </g>
  );
  return (
    <g transform={`translate(${x} 0)`}>
      <line x1={30} y1={-BARN.doorH - 5} x2={330} y2={-BARN.doorH - 5} stroke="#2a3442" strokeWidth={7} strokeLinecap="round" />
      {panel(lerp(BARN.doorX0 - 70, BARN.doorX0, k), 'l')}
      {panel(lerp(BARN.doorX1, BARN.doorX1 - 70, k), 'r')}
    </g>
  );
};

export const Silo: React.FC<{x: number; h?: number}> = ({x, h = 350}) => (
  <g transform={`translate(${x} 0)`}>
    <rect x={0} y={-h} width={86} height={h} fill="#59636f" stroke="#aab4c4" strokeWidth={3} />
    {Array.from({length: Math.floor(h / 50)}, (_, i) => (
      <line key={i} x1={0} y1={-(i + 1) * 50} x2={86} y2={-(i + 1) * 50} stroke="#434c58" strokeWidth={3} />
    ))}
    <path d={`M -3 ${-h} a 46 38 0 0 1 92 0 Z`} fill="#7d8898" stroke="#aab4c4" strokeWidth={3} strokeLinejoin="round" />
    <line x1={70} y1={0} x2={70} y2={-h} stroke="#343c47" strokeWidth={3} />
    <rect x={10} y={-h * 0.92} width={10} height={h * 0.86} rx={5} fill="rgba(255,255,255,0.14)" />
  </g>
);

export const Windmill: React.FC<{x: number; h?: number; time: number}> = ({x, h = 470, time}) => {
  const top = -h + 44;
  const rot = time * 70;
  return (
    <g transform={`translate(${x} 0)`} strokeLinecap="round">
      <g stroke="#66738a" strokeWidth={5} fill="none">
        <line x1={-40} y1={0} x2={-6} y2={top} />
        <line x1={40} y1={0} x2={6} y2={top} />
        {[0, 1, 2, 3].map((i) => {
          const y0 = lerp(0, top, i / 4);
          const y1 = lerp(0, top, (i + 1) / 4);
          const w0 = lerp(40, 6, i / 4);
          const w1 = lerp(40, 6, (i + 1) / 4);
          return <path key={i} d={`M ${-w0} ${y0} L ${w1} ${y1} M ${w0} ${y0} L ${-w1} ${y1} M ${-w1} ${y1} L ${w1} ${y1}`} strokeWidth={3} />;
        })}
        <line x1={0} y1={top} x2={0} y2={-h} />
      </g>
      <polygon points={`8,${-h} 96,${-h - 20} 96,${-h + 20}`} fill={STEEL} />
      <g transform={`rotate(${rot} 0 ${-h})`}>
        {Array.from({length: 12}, (_, i) => (
          <polygon key={i} points={`-4,${-h - 16} 4,${-h - 16} 12,${-h - 68} -12,${-h - 68}`} fill="#aab4c4" opacity={0.92} transform={`rotate(${i * 30} 0 ${-h})`} />
        ))}
      </g>
      <circle cx={0} cy={-h} r={9} fill="#d9d2c4" stroke="#0a1220" strokeWidth={2} />
    </g>
  );
};

export const Tree: React.FC<{x: number; k?: number}> = ({x, k = 1}) => (
  <g transform={`translate(${x} 0) scale(${k})`}>
    <rect x={-9} y={-96} width={18} height={96} fill="#2a2018" />
    {[[-38, -108, 34], [38, -108, 36], [0, -150, 54], [0, -112, 44]].map(([cx, cy, r], i) => (
      <circle key={i} cx={cx} cy={cy} r={r} fill="#1b2a1a" stroke={i < 3 ? '#3c5a3a' : 'none'} strokeWidth={3} />
    ))}
    <circle cx={0} cy={-126} r={46} fill="#1b2a1a" />
  </g>
);

/* ---------------------------------------------------------------- the yard */
export const Fence: React.FC<{x0: number; x1: number; gap?: number}> = ({x0, x1, gap = 90}) => (
  <g>
    <line x1={x0} y1={-54} x2={x1} y2={-54} stroke="#75654a" strokeWidth={7} />
    <line x1={x0} y1={-28} x2={x1} y2={-28} stroke="#75654a" strokeWidth={7} />
    {Array.from({length: Math.round((x1 - x0) / gap) + 1}, (_, i) => (
      <rect key={i} x={x0 + i * gap - 6} y={-72} width={12} height={72} rx={2} fill="#8c7a5c" stroke="#2c2418" strokeWidth={1.5} />
    ))}
  </g>
);

export const Bale: React.FC<{x: number; y?: number; r?: number; k?: number; a?: number}> = ({x, y = 0, r = 44, k = 1, a = 1}) =>
  a <= 0.004 ? null : (
    <g transform={`translate(${x} ${y}) scale(${k})`} opacity={a}>
      <circle cx={0} cy={-r} r={r} fill="#a58d4f" stroke="#3d3218" strokeWidth={3} />
      {[0.72, 0.46, 0.2].map((q) => (
        <path key={q} d={`M ${-r * q} ${-r} a ${r * q} ${r * q} 0 1 1 ${r * q} ${r * q}`} fill="none" stroke="#6f5d30" strokeWidth={3} strokeLinecap="round" />
      ))}
    </g>
  );

export const Sacks: React.FC<{x: number; y?: number; k?: number; a?: number}> = ({x, y = 0, k = 1, a = 1}) =>
  a <= 0.004 ? null : (
    <g transform={`translate(${x} ${y}) scale(${k})`} opacity={a} stroke="#4a463c" strokeWidth={2.5}>
      <rect x={-44} y={-34} width={84} height={34} rx={12} fill="#b9b2a0" />
      <rect x={-36} y={-66} width={80} height={34} rx={12} fill="#c8c1ae" />
      <line x1={-22} y1={-17} x2={18} y2={-17} strokeDasharray="5 5" />
      <line x1={-14} y1={-49} x2={24} y2={-49} strokeDasharray="5 5" />
    </g>
  );

/** A stock tank: an open trough of water. `x` is its left edge. */
export const Tank: React.FC<{x: number; w?: number}> = ({x, w = 140}) => (
  <g transform={`translate(${x} 0)`}>
    <rect x={0} y={-52} width={w} height={52} rx={20} fill="#4a5565" stroke="#aab4c4" strokeWidth={3} />
    <rect x={8} y={-48} width={w - 16} height={12} rx={6} fill="#3f9be6" opacity={0.85} />
    {[0.3, 0.62].map((q) => (
      <line key={q} x1={w * q} y1={-34} x2={w * q} y2={-4} stroke="#343c47" strokeWidth={3} />
    ))}
  </g>
);

/** A tarp thrown over whatever sits between x0 and x1. `peaks` are [x, height] of what is under it. */
export const Tarp: React.FC<{x0: number; x1: number; peaks: [number, number][]; drop: number}> = ({x0, x1, peaks, drop}) => {
  const k = clamp(drop);
  if (k <= 0.004) return null;
  const pts: [number, number][] = [[x0 - 16, 0], [x0 + 4, -peaks[0][1] * 0.72], ...peaks.map(([px, ph]): [number, number] => [px, -ph - 8]), [x1 - 4, -peaks[peaks.length - 1][1] * 0.72], [x1 + 16, 0]];
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1];
    const [bx, by] = pts[i];
    d += ` C ${lerp(ax, bx, 0.5)} ${ay} ${lerp(ax, bx, 0.5)} ${by} ${bx} ${by}`;
  }
  const settle = 1 + 0.06 * Math.sin(Math.min(1, k) * Math.PI);
  return (
    <g transform={`translate(0 ${(1 - Math.min(1, k)) * -330}) scale(1 ${settle})`} opacity={Math.min(1, k * 3)}>
      <path d={`${d} Z`} fill="#2e68ad" stroke="#9cc6ff" strokeWidth={3} strokeLinejoin="round" />
      {pts.slice(1, -1).map(([px, py], i) => (
        <path key={i} d={`M ${px} ${py + 6} q ${(i % 2 ? 1 : -1) * 14} ${-py * 0.5} ${(i % 2 ? -1 : 1) * 6} ${-py - 8}`} fill="none" stroke="#1d4a80" strokeWidth={3} strokeLinecap="round" />
      ))}
      {[x0 - 16, x1 + 16].map((px, i) => (
        <g key={px}>
          <line x1={px} y1={-3} x2={px + (i ? 22 : -22)} y2={0} stroke="#c9d2de" strokeWidth={2.5} />
          <circle cx={px + (i ? -8 : 8)} cy={-8} r={3.5} fill="#c9d2de" />
        </g>
      ))}
    </g>
  );
};

export const Pond: React.FC<{x0: number; x1: number; time: number; ring?: number}> = ({x0, x1, time, ring = 0}) => {
  const w = x1 - x0;
  const mid = (x0 + x1) / 2;
  return (
    <g>
      <path d={`M ${x0} 0 Q ${mid} 120 ${x1} 0 Z`} fill="#102f4d" />
      <line x1={x0} y1={0} x2={x1} y2={0} stroke="#3f9be6" strokeWidth={5} strokeLinecap="round" />
      {[0.22, 0.5, 0.74].map((q, i) => (
        <line key={q} x1={x0 + w * q + Math.sin(time * 0.9 + i * 2) * 8} y1={14 + i * 9} x2={x0 + w * q + 46 + Math.sin(time * 0.9 + i * 2) * 8} y2={14 + i * 9} stroke="#3f9be6" strokeWidth={3} strokeLinecap="round" opacity={0.5} />
      ))}
      {[x0 - 4, x0 + 12, x1 - 10, x1 + 6].map((rx, i) => (
        <g key={rx} strokeLinecap="round">
          <line x1={rx} y1={0} x2={rx + Math.sin(time * 1.1 + i) * 3} y2={-44 - (i % 2) * 12} stroke="#5d8254" strokeWidth={3} />
          <line x1={rx + Math.sin(time * 1.1 + i) * 3} y1={-44 - (i % 2) * 12} x2={rx + Math.sin(time * 1.1 + i) * 3.6} y2={-58 - (i % 2) * 12} stroke="#6b4a2c" strokeWidth={6} />
        </g>
      ))}
      {ring > 0.01 ? <ellipse cx={mid} cy={8} rx={w / 2 + 34} ry={66} fill="none" stroke={C.red} strokeWidth={5} strokeDasharray="16 12" strokeDashoffset={-time * 14} opacity={ring} /> : null}
    </g>
  );
};

/** A sheet pinned to a post: the notice. No words on it. */
export const Notice: React.FC<{x: number; y: number; a?: number; time: number}> = ({x, y, a = 1, time}) => (
  <g opacity={a} transform={`rotate(${Math.sin(time * 2.4) * 3} ${x} ${y})`}>
    <rect x={x - 26} y={y} width={52} height={66} rx={3} fill={PAPER} stroke="#0a1220" strokeWidth={2} />
    {[14, 26, 36, 46].map((dy, i) => (
      <rect key={dy} x={x - 18} y={y + dy} width={i === 0 ? 30 : i === 3 ? 22 : 36} height={i === 0 ? 7 : 4} rx={2} fill={i === 0 ? '#8a3a2c' : '#b4ad98'} />
    ))}
    <circle cx={x} cy={y + 6} r={4} fill={C.red} stroke="#0a1220" strokeWidth={1.5} />
  </g>
);

/** A prohibition sign on a post, the way a safety sign says "keep out": cattle, or the water. */
export const NoSign: React.FC<{x: number; show: number; kind: 'cattle' | 'water'; h?: number}> = ({x, show, kind, h = 214}) => {
  if (show <= 0.004) return null;
  const k = Math.min(1.08, show);
  const cy = -h;
  const r = 60;
  return (
    <g>
      <line x1={x} y1={0} x2={x} y2={cy + r - 4} stroke="#8fa3c2" strokeWidth={9} strokeLinecap="round" opacity={Math.min(1, show * 2)} />
      <g transform={`translate(${x} ${cy}) scale(${k})`} opacity={Math.min(1, show * 2)}>
        <circle cx={0} cy={0} r={r} fill="#f4f6fa" stroke="#04060a" strokeWidth={3} />
        {kind === 'cattle' ? (
          <Cow x={-4} y={30} k={0.44} color={INK} shade={INK} />
        ) : (
          [-16, 2, 20].map((dy) => <path key={dy} d={`M -34 ${dy} q 8.5 -11 17 0 t 17 0 t 17 0 t 17 0`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />)
        )}
        <circle cx={0} cy={0} r={r - 7} fill="none" stroke={C.red} strokeWidth={13} />
        <line x1={-(r - 7) * 0.7} y1={-(r - 7) * 0.7} x2={(r - 7) * 0.7} y2={(r - 7) * 0.7} stroke={C.red} strokeWidth={13} />
      </g>
    </g>
  );
};

/** A stalk of corn, growing up from (x, 0). */
export const Corn: React.FC<{x: number; h?: number; time: number; seed?: number}> = ({x, h = 400, time, seed = 0}) => {
  const sway = Math.sin(time * 0.9 + seed * 1.7) * 1.6;
  return (
    <g transform={`translate(${x} 0) rotate(${sway})`} strokeLinecap="round" fill="none">
      <line x1={0} y1={0} x2={0} y2={-h} stroke="#3f6a3a" strokeWidth={8} />
      {[0.2, 0.36, 0.52, 0.68, 0.82].map((q, i) => {
        const sd = i % 2 ? 1 : -1;
        const len = (88 - i * 9) * (0.9 + 0.2 * rnd(seed + i * 3.3));
        return <path key={q} d={`M 0 ${-h * q} q ${sd * len * 0.55} ${-len * 0.62} ${sd * len} ${len * 0.12}`} stroke="#54854a" strokeWidth={9} />;
      })}
      <ellipse cx={13} cy={-h * 0.47} rx={10} ry={30} fill="#b79a4e" stroke="#6f5d30" strokeWidth={2} transform={`rotate(14 13 ${-h * 0.47})`} />
      {[-18, 0, 18].map((dx) => (
        <line key={dx} x1={0} y1={-h} x2={dx} y2={-h - 34} stroke="#9c8a55" strokeWidth={4} />
      ))}
    </g>
  );
};

/* ---------------------------------------------------------------- the paperwork (HTML, laid out in frame pixels) */
/** A clipboard whose page builds a checklist. Every row's words come from the caller (script.json). */
export const Clipboard: React.FC<{t: number; at: number; x: number; y: number; w: number; h: number; rows: {text: string; at: number; hiAt?: number}[]; a?: number; dx?: number}> = ({t, at, x, y, w, h, rows, a = 1, dx = 0}) => {
  if (t < at || a <= 0.004) return null;
  const inK = clamp(1 - Math.exp(-(t - at) * 7) * Math.cos((t - at) * 9), 0, 1.06);
  const bar = (wd: number, key: number) => <div key={key} style={{height: 13, width: wd, background: '#cfc8b2', borderRadius: 3, marginTop: 16}} />;
  return (
    <div style={{position: 'absolute', left: x + dx, top: y + (1 - inK) * 700, width: w, height: h, opacity: clamp(a), transform: 'rotate(-2deg)', background: '#6a4b2f', borderRadius: 22, boxShadow: '0 40px 90px rgba(0,0,0,0.7)', border: '3px solid #2c1e12'}}>
      <div style={{position: 'absolute', left: 30, top: 56, right: 30, bottom: 30, background: PAPER, borderRadius: 4, padding: '54px 40px 0'}}>
        {bar(w * 0.44, 0)}
        {bar(w * 0.3, 1)}
        <div style={{marginTop: 34}}>
          {rows.map((r, i) => {
            const k = clamp(1 - Math.exp(-(t - r.at) * 9));
            const hi = r.hiAt === undefined ? 0 : ramp(t, r.hiAt, r.hiAt + 0.7, E.inOutQuad);
            return (
              <div key={i} style={{display: 'flex', gap: 26, alignItems: 'flex-start', marginBottom: 34, opacity: t >= r.at ? k : 0, transform: `translateX(${(1 - k) * -24}px)`}}>
                <div style={{width: 46, height: 46, border: `5px solid ${INK}`, borderRadius: 6, flex: 'none', marginTop: 4}} />
                <div style={{fontFamily: FONT.label, fontWeight: 700, fontSize: 50, lineHeight: 1.12, letterSpacing: '0.02em', color: INK}}>
                  <span style={{backgroundImage: `linear-gradient(${C.yellow}, ${C.yellow})`, backgroundRepeat: 'no-repeat', backgroundSize: `${hi * 100}% 100%`, boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone', padding: '0 4px'}}>{r.text}</span>
                </div>
              </div>
            );
          })}
        </div>
        {[w * 0.5, w * 0.36].map((wd, i) => bar(wd, i + 5))}
      </div>
      <div style={{position: 'absolute', left: w / 2 - 110, top: -22, width: 220, height: 84, borderRadius: 14, background: 'linear-gradient(#c3ccd8, #8b96a8)', border: '3px solid #0a1220'}}>
        <div style={{position: 'absolute', left: 84, top: 14, width: 52, height: 22, borderRadius: 11, background: '#0a1220'}} />
      </div>
    </div>
  );
};

/** One slip of paper for the folder: a till receipt, a lab slip with no result yet, or a photograph. */
export const Slip: React.FC<{kind: 'receipt' | 'lab' | 'photo' | 'list'; x: number; y: number; rot?: number; k?: number; a?: number}> = ({kind, x, y, rot = 0, k = 1, a = 1}) => {
  if (a <= 0.004) return null;
  const w = kind === 'receipt' ? 120 : kind === 'photo' ? 190 : 170;
  const h = kind === 'receipt' ? 210 : kind === 'photo' ? 150 : 200;
  const bars = (n: number, top: number, wd: number[]) =>
    Array.from({length: n}, (_, i) => <rect key={i} x={-w / 2 + 16} y={-h / 2 + top + i * 18} width={(w - 32) * wd[i % wd.length]} height={7} rx={3} fill="#b4ad98" />);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${k})`} opacity={a}>
      {kind === 'receipt' ? (
        <>
          <path d={`M ${-w / 2} ${-h / 2} L ${w / 2} ${-h / 2} L ${w / 2} ${h / 2} ${Array.from({length: 8}, (_, i) => `L ${w / 2 - (i + 0.5) * (w / 8)} ${h / 2 - 9} L ${w / 2 - (i + 1) * (w / 8)} ${h / 2}`).join(' ')} Z`} fill="#f2efe6" stroke="#0a1220" strokeWidth={2} />
          {bars(7, 22, [0.9, 0.6, 0.75, 0.5])}
          <rect x={-w / 2 + 16} y={h / 2 - 54} width={w - 32} height={5} fill="#5c574a" />
          <rect x={w / 2 - 62} y={h / 2 - 40} width={46} height={11} rx={3} fill="#5c574a" />
        </>
      ) : kind === 'photo' ? (
        <>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={3} fill="#f2efe6" stroke="#0a1220" strokeWidth={2} />
          <rect x={-w / 2 + 10} y={-h / 2 + 10} width={w - 20} height={h - 36} fill="#17263d" />
          <line x1={-w / 2 + 10} y1={h / 2 - 50} x2={w / 2 - 10} y2={h / 2 - 50} stroke="#3c5a3a" strokeWidth={4} />
          <Cow x={6} y={h / 2 - 50} k={0.5} graze={1} />
        </>
      ) : (
        <>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={3} fill={PAPER} stroke="#0a1220" strokeWidth={2} />
          {kind === 'lab' ? (
            <>
              {bars(3, 20, [0.7, 0.9, 0.5])}
              <rect x={-w / 2 + 16} y={-h / 2 + 86} width={w - 32} height={64} rx={4} fill="none" stroke="#8a8676" strokeWidth={3} strokeDasharray="9 7" />
              {bars(1, 170, [0.6])}
            </>
          ) : (
            [0, 1, 2, 3].map((i) => (
              <g key={i}>
                <rect x={-w / 2 + 16} y={-h / 2 + 24 + i * 42} width={20} height={20} rx={3} fill="none" stroke={INK} strokeWidth={3} />
                <rect x={-w / 2 + 48} y={-h / 2 + 30 + i * 42} width={(w - 70) * [0.9, 0.7, 0.8, 0.55][i]} height={8} rx={3} fill="#b4ad98" />
              </g>
            ))
          )}
        </>
      )}
    </g>
  );
};

/**
 * A manila folder, centred on (0, 0) of the group you put it in. Slips are drawn by the caller
 * between `FolderBack` and `FolderFront`, so they sit inside it.
 */
export const FOLDER = {w: 560, h: 330};
export const FolderBack: React.FC = () => {
  const {w, h} = FOLDER;
  return <path d={`M ${-w / 2} ${-h / 2 + 30} L ${-w / 2} ${h / 2} L ${w / 2} ${h / 2} L ${w / 2} ${-h / 2 + 30} L ${-w / 2 + 250} ${-h / 2 + 30} L ${-w / 2 + 222} ${-h / 2} L ${-w / 2 + 16} ${-h / 2} Q ${-w / 2} ${-h / 2} ${-w / 2} ${-h / 2 + 16} Z`} fill="#a4864c" stroke="#3d3218" strokeWidth={3} strokeLinejoin="round" />;
};
export const FolderFront: React.FC<{band?: number}> = ({band = 0}) => {
  const {w, h} = FOLDER;
  return (
    <g>
      <rect x={-w / 2} y={-h / 2 + 84} width={w} height={h - 84} rx={10} fill="#c7a662" stroke="#3d3218" strokeWidth={3} />
      <line x1={-w / 2 + 12} y1={-h / 2 + 96} x2={w / 2 - 12} y2={-h / 2 + 96} stroke="#dcc084" strokeWidth={3} strokeLinecap="round" />
      {/* a label with nothing written on it */}
      <rect x={-w / 2 + 44} y={-h / 2 + 150} width={250} height={84} rx={4} fill={PAPER} stroke="#3d3218" strokeWidth={2} />
      {[0.8, 0.55].map((q, i) => (
        <rect key={i} x={-w / 2 + 62} y={-h / 2 + 174 + i * 26} width={214 * q} height={9} rx={4} fill="#b4ad98" />
      ))}
      {band > 0.01 ? <rect x={w / 2 - 118} y={-h / 2 + 30 + (1 - clamp(band)) * -60} width={26} height={h - 30} rx={4} fill="#1b1d22" opacity={clamp(band * 2)} /> : null}
    </g>
  );
};
