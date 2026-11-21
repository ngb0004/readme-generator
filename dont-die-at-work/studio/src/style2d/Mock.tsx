import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, useCurrentFrame} from 'remotion';
import '@fontsource/anton/400.css';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/700.css';
import {Grade} from '../engine/hud';
import {C, FONT, FPS, H, W} from '../engine/theme';
import {TRAY_Y} from '../v001/dims';
import {Pictogram, Pose2D} from './Pictogram';
import {Backdrop, Defs, Nitrogen, Reactor, View, at} from './Section';

const FACES = ["400 100px 'Anton'", "600 40px 'Barlow Condensed'", "700 40px 'Barlow Condensed'", "500 20px 'JetBrains Mono'", "700 20px 'JetBrains Mono'"];

const Caption: React.FC<{words: string[]; active: number; y?: number}> = ({words, active, y = 1296}) => (
  <div style={{position: 'absolute', left: 0, top: y, width: W, textAlign: 'center', fontFamily: FONT.display, fontSize: 112, lineHeight: 1, whiteSpace: 'nowrap', filter: 'drop-shadow(0 10px 18px rgba(0,0,0,0.75))'}}>
    {words.map((w, i) => (
      <span key={i} style={{display: 'inline-block', margin: '0 0.11em', color: i === active ? C.yellow : C.white, WebkitTextStroke: '15px #04060a', paintOrder: 'stroke fill'}}>{w}</span>
    ))}
  </div>
);

const Note: React.FC<{x: number; y: number; title: string; sub?: string; color?: string; align?: 'left' | 'right' | 'center'; from?: [number, number]; to?: [number, number]}> = ({x, y, title, sub, color = C.white, align = 'left', from, to}) => (
  <>
    {from && to ? (
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
        <path d={`M ${from[0]} ${from[1]} L ${to[0]} ${to[1]}`} stroke="rgba(0,0,0,0.6)" strokeWidth={8} fill="none" />
        <path d={`M ${from[0]} ${from[1]} L ${to[0]} ${to[1]}`} stroke={color} strokeWidth={3.5} fill="none" />
        <circle cx={to[0]} cy={to[1]} r={8} fill="#05080f" stroke={color} strokeWidth={3.5} />
      </svg>
    ) : null}
    <div style={{position: 'absolute', left: align === 'left' ? x : align === 'center' ? x - 500 : undefined, right: align === 'right' ? W - x : undefined, width: align === 'center' ? 1000 : undefined, top: y, textAlign: align}}>
      <div style={{fontFamily: FONT.display, fontSize: 56, lineHeight: 1, color, letterSpacing: '0.02em', textShadow: '0 4px 16px rgba(0,0,0,0.95), 0 0 2px rgba(0,0,0,0.9)'}}>{title}</div>
      {sub ? <div style={{fontFamily: FONT.label, fontWeight: 600, fontSize: 35, color: C.white, opacity: 0.9, marginTop: 6, letterSpacing: '0.03em', textShadow: '0 3px 12px rgba(0,0,0,0.95)'}}>{sub}</div> : null}
    </div>
  </>
);

const Top: React.FC = () => (
  <div style={{position: 'absolute', left: 70, top: 96, opacity: 0.78}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 12, fontFamily: FONT.mono, fontWeight: 700, fontSize: 23, letterSpacing: '0.16em', color: C.white}}>
      <span style={{width: 13, height: 13, borderRadius: 13, background: C.yellow, display: 'inline-block'}} />
      ANIMATED RECONSTRUCTION
    </div>
    <div style={{fontFamily: FONT.mono, fontSize: 19, letterSpacing: '0.1em', color: C.mute, marginTop: 7}}>SOURCE: U.S. CHEMICAL SAFETY BOARD · CASE STUDY 2006-02-I-DE</div>
  </div>
);

