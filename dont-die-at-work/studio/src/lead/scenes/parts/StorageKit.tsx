import React from 'react';
import {C, FONT} from '../../../engine/theme';
import {clamp, lerp, rnd} from '../../../engine/time';
import {INK, PAPER, pop} from '../../kit';

// Pieces shared by the two barrel scenes (Storage and Failure): where things are inside the
// cut-open drum, the level gauge beside it, and the list that the 1984 paper heads.

/**
 * The construction draw/Barrel.tsx uses, repeated here so overlays can find the bath, the powder,
 * the lid and the bolts. (x, y) is the centre of the drum's base; s is pixels per metre.
 */
export const barrelGeom = (x: number, y: number, s: number, level = 1) => {
  const w = 0.62 * s;
  const h = 0.92 * s;
  const left = x - w / 2;
  const top = y - h;
  const wall = w * 0.045;
  const inner = {x: left + wall, y: top + wall * 1.4, w: w - wall * 2, h: h - wall * 2.4};
  const powderH = inner.h * 0.3;
  const powderTop = inner.y + inner.h - powderH;
  const bathTop = lerp(powderTop + powderH * 0.55, inner.y + inner.h * 0.16, clamp(level));
  return {
    x, y, s, w, h, left, right: left + w, top, inner, powderTop, bathTop,
    lidTop: top - h * 0.09,
    /** Where liquid goes in: the port on the lid. */
    port: {x: x + w * 0.24, y: top - h * 0.09},
    bolts: [0.1, 0.5, 0.9].map((k) => ({x: left + w * k, y: top - h * 0.045})),
    /** The gauge stands this far to the right of the drum. */
    gaugeX: left + w + s * 0.1,
  };
};
export type Geom = ReturnType<typeof barrelGeom>;

const BATH = '#bfe0ff';

/**
 * A level gauge beside the drum: a plain scale, a pointer at the surface of the bath, and a red
 * line at the top of the powder, which the bath has to stay above. No figures on it: the sources
 * give none.
 *   min    the red line, 0..1
 *   ping   0..1: a ring that opens out from the pointer (someone looking at it)
 *   check  0..1: a magnifying glass over the pointer and a tick beside it
 */
export const Gauge: React.FC<{g: Geom; a?: number; min?: number; ping?: number; check?: number; alarm?: number}> = ({g, a = 1, min = 1, ping = -1, check = 0, alarm = 0}) => {
  if (a <= 0.001) return null;
  const gx = g.gaugeX;
  const y0 = g.inner.y;
  const y1 = g.inner.y + g.inner.h;
  const my = g.bathTop;
  const u = g.s / 600;
  const pointer = alarm > 0.5 ? C.red : '#eaf4ff';
  return (
    <g opacity={clamp(a)}>
      <line x1={gx} y1={y0} x2={gx} y2={y1} stroke={C.mute} strokeWidth={3 * u} strokeLinecap="round" />
      {Array.from({length: 11}, (_, i) => {
        const ty = lerp(y0, y1, i / 10);
        return <line key={i} x1={gx} y1={ty} x2={gx - (i % 5 === 0 ? 20 : 11) * u} y2={ty} stroke={C.mute} strokeWidth={3 * u} strokeLinecap="round" />;
      })}
      {/* the bath must not fall below this: the top of the powder */}
      {min > 0.01 ? (
        <g opacity={clamp(min)}>
          <line x1={g.inner.x} y1={g.powderTop} x2={gx} y2={g.powderTop} stroke={C.red} strokeWidth={4 * u} strokeDasharray={`${14 * u} ${10 * u}`} />
          <path d={`M ${gx + 5 * u} ${g.powderTop} l ${24 * u} ${-14 * u} v ${28 * u} Z`} fill="none" stroke={C.red} strokeWidth={4 * u} strokeLinejoin="round" />
        </g>
      ) : null}
      {/* where the bath is now */}
      <line x1={g.right} y1={my} x2={gx} y2={my} stroke={BATH} strokeWidth={3 * u} opacity={0.8} />
      <path d={`M ${gx + 5 * u} ${my} l ${24 * u} ${-14 * u} v ${28 * u} Z`} fill={pointer} stroke="#04060a" strokeWidth={2.5 * u} strokeLinejoin="round" />
      {ping >= 0 && ping < 1 ? <circle cx={gx + 16 * u} cy={my} r={(18 + ping * 60) * u} fill="none" stroke={C.yellow} strokeWidth={5 * u} opacity={(1 - ping) * 0.9} /> : null}
      {check > 0.01 ? (
        <g opacity={Math.min(1, check * 2)} transform={`translate(${gx + 16 * u} ${my}) scale(${(0.7 + 0.3 * Math.min(1, check)) * u})`}>
          <circle r={40} fill="rgba(255,194,26,0.10)" stroke={C.yellow} strokeWidth={7} />
          <line x1={29} y1={29} x2={62} y2={62} stroke={C.yellow} strokeWidth={11} strokeLinecap="round" />
          <path d="M 86 -6 l 18 20 l 34 -44" fill="none" stroke={C.yellow} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ) : null}
    </g>
  );
};

