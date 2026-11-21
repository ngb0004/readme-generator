import React from 'react';
import {Pictogram, joints} from '../engine2d/Pictogram';
import {P, View} from '../engine2d/view';
import {C, H, W} from '../engine/theme';
import {clamp, spring} from '../engine/time';
import {LOOKS, actorA, actorB, actorC, actorP, hookTip, ladderAt, meterAt, responders} from './actors';
import {Direction} from './direct';
import {D, FLANGE_R, TRAY_Y} from './dims';
import {Backdrop, Defs, Nitrogen, OxygenOut, Reactor, Tape} from './Section';
import {T} from './timeline';

const Ladder: React.FC<{v: View; top: [number, number]; foot: [number, number]}> = ({v, top, foot}) => {
  const a = P(v, ...foot);
  const b = P(v, ...top);
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const ux = (b[0] - a[0]) / len;
  const uy = (b[1] - a[1]) / len;
  const off = 0.085 * v.s; // the ladder is seen nearly edge-on: its two rails sit close together
  const n = Math.floor(len / (0.3 * v.s));
  return (
    <g stroke="#dfe6f2" strokeLinecap="round">
      {[-1, 1].map((k) => (
        <line key={k} x1={a[0] - uy * off * k} y1={a[1] + ux * off * k} x2={b[0] - uy * off * k} y2={b[1] + ux * off * k} strokeWidth={0.042 * v.s} />
      ))}
      {Array.from({length: n}, (_, i) => {
        const d = (i + 0.6) * 0.3 * v.s;
        return <line key={i} x1={a[0] + ux * d - uy * off} y1={a[1] + uy * d + ux * off} x2={a[0] + ux * d + uy * off} y2={a[1] + uy * d - ux * off} strokeWidth={0.026 * v.s} />;
      })}
    </g>
  );
};

/** The temporary nitrogen supply and its valve, feeding the vessel. */
const Supply: React.FC<{v: View; a: number; time: number}> = ({v, a, time}) => {
  const [x, y] = P(v, -(D.reactorR + 0.09), -3.0);
  const vx = x - 0.62 * v.s;
  const r = 0.16 * v.s;
  return (
    <g opacity={a}>
      <line x1={0} y1={y} x2={x} y2={y} stroke="#2a3a55" strokeWidth={0.17 * v.s} />
      <line x1={0} y1={y} x2={x} y2={y} stroke={C.cyan} strokeWidth={0.055 * v.s} strokeDasharray={`${0.15 * v.s} ${0.12 * v.s}`} strokeDashoffset={-time * 0.5 * v.s} opacity={0.95} />
      <path d={`M ${vx - r} ${y - r} L ${vx + r} ${y + r} L ${vx + r} ${y - r} L ${vx - r} ${y + r} Z`} fill="#0b1422" stroke={C.white} strokeWidth={4} strokeLinejoin="round" />
      <line x1={vx} y1={y} x2={vx} y2={y - r * 1.8} stroke={C.white} strokeWidth={4} />
      <line x1={vx - r * 0.85} y1={y - r * 1.8} x2={vx + r * 0.85} y2={y - r * 1.8} stroke={C.white} strokeWidth={6} strokeLinecap="round" />
      {[0, 1, 2, 3].map((i) => {
        const k = (time * 0.55 + i / 4) % 1;
        const [cx, cy] = P(v, -0.95 + i * 0.62, -2.5 - 1.3 * (1 - k));
        return <path key={i} d={`M ${cx - 16} ${cy + 12} L ${cx} ${cy - 8} L ${cx + 16} ${cy + 12}`} fill="none" stroke={C.cyan} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" opacity={Math.sin(k * Math.PI)} />;
      })}
    </g>
  );
};

