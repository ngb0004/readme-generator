import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import '@fontsource/anton/400.css';
import '@fontsource/jetbrains-mono/700.css';
import script from '../../../videos/001-valero-nitrogen-duct-tape/script.json';
import {CamState, project} from '../engine/cam';
import {Grade, Reticle} from '../engine/hud';
import {C, FONT, H, W} from '../engine/theme';
import {TAPE} from './dims';
import {Scene} from './Scene';
import {T} from './timeline';

// The moment the first man is fishing for the tape, framed so the title sits in clear sky.
const CAM: CamState = {p: [1.0, 1.2, 12.6], t: [0, 0.62, 0], fov: 30};
const AT = T.first + 1.05;

/** Thumbnail. Its words come from script.json ("thumbnail"), so the verify gate covers them. */
export const Thumb: React.FC = () => {
  const [fonts] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all(["400 100px 'Anton'", "700 20px 'JetBrains Mono'"].map((f) => document.fonts.load(f))).then(() => continueRender(fonts));
  }, [fonts]);
  const lines = (script as {thumbnail: {lines: string[]}}).thumbnail.lines;
  const tape = project(CAM, TAPE);
  const from = {x: 540, y: 492};
  const to = {x: tape.x, y: tape.y - 96};
  const ang = Math.atan2(to.y - from.y, to.x - from.x);
  const head = (a: number) => `${to.x - Math.cos(ang + a) * 62},${to.y - Math.sin(ang + a) * 62}`;
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <ThreeCanvas width={W} height={H} shadows gl={{antialias: true}} camera={{fov: 30}}>
        <Scene time={AT} cam={CAM} />
      </ThreeCanvas>
      <Grade frame={3} />
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(3,5,9,0.9) 0%, rgba(3,5,9,0.6) 20%, rgba(3,5,9,0) 31%)'}} />
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
      <Reticle at={tape} r={64} a={1} time={0.35} />
    </AbsoluteFill>
  );
};
