import React from 'react';
import {C, FONT} from '../../engine/theme';
import {E, clamp, ramp} from '../../engine/time';
import {Bunker, M} from '../draw/Bunker';
import {P, View, ViewKey, viewAt} from '../draw/view';
import {Backdrop, Chip, H, Leader, QuoteCard, Txt, W, fadeIn, pop, span} from '../kit';
import {label, os} from '../script';
import {StageOptions} from '../Stage';
import {at, word} from '../timeline';
import {DrumRow, Frame, KeptWet, LidCrystals, OneOnMap, PANEL, Page, ShutterWindow} from './parts/DecisionPictures';

// 7. THE DECISION. The Army's plan and its case for it, fairly put. Then the turn: it is only
// the right call today, because of three chances that were not taken before today.
const c = {
  two: word('dec-1', 'Two') - 0.1,
  b2: at('dec-2'),
  walls: word('dec-2', 'walls') - 0.12,
  water: word('dec-2', 'Water') - 0.12,
  foam: word('dec-2', 'Foam') - 0.12,
  gel: word('dec-2', 'Gel') - 0.12,
  mist: word('dec-2', 'misters') - 0.12,
  b3: at('dec-3'),
  goal: word('dec-3', 'goal') - 0.1,
  b5: at('dec-5'),
  leave: word('dec-5', 'Leave') - 0.1,
  noWarn: word('dec-5', 'No', 0) - 0.05,
  noBar: word('dec-5', 'No', 1) - 0.05,
  nobody: word('dec-5', 'Nobody') - 0.05,
  b6: at('dec-6'),
  b7: at('dec-7'),
  court: word('dec-7', 'federal') - 0.1,
  gov: word('dec-7', "Iowa's") - 0.1,
  mayor: word('dec-7', 'mayor') - 0.12,
  b8: at('dec-8'),
  because: word('dec-9', 'Because') - 0.1,
  b10: at('dec-10'),
  doing: word('dec-10', 'already') - 0.15,
  paper: word('dec-10', '1984') - 0.12,
  stopped: word('dec-10', 'stopped') - 0.05,
  b11: at('dec-11'),
  anomaly: word('dec-11', 'anomaly') - 0.15,
  b12: at('dec-12'),
  job: word('dec-12', 'That') - 0.05,
  b13: at('dec-13'),
  panel: word('dec-13', 'recommended') - 0.1,
  hired: word('dec-13', 'hired') - 0.1,
  b14: at('dec-14'),
  danger: word('dec-14', 'dangerous') - 0.05,
  what: word('dec-14', 'What') - 0.15,
  b17: at('dec-17'),
  open: word('dec-17', 'open') - 0.05,
  closed: word('dec-17', 'closed') - 0.08,
  nobody2: word('dec-17', 'nobody') - 0.05,
};

/** The second bunker stands this far to the right, so that the barrier between the two is shared. */
const BX = 32.4;
/** The plant's fence, either side of the pair. A schematic: the sources give no distances. */
const FENCE = 42;

const VIEWS: ViewKey[] = [
  {at: 0, cut: true, x: BX / 2, y: 3.4, s: 30},
  {at: c.b2, x: BX / 2, y: 3.4, s: 31.5, ease: E.lin},
  {at: c.walls + 0.7, x: 0, y: 3.3, s: 44, ease: E.inOutQuad},
  {at: c.b3, x: 0, y: 3.25, s: 46, ease: E.lin},
  {at: c.goal + 0.9, x: BX / 2, y: 6.4, s: 20.5, ease: E.inOutQuad},
  {at: c.b5, x: BX / 2, y: 6.3, s: 21.2, ease: E.lin},
  {at: c.b5, cut: true, x: 0, y: 2.9, s: 50},
  {at: c.b6, x: 0, y: 2.75, s: 53.5, ease: E.lin},
  {at: c.b6, cut: true, x: 0, y: 3.2, s: 44},
  {at: c.b10, x: 0, y: 3.0, s: 54, ease: E.lin},
];

const hex = (s: string) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
const mix = (a: string, b: string, k: number) => {
  const x = hex(a);
  const y = hex(b);
  return `rgb(${x.map((n, i) => Math.round(n + (y[i] - n) * clamp(k))).join(',')})`;
};

// ---- the three chances
const ROWS = [
  {text: () => os('dec-10', 0), land: c.b10 + 0.1, cross: c.stopped},
  {text: () => os('dec-12', 0), land: c.b12 + 0.1, cross: c.job},
  {text: () => os('dec-13', 0), land: c.b13 + 0.1, cross: c.danger},
];
const ROW_Y = [200, 392, 584];
const ROW_W = 968;