/**
 * A can tipped over the drum's port, and what runs out of it. `color` says what it is.
 *   dry    the can only, nothing poured (it cannot be used)
 *   flip   the can comes in from the right instead of the left
 *   size   pixels per metre for the can itself, when the drum is drawn much larger than usual
 */
export const Pour: React.FC<{g: Geom; time: number; a: number; color: string; dry?: boolean; flip?: boolean; size?: number}> = ({g, time, a, color, dry, flip, size}) => {
  const k = clamp(a);
  if (k <= 0.001) return null;
  const s = size ?? g.s;
  const sx = g.port.x;
  const sy = g.port.y - s * 0.105;
  const tilt = dry ? -96 : -118 - 22 * Math.min(1, k * 1.6);
  return (
    <g opacity={Math.min(1, k * 2.5)}>
      {/* the stream: down through the port and into the bath */}
      {dry
        ? null
        : Array.from({length: 11}, (_, i) => {
            const u = (i / 11 + time * 1.9) % 1;
            const yy = lerp(sy + s * 0.01, g.bathTop, Math.pow(u, 1.5));
            return <ellipse key={i} cx={sx + Math.sin(i * 2.1) * s * 0.004} cy={yy} rx={s * 0.009} ry={s * 0.016} fill={color} opacity={0.95 - 0.35 * u} />;
          })}
      {dry ? null : <ellipse cx={sx} cy={g.bathTop} rx={s * (0.04 + 0.02 * Math.sin(time * 9))} ry={s * 0.006} fill="none" stroke={color} strokeWidth={3} opacity={0.8} />}
      {/* the can: the spout is at the origin, the body swings up and over as it tips */}
      <g transform={`translate(${sx} ${sy}) scale(${flip ? -1 : 1} 1) rotate(${tilt})`}>
        <path d={`M 0 0 L ${s * 0.035} ${-s * 0.012} L ${s * 0.035} ${s * 0.03} Z`} fill={color} />
        <rect x={s * 0.03} y={-s * 0.025} width={s * 0.17} height={s * 0.125} rx={s * 0.018} fill="#0b111b" stroke={color} strokeWidth={Math.max(4, s * 0.009)} />
        <rect x={s * 0.075} y={s * 0.014} width={s * 0.08} height={s * 0.026} rx={s * 0.013} fill="none" stroke={color} strokeWidth={Math.max(3, s * 0.007)} />
      </g>
    </g>
  );
};

/** Vapour leaving the top of the drum. */
export const Wisps: React.FC<{g: Geom; time: number; a: number}> = ({g, time, a}) => {
  if (a <= 0.001) return null;
  return (
    <g>
      {Array.from({length: 9}, (_, i) => {
        const k = (rnd(i * 3.3) + time * (0.3 + rnd(i * 5.1) * 0.14)) % 1;
        const wv = g.s * 0.032;
        const bx = g.left + g.w * (0.1 + 0.8 * rnd(i * 7.7)) + Math.sin(k * 7 + i) * wv * 0.6;
        const by = g.lidTop - g.s * 0.015 - k * g.s * 0.16;
        return <path key={i} d={`M ${bx - wv} ${by} q ${wv / 2} ${-wv * 0.8} ${wv} 0 t ${wv} 0`} fill="none" stroke={BATH} strokeWidth={Math.max(3, g.s * 0.006)} strokeLinecap="round" opacity={clamp(a) * Math.sin(k * Math.PI) * 0.9} />;
      })}
    </g>
  );
};

/** A snowflake: the cold. */
export const Snowflake: React.FC<{x: number; y: number; r: number; a: number; spin?: number}> = ({x, y, r, a, spin = 0}) => {
  if (a <= 0.001) return null;
  return (
    <g transform={`translate(${x} ${y}) rotate(${spin}) scale(${0.6 + 0.4 * Math.min(1, a)})`} opacity={clamp(a)} stroke="#eaf4ff" strokeWidth={r * 0.11} strokeLinecap="round" fill="none">
      {[0, 60, 120].map((deg) => (
        <g key={deg} transform={`rotate(${deg})`}>
          <line x1={-r} y1={0} x2={r} y2={0} />
          {[-1, 1].map((sd) => (
            <path key={sd} d={`M ${sd * r * 0.82} ${-r * 0.24} L ${sd * r * 0.58} 0 L ${sd * r * 0.82} ${r * 0.24}`} />
          ))}
        </g>
      ))}
    </g>
  );
};

