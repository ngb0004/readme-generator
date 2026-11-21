import React from 'react';
import {Chip, Leader, Tag} from '../engine/hud';
import {C, FONT, H, W} from '../engine/theme';
import {E, clamp, lerp, noise, ramp, rnd, spring, window as win} from '../engine/time';
import {os} from './Cards';
import {Defs} from './Section';
import {T} from './timeline';

/**
 * What the tank is, for someone who has never seen one.
 * A schematic, not to scale: running (heavy oil in, heat and pressure, fuel out),
 * then worn out, shut down, opened at the top, refilled, and pumped full of nitrogen.
 */
const CX = 540;
const HW = 190; // half-width of the tank
const TOP = 560; // where the straight wall starts
const BOT = 1000; // where it ends
const BED_TOP = 650;
const BED_BOT = 975;
const NECK = {x0: 500, x1: 580, y0: 424, y1: 478};
const LINE = '#8db1e6';

const shell = `M ${CX - HW} ${TOP} A ${HW} 92 0 0 1 ${CX + HW} ${TOP} L ${CX + HW} ${BOT} A ${HW} 62 0 0 1 ${CX - HW} ${BOT} Z`;
const pop = (t: number, at: number) => clamp(spring(t - at, 3.4, 0.6), 0, 1.2);

const Pump: React.FC<{x: number; y: number; on: number}> = ({x, y, on}) => (
  <g transform={`translate(${x} ${y})`} opacity={0.35 + 0.65 * on}>
    <rect x={-26} y={-34} width={44} height={68} rx={6} fill="#ffc85a" />
    <rect x={-18} y={-26} width={28} height={20} rx={3} fill="#0b1422" />
    <path d="M 18 -18 q 16 4 16 22 l 0 22" fill="none" stroke="#ffc85a" strokeWidth={7} strokeLinecap="round" />
    <rect x={-32} y={34} width={56} height={8} rx={3} fill="#ffc85a" />
  </g>
);
const Jet: React.FC<{x: number; y: number; on: number}> = ({x, y, on}) => (
  <g transform={`translate(${x} ${y}) rotate(-18)`} opacity={0.35 + 0.65 * on} fill="#bfe3ff">
    <path d="M -46 0 Q -46 -9 -30 -9 L 34 -9 Q 50 -6 54 0 Q 50 6 34 9 L -30 9 Q -46 9 -46 0 Z" />
    <path d="M -8 -8 L -30 -40 L -16 -40 L 14 -8 Z" />
    <path d="M -8 8 L -30 40 L -16 40 L 14 8 Z" />
    <path d="M -40 -6 L -54 -24 L -44 -24 L -30 -6 Z" />
  </g>
);

