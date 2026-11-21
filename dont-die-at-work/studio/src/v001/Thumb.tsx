import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender} from 'remotion';
import '@fontsource/anton/400.css';
import script from '../../../videos/001-valero-nitrogen-duct-tape/script.json';
import {P, View} from '../engine2d/view';
import {Grade, Reticle} from '../engine/hud';
import {C, FONT, H, W} from '../engine/theme';
import {direct} from './direct';
import {TRAY_Y} from './dims';
import {T} from './timeline';
import {World} from './World';

// The first man fishing for the tape, over a vessel the viewer can see is full of gas.
const AT = T.i4 + 0.75;
const VIEW: View = {cx: 560, cy: 900, s: 205};

/** Thumbnail. Its words come from script.json ("thumbnail"), so the verify gate covers them. */
export const Thumb: React.FC = () => {
  const [fonts] = useState(() => delayRender('fonts'));
  useEffect(() => {
    document.fonts.load("400 100px 'Anton'").then(() => continueRender(fonts));
  }, [fonts]);
  const lines = (script as {thumbnail: {lines: string[]}}).thumbnail.lines;
  const tape = P(VIEW, 0.12, TRAY_Y + 0.085);
  const from = {x: 560, y: 520};
  const to = {x: tape[0], y: tape[1] - 86};
  const ang = Math.atan2(to.y - from.y, to.x - from.x);
  const head = (a: number) => `${to.x - Math.cos(ang + a) * 62},${to.y - Math.sin(ang + a) * 62}`;
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <World t={AT} d={direct(AT)} view={VIEW} />
      <Grade frame={3} />
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(3,5,9,0.92) 0%, rgba(3,5,9,0.6) 20%, rgba(3,5,9,0) 30%)'}} />
      <div style={{position: 'absolute', left: 0, top: 84, width: W, textAlign: 'center', fontFamily: FONT.display, lineHeight: 0.98, filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.8))'}}>
        <div style={{fontSize: 164, color: C.white, WebkitTextStroke: '12px #04060a', paintOrder: 'stroke fill', whiteSpace: 'nowrap'}}>{lines[0]}</div>
        <div style={{fontSize: 214, color: C.yellow, WebkitTextStroke: '12px #04060a', paintOrder: 'stroke fill', whiteSpace: 'nowrap'}}>{lines[1]}</div>
      </div>
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
        {[['rgba(0,0,0,0.75)', 30], [C.yellow, 16]].map(([col, w]) => (
          <g key={String(w)} stroke={col as string} strokeWidth={w as number} strokeLinecap="round" strokeLinejoin="round" fill="none">
            <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} />
            <polyline points={`${head(0.5)} ${to.x},${to.y} ${head(-0.5)}`} />
          </g>
        ))}
      </svg>
      <Reticle at={{x: tape[0], y: tape[1]}} r={56} a={1} time={0.35} />
    </AbsoluteFill>
  );
};