/** Style frames for the diagram look. `shot` 0: what they're standing over. 1: on the rim. */
export const Mock: React.FC<{shot?: number}> = ({shot}) => {
  const frame = useCurrentFrame();
  const which = shot ?? frame;
  const time = 3 + frame / FPS;
  const [fonts] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all(FACES.map((f) => document.fonts.load(f))).then(() => continueRender(fonts));
  }, [fonts]);

  if (which === 0) {
    const v: View = {cx: 540, cy: 700, s: 178};
    const h = 1.78 * v.s;
    const A: Pose2D = {x: at(v, -1.06, 0)[0], y: at(v, 0, 0.93)[1], lean: 22, head: 26, armA: 58, foreA: 26, armB: 44, foreB: 30, legA: 10, shinA: -6, legB: -12, shinB: 4};
    const B: Pose2D = {x: at(v, 1.22, 0)[0], y: at(v, 0, 0.93)[1], lean: 8, head: 18, armA: 14, foreA: 16, armB: -4, foreB: 12, legA: 6, shinA: 0, legB: -6, shinB: 0};
    const Cc: Pose2D = {x: at(v, 2.25, 0)[0], y: at(v, 0, 0.93)[1], lean: 3, head: 6, armA: 5, foreA: 6, armB: -5, foreB: 4, legA: 4, shinA: 0, legB: -4, shinB: 0};
    const hand: [number, number] = [A.x + 172, A.y - 62];
    const tape = at(v, 0.12, TRAY_Y + 0.085);
    const inlet = at(v, -1.84, -3.05);
    return (
      <AbsoluteFill style={{background: C.bg}}>
        <svg width={W} height={H} style={{position: 'absolute'}}>
          <Defs />
          <Backdrop w={W} h={H} horizon={at(v, 0, -0.4)[1]} time={time} />
          <Reactor v={v} part="back" />
          <Nitrogen v={v} time={time} level={1} cloud={1} />
          {/* flow: in at the side, up through the catalyst, out the top */}
          {[0, 1, 2, 3, 4].map((i) => {
            const k = (time * 0.6 + i / 5) % 1;
            const [x, y] = at(v, -0.9 + i * 0.45, -2.2 - 1.2 * (1 - k));
            return <path key={i} d={`M ${x - 16} ${y + 12} L ${x} ${y - 8} L ${x + 16} ${y + 12}`} fill="none" stroke={C.cyan} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" opacity={Math.sin(k * Math.PI)} />;
          })}
          <Reactor v={v} part="front" />
          {/* temporary nitrogen supply, with its valve */}
          <g>
            <line x1={0} y1={inlet[1]} x2={inlet[0]} y2={inlet[1]} stroke="#2a3a55" strokeWidth={30} />
            <line x1={0} y1={inlet[1]} x2={inlet[0]} y2={inlet[1]} stroke={C.cyan} strokeWidth={10} strokeDasharray="26 22" strokeDashoffset={-time * 90} opacity={0.9} />
            <path d={`M 150 ${inlet[1] - 30} L 210 ${inlet[1] + 30} L 210 ${inlet[1] - 30} L 150 ${inlet[1] + 30} Z`} fill="#0b1422" stroke={C.white} strokeWidth={4} strokeLinejoin="round" />
            <line x1={180} y1={inlet[1]} x2={180} y2={inlet[1] - 54} stroke={C.white} strokeWidth={4} />
            <line x1={156} y1={inlet[1] - 54} x2={204} y2={inlet[1] - 54} stroke={C.white} strokeWidth={6} strokeLinecap="round" />
          </g>
          {/* the wire, the tape */}
          <path d={`M ${hand[0] - 130} ${hand[1] - 250} L ${hand[0]} ${hand[1]} Q ${hand[0] + 30} ${hand[1] + 90} ${tape[0] - 10} ${v.cy + 30} L ${tape[0] - 14} ${tape[1] - 26} q 2 22 18 18`} fill="none" stroke="#eef3fb" strokeWidth={4.5} strokeLinecap="round" />
          <rect x={tape[0] - 12} y={tape[1] - 6} width={24} height={11} rx={3} fill="#e7ebf2" />
          <g stroke={C.yellow} strokeWidth={4} fill="none">
            {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy], i) => (
              <path key={i} d={`M ${tape[0] + sx * 34} ${tape[1] + sy * 14} L ${tape[0] + sx * 34} ${tape[1] + sy * 30} L ${tape[0] + sx * 18} ${tape[1] + sy * 30}`} />
            ))}
          </g>
          <Pictogram p={Cc} h={h} color="#7ea6e8" opacity={0.9} />
          <Pictogram p={B} h={h} color="#eef2f8" band="#9aa7bb" flip />
          <Pictogram p={A} h={h} color={C.yellow} band="#0b0f16" glow="rgba(255,194,26,0.35)" />
          <rect x={0} y={1180} width={W} height={740} fill="url(#fadeDown)" />
        </svg>
        <Grade frame={frame} />
        <Top />
        <Note x={540} y={214} align="center" title="THE ONLY WAY OUT" sub="a 24-inch manway" color={C.cyan} from={[540, 322]} to={[at(v, 0.05, 0)[0], at(v, 0, 0.95)[1]]} />
        <Note x={1024} y={792} align="right" title="NITROGEN" sub="pumped in on purpose" color={C.cyan} from={[800, 836]} to={at(v, 0.62, -0.95)} />
        <Note x={56} y={1010} title="NEW CATALYST" sub="must not touch oxygen" color="#eab366" from={[330, 1110]} to={at(v, -0.7, -2.5)} />
        <Caption words={['PUMPED', 'FULL', 'OF']} active={1} />
      </AbsoluteFill>
    );
  }

  const v: View = {cx: 560, cy: 1010, s: 400};
  const h = 1.78 * v.s;
  const A: Pose2D = {x: at(v, -0.4, 0)[0], y: at(v, 0, 0.12)[1], lean: 34, head: 30, armA: 30, foreA: -8, armB: -38, foreB: 22, legA: 84, shinA: -82, legB: 76, shinB: -80};
  const hand: [number, number] = [A.x + 262, A.y + 10];
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <svg width={W} height={H} style={{position: 'absolute'}}>
        <Defs />
        <Backdrop w={W} h={H} horizon={at(v, 0, -0.2)[1]} time={time} />
        <Reactor v={v} part="back" />
        <Nitrogen v={v} time={time} level={1} cloud={1} />
        <Reactor v={v} part="front" />
        <path d={`M ${hand[0] - 150} ${hand[1] - 520} L ${hand[0]} ${hand[1]} L ${hand[0] + 8} ${H}`} fill="none" stroke="#eef3fb" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
        <Pictogram p={A} h={h} color={C.yellow} band="#0b0f16" glow="rgba(255,194,26,0.3)" />
        {/* where the report says nitrogen may have collected */}
        <ellipse cx={v.cx} cy={at(v, 0, 0.62)[1]} rx={1.12 * v.s} ry={0.86 * v.s} fill="none" stroke={C.cyan} strokeWidth={4} strokeDasharray="18 16" strokeDashoffset={-time * 30} opacity={0.9} />
        <rect x={0} y={1320} width={W} height={600} fill="url(#fadeDown)" />
      </svg>
      <Grade frame={frame} />
      <Top />
      <Note x={70} y={232} title="CALM AIR. NO WIND." sub="CSB: nitrogen may have pooled above the opening" color={C.cyan} from={[150, 352]} to={[at(v, -0.86, 0)[0], at(v, 0, 1.17)[1]]} />
      <Note x={1024} y={1188} align="right" title="INSIDE: NEAR ZERO OXYGEN" color={C.red} from={[760, 1184]} to={at(v, 0.2, -0.3)} />
      <Caption words={['LEGS', 'INSIDE']} active={1} y={1420} />
    </AbsoluteFill>
  );
};
