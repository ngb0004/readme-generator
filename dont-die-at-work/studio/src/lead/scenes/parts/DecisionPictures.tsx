import React from 'react';
import {C, FONT} from '../../../engine/theme';
import {E, clamp, lerp, ramp} from '../../../engine/time';
import {BarrelCut} from '../../draw/Barrel';
import {Bunker, Drum} from '../../draw/Bunker';
import {MapBase, PLACE, Pin, camAt, projection} from '../../draw/MapView';
import {View} from '../../draw/view';
import {INK, PAPER, pop} from '../../kit';

// The pictures that sit beside the list of chances in the second half of THE DECISION.
// Each one is drawn in the panel's own coordinates (0..PANEL.w, 0..PANEL.h).

/** The window on the right of the list. */
export const PANEL = {x: 1112, y: 176, w: 736, h: 620};

export const Frame: React.FC<{a: number}> = ({a}) => (
  <div style={{position: 'absolute', left: PANEL.x, top: PANEL.y, width: PANEL.w, height: PANEL.h, opacity: clamp(a), background: 'rgba(4,7,13,0.94)', border: '1px solid rgba(141,177,230,0.24)', boxShadow: '0 24px 60px rgba(0,0,0,0.6)'}} />
);

const Local: React.FC<{a?: number; children: React.ReactNode}> = ({a = 1, children}) =>
  a <= 0.001 ? null : (
    <svg width={PANEL.w} height={PANEL.h} style={{position: 'absolute', left: PANEL.x, top: PANEL.y, opacity: clamp(a)}}>
      {children}
    </svg>
  );

/**
 * dec-10. A row of the 1984 steel drums. The Army starts destroying them, and stops with half
 * still standing. `title` and `year` are the paper's, from script.json.
 */
export const DrumRow: React.FC<{t: number; a: number; doing: number; paper: number; stopped: number; title: string; year: string}> = ({t, a, doing, paper, stopped, title, year}) => {
  const floor = 556;
  const v: View = {cx: PANEL.w / 2, cy: floor, s: 130};
  const dw = 0.6 * v.s;
  const dh = 0.92 * v.s;
  const stop = clamp((t - stopped) / 0.25);
  const pk = pop(t, paper, 2.6, 0.75);
  return (
    <>
      <Local a={a}>
        <line x1={18} y1={floor} x2={PANEL.w - 18} y2={floor} stroke="#3a4a66" strokeWidth={3} />
        {Array.from({length: 8}, (_, i) => {
          const x = (i - 3.5) * 0.665;
          const gone = i < 4 ? clamp((t - (doing + i * 0.5)) / 0.4) : 0;
          const px = v.cx + x * v.s - dw / 2;
          const py = floor - dh;
          return (
            <g key={i}>
              {gone > 0 ? <rect x={px} y={py} width={dw} height={dh} rx={12} fill="none" stroke="#56688a" strokeWidth={2.5} strokeDasharray="8 8" opacity={gone} /> : null}
              <g opacity={1 - gone}>
                <Drum v={v} x={x} y={0} color="#6d7684" />
              </g>
              {gone > 0 && gone < 1 ? <rect x={px} y={py} width={dw} height={dh} rx={12} fill="#fff6d8" opacity={(1 - gone) * 0.85} /> : null}
              {i >= 4 && stop > 0 ? <rect x={px - 6} y={py - 13} width={dw + 12} height={dh + 19} rx={14} fill="none" stroke={C.red} strokeWidth={4} opacity={stop * (0.6 + 0.4 * Math.sin(t * 5 + i))} /> : null}
            </g>
          );
        })}
        {/* where it stopped */}
        {stop > 0 ? <line x1={v.cx} y1={floor + 14} x2={v.cx} y2={floor + 14 - (dh + 44) * stop} stroke={C.red} strokeWidth={9} strokeLinecap="round" /> : null}
      </Local>
      {/* the paper that recorded it */}
      {t >= paper ? (
        <div style={{position: 'absolute', left: PANEL.x + 62, top: PANEL.y + 44 + (1 - Math.min(1, pk)) * 46, width: 612, boxSizing: 'border-box', opacity: clamp(a) * Math.min(1, pk * 2), transform: 'rotate(-1.4deg)', background: PAPER, boxShadow: '0 24px 50px rgba(0,0,0,0.7)', borderRadius: 3, padding: '24px 30px 28px'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: `3px solid ${INK}`, paddingBottom: 12}}>
            <span style={{fontFamily: FONT.mono, fontWeight: 700, fontSize: 26, letterSpacing: '0.03em', color: INK, whiteSpace: 'nowrap'}}>{title}</span>
            <span style={{fontFamily: FONT.mono, fontWeight: 700, fontSize: 32, color: '#8a3a2c'}}>{year}</span>
          </div>
          {[0.94, 0.72, 0.86].map((k, i) => (
            <div key={i} style={{height: 12, width: `${k * 100}%`, background: '#cfc8b2', borderRadius: 3, marginTop: 17}} />
          ))}
        </div>
      ) : null}
    </>
  );
};

