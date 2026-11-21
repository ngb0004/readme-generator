import React from 'react';
import {C, FONT, H, W} from './theme';
import {clamp, rnd} from './time';

type Pt = {x: number; y: number};
const fade = (a: number): React.CSSProperties => ({opacity: clamp(a), transform: `translateY(${(1 - clamp(a)) * 14}px)`});

/** Small letter-spaced technical label. */
export const Tag: React.FC<{x: number; y: number; a: number; color?: string; size?: number; align?: 'left' | 'center' | 'right'; children: React.ReactNode}> = ({x, y, a, color = C.white, size = 30, align = 'left', children}) => (
  <div style={{position: 'absolute', left: align === 'left' ? x : align === 'center' ? x - 500 : x - 1000, top: y, width: align === 'left' ? undefined : 1000, textAlign: align, fontFamily: FONT.mono, fontWeight: 700, fontSize: size, letterSpacing: '0.16em', color, whiteSpace: 'nowrap', textShadow: '0 2px 10px rgba(0,0,0,0.9)', ...fade(a)}}>
    {children}
  </div>
);

/** Display-face headline. */
export const Big: React.FC<{x: number; y: number; a: number; size: number; color?: string; align?: 'left' | 'center' | 'right'; scale?: number; stroke?: number; children: React.ReactNode}> = ({x, y, a, size, color = C.white, align = 'center', scale = 1, stroke = 0, children}) => (
  <div style={{position: 'absolute', left: align === 'left' ? x : align === 'center' ? x - 540 : x - 1080, top: y, width: align === 'left' ? undefined : 1080, textAlign: align, fontFamily: FONT.display, fontSize: size, lineHeight: 1, color, whiteSpace: 'nowrap', opacity: clamp(a), transform: `scale(${scale})`, transformOrigin: align === 'left' ? '0% 50%' : '50% 50%', filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.7))', WebkitTextStroke: stroke ? `${stroke}px #04060a` : undefined, paintOrder: 'stroke fill'}}>
    {children}
  </div>
);

/** Boxed callout with an accent bar. `a` runs 0..1 and wipes it in from the left. */
export const Chip: React.FC<{x: number; y: number; a: number; color?: string; size?: number; align?: 'left' | 'center'; mark?: string; children: React.ReactNode}> = ({x, y, a, color = C.yellow, size = 46, align = 'left', mark, children}) => {
  const k = clamp(a);
  return (
    <div style={{position: 'absolute', left: align === 'center' ? x - 540 : x, top: y, width: align === 'center' ? 1080 : undefined, display: 'flex', justifyContent: align === 'center' ? 'center' : 'flex-start', opacity: Math.min(1, k * 3)}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(5,8,14,0.86)', borderLeft: `9px solid ${color}`, padding: `${size * 0.2}px ${size * 0.5}px ${size * 0.2}px ${size * 0.42}px`, fontFamily: FONT.label, fontWeight: 700, fontSize: size, letterSpacing: '0.045em', color: C.white, whiteSpace: 'nowrap', clipPath: `inset(0 ${(1 - k) * 100}% 0 0)`, boxShadow: '0 10px 30px rgba(0,0,0,0.55)'}}>
        {mark ? <span style={{color, fontFamily: FONT.display, fontSize: size * 0.92, lineHeight: 1}}>{mark}</span> : null}
        {children}
      </div>
    </div>
  );
};

/** Leader line from a thing in the scene to a label position. */
export const Leader: React.FC<{from: Pt; to: Pt; a: number; color?: string}> = ({from, to, a, color = C.yellow}) => {
  const k = clamp(a);
  if (k <= 0) return null;
  const x = from.x + (to.x - from.x) * k;
  const y = from.y + (to.y - from.y) * k;
  return (
    <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <line x1={from.x} y1={from.y} x2={x} y2={y} stroke="rgba(0,0,0,0.6)" strokeWidth={7} />
      <line x1={from.x} y1={from.y} x2={x} y2={y} stroke={color} strokeWidth={3} />
      <circle cx={from.x} cy={from.y} r={9} fill="none" stroke={color} strokeWidth={3} />
      <circle cx={from.x} cy={from.y} r={3.5} fill={color} />
    </svg>
  );
};

/** Four corner brackets that snap onto a target, with a ping. */
export const Reticle: React.FC<{at: Pt; r: number; a: number; time: number; color?: string}> = ({at, r, a, time, color = C.yellow}) => {
  const k = clamp(a);
  if (k <= 0) return null;
  const s = r * (1 + (1 - k) * 1.6);
  const l = s * 0.42;
  const ping = (time * 1.1) % 1;
  const corner = (sx: number, sy: number) => `M ${at.x + sx * s} ${at.y + sy * (s - l)} L ${at.x + sx * s} ${at.y + sy * s} L ${at.x + sx * (s - l)} ${at.y + sy * s}`;
  return (
    <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, opacity: k}}>
      {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy], i) => (
        <g key={i}>
          <path d={corner(sx, sy)} fill="none" stroke="rgba(0,0,0,0.65)" strokeWidth={10} />
          <path d={corner(sx, sy)} fill="none" stroke={color} strokeWidth={5} />
        </g>
      ))}
      <circle cx={at.x} cy={at.y} r={r * (0.5 + ping * 1.5)} fill="none" stroke={color} strokeWidth={3} opacity={(1 - ping) * 0.8} />
    </svg>
  );
};

/** Engineering dimension line between two points, drawn on over `a`. */
export const Dim: React.FC<{from: Pt; to: Pt; a: number; color?: string}> = ({from, to, a, color = C.yellow}) => {
  const k = clamp(a);
  if (k <= 0) return null;
  const x = from.x + (to.x - from.x) * k;
  const y = from.y + (to.y - from.y) * k;
  const tick = 26;
  return (
    <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
      {[7, 3].map((w) => (
        <g key={w} stroke={w === 7 ? 'rgba(0,0,0,0.6)' : color} strokeWidth={w === 7 ? 8 : 4} fill="none">
          <line x1={from.x} y1={from.y} x2={x} y2={y} />
          <line x1={from.x - tick} y1={from.y} x2={from.x + tick} y2={from.y} />
          {k > 0.98 ? <line x1={to.x - tick} y1={to.y} x2={to.x + tick} y2={to.y} /> : null}
        </g>
      ))}
    </svg>
  );
};

/** Vignette + film grain: the last 5% that stops it looking like raw CG. */
let grainUrl: string | null = null;
const grain = () => {
  if (grainUrl) return grainUrl;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  const img = g.createImageData(256, 256);
  for (let i = 0; i < 256 * 256; i++) {
    const v = 128 + (rnd(i * 0.731) - 0.5) * 150;
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return (grainUrl = c.toDataURL());
};

export const Grade: React.FC<{frame: number}> = ({frame}) => (
  <>
    <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 78% 62% at 50% 44%, rgba(0,0,0,0) 52%, rgba(0,0,0,0.6) 100%)'}} />
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 720, background: 'linear-gradient(to bottom, rgba(2,4,8,0) 0%, rgba(2,4,8,0.5) 55%, rgba(2,4,8,0.72) 100%)'}} />
    <div style={{position: 'absolute', inset: 0, backgroundImage: `url(${grain()})`, backgroundSize: '256px 256px', backgroundPosition: `${Math.floor(rnd(frame) * 256)}px ${Math.floor(rnd(frame + 0.5) * 256)}px`, opacity: 0.085, mixBlendMode: 'overlay'}} />
  </>
);