/** The lid that has to go back on: the pipe elbow that bolts over the manway. Drawn as a plan, not a thing in the air. */
const Lid: React.FC<{v: View; a: number; time: number}> = ({v, a, time}) => {
  if (a <= 0.01) return null;
  const bob = Math.sin(time * 1.6) * 0.03;
  const y0 = 1.25 + bob;
  const p = (x: number, y: number) => P(v, x, y + y0).join(' ');
  const r = 0.16;
  const d = `M ${p(-FLANGE_R, 0)} L ${p(FLANGE_R, 0)} L ${p(FLANGE_R, 0.13)} L ${p(D.manwayR, 0.13)} L ${p(r, 0.55)} L ${p(r, 0.95)}
    Q ${p(r, 1.45)} ${p(0.7, 1.45)} L ${p(2.3, 1.45)} L ${p(2.3, 1.77)} L ${p(0.7, 1.77)} Q ${p(-r, 1.77)} ${p(-r, 0.95)} L ${p(-r, 0.55)} L ${p(-D.manwayR, 0.13)} L ${p(-FLANGE_R, 0.13)} Z`;
  const [ax, ay] = P(v, 0, y0 - 0.12);
  const [bx, by] = P(v, 0, 0.72);
  return (
    <g opacity={a}>
      <path d={d} fill="rgba(141,177,230,0.10)" stroke="#bcd3f5" strokeWidth={3} strokeDasharray="14 10" strokeDashoffset={-time * 26} strokeLinejoin="round" />
      <path d={`M ${ax} ${ay} L ${bx} ${by} M ${bx - 16} ${by - 20} L ${bx} ${by} L ${bx + 16} ${by - 20}`} fill="none" stroke="#bcd3f5" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="10 12" />
    </g>
  );
};

const HardHat: React.FC<{v: View; x: number; color: string; tilt?: number}> = ({v, x, color, tilt = 0}) => {
  const [px, py] = P(v, x, 0);
  const r = 0.145 * v.s;
  return (
    <g transform={`translate(${px} ${py}) rotate(${tilt})`}>
      <path d={`M ${-r} 0 A ${r} ${r * 0.92} 0 0 1 ${r} 0 Z`} fill={color} />
      <rect x={-r * 1.12} y={-r * 0.16} width={r * 2.7} height={r * 0.2} rx={r * 0.1} fill={color} />
      {[-0.32, 0, 0.32].map((k) => (
        <path key={k} d={`M ${r * k} ${-r * 0.2} Q ${r * k * 0.9} ${-r * 0.72} ${r * k * 0.55} ${-r * 0.86}`} stroke="rgba(0,0,0,0.22)" strokeWidth={r * 0.07} fill="none" strokeLinecap="round" />
      ))}
    </g>
  );
};

/**
 * A warning sign on a post and a barricade round the hatch. The site's procedure called for both
 * before the purge was started (CSB p. 12); they were installed after the incident (Figs. 8, 11).
 *   ghost  drawn as a red dashed outline: what was not there
 *   solid  0..1+, each piece dropping into place
 */