/** dec-11. The whole country, and the one place that still has a stockpile like this. */
export const OneOnMap: React.FC<{t: number; a: number; start: number; end: number; quoteAt: number; quote: string; by: string}> = ({t, a, start, end, quoteAt, quote, by}) => {
  const mapH = 400;
  const cam = camAt(t, [
    {at: start, cut: true, lon: -96.3, lat: 38.3, k: 11.6},
    {at: end, lon: -94.4, lat: 39.5, k: 16.5, ease: E.lin},
  ]);
  const proj = projection(cam, [PANEL.w / 2, mapH / 2]);
  const k = pop(t, quoteAt, 3, 0.65);
  return (
    <>
      {a > 0.001 ? (
        <svg width={PANEL.w - 2} height={mapH} style={{position: 'absolute', left: PANEL.x + 1, top: PANEL.y + PANEL.h - mapH - 1, opacity: clamp(a)}}>
          <MapBase proj={proj} cam={cam} lit={{'19': '#234069'}} river={0} counties={0} />
          <Pin proj={proj} at={PLACE.plant} time={t} ping color={C.red} r={10} />
        </svg>
      ) : null}
      {t >= quoteAt ? (
        <div style={{position: 'absolute', left: PANEL.x + 34, top: PANEL.y + 26, opacity: clamp(a) * Math.min(1, k * 2.2), transform: `scale(${0.86 + 0.14 * Math.min(1, k)})`, transformOrigin: '0% 50%'}}>
          <div style={{fontFamily: FONT.display, fontSize: 108, lineHeight: 1.04, color: C.yellow, whiteSpace: 'nowrap'}}>{quote}</div>
          <div style={{marginTop: 12, fontFamily: FONT.mono, fontWeight: 700, fontSize: 26, letterSpacing: '0.16em', color: C.white}}>{by}</div>
        </div>
      ) : null}
    </>
  );
};

/** dec-12. The bath topped up, as it was meant to be; then what happened instead. */
export const KeptWet: React.FC<{t: number; a: number; start: number; cross: number}> = ({t, a, start, cross}) => {
  const s = 560;
  const x = PANEL.w / 2 - 50;
  const y = 596;
  const up = ramp(t, start + 0.1, start + 1.15, E.inOutQuad);
  const down = ramp(t, cross + 0.15, cross + 1.35, E.inOutQuad);
  const level = lerp(lerp(0.3, 1, up), 0.05, down);
  // where the bath should stand: BarrelCut's own geometry for level = 1
  const w = 0.62 * s;
  const h = 0.92 * s;
  const wall = w * 0.045;
  const full = y - h + wall * 1.4 + (h - wall * 2.4) * 0.16;
  const mark = clamp((t - start - 0.9) / 0.3);
  return (
    <Local a={a}>
      <BarrelCut x={x} y={y} s={s} time={t} level={level} needles={down} />
      <g opacity={mark}>
        <line x1={x + w / 2 + 8} y1={full} x2={x + w / 2 + 150} y2={full} stroke={down > 0 ? C.red : C.yellow} strokeWidth={5} strokeDasharray="14 10" />
        <path d={`M ${x + w / 2 + 150} ${full - 16} l 22 16 l -22 16 Z`} fill={down > 0 ? C.red : C.yellow} />
      </g>
    </Local>
  );
};

/**
 * dec-13 and dec-14. A document with no words on it: the review panel's tick, a signature,
 * and then the part that has not been made public, blacked out.
 */
