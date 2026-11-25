import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C} from '../engine/theme';
import {rnd} from '../engine/time';
import {Bunker} from './draw/Bunker';
import {useFonts} from './fonts';
import {Backdrop, Grade16, H, Txt, W} from './kit';
import {BarnBody, BarnDoors, Cow, Fence, Silo, Windmill} from './scenes/parts/FarmsPictos';
import {os, thumbLine} from './script';

/** Thumbnail: the title over the cut-open bunker. */
export const Thumb: React.FC = () => {
  useFonts();
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <Backdrop />
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
        <Bunker v={{cx: 1340, cy: 860, s: 74}} time={3} cut={1} crust={1} />
        <defs>
          <radialGradient id="thumbGlow">
            <stop offset="0%" stopColor={C.red} stopOpacity={0.42} />
            <stop offset="100%" stopColor={C.red} stopOpacity={0} />
          </radialGradient>
        </defs>
        <circle cx={1340} cy={790} r={420} fill="url(#thumbGlow)" />
      </svg>
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(4,6,10,0.92) 0%, rgba(4,6,10,0.75) 42%, rgba(4,6,10,0) 70%)'}} />
      <Txt x={84} y={150} w={1200} size={270} font="display" lh={0.96} outline={14}>{os('cold-title', 0)}</Txt>
      <Txt x={84} y={410} w={1300} size={270} font="display" lh={0.96} color={C.yellow} outline={14}>{os('cold-title', 1)}</Txt>
      <Txt x={90} y={720} w={1100} size={50} font="mono" weight={700} spacing="0.12em" nowrap>{os('cold-title', 2)}</Txt>
      <Grade16 frame={0} />
    </AbsoluteFill>
  );
};

/** The day-of thumbnail: the same bunker going up, with the date and the hour. Every word is from the script. */
export const ThumbToday: React.FC = () => {
  useFonts();
  const tag: React.CSSProperties = {position: 'absolute', left: 84, background: C.red, color: '#04060a', fontFamily: "'Anton', sans-serif", fontSize: 88, lineHeight: 1, padding: '16px 30px 8px', whiteSpace: 'nowrap'};
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <Backdrop />
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
        <Bunker v={{cx: 1480, cy: 940, s: 54}} time={3} cut={1} blast={0.6} wind={0.2} />
      </svg>
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(4,6,10,0.9) 0%, rgba(4,6,10,0.66) 40%, rgba(4,6,10,0) 64%)'}} />
      <Txt x={84} y={96} w={1200} size={236} font="display" lh={0.96} outline={13} nowrap>{os('cold-title', 0)}</Txt>
      <Txt x={84} y={326} w={1200} size={236} font="display" lh={0.96} color={C.yellow} outline={13} nowrap>{os('cold-2', 0)}</Txt>
      <div style={{...tag, top: 604}}>{os('cold-4', 0)}</div>
      <div style={{...tag, top: 730}}>{os('cold-4', 1)}</div>
      <Grade16 frame={0} />
    </AbsoluteFill>
  );
};

/**
 * The day-of thumbnail Nick asked for: rain over an Iowa farm, and the rain is the colour of lead.
 * It is a picture of the worry, not a map: nobody knows yet where the dust comes down.
 */