const Row: React.FC<{t: number; i: number}> = ({t, i}) => {
  const r = ROWS[i];
  const shown = fadeIn(t, c.because + 0.2 + i * 0.16, 0.45);
  if (shown <= 0) return null;
  const landed = t >= r.land;
  const k = pop(t, r.land);
  const x = clamp((t - r.cross) / 0.3);
  const allRed = ramp(t, c.nobody2, c.nobody2 + 0.4);
  const edge = x > 0 ? C.red : landed ? C.white : '#4a5a74';
  return (
    <div
      style={{
        position: 'absolute', left: 84, top: ROW_Y[i], width: ROW_W, height: 132, boxSizing: 'border-box', opacity: shown,
        background: landed ? 'rgba(6,10,18,0.94)' : 'rgba(6,10,18,0.45)', border: landed ? '1px solid rgba(141,177,230,0.24)' : '2px dashed #3a4a66',
        borderLeft: `10px solid ${edge}`, boxShadow: landed ? '0 20px 50px rgba(0,0,0,0.55)' : undefined,
      }}
    >
      {/* the box that never got its tick */}
      <svg width={84} height={84} style={{position: 'absolute', left: 22, top: 23}}>
        <rect x={4} y={4} width={76} height={76} fill="none" stroke={x > 0 ? C.red : landed ? '#aab4c4' : '#4a5a74'} strokeWidth={5} />
        {x > 0 ? <line x1={20} y1={20} x2={20 + 44 * clamp(x * 2)} y2={20 + 44 * clamp(x * 2)} stroke={C.red} strokeWidth={10} strokeLinecap="round" /> : null}
        {x > 0.5 ? <line x1={64} y1={20} x2={64 - 44 * clamp(x * 2 - 1)} y2={20 + 44 * clamp(x * 2 - 1)} stroke={C.red} strokeWidth={10} strokeLinecap="round" /> : null}
      </svg>
      {landed ? (
        <div
          style={{
            position: 'absolute', left: 132, top: 0, height: 130, display: 'flex', alignItems: 'center', fontFamily: FONT.label, fontWeight: 700, fontSize: 56,
            letterSpacing: '0.03em', color: mix(C.white, '#ff8a80', allRed), whiteSpace: 'nowrap', opacity: Math.min(1, k * 2), transform: `translateX(${(1 - Math.min(1, k)) * -24}px)`,
            textShadow: '0 3px 14px rgba(0,0,0,0.85)',
          }}
        >
          {r.text()}
        </div>
      ) : null}
    </div>
  );
};

