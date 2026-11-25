import React from 'react';
import {C} from '../../engine/theme';
import {clamp, lerp, rnd} from '../../engine/time';
import {BARREL, BARREL_DARK} from './Bunker';

/**
 * One storage drum, cut open: the lead azide at the bottom, the water-and-alcohol bath over it.
 * Schematic: the sources describe the arrangement (kept "in a bath of ethanol and water"; the
 * bath "had evaporated"; crystals "on the exterior of the barrels, including the barrel lids"
 * and "on each of the bolts on the view ports and on the lids") but give no drawing.
 *
 *   (x, y)   centre of the drum's base, in pixels
 *   s        pixels per metre (the drum is 0.92 m tall)
 *   level    how full the bath is, 0..1 (1 = covers the powder with room to spare)
 *   needles  crystals inside, on the powder and up the wall, 0..1
 *   outside  crystals on the lid, the bolts and down the outside, 0..1
 *   ice      the bath freezing, 0..1
 *   steel    draw the 1984 steel drum instead of the plastic one; `rust` eats through it
 */
export const BarrelCut: React.FC<{
  x: number; y: number; s: number; time: number; level?: number; needles?: number; outside?: number; ice?: number; steel?: boolean; rust?: number; open?: number; glow?: number;
}> = ({x, y, s, time, level = 1, needles = 0, outside = 0, ice = 0, steel = false, rust = 0, open = 1, glow = 0}) => {
  const w = 0.62 * s;
  const h = 0.92 * s;
  const left = x - w / 2;
  const top = y - h;
  const wall = w * 0.045;
  const inner = {x: left + wall, y: top + wall * 1.4, w: w - wall * 2, h: h - wall * 2.4};
  const powderH = inner.h * 0.3;
  const powderTop = inner.y + inner.h - powderH;
  const bathTop = lerp(powderTop + powderH * 0.55, inner.y + inner.h * 0.16, clamp(level));
  const body = steel ? '#6d7684' : BARREL;
  const dark = steel ? '#444c58' : BARREL_DARK;
  const wave = (px: number) => Math.sin(px * 0.06 + time * 2.2) * s * 0.006;
  const surface = Array.from({length: 13}, (_, i) => {
    const px = inner.x + (inner.w * i) / 12;
    return `${px},${bathTop + wave(px)}`;
  }).join(' L ');
  const needle = (bx: number, by: number, ang: number, len: number, key: string, op = 1) => (
    <g key={key} opacity={op}>
      <line x1={bx} y1={by} x2={bx + Math.cos(ang) * len} y2={by + Math.sin(ang) * len} stroke="#f4f8ff" strokeWidth={Math.max(1.5, s * 0.006)} strokeLinecap="round" />
      <line x1={bx} y1={by} x2={bx + Math.cos(ang) * len * 0.5} y2={by + Math.sin(ang) * len * 0.5} stroke="#ffffff" strokeWidth={Math.max(2.5, s * 0.011)} strokeLinecap="round" opacity={0.55} />
    </g>
  );
  return (
    <g>
      {glow > 0 ? <ellipse cx={x} cy={y - h / 2} rx={w * 1.1} ry={h * 0.8} fill={C.red} opacity={0.16 * glow} filter="url(#barrelGlow)" /> : null}
      <defs>
        <filter id="barrelGlow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation={s * 0.05} />
        </filter>
        <clipPath id={`in${Math.round(x)}${Math.round(y)}`}>
          <rect x={inner.x} y={inner.y} width={inner.w} height={inner.h} rx={w * 0.1} />
        </clipPath>
      </defs>
      {/* the shell */}
      <rect x={left} y={top} width={w} height={h} rx={w * 0.14} fill={body} stroke="#0a1220" strokeWidth={Math.max(2, s * 0.008)} />
      {[0.3, 0.66].map((k) => (
        <rect key={k} x={left} y={top + h * k} width={w} height={h * 0.045} fill={dark} />
      ))}
      {/* the cutaway window */}
      <g opacity={clamp(open)}>
        <rect x={inner.x} y={inner.y} width={inner.w} height={inner.h} rx={w * 0.1} fill="#070c14" />
        <g clipPath={`url(#in${Math.round(x)}${Math.round(y)})`}>
          {/* the bath */}
          <path d={`M ${surface} L ${inner.x + inner.w},${inner.y + inner.h} L ${inner.x},${inner.y + inner.h} Z`} fill={ice > 0.5 ? 'rgba(200,225,255,0.55)' : 'rgba(70,150,230,0.5)'} />
          <path d={`M ${surface}`} fill="none" stroke="#bfe0ff" strokeWidth={Math.max(2, s * 0.007)} />
          {/* the powder */}
          <path d={`M ${inner.x},${inner.y + inner.h} L ${inner.x},${powderTop + powderH * 0.25} Q ${x},${powderTop - powderH * 0.25} ${inner.x + inner.w},${powderTop + powderH * 0.25} L ${inner.x + inner.w},${inner.y + inner.h} Z`} fill="#e3d6b6" />
          {Array.from({length: 40}, (_, i) => (
            <circle key={i} cx={inner.x + rnd(i * 2.1) * inner.w} cy={powderTop + powderH * (0.3 + rnd(i * 4.7) * 0.7)} r={s * 0.006} fill="#b9a983" />
          ))}
          {/* ice forming in the bath */}
          {ice > 0.01
            ? Array.from({length: 16}, (_, i) => {
                const cx = inner.x + rnd(i * 3.9) * inner.w;
                const cy = lerp(bathTop + s * 0.03, powderTop + powderH * 0.2, rnd(i * 6.3));
                const r = s * 0.03 * clamp(ice * 1.6 - rnd(i * 8.1) * 0.6);
                if (r <= 0 || cy < bathTop) return null;
                return (
                  <g key={i} stroke="#ffffff" strokeWidth={Math.max(1.5, s * 0.006)} strokeLinecap="round" opacity={0.9}>
                    {[0, 60, 120].map((a) => (
                      <line key={a} x1={cx - Math.cos((a * Math.PI) / 180) * r} y1={cy - Math.sin((a * Math.PI) / 180) * r} x2={cx + Math.cos((a * Math.PI) / 180) * r} y2={cy + Math.sin((a * Math.PI) / 180) * r} />
                    ))}
                  </g>
                );
              })
            : null}
          {/* crystals: up from the powder, and along the wall the bath has left dry */}
          {needles > 0.01
            ? Array.from({length: 34}, (_, i) => {
                const onWall = i % 3 === 0;
                const k = clamp(needles * 1.5 - rnd(i * 5.5) * 0.5);
                if (k <= 0) return null;
                if (onWall) {
                  const sideLeft = i % 2 === 0;
                  const by = lerp(inner.y + inner.h * 0.12, bathTop, rnd(i * 7.9));
                  const bx = sideLeft ? inner.x : inner.x + inner.w;
                  const ang = (sideLeft ? 0 : Math.PI) + (rnd(i * 2.7) - 0.5) * 1.1;
                  return needle(bx, by, ang, s * (0.05 + rnd(i * 9.7) * 0.07) * k, `w${i}`);
                }
                const bx = inner.x + inner.w * (0.06 + rnd(i * 3.3) * 0.88);
                const by = powderTop + powderH * (0.02 + Math.abs(bx - x) / inner.w) * 0.5;
                return needle(bx, by, -Math.PI / 2 + (rnd(i * 6.1) - 0.5) * 1.3, s * (0.06 + rnd(i * 8.3) * 0.11) * k, `p${i}`);
              })
            : null}
        </g>
        <rect x={inner.x} y={inner.y} width={inner.w} height={inner.h} rx={w * 0.1} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={2} />
      </g>
      {/* rust eating through a steel drum */}
      {rust > 0.01
        ? Array.from({length: 14}, (_, i) => {
            const cx = left + rnd(i * 3.1) * w;
            const cy = top + h * (0.45 + rnd(i * 5.7) * 0.55);
            return <circle key={i} cx={cx} cy={cy} r={s * (0.02 + rnd(i * 7.3) * 0.045) * clamp(rust * 1.5 - rnd(i * 2.2) * 0.5)} fill={i % 3 ? '#a1481f' : '#5e2a12'} opacity={0.9} />;
          })
        : null}
      {rust > 0.6 ? (
        <path d={`M ${left + w * 0.86} ${y - h * 0.08} q ${w * 0.3} ${h * 0.02} ${w * 0.42} ${h * 0.09} l ${-w * 0.7} 0`} fill="rgba(70,150,230,0.55)" opacity={clamp((rust - 0.6) * 2.5)} />
      ) : null}
      {/* lid, bolts and the view port */}
      <rect x={left - w * 0.02} y={top - h * 0.035} width={w * 1.04} height={h * 0.07} rx={h * 0.02} fill={steel ? '#535b68' : '#1c2f4a'} stroke="#0a1220" strokeWidth={2} />
      {[0.1, 0.5, 0.9].map((k) => (
        <rect key={k} x={left + w * k - w * 0.035} y={top - h * 0.065} width={w * 0.07} height={h * 0.04} rx={2} fill="#c9d2de" stroke="#0a1220" strokeWidth={1.5} />
      ))}
      <rect x={x + w * 0.16} y={top - h * 0.09} width={w * 0.16} height={h * 0.06} rx={3} fill="#2a3f5e" stroke="#0a1220" strokeWidth={1.5} />
      {/* crystals on the outside: lid, bolts, down the shell */}
      {outside > 0.01
        ? Array.from({length: 46}, (_, i) => {
            const k = clamp(outside * 1.6 - rnd(i * 4.9) * 0.6);
            if (k <= 0) return null;
            const onLid = i % 5 !== 0;
            const bx = onLid ? left + w * (rnd(i * 2.9) * 1.0) : i % 2 ? left : left + w;
            const by = onLid ? top - h * 0.04 : top + h * rnd(i * 6.6) * 0.45;
            const ang = onLid ? -Math.PI / 2 + (rnd(i * 3.7) - 0.5) * 1.6 : (i % 2 ? Math.PI : 0) + (rnd(i * 8.8) - 0.5) * 1.2;
            return needle(bx, by, ang, s * (0.03 + rnd(i * 7.7) * 0.07) * k, `o${i}`, 0.95);
          })
        : null}
    </g>
  );
};