export const Machine: React.FC<{t: number}> = ({t}) => {
  const t0 = T.ma2;
  // running
  const oilIn = win(t, T.inside, T.shut + 0.1, 0.4, 0.7);
  const heat = win(t, T.cooked, T.shut + 0.3, 0.5, 0.9);
  const prod = win(t, T.breaks, T.shut + 0.1, 0.5, 0.7);
  const fuel = pop(t, T.purpose);
  // worn out, shut down, opened, refilled
  const worn = ramp(t, T.wears + 0.2, T.wears + 1.3);
  const lid = ramp(t, T.opened, T.opened + 0.9, E.inOutQuad);
  const drain = ramp(t, T.opened + 0.75, T.refilled + 0.05, E.inOutQuad);
  const refill = ramp(t, T.refilled, T.refilled + 1.25, E.inOutQuad);
  const fresh = refill > 0.02;
  // oxygen, then nitrogen
  const o2 = win(t, T.ma4 + 0.1, T.pumped + 0.7, 0.3, 0.7);
  const n2 = ramp(t, T.pumped + 0.15, T.onPurpose + 0.5, E.inOutQuad);
  const reseat = ramp(t, T.kept + 0.5, T.bolted + 0.15, E.inOutQuad);
  const sealed = ramp(t, T.bolted + 0.15, T.bolted + 0.55);

  const bedTop = fresh ? lerp(BED_BOT, BED_TOP, refill) : lerp(BED_TOP, BED_BOT, drain);
  const n2Top = lerp(BOT + 62, NECK.y0, n2);
  const lidX = lid * 250;
  const lidY = -lid * 64;

  const label = (text: string, x: number, y: number, a: number, color = C.white, size = 46) => (
    <div style={{position: 'absolute', left: x - 300, top: y, width: 600, textAlign: 'center', fontFamily: FONT.label, fontWeight: 700, fontSize: size, letterSpacing: '0.04em', color, opacity: clamp(a), textShadow: '0 3px 12px #000, 0 0 3px #000', whiteSpace: 'nowrap'}}>{text}</div>
  );

  return (
    <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 90% 60% at 50% 40%, #0c1626 0%, #05080f 72%)'}}>
      <div style={{position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(#152136 1px, transparent 1px), linear-gradient(90deg, #152136 1px, transparent 1px)', backgroundSize: '48px 48px', opacity: 0.45}} />
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, transform: `scale(${lerp(0.93, 1.03, ramp(t, t0, T.m1, E.lin))})`, transformOrigin: '50% 40%'}}>
        <Defs />
        <defs>
          <clipPath id="inTank">
            <path d={shell} />
            <rect x={NECK.x0} y={NECK.y0} width={NECK.x1 - NECK.x0} height={NECK.y1 - NECK.y0 + 12} />
          </clipPath>
          <radialGradient id="heat">
            <stop offset="0" stopColor="#ff7a1a" stopOpacity={0.85} />
            <stop offset="0.6" stopColor="#ff3b1a" stopOpacity={0.35} />
            <stop offset="1" stopColor="#ff3b1a" stopOpacity={0} />
          </radialGradient>
          <pattern id="catFresh" width={22} height={19} patternUnits="userSpaceOnUse">
            <rect width={22} height={19} fill="#2a1d0c" />
            <circle cx={5} cy={5} r={3.8} fill="#f0b45e" />
            <circle cx={16} cy={14} r={3.8} fill="#e09a3e" />
            <circle cx={16} cy={3.5} r={2.3} fill="#b9792c" />
            <circle cx={5} cy={14.5} r={2.3} fill="#b9792c" />
          </pattern>
          <pattern id="catWorn" width={22} height={19} patternUnits="userSpaceOnUse">
            <rect width={22} height={19} fill="#15130f" />
            <circle cx={5} cy={5} r={3.6} fill="#5a5448" />
            <circle cx={16} cy={14} r={3.6} fill="#4a453c" />
            <circle cx={16} cy={3.5} r={2.2} fill="#3a362f" />
            <circle cx={5} cy={14.5} r={2.2} fill="#3a362f" />
          </pattern>
        </defs>

        {/* the rest of the refinery, faint, so the tank reads as one part of something bigger */}
        <g opacity={0.5} fill="#0e1828" stroke="#1d2c44" strokeWidth={2}>
          <rect x={40} y={520} width={90} height={560} rx={44} />
          <rect x={160} y={700} width={110} height={380} rx={20} />
          <rect x={830} y={600} width={80} height={480} rx={40} />
          <rect x={940} y={470} width={100} height={610} rx={48} />
          <line x1={0} y1={1080} x2={W} y2={1080} strokeWidth={6} />
        </g>
        {[[85, 560], [85, 700], [215, 740], [215, 880], [870, 640], [870, 800], [990, 520], [990, 690], [990, 860]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={5} fill={C.warm} opacity={ramp(t, t0 + 0.5 + i * 0.12, t0 + 0.8 + i * 0.12) * (0.55 + 0.3 * Math.sin(t * 1.3 + i))} />
        ))}
        {/* the tank this story is about */}
        <path d={shell} fill="none" stroke={C.yellow} strokeWidth={10} opacity={win(t, t0 + 0.1, T.purpose, 0.3, 0.5) * (0.45 + 0.35 * Math.sin(t * 5))} />

        {/* nitrogen supply and its valve */}
        <g opacity={ramp(t, T.pumped - 0.4, T.pumped)}>
          <line x1={0} y1={930} x2={CX - HW} y2={930} stroke="#2a3a55" strokeWidth={30} />
          <line x1={0} y1={930} x2={CX - HW} y2={930} stroke={C.cyan} strokeWidth={10} strokeDasharray="26 22" strokeDashoffset={-t * 110} opacity={n2 > 0.01 ? 0.95 : 0.25} />
          <path d="M 152 902 L 208 958 L 208 902 L 152 958 Z" fill="#0b1422" stroke={C.white} strokeWidth={4} strokeLinejoin="round" />
          <line x1={180} y1={930} x2={180} y2={882} stroke={C.white} strokeWidth={4} />
          <line x1={156} y1={882} x2={204} y2={882} stroke={C.white} strokeWidth={6} strokeLinecap="round" transform={`rotate(${n2 > 0.01 ? 90 * ramp(t, T.pumped, T.pumped + 0.4) : 0} 180 882)`} />
        </g>

        {/* outlet and where the fuel goes */}
        <g fill="none" stroke="#2a3a55" strokeWidth={26} strokeLinejoin="round">
          <path d={`M ${CX} ${BOT + 56} L ${CX} 1102 M 300 1102 L 780 1102`} />
        </g>
        {Array.from({length: 26}, (_, i) => {
          const k = (rnd(i * 2.7) + t * (0.5 + rnd(i * 4.3) * 0.3)) % 1;
          const left = i % 2 === 0;
          const x = k < 0.2 ? CX : lerp(CX, left ? 310 : 770, (k - 0.2) / 0.8);
          const y = k < 0.2 ? lerp(BOT + 60, 1102, k / 0.2) : 1102;
          return <circle key={i} cx={x} cy={y} r={7} fill={left ? '#ffc85a' : '#bfe3ff'} opacity={prod * Math.sin(k * Math.PI)} />;
        })}
        <Pump x={300} y={1150} on={Math.max(prod, fuel > 0 ? Math.min(1, fuel) * (1 - ramp(t, T.purpose + 0.9, T.purpose + 1.5)) : 0)} />
        <Jet x={784} y={1150} on={Math.max(prod, fuel > 0 ? Math.min(1, fuel) * (1 - ramp(t, T.purpose + 0.9, T.purpose + 1.5)) : 0)} />

        {/* the tank */}
        <path d={shell} fill="#0b1422" />
        <rect x={NECK.x0} y={NECK.y0} width={NECK.x1 - NECK.x0} height={NECK.y1 - NECK.y0 + 14} fill="#0b1422" />
        <g clipPath="url(#inTank)">
          {/* the material that does the work */}
          <rect x={CX - HW} y={bedTop} width={HW * 2} height={BED_BOT - bedTop} fill={fresh ? 'url(#catFresh)' : 'url(#catalyst)'} />
          {!fresh && worn > 0 ? <rect x={CX - HW} y={bedTop} width={HW * 2} height={BED_BOT - bedTop} fill="url(#catWorn)" opacity={worn} /> : null}
          {win(t, T.ma3 + 0.2, T.wears, 0.3, 0.3) > 0 ? <rect x={CX - HW + 6} y={BED_TOP} width={HW * 2 - 12} height={BED_BOT - BED_TOP} fill="none" stroke={C.yellow} strokeWidth={6} opacity={win(t, T.ma3 + 0.2, T.wears, 0.3, 0.3) * (0.6 + 0.4 * Math.sin(t * 7))} /> : null}
          {/* heavy oil working its way down, getting lighter as it goes */}
          {Array.from({length: 70}, (_, i) => {
            const k = (rnd(i * 1.9) + t * (0.22 + rnd(i * 3.1) * 0.12)) % 1;
            const y = lerp(NECK.y1, BOT + 40, k);
            const spread = Math.min(1, (y - NECK.y1) / 120);
            const x = CX + (rnd(i * 5.7) * 2 - 1) * lerp(26, HW - 22, spread) + noise(t + i, i) * 5;
            const light = clamp((y - BED_TOP) / (BED_BOT - BED_TOP));
            const col = `rgb(${Math.round(lerp(64, 255, light))},${Math.round(lerp(40, 196, light))},${Math.round(lerp(22, 84, light))})`;
            return <circle key={i} cx={x} cy={y} r={lerp(10, 6, light)} fill={col} stroke={light < 0.3 ? '#9a6a3a' : 'none'} strokeWidth={2} opacity={oilIn * Math.sin(k * Math.PI) * (1 - worn * 0.6)} />;
          })}
          {/* heat and pressure */}
          {heat > 0 ? <ellipse cx={CX} cy={(TOP + BOT) / 2} rx={HW * 1.25} ry={300} fill="url(#heat)" opacity={heat * (0.75 + 0.2 * Math.sin(t * 9) + 0.05 * noise(t * 4, 3))} /> : null}
          {/* fresh material pouring in through the open top */}
          {refill > 0 && refill < 1
            ? Array.from({length: 40}, (_, i) => {
                const k = (rnd(i * 2.1) + t * (1.1 + rnd(i * 3.3) * 0.6)) % 1;
                return <circle key={i} cx={CX + (rnd(i * 6.1) * 2 - 1) * lerp(20, 120, k)} cy={lerp(NECK.y0 - 30, bedTop, k)} r={6} fill="#f0b45e" />;
              })
            : null}
          {/* oxygen drifting in from the open top: the fresh batch cannot touch it */}
          {o2 > 0
            ? Array.from({length: 26}, (_, i) => {
                const k = (rnd(i * 3.7) + t * (0.12 + rnd(i * 2.3) * 0.08)) % 1;
                const pushed = n2;
                const y = lerp(lerp(NECK.y0 - 60, BED_TOP - 16, k), NECK.y0 - 120 - rnd(i) * 120, pushed);
                const x = CX + (rnd(i * 8.3) * 2 - 1) * lerp(24, 150, Math.min(1, k * 1.4)) * (1 - pushed * 0.7);
                return <circle key={i} cx={x} cy={y} r={9} fill="#ffffff" opacity={o2 * 0.95} />;
              })
            : null}
          {/* nitrogen, pumped in from below until it fills the tank */}
          {n2 > 0 ? <rect x={CX - HW} y={n2Top} width={HW * 2} height={BOT + 70 - n2Top} fill={C.cyan} opacity={0.5} /> : null}
          {n2 > 0
            ? Array.from({length: 46}, (_, i) => {
                const k = (rnd(i * 1.3) + t * (0.2 + rnd(i * 2.9) * 0.15)) % 1;
                const y = lerp(BOT + 40, n2Top + 10, k);
                return <circle key={i} cx={CX + (rnd(i * 4.7) * 2 - 1) * (y < TOP - 40 ? 30 : HW - 26)} cy={y} r={16 + rnd(i * 7) * 22} fill="url(#puff)" opacity={0.8 * Math.sin(k * Math.PI)} />;
              })
            : null}
        </g>
        {/* oxygen that never got in, and what vents out of the open hatch once the tank is full */}
        {o2 > 0 && n2 < 0.05
          ? Array.from({length: 14}, (_, i) => {
              const k = (rnd(i * 5.1) + t * (0.15 + rnd(i * 2.7) * 0.1)) % 1;
              return <circle key={i} cx={CX + (rnd(i * 9.1) * 2 - 1) * lerp(180, 30, k)} cy={lerp(250, NECK.y0 - 10, k)} r={9} fill="#ffffff" opacity={o2 * Math.sin(k * Math.PI) * lid} />;
            })
          : null}
        {n2 > 0.9
          ? Array.from({length: 26}, (_, i) => {
              const k = (rnd(i * 3.3) + t * (0.2 + rnd(i * 6.1) * 0.12)) % 1;
              return <circle key={i} cx={CX + (rnd(i * 8.7) * 2 - 1) * (20 + k * 150)} cy={NECK.y0 - k * 190} r={34 + k * 60} fill="url(#puff)" opacity={0.75 * Math.sin(k * Math.PI) * (1 - sealed)} />;
            })
          : null}
        <path d={shell} fill="none" stroke={LINE} strokeWidth={6} />
        <path d={`M ${NECK.x0} ${NECK.y1 + 8} L ${NECK.x0} ${NECK.y0} M ${NECK.x1} ${NECK.y1 + 8} L ${NECK.x1} ${NECK.y0}`} stroke={LINE} strokeWidth={6} />
        <rect x={NECK.x0 - 34} y={NECK.y0 - 12} width={NECK.x1 - NECK.x0 + 68} height={14} rx={3} fill="#3b4f70" stroke={LINE} strokeWidth={3} />

        {/* the lid: the pipe that brings the oil in bolts over the hatch on top */}
        <g transform={`translate(${lidX} ${lidY})`}>
          <path d={`M ${CX} ${NECK.y0 - 24} L ${CX} 330 L ${130 - lidX} 330`} fill="none" stroke="#2a3a55" strokeWidth={46} strokeLinejoin="round" />
          <path d={`M ${CX} ${NECK.y0 - 24} L ${CX} 330 L ${130 - lidX} 330`} fill="none" stroke={LINE} strokeWidth={3} strokeLinejoin="round" opacity={0.5} />
          <rect x={NECK.x0 - 34} y={NECK.y0 - 28} width={NECK.x1 - NECK.x0 + 68} height={16} rx={3} fill="#51688d" stroke={LINE} strokeWidth={3} />
          {/* heavy oil coming down the pipe */}
          {Array.from({length: 16}, (_, i) => {
            const k = (rnd(i * 2.9) + t * 0.45) % 1;
            const x = k < 0.72 ? lerp(140, CX, k / 0.72) : CX;
            const y = k < 0.72 ? 330 : lerp(330, NECK.y0 - 24, (k - 0.72) / 0.28);
            return <circle key={i} cx={x} cy={y} r={11} fill="#402816" stroke="#9a6a3a" strokeWidth={2} opacity={oilIn * (1 - lid)} />;
          })}
        </g>
        {/* where the lid has to go back: shown as a plan */}
        {reseat > 0 ? (
          <g opacity={0.9}>
            <rect x={NECK.x0 - 34} y={lerp(NECK.y0 - 150, NECK.y0 - 28, reseat)} width={NECK.x1 - NECK.x0 + 68} height={16} rx={3} fill="rgba(188,211,245,0.18)" stroke="#bcd3f5" strokeWidth={3} strokeDasharray="10 7" />
            {sealed > 0 ? [-52, -18, 18, 52].map((dx) => <circle key={dx} cx={CX + dx} cy={NECK.y0 - 20} r={7 * Math.min(1, sealed * 2)} fill={C.yellow} />) : null}
          </g>
        ) : null}

        {/* heat and pressure gauge */}
        <g transform="translate(888 700)" opacity={ramp(t, T.cooked - 0.3, T.cooked)}>
          <circle r={64} fill="#0b1422" stroke={LINE} strokeWidth={5} />
          <path d="M -44 28 A 52 52 0 1 1 44 28" fill="none" stroke="#33496b" strokeWidth={10} strokeLinecap="round" />
          <path d="M 20 -48 A 52 52 0 0 1 44 28" fill="none" stroke={C.red} strokeWidth={10} strokeLinecap="round" />
          <line x1={0} y1={0} x2={Math.sin(lerp(-2.2, 1.9, heat) + noise(t * 6, 2) * 0.05 * heat) * 46} y2={-Math.cos(lerp(-2.2, 1.9, heat) + noise(t * 6, 2) * 0.05 * heat) * 46} stroke={C.white} strokeWidth={6} strokeLinecap="round" />
          <circle r={7} fill={C.white} />
        </g>
        {/* the fresh batch must not meet oxygen */}
        {t >= T.cantTouch && n2 < 0.3 ? (
          <g transform={`translate(${CX} ${BED_TOP - 60}) scale(${pop(t, T.cantTouch)})`}>
            <path d="M -34 -34 L 34 34 M 34 -34 L -34 34" stroke={C.red} strokeWidth={16} strokeLinecap="round" />
          </g>
        ) : null}
      </svg>

      <Tag x={540} y={226} a={win(t, t0 + 0.15, T.inside, 0.35, 0.3)} align="center" size={44} color={C.white}>{os('mach-2', 0)}</Tag>
      {label(os('mach-2', 1), 250, 244, win(t, T.inside + 0.1, T.shut, 0.3, 0.3), '#e0b074', 50)}
      {label(os('mach-2', 2), 872, 782, win(t, T.cooked, T.shut, 0.3, 0.3), C.red, 36)}
      {label(os('mach-2', 3), 300, 1196, Math.max(win(t, T.gasoline, T.shut, 0.2, 0.3), 0), '#ffc85a')}
      {label(os('mach-2', 4), 784, 1196, Math.max(win(t, T.jet, T.shut, 0.2, 0.3), 0), '#bfe3ff')}

      {/* the material, worn out, shut down, the fresh batch */}
      <Leader from={{x: 196, y: 760}} to={{x: 392, y: 800}} a={win(t, T.ma3 + 0.3, T.shut, 0.3, 0.2)} color={worn > 0.5 ? C.red : C.yellow} />
      <Chip x={40} y={690} a={win(t, T.ma3 + 0.3, T.wears + 0.5, 0.3, 0.15)} size={50}>{os('mach-3', 0)}</Chip>
      <Chip x={40} y={690} a={win(t, T.wears + 0.6, T.shut, 0.2, 0.15)} size={50} color={C.red}>{os('mach-3', 1)}</Chip>
      <Chip x={540} y={236} a={win(t, T.shut + 0.05, T.refilled, 0.2, 0.15)} size={66} color={C.red} align="center">{os('mach-3', 2)}</Chip>
      <Leader from={{x: 196, y: 760}} to={{x: 392, y: 800}} a={win(t, T.refilled + 0.6, T.pumped, 0.3, 0.2)} color="#f0b45e" />
      <Chip x={40} y={690} a={win(t, T.refilled + 0.6, T.pumped, 0.3, 0.15)} size={50} color="#f0b45e">{os('mach-3', 3)}</Chip>

      {/* oxygen, then nitrogen on purpose */}
      <Chip x={540} y={236} a={win(t, T.cantTouch, T.pumped, 0.2, 0.15)} size={62} color={C.red} align="center" mark="✕">{os('mach-4', 0)}</Chip>
      <Chip x={40} y={800} a={win(t, T.pumped + 0.1, T.m1, 0.3, 0.1)} size={50} color={C.cyan}>{os('mach-4', 1)}</Chip>
      {t >= T.onPurpose ? (
        <div style={{position: 'absolute', left: 0, top: 226, width: W, display: 'flex', justifyContent: 'center', transform: `scale(${0.7 + 0.3 * pop(t, T.onPurpose)}) rotate(-3deg)`, opacity: Math.min(1, pop(t, T.onPurpose) * 2)}}>
          <div style={{background: C.yellow, color: '#07090d', fontFamily: FONT.display, fontSize: 104, padding: '10px 44px 4px', boxShadow: '0 20px 50px rgba(0,0,0,0.6)'}}>{os('mach-4', 2)}</div>
        </div>
      ) : null}
      <div style={{position: 'absolute', left: 0, right: 0, top: 1250, height: 670, background: 'linear-gradient(to bottom, rgba(5,8,15,0), #05080f 30%)'}} />
    </div>
  );
};