/** A tick that draws itself. */
const Tick: React.FC<{k: number; size: number; color?: string}> = ({k, size, color = C.yellow}) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <circle cx={50} cy={50} r={44} fill="none" stroke={color} strokeWidth={7} opacity={Math.min(1, k * 3)} />
    <path d="M 27 52 L 44 69 L 74 32" fill="none" stroke={color} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${clamp(k)} 1`} />
  </svg>
);

export const options: StageOptions = {
  // the general's words are on screen exactly as spoken
  hideCaption: (id) => id === 'dec-6',
};

export const Decision: React.FC<{t: number}> = ({t}) => {
  const v = viewAt(t, VIEWS);
  const vB: View = {cx: v.cx + BX * v.s, cy: v.cy, s: v.s};
  const pt = (x: number, y: number) => ({x: P(v, x, y)[0], y: P(v, x, y)[1]});
  const inWorld = t < c.b10;
  const stripped = t >= c.b5 && t < c.b6;
  const on = (a: number, d = 0.7) => ramp(t, a, a + d, E.out);
  const works = stripped ? {} : {barriers: ramp(t, c.walls, c.walls + 1.4, E.out), tanks: on(c.water), foam: on(c.foam, 0.9), gel: on(c.gel), mist: on(c.mist, 0.5)};
  const gy = P(v, 0, 0)[1];
  const px = (m: number) => m * v.s;

  // dec-1: one pulse in each bunker, a beat apart
  const pulse = (cx: number, t0: number) => {
    const u = (t - t0) / 0.95;
    if (u <= 0 || u >= 1) return null;
    const [x, y] = P(v, cx, 1.6);
    const arch = Array.from({length: 25}, (_, i) => P(v, cx + Math.cos((Math.PI * i) / 24) * M.r, Math.sin((Math.PI * i) / 24) * M.r).join(',')).join(' ');
    return (
      <g key={cx}>
        <polygon points={arch} fill="#fff6d8" opacity={0.55 * Math.pow(1 - u, 2)} />
        <circle cx={x} cy={y} r={px(1.5 + u * 8.5)} fill="none" stroke={C.yellow} strokeWidth={7 * (1 - u) + 1} opacity={1 - u} />
      </g>
    );
  };

  // dec-3: the fence, and the line the dust is meant to stay inside
  const domeA = span(t, c.goal + 0.5, c.b5, 0.7, 0.12);
  const fenceA = span(t, c.b3 + 0.9, c.b5, 0.5, 0.12);
  const fence = (side: number) => {
    const [fx] = P(v, BX / 2 + side * FENCE, 0);
    const h = px(3.2);
    return (
      <g key={side} opacity={fenceA}>
        <line x1={fx} y1={gy} x2={fx} y2={gy - px(20)} stroke={C.yellow} strokeWidth={3} strokeDasharray="10 12" opacity={0.75} />
        <line x1={fx} y1={gy} x2={fx} y2={gy - h} stroke="#aab4c4" strokeWidth={6} />
        <line x1={fx} y1={gy - h} x2={fx + side * px(0.9)} y2={gy - h - px(0.7)} stroke="#aab4c4" strokeWidth={5} />
        {[0.3, 0.55, 0.8].map((k) => (
          <line key={k} x1={fx - px(1.2)} y1={gy - h * k} x2={fx + px(1.2)} y2={gy - h * k} stroke="#8b96a8" strokeWidth={2} />
        ))}
        {/* inward: this is the side the dust is meant to stay on */}
        {[0, 1].map((n) => {
          const ax = fx - side * px(3.2 + n * 2.2);
          const ay = gy - px(9);
          return <path key={n} d={`M ${ax + side * px(0.8)} ${ay - px(1)} L ${ax - side * px(0.4)} ${ay} L ${ax + side * px(0.8)} ${ay + px(1)}`} fill="none" stroke={C.cyan} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" opacity={0.55 + 0.45 * Math.sin(t * 5 - n * 1.2)} />;
        })}
      </g>
    );
  };
  const domeL = P(v, BX / 2 - FENCE + 1.2, 0)[0];
  const domeR = P(v, BX / 2 + FENCE - 1.2, 0)[0];

  // dec-5: left alone
  const g = stripped ? ramp(t, c.leave, c.b6, E.in) : 0;
  const step = stripped ? 0.34 * (clamp((t - c.noWarn) / 0.15) + clamp((t - c.noBar) / 0.15) + clamp((t - c.nobody) / 0.15)) : 0;
  const ghost = stripped ? span(t, c.noBar, c.nobody + 0.25, 0.08, 0.45) * (0.7 + 0.3 * Math.sin(t * 46)) : 0;
  const lit = stripped ? fadeIn(t, c.nobody, 0.35) : 0;
  const house = (x: number, w: number, k: number) => (
    <g key={x} opacity={fadeIn(t, c.nobody - 0.25, 0.3)}>
      <rect x={x} y={gy - w * 0.62} width={w} height={w * 0.62} fill="#0b1422" stroke="#3a4d6e" strokeWidth={2.5} />
      <polygon points={`${x - w * 0.1},${gy - w * 0.62} ${x + w / 2},${gy - w * 1.06} ${x + w * 1.1},${gy - w * 0.62}`} fill="#0b1422" stroke="#3a4d6e" strokeWidth={2.5} strokeLinejoin="round" />
      <rect x={x + w * 0.16} y={gy - w * 0.46} width={w * 0.24} height={w * 0.24} fill={C.warm} opacity={lit * k} />
      <rect x={x + w * 0.6} y={gy - w * 0.46} width={w * 0.24} height={w * 0.24} fill={C.warm} opacity={lit * (1.15 - k)} />
    </g>
  );

  // the veil that the quote, the plates and then the list sit on
  const veil =
    t < c.because - 0.1
      ? Math.min(ramp(t, c.b6 - 0.05, c.b6 + 0.3), 1 - ramp(t, c.b8 - 0.2, c.b8 + 0.5)) * 0.84
      : 0.9 * ramp(t, c.because - 0.1, c.because + 0.7) + 0.1 * ramp(t, c.b10 - 0.6, c.b10);
  const cb = (a: number) => span(t, a, c.b3 + 0.1, 0.35, 0.2);
  const plates = [
    {at: c.court, text: os('dec-7', 0)},
    {at: c.gov, text: os('dec-7', 1)},
    {at: c.mayor, text: os('dec-7', 2)},
  ];
  const platesOut = 1 - ramp(t, c.b8 - 0.15, c.b8 + 0.25);
  const pic = (a: number, b: number) => span(t, a, b, 0.22, 0.16);

  return (
    <>
      {inWorld ? (
        <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
          <Bunker v={vB} time={t} cut={1} crust={1} works={works} />
          <Bunker v={v} time={t} cut={1} crust={1} works={works} sky={false} />
          {/* the far bunker's floor slab, which the near one's ground is drawn over */}
          <rect x={P(vB, -(M.r + M.wall), 0)[0]} y={gy} width={px(2 * (M.r + M.wall))} height={px(M.floor)} fill="#59636f" />
          {t < c.b2 ? [pulse(0, c.two), pulse(BX, c.two + 0.42)] : null}

          {t >= c.b3 && t < c.b5 ? (
            <>
              <path d={`M ${domeL} ${gy} A ${(domeR - domeL) / 2} ${px(16)} 0 0 1 ${domeR} ${gy}`} fill="rgba(69,227,255,0.05)" stroke={C.cyan} strokeWidth={4} strokeDasharray="18 14" strokeDashoffset={-t * 26} opacity={domeA} />
              {fence(-1)}
              {fence(1)}
            </>
          ) : null}

          {stripped ? (
            <>
              {/* what would not be there */}
              {[-1, 1].map((sd) => (
                <g key={sd} opacity={ghost} fill="none" stroke={C.red} strokeWidth={3} strokeDasharray="12 9">
                  <rect x={P(v, sd * 16.2 - 1.3, 6.15)[0]} y={P(v, 0, 6.15)[1]} width={px(2.6)} height={px(6.15)} />
                  <rect x={P(v, sd * 11.4 - 1.0, 5.3)[0]} y={P(v, 0, 5.3)[1]} width={px(2.0)} height={px(5.3)} />
                </g>
              ))}
              {/* the barrels, with nobody left to look in on them */}
              {Array.from({length: M.barrels}, (_, i) => {
                const [bx, by] = P(v, (i - (M.barrels - 1) / 2) * M.barrelGap, 0.1 + M.barrelH / 2);
                const k = 0.5 + 0.5 * Math.sin(t * (3 + g * 4) + i * 0.9);
                return <circle key={i} cx={bx} cy={by} r={px(M.barrelW) * (0.9 + 0.9 * g)} fill={C.red} opacity={Math.min(0.6, (0.07 + 0.2 * g + 0.2 * step * g) * (0.6 + 0.4 * k))} />;
              })}
              {[
                [28, 76, 0.9],
                [124, 62, 0.6],
                [1716, 70, 0.75],
                [1812, 80, 1],
              ].map(([x, w, k]) => house(x, w, k))}
            </>
          ) : null}
        </svg>
      ) : null}
      {stripped ? <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 62% 58% at 50% 50%, rgba(255,59,47,0) 34%, rgba(255,59,47,0.22) 100%)', opacity: clamp(g * 0.7 + step * 0.5)}} /> : null}

      {/* dec-1: the plan */}
      {t < c.b2 + 0.4 ? <Chip x={W / 2} y={150} align="center" size={72} a={span(t, c.two - 0.05, c.b2 + 0.3, 0.35, 0.25)}>{os('dec-1', 0)}</Chip> : null}

      {/* dec-2: what the Army has built round them */}
      {t >= c.b2 && t < c.b3 + 0.2 ? (
        <>
          <Leader from={{x: 150, y: 212}} to={pt(-16.2, 6.3)} a={cb(c.walls + 0.55)} />
          <Chip x={72} y={144} size={40} a={cb(c.walls + 0.45)}>{os('dec-2', 0)}</Chip>
          <Leader from={{x: 1730, y: 212}} to={pt(11.4, 5.45)} a={cb(c.water + 0.15)} />
          <Chip x={W - 72} y={144} align="right" size={40} a={cb(c.water + 0.05)}>{os('dec-2', 1)}</Chip>
          <Leader from={{x: W / 2, y: 318}} to={pt(0, 5.8)} a={cb(c.foam + 0.15)} />
          <Chip x={W / 2} y={250} align="center" size={40} a={cb(c.foam + 0.05)}>{os('dec-2', 2)}</Chip>
          <Leader from={{x: 470, y: 398}} to={pt(-8.85, 0.85)} a={cb(c.gel + 0.15)} />
          <Chip x={340} y={330} size={40} a={cb(c.gel + 0.05)}>{os('dec-2', 3)}</Chip>
          <Leader from={{x: 1290, y: 398}} to={pt(9.6, 3.9)} a={cb(c.mist + 0.15)} />
          <Chip x={1340} y={330} align="right" size={40} a={cb(c.mist + 0.05)}>{os('dec-2', 4)}</Chip>
        </>
      ) : null}

      {/* dec-3: the goal */}
      {t >= c.b3 && t < c.b5 ? <Chip x={W / 2} y={150} align="center" size={64} color={C.cyan} a={span(t, c.goal, c.b5, 0.35, 0.15)}>{os('dec-3', 0)}</Chip> : null}

      {inWorld && t < c.b6 ? <Txt x={W - 72} y={790} size={22} font="mono" weight={700} align="right" spacing="0.18em" color={C.mute} a={fadeIn(t, c.two, 0.4) * 0.9}>{label('schematic')}</Txt> : null}

      {veil > 0.001 ? (
        <div style={{position: 'absolute', inset: 0, opacity: veil}}>
          <Backdrop tone="deep" />
        </div>
      ) : null}

      {/* dec-6: the general */}
      {t >= c.b6 && t < c.b7 + 0.1 ? <QuoteCard t={t} at={c.b6 + 0.05} quote={os('dec-6', 0)} by={os('dec-6', 1)} y={300} size={96} w={1560} backdrop={0} a={1 - ramp(t, c.b7 - 0.22, c.b7)} /> : null}

      {/* dec-7: who agreed */}
      {t >= c.b7 && t < c.b8 + 0.3
        ? plates.map((p, i) => {
            const k = pop(t, p.at, 3, 0.62);
            if (t < p.at) return null;
            return (
              <div key={i} style={{position: 'absolute', left: 300, top: 196 + i * 178, width: 1320, height: 140, boxSizing: 'border-box', opacity: Math.min(1, k * 2.2) * platesOut, transform: `translateY(${(1 - Math.min(1, k)) * 26}px)`, background: 'rgba(6,10,18,0.95)', border: '1px solid rgba(141,177,230,0.24)', borderLeft: `10px solid ${C.yellow}`, boxShadow: '0 24px 60px rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', gap: 34, paddingLeft: 34}}>
                <Tick k={clamp((t - p.at - 0.12) / 0.3)} size={88} />
                <span style={{fontFamily: FONT.label, fontWeight: 700, fontSize: 80, letterSpacing: '0.025em', color: C.white, whiteSpace: 'nowrap', lineHeight: 1}}>{p.text}</span>
              </div>
            );
          })
        : null}

      {/* dec-9 on: everything that did not happen before today */}
      {t >= c.because ? (
        <>
          {[0, 1, 2].map((i) => (
            <Row key={i} t={t} i={i} />
          ))}
          {t >= c.b10 - 0.1 ? <Frame a={fadeIn(t, c.b10 - 0.1, 0.35)} /> : null}
          {t >= c.b10 && t < c.b11 ? <DrumRow t={t} a={pic(c.b10, c.b11)} doing={c.doing} paper={c.paper} stopped={c.stopped} title={os('sur-1', 0)} year={os('sur-8', 0)} /> : null}
          {t >= c.b11 && t < c.b12 ? <OneOnMap t={t} a={pic(c.b11, c.b12)} start={c.b11} end={c.b12} quoteAt={c.anomaly} quote={os('dec-11', 0)} by={os('dec-11', 1)} /> : null}
          {t >= c.b12 && t < c.b13 ? <KeptWet t={t} a={pic(c.b12, c.b13)} start={c.b12} cross={c.job} /> : null}
          {t >= c.b13 && t < c.b14 ? <Page t={t} a={pic(c.b13, c.b14)} at={c.b13 + 0.05} stamp={c.panel} sign={c.hired} /> : null}
          {t >= c.b14 && t < c.what ? <LidCrystals t={t} a={pic(c.b14, c.what)} start={c.b14} /> : null}
          {t >= c.what && t < c.b17 ? <Page t={t} a={pic(c.what, c.b17)} at={c.what - 2} stamp={c.what - 2} sign={c.what - 2} redact={c.what + 0.35} /> : null}
          {t >= c.b17 ? <ShutterWindow t={t} a={fadeIn(t, c.b17, 0.25)} open={c.open} closed={c.closed} /> : null}
          {/* the barrel drawings are schematics */}
          {(t >= c.b10 && t < c.b11) || (t >= c.b12 && t < c.b13) || (t >= c.b14 && t < c.what) || t >= c.b17 ? (
            <Txt x={PANEL.x + PANEL.w - 18} y={PANEL.y + PANEL.h - 40} size={20} font="mono" weight={700} align="right" spacing="0.16em" color={C.mute} a={0.9}>{label('schematic')}</Txt>
          ) : null}
        </>
      ) : null}
    </>
  );
};