export const ThumbRain: React.FC = () => {
  useFonts();
  const GY = 940;
  const BX = 955; // where the blast stands on the horizon
  const big: React.CSSProperties = {position: 'absolute', left: 64, top: 176, fontFamily: "'Anton', sans-serif", fontSize: 372, lineHeight: 1, whiteSpace: 'nowrap', letterSpacing: '0.01em'};
  const lean = (20 * Math.PI) / 180;
  const streak = (i: number, key: string, front = false) => {
    const x = rnd(i * 1.71) * 2200 - 80;
    const y = rnd(i * 3.37) * 1120 - 60;
    const len = (front ? 110 : 64) + rnd(i * 5.13) * 96;
    const lead = i % 3 === 0;
    return <line key={key} x1={x} y1={y} x2={x - Math.sin(lean) * len} y2={y + Math.cos(lean) * len} stroke={lead ? C.cyan : '#b4c2d2'} strokeWidth={front ? 9 : 5.5} strokeLinecap="round" opacity={(front ? 0.95 : 0.6) * (0.55 + 0.45 * rnd(i * 7.7))} />;
  };
  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #0a1322 0%, #111d33 52%, #1a2a40 100%)'}}>
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
        <defs>
          <radialGradient id="rainGlow" cx={BX / W} cy={GY / H} r="0.42">
            <stop offset="0%" stopColor="#ffd98a" stopOpacity={0.75} />
            <stop offset="45%" stopColor={C.warm} stopOpacity={0.3} />
            <stop offset="100%" stopColor={C.warm} stopOpacity={0} />
          </radialGradient>
        </defs>
        <rect x={0} y={0} width={W} height={H} fill="url(#rainGlow)" />
        {/* the dust cloud */}
        {Array.from({length: 46}, (_, i) => (
          <circle key={i} cx={520 + rnd(i * 2.3) * 1500} cy={-70 + rnd(i * 4.9) * 300} r={130 + rnd(i * 6.1) * 150} fill={i % 3 ? '#5c574e' : '#3d3a35'} opacity={0.62} />
        ))}
        {/* the blast, far off behind the farm: a column of dust going up into that cloud, and the burst at its foot */}
        {Array.from({length: 30}, (_, i) => {
          const u = i / 29;
          return <circle key={`s${i}`} cx={BX + 30 + u * 150 + (rnd(i * 3.3) - 0.5) * (120 + u * 260)} cy={GY - 150 - u * 520} r={74 + u * 96 + rnd(i * 7.1) * 30} fill={i % 2 ? '#57524a' : '#403c36'} opacity={0.96} />;
        })}
        {[
          {r: 300, fill: '#c8431c', seed: 1},
          {r: 236, fill: '#ff7a2a', seed: 2},
          {r: 168, fill: '#ffd35a', seed: 3},
          {r: 92, fill: '#fffdf0', seed: 4},
        ].map((layer) => (
          <polygon
            key={layer.seed}
            fill={layer.fill}
            points={Array.from({length: 22}, (_, i) => {
              const ang = Math.PI * (i / 21);
              const r = layer.r * (i % 2 ? 0.62 : 1) * (0.86 + 0.28 * rnd(i * 2.7 + layer.seed));
              return `${BX - Math.cos(ang) * r},${GY + 6 - Math.sin(ang) * r * 0.78}`;
            }).join(' ')}
          />
        ))}
        {Array.from({length: 12}, (_, i) => {
          const ang = Math.PI * (0.08 + 0.84 * (i / 11));
          const r0 = 300 + rnd(i * 4.1) * 50;
          const len = 30 + rnd(i * 6.7) * 54;
          const x = BX - Math.cos(ang) * r0;
          const y = GY - Math.sin(ang) * r0 * 0.78;
          return <line key={`d${i}`} x1={x} y1={y} x2={x - Math.cos(ang) * len} y2={y - Math.sin(ang) * len * 0.78} stroke="#ffcf5a" strokeWidth={8} strokeLinecap="round" opacity={0.9} />;
        })}
        {Array.from({length: 120}, (_, i) => streak(i, `b${i}`))}
        {/* the farm */}
        <rect x={0} y={GY} width={W} height={H - GY} fill="#0b130d" />
        <g transform={`translate(0 ${GY})`}>
          <line x1={0} y1={0} x2={W} y2={0} stroke="#4c6b45" strokeWidth={5} />
          <Windmill x={1766} time={1.3} />
          <Silo x={1586} />
          <BarnBody x={1186} lit={0.85} />
          <BarnDoors x={1186} shut={0.35} />
          <Fence x0={40} x1={1150} />
          <Cow x={250} flip graze={0} time={0.4} seed={1} />
          <Cow x={560} graze={1} time={1.1} seed={2} />
          {Array.from({length: 26}, (_, i) => (
            <ellipse key={i} cx={40 + rnd(i * 3.9) * 1840} cy={6 + rnd(i * 8.3) * 60} rx={16 + rnd(i * 2.1) * 20} ry={4} fill="none" stroke={i % 3 === 0 ? C.cyan : '#b4c2d2'} strokeWidth={3} opacity={0.75} />
          ))}
        </g>
        {Array.from({length: 46}, (_, i) => streak(i + 500, `f${i}`, true))}
      </svg>
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(4,6,10,0.62) 0%, rgba(4,6,10,0.36) 52%, rgba(4,6,10,0) 80%)'}} />
      <Txt x={70} y={40} w={1500} size={150} font="display" outline={13} nowrap>{thumbLine(0)}</Txt>
      <div style={{...big, color: '#04060a', WebkitTextStroke: '34px #04060a'}}>{thumbLine(1)}</div>
      <div style={{...big, backgroundImage: 'linear-gradient(180deg, #ffffff 6%, #d5e0ec 36%, #8296ab 58%, #c2d0de 92%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'}}>{thumbLine(1)}</div>
      <div style={{position: 'absolute', left: 70, top: 588, background: C.red, color: '#04060a', fontFamily: "'Anton', sans-serif", fontSize: 104, lineHeight: 1, padding: '18px 34px 9px', whiteSpace: 'nowrap', boxShadow: '0 16px 40px rgba(0,0,0,0.6)'}}>
        {thumbLine(2)} · {os('cold-4', 1)}
      </div>
      <Grade16 frame={0} />
    </AbsoluteFill>
  );
};