export const SIGN_X = 2.55;
export const BAR_X = 1.78;
const Guard: React.FC<{v: View; sign: number; barrier: number; ghost?: boolean}> = ({v, sign, barrier, ghost}) => {
  const px = (m: number) => m * v.s;
  const dash = `${px(0.1)} ${px(0.07)}`;
  const line = ghost ? {fill: 'rgba(255,59,47,0.16)', stroke: C.red, strokeWidth: Math.max(4, px(0.03)), strokeDasharray: dash} : {};
  const drop = (k: number) => (ghost ? 0 : (1 - Math.min(1, k)) * -px(2.2));
  // the barricade: two posts and a striped board, in front of the hatch
  const [bl, by] = P(v, -BAR_X, 1.02);
  const [br] = P(v, BAR_X, 1.02);
  const board = px(0.2);
  const stripes = Math.floor((br - bl) / px(0.2));
  // the sign: a warning triangle on a post
  const [sx, sy] = P(v, SIGN_X, 1.9);
  const tri = px(0.62);
  return (
    <g>
      {barrier > 0.01 ? (
        <g opacity={ghost ? barrier : Math.min(1, barrier * 3)} transform={`translate(0 ${drop(barrier)})`}>
          {[-BAR_X, BAR_X].map((x) => (
            <rect key={x} x={P(v, x - 0.035, 0)[0]} y={by} width={px(0.07)} height={px(1.02)} fill={ghost ? 'none' : '#d7dce6'} {...line} />
          ))}
          <rect x={bl} y={by} width={br - bl} height={board} fill={ghost ? 'rgba(255,59,47,0.16)' : C.yellow} stroke={ghost ? C.red : '#07090d'} strokeWidth={ghost ? Math.max(4, px(0.03)) : 3} strokeDasharray={ghost ? dash : undefined} />
          {!ghost
            ? Array.from({length: stripes}, (_, i) => {
                const x = bl + (i + 0.25) * ((br - bl) / stripes);
                const w = (br - bl) / stripes / 2;
                return <path key={i} d={`M ${x} ${by + board} L ${x + w} ${by + board} L ${x + w + board * 0.7} ${by} L ${x + board * 0.7} ${by} Z`} fill="#07090d" />;
              })
            : null}
        </g>
      ) : null}
      {sign > 0.01 ? (
        <g opacity={ghost ? sign : Math.min(1, sign * 3)} transform={`translate(0 ${drop(sign)})`}>
          <rect x={sx - px(0.03)} y={sy + tri * 0.3} width={px(0.06)} height={P(v, 0, 0)[1] - sy - tri * 0.3} fill={ghost ? 'none' : '#d7dce6'} {...line} />
          <path d={`M ${sx} ${sy - tri * 0.5} L ${sx + tri * 0.56} ${sy + tri * 0.42} L ${sx - tri * 0.56} ${sy + tri * 0.42} Z`} fill={ghost ? 'rgba(255,59,47,0.16)' : C.yellow} stroke={ghost ? C.red : '#07090d'} strokeWidth={ghost ? Math.max(4, px(0.03)) : px(0.035)} strokeLinejoin="round" strokeDasharray={ghost ? dash : undefined} />
          {!ghost ? (
            <>
              <rect x={sx - tri * 0.045} y={sy - tri * 0.2} width={tri * 0.09} height={tri * 0.36} rx={tri * 0.03} fill="#07090d" />
              <circle cx={sx} cy={sy + tri * 0.28} r={tri * 0.055} fill="#07090d" />
            </>
          ) : null}
        </g>
      ) : null}
    </g>
  );
};

/** The responders' oxygen meter on its cord, let down through the manway. It alarms at once. */
const Meter: React.FC<{v: View; hand: [number, number]; drop: number; alarm: boolean; time: number}> = ({v, hand, drop, alarm, time}) => {
  const w = 0.17 * v.s;
  const h = 0.26 * v.s;
  const y = hand[1] + 0.12 * v.s + (P(v, 0, -0.78)[1] - hand[1] - 0.12 * v.s) * drop;
  const x = hand[0];
  const blink = alarm ? Math.sin(time * 26) > -0.2 : false;
  return (
    <g>
      <line x1={hand[0]} y1={hand[1]} x2={x} y2={y} stroke="#eef3fb" strokeWidth={Math.max(3, 0.014 * v.s)} />
      {alarm
        ? [0, 1, 2].map((i) => {
            const k = (time * 1.7 + i / 3) % 1;
            return <circle key={i} cx={x} cy={y + h / 2} r={w * (0.9 + k * 4.2)} fill="none" stroke={C.red} strokeWidth={Math.max(4, 0.022 * v.s)} opacity={(1 - k) * 0.9} />;
          })
        : null}
      <rect x={x - w / 2} y={y} width={w} height={h} rx={w * 0.16} fill={C.yellow} stroke="#07090d" strokeWidth={Math.max(2, 0.012 * v.s)} />
      <rect x={x - w * 0.34} y={y + h * 0.14} width={w * 0.68} height={h * 0.36} rx={w * 0.06} fill={alarm ? (blink ? C.red : '#5a0d09') : '#0c1a14'} />
      <circle cx={x} cy={y + h * 0.74} r={w * 0.13} fill={alarm && blink ? C.red : '#07090d'} />
    </g>
  );
};