export const Page: React.FC<{t: number; a: number; at: number; stamp: number; sign: number; redact?: number}> = ({t, a, at, stamp, sign, redact}) => {
  const k = pop(t, at, 2.6, 0.75);
  const X = 148;
  const Y = 30;
  const PW = 440;
  const PH = 560;
  const lines = [0.88, 0.96, 0.72, 0.9, 0.84, 0.95, 0.6, 0.86, 0.78];
  const st = clamp((t - stamp) / 0.22);
  const sg = clamp((t - sign) / 0.6);
  const cx = X + 104;
  const cy = Y + PH - 104;
  const red = (delay: number, dur = 0.3) => (redact === undefined ? 0 : clamp((t - redact - delay) / dur));
  const sx = X + 232;
  const sy = Y + PH - 82;
  return (
    <Local a={a}>
      <g transform={`translate(0 ${(1 - Math.min(1, k)) * 70}) rotate(-2 ${X + PW / 2} ${Y + PH / 2})`}>
        <rect x={X + 10} y={Y + 14} width={PW} height={PH} rx={4} fill="#000" opacity={0.5} />
        <rect x={X} y={Y} width={PW} height={PH} rx={4} fill={PAPER} />
        <rect x={X + 36} y={Y + 38} width={PW * 0.46} height={20} rx={3} fill={INK} opacity={0.78} />
        <line x1={X + 36} y1={Y + 78} x2={X + PW - 36} y2={Y + 78} stroke={INK} strokeWidth={3} />
        {lines.map((lw, i) => {
          const ly = Y + 108 + i * 34;
          const r = red(i * 0.09);
          return (
            <g key={i}>
              <rect x={X + 36} y={ly} width={(PW - 72) * lw} height={13} rx={3} fill="#bdb59d" />
              {r > 0 ? <rect x={X + 30} y={ly - 5} width={((PW - 72) * lw + 12) * r} height={23} fill={INK} /> : null}
            </g>
          );
        })}
        {/* the review panel's recommendation */}
        {st > 0 ? (
          <g transform={`translate(${cx} ${cy}) scale(${1 + 0.7 * Math.pow(1 - st, 2)}) rotate(-8)`} opacity={Math.min(1, st * 2)}>
            <circle r={50} fill="none" stroke="#1f4f8f" strokeWidth={7} />
            <path d="M -24 2 L -7 20 L 26 -20" fill="none" stroke="#1f4f8f" strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ) : null}
        {/* hired: a signature */}
        <line x1={sx} y1={sy + 26} x2={X + PW - 36} y2={sy + 26} stroke={INK} strokeWidth={2.5} />
        {sg > 0 ? <path d={`M ${sx + 8} ${sy + 8} c 12 -40 26 -40 30 -4 s 18 34 30 -6 s 18 -30 30 4 s 22 22 62 -14`} fill="none" stroke="#1f4f8f" strokeWidth={5} strokeLinecap="round" pathLength={1} strokeDasharray={`${sg} 1`} /> : null}
        {/* what has not been made public */}
        {red(0.85) > 0 ? <rect x={cx - 64} y={cy - 62} width={128 * red(0.85)} height={124} fill={INK} /> : null}
        {red(1.0) > 0 ? <rect x={sx - 6} y={sy - 40} width={(X + PW - 30 - sx) * red(1.0)} height={78} fill={INK} /> : null}
      </g>
    </Local>
  );
};

/** dec-14. The Army's reason: crystals round the lids. */
export const LidCrystals: React.FC<{t: number; a: number; start: number}> = ({t, a, start}) => {
  const g = ramp(t, start, start + 3.4, E.out);
  return (
    <Local a={a}>
      <BarrelCut x={PANEL.w / 2} y={PANEL.h + 170} s={720} time={t} level={0.08} needles={1} outside={0.2 + 0.8 * g} glow={g} />
    </Local>
  );
};

/** dec-17. The window that stood open for decades, and the shutter coming down on it. */
export const ShutterWindow: React.FC<{t: number; a: number; open: number; closed: number}> = ({t, a, open, closed}) => {
  const X = 46;
  const Y = 36;
  const WW = PANEL.w - 92;
  const WH = 548;
  const v: View = {cx: X + WW / 2, cy: Y + WH - 92, s: 20.5};
  const slam = closed + 0.42;
  const k = t < closed ? 0.07 : t < slam ? lerp(0.07, 1, E.in((t - closed) / 0.42)) : 1 - 0.035 * Math.exp(-(t - slam) * 9) * Math.abs(Math.cos((t - slam) * 22));
  // "open for decades": days going by outside
  const years = clamp((t - open) / Math.max(0.1, closed - open));
  const day = t < closed ? 0.5 - 0.5 * Math.cos(years * Math.PI * 2 * 5) : 0;
  const hgt = WH * k;
  return (
    <Local a={a}>
      <defs>
        <clipPath id="decisionWindow">
          <rect x={X} y={Y} width={WW} height={WH} />
        </clipPath>
      </defs>
      <g clipPath="url(#decisionWindow)">
        <rect x={X} y={Y} width={WW} height={WH} fill="#060b14" />
        <Bunker v={v} time={t} cut={1} crust={1} />
        <rect x={X} y={Y} width={WW} height={WH} fill="#7da2d8" opacity={0.2 * day} />
        {/* the shutter */}
        <rect x={X} y={Y} width={WW} height={hgt} fill="#27303d" />
        {Array.from({length: Math.ceil(hgt / 34) + 1}, (_, i) => (
          <line key={i} x1={X} y1={Y + hgt - i * 34} x2={X + WW} y2={Y + hgt - i * 34} stroke="#141a23" strokeWidth={4} />
        ))}
        <rect x={X} y={Y + hgt - 18} width={WW} height={18} fill="#51607a" />
        <rect x={X + WW / 2 - 46} y={Y + hgt - 13} width={92} height={8} rx={4} fill="#141a23" />
      </g>
      <rect x={X} y={Y} width={WW} height={WH} fill="none" stroke="#51607a" strokeWidth={14} />
      <rect x={X - 16} y={Y + WH + 7} width={WW + 32} height={16} fill="#3a4658" />
    </Local>
  );
};