/**
 * The strip that heads the list: the title block of the 1984 paper. `flip` wipes a headline
 * over it (0..1). Every string comes from script.json.
 */
export const PaperStrip: React.FC<{x: number; y: number; w: number; a: number; title: string; sub: string; flip?: number; headline?: string}> = ({x, y, w, a, title, sub, flip = 0, headline}) => {
  const k = clamp(a);
  if (k <= 0.001) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y + (1 - k) * 22, width: w, height: 102, opacity: k, boxShadow: '0 20px 44px rgba(0,0,0,0.65)', transform: 'rotate(-0.6deg)'}}>
      <div style={{position: 'absolute', inset: 0, background: PAPER, borderBottom: `4px solid ${INK}`, padding: '13px 26px 0', boxSizing: 'border-box'}}>
        <div style={{fontFamily: FONT.mono, fontWeight: 700, fontSize: 33, letterSpacing: '0.05em', color: INK, whiteSpace: 'nowrap', lineHeight: 1.2}}>{title}</div>
        <div style={{fontFamily: FONT.mono, fontWeight: 500, fontSize: 22, letterSpacing: '0.03em', color: '#4a4a46', whiteSpace: 'nowrap', marginTop: 6, lineHeight: 1.2}}>{sub}</div>
      </div>
      {flip > 0.001 && headline ? (
        <div style={{position: 'absolute', inset: 0, background: C.yellow, clipPath: `inset(0 ${(1 - clamp(flip)) * 100}% 0 0)`, display: 'flex', alignItems: 'center', padding: '6px 26px 0', boxSizing: 'border-box'}}>
          <span style={{fontFamily: FONT.display, fontSize: 62, color: INK, whiteSpace: 'nowrap', lineHeight: 1}}>{headline}</span>
        </div>
      ) : null}
    </div>
  );
};

type Line = {text: string; at: number; color?: string; sub?: boolean};
/** One entry of the list: a marker, a line, and the lines that follow from it. Each line lands at its own time. */
export const ListRow: React.FC<{t: number; x: number; y: number; w: number; mark?: string; lines: Line[]; size?: number; a?: number}> = ({t, x, y, w, mark = C.yellow, lines, size = 56, a = 1}) => {
  const first = lines[0].at;
  if (t < first || a <= 0.001) return null;
  const k0 = pop(t, first);
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, opacity: clamp(a)}}>
      <div style={{position: 'absolute', left: 0, top: size * 0.24, width: 18, height: size * 0.56, background: mark, opacity: Math.min(1, k0 * 2), transform: `scaleY(${Math.min(1, k0)})`}} />
      {lines.map((ln, i) => {
        if (t < ln.at) return <div key={i} style={{height: (ln.sub ? size * 0.78 : size) * 1.1 + (ln.sub ? 6 : 0)}} />;
        const k = pop(t, ln.at);
        const fs = ln.sub ? size * 0.78 : size;
        return (
          <div key={i} style={{display: 'flex', alignItems: 'center', gap: 14, marginLeft: 40, marginTop: ln.sub ? 6 : 0, height: fs * 1.1, opacity: Math.min(1, k * 2), transform: `translateX(${(1 - Math.min(1, k)) * -26}px)`}}>
            {ln.sub ? <span style={{width: 18, height: 16, borderLeft: `5px solid ${C.mute}`, borderBottom: `5px solid ${C.mute}`, marginTop: -12, flex: 'none'}} /> : null}
            <span style={{fontFamily: FONT.label, fontWeight: 700, fontSize: fs, letterSpacing: '0.03em', lineHeight: 1.1, color: ln.color ?? C.white, whiteSpace: 'nowrap', textShadow: '0 3px 14px rgba(0,0,0,0.85)'}}>{ln.text}</span>
          </div>
        );
      })}
    </div>
  );
};

/** The floor the drum stands on, and the pallet under it. */
export const Floor: React.FC<{g: Geom; a?: number; half?: number}> = ({g, a = 1, half = 470}) => (
  <g opacity={a}>
    <line x1={g.x - half} y1={g.y + g.s * 0.045} x2={g.x + half} y2={g.y + g.s * 0.045} stroke="#59636f" strokeWidth={3} strokeLinecap="round" opacity={0.8} />
    <rect x={g.left - g.w * 0.08} y={g.y} width={g.w * 1.16} height={g.s * 0.045} fill="#4a3a26" stroke="#0a1220" strokeWidth={2} />
  </g>
);