/** The drawing: everything in the world at time t, through the camera. */
export const World: React.FC<{t: number; d: Direction; view?: View}> = ({t, d, view}) => {
  const v = view ?? d.view;
  const a = actorA(t);
  const b = actorB(t);
  const hand = joints(v, a).hand;
  const tip = P(v, ...hookTip(t));
  const mouth = P(v, 0, 0.05);
  const fallenA = t >= T.i7 - 0.6;
  const fallenB = t >= T.lying;
  const ladder = ladderAt(t);
  // figures that are down inside the vessel are drawn inside it, behind the wall
  const inside = (
    <>
      {d.cast === 'main' && fallenA ? <Pictogram v={v} p={a} look={LOOKS.A} dead={0.12 + 0.38 * d.fallen} /> : null}
      {d.cast === 'main' && t >= T.climbs + 0.5 ? <Pictogram v={v} p={b} look={LOOKS.B} faceLeft dead={fallenB ? d.fallen * 0.5 : 0} /> : null}
    </>
  );
  return (
    <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
      <Defs />
      <Backdrop w={W} h={H} v={v} time={t} day={d.day} />
      <Reactor v={v} part="back" rails={d.hats === 0} />
      <Nitrogen v={v} time={t} level={d.gas.level} fill={d.gas.fill} part="body" />
      <OxygenOut v={v} time={t} amount={d.o2out} />
      {d.supply > 0 ? <Supply v={v} a={d.supply} time={t} /> : null}
      {d.ladder && t >= T.climbs - 0.34 ? <Ladder v={v} top={ladder.top} foot={ladder.foot} /> : null}
      {inside}
      <Tape v={v} />
      <Nitrogen v={v} time={t} level={d.gas.level * 0.8} fill={d.gas.fill} part="wisps" />
      <Reactor v={v} part="front" tape={d.redTape} />
      {d.ladder && t < T.climbs - 0.34 ? <Ladder v={v} top={ladder.top} foot={ladder.foot} /> : null}

      {d.cast === 'main' ? (
        <>
          {d.showP ? <Pictogram v={v} p={actorP(t)} look={LOOKS.P} /> : null}
          {d.showC ? <Pictogram v={v} p={actorC(t)} look={LOOKS.C} faceLeft /> : null}
          {d.responders ? responders(t).map((r, i) => <Pictogram key={i} v={v} p={r} look={LOOKS.R} faceLeft />) : null}
          {d.responders && d.meter ? <Meter v={v} hand={joints(v, responders(t)[0], true).hand} time={t} {...meterAt(t)} /> : null}
          {t < T.climbs + 0.5 ? <Pictogram v={v} p={b} look={LOOKS.B} faceLeft /> : null}
          {!fallenA ? <Pictogram v={v} p={a} look={LOOKS.A} glow /> : null}
          {d.wire ? (
            <path
              d={`M ${hand[0] - 0.55 * v.s} ${hand[1] - 1.25 * v.s} L ${hand[0]} ${hand[1]} Q ${hand[0] + 0.18 * v.s} ${hand[1] + 0.35 * v.s} ${mouth[0] + (tip[0] - mouth[0]) * 0.25} ${mouth[1] - 0.25 * v.s} L ${tip[0]} ${tip[1] - 0.12 * v.s} q ${0.01 * v.s} ${0.1 * v.s} ${0.08 * v.s} ${0.08 * v.s}`}
              fill="none" stroke="#eef3fb" strokeWidth={Math.max(3.5, 0.02 * v.s)} strokeLinecap="round" strokeLinejoin="round"
            />
          ) : null}
        </>
      ) : null}

      <Lid v={v} a={d.lid} time={t} />
      {d.ghost.sign > 0.01 || d.ghost.barrier > 0.01 ? <Guard v={v} sign={d.ghost.sign} barrier={d.ghost.barrier} ghost /> : null}
      {d.after ? <Guard v={v} sign={clamp(spring(t - T.wentUp, 2.4, 0.62), 0, 1.15)} barrier={clamp(spring(t - T.wentUp - 0.45, 2.4, 0.62), 0, 1.15)} /> : null}
      {d.hats > 0 ? (
        <>
          <HardHat v={v} x={-1.72} color={LOOKS.A.color} tilt={-4} />
          <HardHat v={v} x={-1.28} color={LOOKS.B.color} tilt={5} />
        </>
      ) : null}

      {/* what hangs over the opening goes in front of whoever is standing in it */}
      <Nitrogen v={v} time={t} level={d.gas.level * 0.9} fill={d.gas.fill} cloud={d.gas.cloud} spill={d.gas.spill} part="cloud" />
      {d.flash > 0 ? <rect width={W} height={H} fill={C.red} opacity={d.flash * 0.16} /> : null}
      <rect x={0} y={1280} width={W} height={640} fill="url(#fadeDown)" opacity={0.9} />
    </svg>
  );
};
