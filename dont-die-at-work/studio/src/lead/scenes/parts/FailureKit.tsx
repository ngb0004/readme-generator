import React from 'react';
import {C, FONT} from '../../../engine/theme';
import {clamp, rnd} from '../../../engine/time';
import {P, View} from '../../draw/view';
import {H, W} from '../../kit';

// Pieces only the failure scene uses: the three red stamps, the snow, the truck that cannot be used.

/** A red stamp, slammed down at `at`, centred on (cx, cy). The words come from script.json. */
export const Stamp: React.FC<{t: number; at: number; cx: number; cy: number; size?: number; a?: number; rot?: number; children: React.ReactNode}> = ({t, at, cx, cy, size = 96, a = 1, rot = -3, children}) => {
  if (t < at || a <= 0.001) return null;
  const hit = Math.pow(1 - clamp((t - at) / 0.22), 3);
  return (
    <div style={{position: 'absolute', left: cx - 600, top: cy - size * 1.5, width: 1200, height: size * 3, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 + 0.8 * hit}) rotate(${rot}deg)`, opacity: clamp(a) * Math.min(1, (t - at) / 0.05), pointerEvents: 'none'}}>
      <div style={{border: `${Math.round(size * 0.1)}px solid ${C.red}`, color: C.red, fontFamily: FONT.display, fontSize: size, lineHeight: 1, padding: `${size * 0.13}px ${size * 0.34}px ${size * 0.05}px`, background: 'rgba(4,6,10,0.82)', whiteSpace: 'nowrap', boxShadow: '0 16px 40px rgba(0,0,0,0.6)'}}>{children}</div>
    </div>
  );
};

/** Snow across the whole frame. White: cyan is kept for lead. */
export const Snow: React.FC<{time: number; a: number}> = ({time, a}) => {
  if (a <= 0.001) return null;
  return (
    <g opacity={clamp(a)}>
      {Array.from({length: 120}, (_, i) => {
        const fall = 70 + rnd(i * 2.7) * 110;
        const x = ((rnd(i * 5.3) * (W + 240) + time * (16 + rnd(i * 1.3) * 26) + Math.sin(time * 0.8 + i) * 16) % (W + 240)) - 120;
        const y = (rnd(i * 9.1) * H + time * fall) % H;
        return <circle key={i} cx={x} cy={y} r={1.8 + rnd(i * 4.4) * 3} fill="#f4f8ff" opacity={0.3 + 0.55 * rnd(i * 6.6)} />;
      })}
    </g>
  );
};

/** A flatbed truck in the bunker's world (metres). `x` is its front bumper; it faces right. */
export const Truck: React.FC<{v: View; x: number; a?: number}> = ({v, x, a = 1}) => {
  if (a <= 0.001) return null;
  const px = (m: number) => m * v.s;
  const at = (wx: number, wy: number) => P(v, x + wx, wy);
  const wheel = (wx: number) => {
    const [cx, cy] = at(wx, 0.52);
    return (
      <g key={wx}>
        <circle cx={cx} cy={cy} r={px(0.52)} fill="#0a0f18" stroke="#2a3446" strokeWidth={3} />
        <circle cx={cx} cy={cy} r={px(0.2)} fill={C.mute} />
      </g>
    );
  };
  const [bedX, bedY] = at(-7.6, 1.45);
  const [cabX, cabY] = at(-2.35, 2.95);
  const [hoodX, hoodY] = at(-0.9, 1.9);
  return (
    <g opacity={clamp(a)}>
      {/* bed and chassis */}
      <rect x={bedX} y={bedY} width={px(5.2)} height={px(0.3)} fill="#51607a" stroke="#0a1220" strokeWidth={2.5} />
      <rect x={at(-7.4, 1.15)[0]} y={at(0, 1.15)[1]} width={px(7.0)} height={px(0.28)} fill="#27303d" stroke="#0a1220" strokeWidth={2} />
      <rect x={at(-2.6, 2.6)[0]} y={at(0, 2.6)[1]} width={px(0.18)} height={px(1.2)} fill="#51607a" />
      {/* cab and nose */}
      <rect x={cabX} y={cabY} width={px(1.5)} height={px(2.1)} rx={px(0.18)} fill="#6d7d99" stroke="#0a1220" strokeWidth={2.5} />
      <rect x={at(-1.75, 2.72)[0]} y={at(0, 2.72)[1]} width={px(0.78)} height={px(0.72)} rx={px(0.08)} fill="#0d1727" stroke="#0a1220" strokeWidth={2} />
      <rect x={hoodX} y={hoodY} width={px(0.9)} height={px(1.05)} rx={px(0.12)} fill="#6d7d99" stroke="#0a1220" strokeWidth={2.5} />
      <circle cx={at(-0.08, 1.35)[0]} cy={at(0, 1.35)[1]} r={px(0.11)} fill={C.warm} />
      {[-6.6, -5.4, -1.1].map(wheel)}
    </g>
  );
};

/** A red cross over something that cannot be done. Centre (x, y) in pixels; `k` runs 0..1. */
export const Cross: React.FC<{x: number; y: number; r: number; k: number}> = ({x, y, r, k}) => {
  if (k <= 0.001) return null;
  const s = 1 + 0.7 * Math.pow(1 - clamp(k), 3);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={Math.min(1, k * 4)} strokeLinecap="round">
      <line x1={-r} y1={-r * 0.62} x2={r} y2={r * 0.62} stroke="#04060a" strokeWidth={r * 0.26} />
      <line x1={-r} y1={r * 0.62} x2={r} y2={-r * 0.62} stroke="#04060a" strokeWidth={r * 0.26} />
      <line x1={-r} y1={-r * 0.62} x2={r} y2={r * 0.62} stroke={C.red} strokeWidth={r * 0.16} />
      <line x1={-r} y1={r * 0.62} x2={r} y2={-r * 0.62} stroke={C.red} strokeWidth={r * 0.16} />
    </g>
  );
};
