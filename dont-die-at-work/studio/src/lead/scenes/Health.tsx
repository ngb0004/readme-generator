import React from 'react';
import {C} from '../../engine/theme';
import {E, clamp, lerp, ramp, rnd} from '../../engine/time';
import {Bunker, EARTH, mound} from '../draw/Bunker';
import {P, ViewKey, viewAt} from '../draw/view';
import {Chip, H, Leader, Txt, W, fadeIn, pop, span} from '../kit';
import {label, os} from '../script';
import {StageOptions} from '../Stage';
import {S, at, word} from '../timeline';
import {GLASS_LINE, Jar, LEAD_OLD, Person, Pt, QuoteBlock, Slide, Soil, Speck, body, chute} from './parts/HealthPictos';

// 10. WHY LEAD MATTERS. What it does inside a body, why small children get the worst of it,
// why rinsing a playground does not remove it, the fair counterpoint, and what nobody knows yet.
const c = {
  b1: S.lead.start,
  brain: word('lead-1', 'brain') - 0.12,
  kidneys: word('lead-1', 'kidneys') - 0.12,
  heart: word('lead-1', 'heart') - 0.12,
  b2: at('lead-2'),
  no: word('lead-2', 'no') - 0.1,
  safe: word('lead-2', 'safe'),
  b3: at('lead-3'),
  smallest: word('lead-3', 'smallest') - 0.12,
  damage: word('lead-3', 'permanent') - 0.1,
  b4: at('lead-4'),
  said: word('lead-4', 'said') - 0.15,
  touch: word('lead-4', 'touch') - 0.3,
  then: word('lead-4', 'then') - 0.1,
  mouth: word('lead-4', 'mouth') - 0.1,
  b5: at('lead-5'),
  rinse: word('lead-5', 'rinse') - 0.12,
  catch: word('lead-5', 'Researchers') - 0.1,
  away: word('lead-5', 'lead') - 0.3,
  washes: word('lead-5', 'washes') - 0.25,
  b6: at('lead-6'),
  until: word('lead-6', 'until') - 0.15,
  b7: at('lead-7'),
  one: word('lead-7', 'One') - 0.15,
  very: word('lead-7', 'very') - 0.1,
  already: word('lead-7', 'already') - 0.1,
  b8: at('lead-8'),
  high: word('lead-8', 'high') - 0.3,
  b9: at('lead-9'),
  nobody: word('lead-9', 'nobody') - 0.1,
  sampling: word('lead-9', 'sampling') - 0.1,
  end: S.lead.end,
};

const mix = (a: Pt, b: Pt, k: number): Pt => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
const Svg: React.FC<{a?: number; children: React.ReactNode}> = ({a = 1, children}) => (
  <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, opacity: a}}>
    {children}
  </svg>
);
/** A world drawn in pixels with the ground at y = 0: put world x = cx at the middle of the frame. */
const World: React.FC<{cx: number; s: number; gy: number; children: React.ReactNode}> = ({cx, s, gy, children}) => <g transform={`translate(${W / 2 - cx * s} ${gy}) scale(${s})`}>{children}</g>;

/* ------------------------------------------------------------------ lead-1: inside a body */
const FX = W / 2;
const FY = 806;
const FH = 650;
const ZC: Pt = [FX, 470];

const BodyShot: React.FC<{t: number}> = ({t}) => {
  const z = lerp(1, 1.06, ramp(t, c.b1, c.b2, E.lin));
  const Z = (p: Pt) => ({x: ZC[0] + (p[0] - ZC[0]) * z, y: ZC[1] + (p[1] - ZC[1]) * z});
  const g = body('adult', FX, FY, FH);
  const k1 = ramp(t, c.brain, c.brain + 0.4, E.out);
  const k2 = ramp(t, c.kidneys, c.kidneys + 0.4, E.out);
  const k3 = ramp(t, c.heart, c.heart + 0.4, E.out);
  const all = ramp(t, c.heart + 0.8, c.heart + 1.2);
  const beat = 0.88 + 0.12 * Math.sin(t * 5.2);
  // the part being named is brightest; the ones before it settle back until all three are lit
  const organs = {
    brain: k1 * lerp(1 - 0.45 * k2, 1, all) * beat,
    nerves: k1 * lerp(1 - 0.5 * k2, 0.85, all),
    kidneys: k2 * lerp(1 - 0.45 * k3, 1, all) * beat,
    heart: k3 * (0.82 + 0.18 * Math.sin(t * 7.5)),
    vessels: k3 * 0.9,
  };
  const mouthPt: Pt = [g.X(0), g.Y(g.p.headY - 0.036)];
  const targets: {at: number; to: Pt}[] = [
    {at: c.brain, to: [g.X(0), g.Y(g.p.headY + 0.006)]},
    {at: c.kidneys, to: [g.X(-0.05), g.Y(0.562)]},
    {at: c.heart, to: [g.X(0.03), g.Y(0.705)]},
  ];
  const u = t - c.b1;
  return (
    <>
      <Svg a={fadeIn(t, c.b1, 0.35)}>
        {/* dust in the air: lead is drawn cyan */}
        {Array.from({length: 34}, (_, i) => {
          const x = (((rnd(i * 1.9) * 2300 - u * (16 + rnd(i * 3.3) * 22)) % 2300) + 2300) % 2300 - 190;
          const y = ((rnd(i * 4.7) * 900 + u * (20 + rnd(i * 6.1) * 26)) % 900) + 40;
          return <Speck key={i} x={x} y={y} r={3 + rnd(i * 8.3) * 3} a={0.28 + 0.35 * rnd(i * 2.3)} />;
        })}
        <g transform={`translate(${ZC[0]} ${ZC[1]}) scale(${z}) translate(${-ZC[0]} ${-ZC[1]})`}>
          <line x1={FX - 520} y1={FY} x2={FX + 520} y2={FY} stroke="#2a3a55" strokeWidth={4} strokeLinecap="round" />
          <Person x={FX} y={FY} h={FH} anatomy organs={organs} />
          {/* breathed in, and carried to where it does the damage */}
          {targets.map((tg, j) =>
            Array.from({length: 4}, (_, n) => {
              const sd = j * 10 + n;
              const from: Pt = [FX - 560 + rnd(sd * 3.1) * 300, 150 + rnd(sd * 5.7) * 230 + Math.sin(t * 0.9 + sd) * 8];
              const leave = tg.at - 2.3 - rnd(sd * 7.3) * 0.5;
              const a1 = ramp(t, leave, tg.at - 0.75, E.inOutQuad);
              const a2 = ramp(t, tg.at - 0.75, tg.at - 0.02, E.inOutQuad);
              const rest: Pt = [tg.to[0] + (rnd(sd * 2.1) - 0.5) * FH * 0.035, tg.to[1] + (rnd(sd * 9.7) - 0.5) * FH * 0.04];
              const p = a2 > 0 ? mix(mouthPt, rest, a2) : mix(from, mouthPt, a1);
              return <Speck key={sd} x={p[0]} y={p[1]} r={5} a={0.95} />;
            }),
          )}
        </g>
      </Svg>
      <Leader from={{x: 1202, y: 219}} to={Z([g.X(0.052), g.Y(g.p.headY + 0.006)])} a={span(t, c.brain + 0.1, c.b2, 0.3, 0.15)} color={C.red} />
      <Chip x={1210} y={176} size={52} color={C.red} a={span(t, c.brain + 0.15, c.b2, 0.35, 0.15)}>{os('lead-1', 0)}</Chip>
      <Leader from={{x: 720, y: 467}} to={Z([g.X(-0.076), g.Y(0.562)])} a={span(t, c.kidneys + 0.1, c.b2, 0.3, 0.15)} color={C.red} />
      <Chip x={712} y={424} size={52} color={C.red} align="right" a={span(t, c.kidneys + 0.15, c.b2, 0.35, 0.15)}>{os('lead-1', 1)}</Chip>
      <Leader from={{x: 1202, y: 365}} to={Z([g.X(0.074), g.Y(0.705)])} a={span(t, c.heart + 0.1, c.b2, 0.3, 0.15)} color={C.red} />
      <Chip x={1210} y={322} size={52} color={C.red} a={span(t, c.heart + 0.15, c.b2, 0.35, 0.15)}>{os('lead-1', 2)}</Chip>
    </>
  );
};

/* ------------------------------------------------------------------ lead-2: the CDC's line */
const StatementShot: React.FC<{t: number}> = ({t}) => {
  const words = os('lead-2', 0).split(' ');
  const landed = t >= c.no;
  return (
    <>
      <div style={{position: 'absolute', inset: 0, background: '#03050a', opacity: fadeIn(t, c.b2, 0.2)}} />
      <Txt x={W / 2} y={196} w={W} size={32} font="mono" weight={700} align="center" spacing="0.2em" color={C.yellow} a={span(t, c.b2 + 0.1, c.b3, 0.3, 0.2)}>{os('lead-2', 1)}</Txt>
      <Txt x={W / 2} y={272} w={1460} size={176} font="display" align="center" lh={1.04} outline={10} scale={0.84 + 0.16 * pop(t, c.no)} a={landed ? span(t, c.no, c.b3, 0.06, 0.2) : 0} style={{textWrap: 'balance'} as React.CSSProperties}>
        {words.map((w, i) => (
          <span key={i} style={{color: i < 2 ? C.yellow : w === 'LEAD' ? C.cyan : C.white}}>
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </Txt>
      <div style={{position: 'absolute', left: W / 2 - 520, top: 676, width: 1040, height: 8, background: C.yellow, opacity: span(t, c.safe, c.b3, 0.1, 0.2), transform: `scaleX(${ramp(t, c.safe, c.safe + 0.45, E.out)})`}} />
    </>
  );
};

/* ------------------------------------------------------------------ lead-3, lead-4: the smallest people */
const KID = {x: 170, h: 300};
const kid0 = body('child', KID.x, 0, KID.h);
const HAND_REST = kid0.arms[1].hand;
const HAND_TOY: Pt = [264, -138];
const HAND_MOUTH: Pt = [KID.x + 5, kid0.head[1] + kid0.headR * 0.55];
const BALL: Pt = [286, -128];

const PeopleShot: React.FC<{t: number}> = ({t}) => {
  const drift = ramp(t, c.b3, c.b4, E.lin);
  const push = ramp(t, c.b4 - 0.25, c.b4 + 1.25, E.inOutQuad);
  const s = lerp(lerp(1.15, 1.2, drift), 1.75, push);
  const cx = lerp(lerp(30, 40, drift), 420, push);
  const gy = lerp(796, 790, push);
  const kidIn = t >= c.smallest ? Math.min(1.06, pop(t, c.smallest, 2.8, 0.62)) : 0;
  const reach = ramp(t, c.touch, c.touch + 0.45, E.inOutQuad);
  const lift = ramp(t, c.then, c.mouth, E.inOutQuad);
  const hand = lift > 0 ? mix(HAND_TOY, HAND_MOUTH, lift) : mix(HAND_REST, HAND_TOY, reach);
  const onHand = ramp(t, c.touch + 0.4, c.touch + 0.7) * (1 - ramp(t, c.mouth + 0.05, c.mouth + 0.45));
  const inside = ramp(t, c.mouth + 0.25, c.mouth + 1.0, E.inOutQuad);
  const brain = ramp(t, c.damage, c.damage + 0.5, E.out) * lerp(0.85 + 0.15 * Math.sin(t * 5), 0.5, push);
  const measure = span(t, c.smallest + 0.45, c.b4 - 0.1, 0.4, 0.3);
  const top = -KID.h * 0.985;
  return (
    <>
      <Svg a={fadeIn(t, c.b3, 0.25)}>
        <World cx={cx} s={s} gy={gy}>
          <Soil x0={-1400} x1={1700} y={0} depth={420} seed={3} />
          {/* dust that has settled where a small child plays */}
          {Array.from({length: 64}, (_, i) => (
            <Speck key={i} x={-760 + rnd(i * 2.7) * 1900} y={-3 - rnd(i * 5.1) * 5} r={3.4 + rnd(i * 7.3) * 1.8} a={0.9} />
          ))}
          <Person x={-190} y={0} h={600} anatomy a={1 - clamp(push * 1.5)} organs={{brain: 0.3, nerves: 0.22, kidneys: 0.3, heart: 0.3, vessels: 0.22}} />
          {/* how small */}
          <g opacity={measure} stroke="#8b96a8" strokeWidth={3} strokeLinecap="round">
            <line x1={-330} y1={top} x2={330} y2={top} strokeDasharray="12 10" />
            <line x1={330} y1={top} x2={330} y2={0} strokeDasharray="2 9" opacity={0.7} />
          </g>
          {/* a toy at the height of a small hand */}
          <g>
            <line x1={252} y1={-98} x2={248} y2={0} stroke="#8fa3c2" strokeWidth={8} strokeLinecap="round" />
            <line x1={328} y1={-98} x2={332} y2={0} stroke="#8fa3c2" strokeWidth={8} strokeLinecap="round" />
            <rect x={238} y={-108} width={104} height={12} rx={4} fill="#aab8d2" stroke="#04060a" strokeWidth={2} />
            <rect x={312} y={-130} width={22} height={22} rx={3} fill="#c9d2de" stroke="#04060a" strokeWidth={2} />
            <circle cx={BALL[0]} cy={BALL[1]} r={22} fill={C.yellow} stroke="#04060a" strokeWidth={2.5} />
            <path d={`M ${BALL[0] - 20} ${BALL[1] - 8} q 20 14 40 0`} fill="none" stroke="#04060a" strokeWidth={2.5} opacity={0.55} />
            {Array.from({length: 9}, (_, i) => {
              const onBall = i < 6;
              const ang = ((28 + i * 25) * Math.PI) / 180;
              const x = onBall ? BALL[0] + Math.cos(ang) * 22 : [246, 300, 323][i - 6];
              const y = onBall ? BALL[1] - Math.sin(ang) * 22 : [-111, -111, -133][i - 6];
              const taken = onBall && i >= 3 ? 1 - ramp(t, c.touch + 0.4, c.touch + 0.7) : 1;
              return <Speck key={i} x={x} y={y - 2} r={3.6} a={taken} />;
            })}
          </g>
          {kidIn > 0 ? (
            <g transform={`translate(${KID.x} 0) scale(${kidIn}) translate(${-KID.x} 0)`}>
              <Person x={KID.x} y={0} h={KID.h} kind="child" line="#e6edf8" handR={hand} organs={{brain}} />
              {/* what was on the toy is on the hand, and then it is inside */}
              {[0, 1, 2, 3].map((i) => (
                <Speck key={i} x={hand[0] + [-6, 5, -1, 8][i]} y={hand[1] + [3, -5, 8, 4][i]} r={3.6} a={onHand} />
              ))}
              <Speck x={KID.x} y={lerp(-204, -148, inside)} r={5} a={t >= c.mouth + 0.25 ? 0.95 : 0} />
            </g>
          ) : null}
        </World>
      </Svg>
      <QuoteBlock t={t} at={c.said} quote={os('lead-4', 0)} by={os('lead-4', 1)} x={930} y={236} w={900} size={54} bySize={26} />
    </>
  );
};

/* ------------------------------------------------------------------ lead-5, lead-6: the playground */
const WASHED = 16;
const PlaygroundShot: React.FC<{t: number}> = ({t}) => {
  const p1 = ramp(t, c.catch, c.away - 0.1, E.inOutQuad);
  const p2 = ramp(t, c.b6 - 0.1, c.b6 + 2.4, E.inOutQuad);
  const hold = ramp(t, c.b5, c.b7, E.lin);
  const s = lerp(lerp(1.0, 1.55, p1), 2.1, p2) * (1 + 0.03 * hold);
  const cx = lerp(lerp(-10, 250, p1), 345, p2);
  const gy = lerp(lerp(650, 590, p1), 500, p2);
  const spray = span(t, c.rinse, c.rinse + 4.3, 0.25, 0.45);
  const front = ramp(t, c.rinse + 0.35, c.rinse + 2.3, E.lin);
  const puddle = ramp(t, c.rinse + 1.7, c.rinse + 4.2) * (1 - 0.9 * ramp(t, c.washes + 0.3, c.washes + 2.6));
  const wetSoil = ramp(t, c.washes, c.washes + 1.4) * (1 - 0.85 * ramp(t, c.b6 + 1.4, c.b6 + 4.2));
  const dig = ramp(t, c.until, c.until + 0.5, E.out);
  const nozzle: Pt = [-640, -214];
  const aim: Pt = [-120, -300];
  const sx = (wx: number) => W / 2 + (wx - cx) * s;
  const sy = (wy: number) => gy + wy * s;
  const glow = 0.75 + 0.25 * Math.sin(t * 4.2);
  return (
    <>
      <Svg a={fadeIn(t, c.b5, 0.25)}>
        <World cx={cx} s={s} gy={gy}>
          <Soil x0={-1500} x1={1500} y={0} depth={560} seed={11} />
          {/* where the rinse water soaks in */}
          <ellipse cx={372} cy={64} rx={170} ry={104} fill="#0c1a2b" opacity={0.8 * wetSoil} />
          <Slide wet={front} />
          {/* the hose */}
          <g opacity={clamp(spray * 3)}>
            <path d="M -1300 -30 C -980 -30 -800 -130 -662 -202" fill="none" stroke="#2f4a36" strokeWidth={16} strokeLinecap="round" />
            <line x1={-662} y1={-202} x2={nozzle[0]} y2={nozzle[1]} stroke="#c9d2de" strokeWidth={15} strokeLinecap="round" />
          </g>
          {spray > 0.01
            ? Array.from({length: 34}, (_, i) => {
                const k = (rnd(i * 2.9) + t * 1.7) % 1;
                const x = lerp(nozzle[0], aim[0] + (rnd(i * 6.3) - 0.5) * 90, k);
                const y = lerp(nozzle[1], aim[1], k) - Math.sin(k * Math.PI) * 120 + (rnd(i * 7.7) - 0.5) * 26;
                return <circle key={i} cx={x} cy={y} r={4.5} fill="#bfe3ff" opacity={0.85 * spray * Math.sin(k * Math.PI)} />;
              })
            : null}
          {/* the puddle at the foot of the slide */}
          <ellipse cx={372} cy={-1} rx={108 * puddle} ry={7 * puddle} fill="#7fc0ff" opacity={0.8} />
          {/* dust that was already on the grass */}
          {Array.from({length: 12}, (_, i) => (
            <Speck key={`g${i}`} x={-470 + rnd(i * 3.9) * 700 + (i > 8 ? 620 : 0)} y={-4 - rnd(i * 6.6) * 4} r={4.2} a={0.9} />
          ))}
          {/* dust on the slide: the water carries it down, off the end, and into the ground */}
          {Array.from({length: WASHED}, (_, i) => {
            const u0 = 0.03 + 0.76 * rnd(i * 3.7 + 1);
            const go = c.rinse + 0.45 + 1.95 * u0 + rnd(i * 9.1) * 0.25;
            const run = 0.5 + 1.0 * (1 - u0);
            const down = ramp(t, go, go + run, E.in);
            const hop = ramp(t, go + run, go + run + 0.4, E.inOutQuad);
            const sink = ramp(t, c.washes + rnd(i * 2.9) * 0.8, c.washes + 1.6 + rnd(i * 7.7) * 1.3, E.out);
            const depth = 24 + rnd(i * 6.1) * 112;
            const on = chute(lerp(u0, 1, down));
            const landX = 286 + rnd(i * 5.3) * 172;
            const x = hop <= 0 ? on[0] : lerp(on[0], landX, hop) + (rnd(i * 4.4) - 0.5) * 34 * sink;
            const y = hop <= 0 ? on[1] - 16 : lerp(on[1] - 16, -5, hop) + (depth + 5) * sink;
            return (
              <g key={i}>
                {sink > 0.9 ? <circle cx={x} cy={y} r={10} fill={C.cyan} opacity={0.16 * glow} /> : null}
                <Speck x={x} y={y} r={4.6} a={0.95} />
              </g>
            );
          })}
          {/* it stays until somebody digs it out */}
          <g opacity={dig}>
            <rect x={262} y={-10} width={222} height={160} fill="none" stroke={C.white} strokeWidth={3} strokeDasharray="14 10" strokeDashoffset={-t * 10} />
          </g>
        </World>
      </Svg>
      <Leader from={{x: 1052, y: 326}} to={{x: sx(372), y: sy(-6)}} a={span(t, c.away + 0.2, c.washes - 0.1, 0.3, 0.2)} color={C.cyan} />
      <Chip x={1040} y={238} size={56} color={C.cyan} a={span(t, c.away, c.b7, 0.35, 0.2)}>{os('lead-5', 0)}</Chip>
      <Chip x={1040} y={342} size={56} color={C.cyan} a={span(t, c.washes, c.b7, 0.35, 0.2)}>{os('lead-5', 1)}</Chip>
    </>
  );
};

/* ------------------------------------------------------------------ lead-7: to be fair */
const GROUND = 610;
const TRAVEL = 1500;
const FarShot: React.FC<{t: number}> = ({t}) => {
  const pan = ramp(t, c.b7 + 0.25, c.one - 0.25, E.inOutQuad) * TRAVEL;
  const moundPts = Array.from({length: 41}, (_, i) => {
    const x = -260 + i * 13;
    return `${330 + x},${GROUND - 150 * Math.exp(-((x / 118) ** 2))}`;
  }).join(' ');
  const lit = ramp(t, c.already, c.already + 0.5, E.out);
  const chipA = span(t, c.b7 + 0.3, c.b7 + 3.4, 0.4, 0.5);
  return (
    <>
      <Svg a={fadeIn(t, c.b7, 0.25)}>
        {Array.from({length: 50}, (_, i) => (
          <circle key={i} cx={rnd(i * 1.7) * W} cy={110 + rnd(i * 4.3) * 420} r={0.8 + rnd(i * 7.7) * 1.4} fill="#9fb8e6" opacity={0.2 + 0.28 * rnd(i * 2.9)} />
        ))}
        {/* far hills: they barely move */}
        <g transform={`translate(${-pan * 0.25} 0)`} fill="#0a111d">
          {Array.from({length: 14}, (_, i) => (
            <ellipse key={i} cx={i * 190 + rnd(i * 3.3) * 80} cy={GROUND} rx={150 + rnd(i * 5.1) * 90} ry={26 + rnd(i * 8.7) * 30} />
          ))}
        </g>
        <g transform={`translate(${-pan} 0)`}>
          {/* the plant, left behind */}
          <polygon points={`70,${GROUND} ${moundPts} 590,${GROUND}`} fill={EARTH} stroke="#4c6b45" strokeWidth={3} strokeLinejoin="round" />
          {/* what the road passes on the way out */}
          {Array.from({length: 26}, (_, i) => {
            const x = 700 + i * 112;
            return <rect key={`p${i}`} x={x} y={GROUND - 44} width={7} height={44} fill="#5a6a52" />;
          })}
          <line x1={700} y1={GROUND - 32} x2={3520} y2={GROUND - 32} stroke="#5a6a52" strokeWidth={4} />
          <line x1={700} y1={GROUND - 16} x2={3520} y2={GROUND - 16} stroke="#5a6a52" strokeWidth={4} />
          {[1300, 2200, 3100].map((x) => (
            <g key={x} stroke="#3d4a5e" strokeLinecap="round">
              <line x1={x} y1={GROUND} x2={x} y2={GROUND - 196} strokeWidth={7} />
              <line x1={x - 26} y1={GROUND - 178} x2={x + 26} y2={GROUND - 178} strokeWidth={6} />
            </g>
          ))}
          <path d={`M 1274 ${GROUND - 178} q 450 70 900 0 q 450 70 900 0`} fill="none" stroke="#3d4a5e" strokeWidth={2} />
          {[1010, 1650, 2760, 3330].map((x, i) => (
            <g key={x}>
              <rect x={x - 7} y={GROUND - 70} width={14} height={70} fill="#2a2018" />
              <circle cx={x} cy={GROUND - 112} r={50 + (i % 2) * 8} fill="#1b2a1a" stroke="#3c5a3a" strokeWidth={3} />
              <circle cx={x - 34} cy={GROUND - 84} r={30} fill="#1b2a1a" stroke="#3c5a3a" strokeWidth={3} />
              <circle cx={x + 34} cy={GROUND - 84} r={32} fill="#1b2a1a" stroke="#3c5a3a" strokeWidth={3} />
              <circle cx={x} cy={GROUND - 92} r={40} fill="#1b2a1a" />
            </g>
          ))}
          <g>
            <rect x={1990} y={GROUND - 70} width={120} height={70} fill="#141c2a" stroke="#3d4a5e" strokeWidth={3} />
            <polygon points={`1978,${GROUND - 70} 2050,${GROUND - 124} 2122,${GROUND - 70}`} fill="#101722" stroke="#3d4a5e" strokeWidth={3} strokeLinejoin="round" />
            <rect x={2010} y={GROUND - 48} width={22} height={22} fill={C.warm} opacity={0.75} />
          </g>
          <Soil x0={-40} x1={3560} y={GROUND} depth={H - GROUND} seed={23} />
          {/* lead that was in this ground long before the Army's barrels */}
          {Array.from({length: 250}, (_, i) => (
            <Speck key={i} x={rnd(i * 2.9) * 3500} y={GROUND + 14 + rnd(i * 5.3) * 330} r={3.6 + lit * 0.9} a={0.5 + 0.38 * lit} color={LEAD_OLD} />
          ))}
        </g>
        {/* the addition */}
        {[770, 948, 1110].map((x, i) => {
          const fall = ramp(t, c.very + i * 0.16, c.very + 0.95 + i * 0.16, E.in);
          if (t < c.very + i * 0.16) return null;
          return (
            <g key={x}>
              <circle cx={x} cy={lerp(452, GROUND - 6, fall)} r={13} fill={C.cyan} opacity={0.2} />
              <Speck x={x} y={lerp(452, GROUND - 6, fall)} r={6} />
            </g>
          );
        })}
      </Svg>
      <Chip x={330 - pan} y={376} align="center" size={38} color={C.white} a={chipA}>{label('plant')}</Chip>
      <QuoteBlock t={t} at={c.one} quote={os('lead-7', 0)} by={os('lead-7', 1)} x={210} y={150} w={1500} size={68} />
    </>
  );
};

/* ------------------------------------------------------------------ lead-8: close to the blast */
const NEAR: ViewKey[] = [
  {at: c.b8, cut: true, x: 0, y: 3.4, s: 40},
  {at: c.b9, x: 0, y: 3.0, s: 50, ease: E.lin},
];
const HazeShot: React.FC<{t: number}> = ({t}) => {
  const v = viewAt(t, NEAR);
  const more = ramp(t, c.high, c.high + 0.9, E.out);
  const [ox, oy] = P(v, 0, 2.2);
  return (
    <>
      <Svg a={fadeIn(t, c.b8, 0.25)}>
        <defs>
          <radialGradient id="nearHaze">
            <stop offset="0" stopColor={C.cyan} stopOpacity={0.3} />
            <stop offset="1" stopColor={C.cyan} stopOpacity={0} />
          </radialGradient>
          <radialGradient id="nearDark" cx="50%" cy="56%" r="62%">
            <stop offset="0.5" stopColor="#03050a" stopOpacity={0} />
            <stop offset="1" stopColor="#03050a" stopOpacity={0.94} />
          </radialGradient>
        </defs>
        <Bunker v={v} time={t} cut={0} />
        <ellipse cx={ox} cy={oy} rx={v.s * 15} ry={v.s * 6.5} fill="url(#nearHaze)" opacity={0.35 + 0.65 * more} />
        {Array.from({length: 190}, (_, i) => {
          const x0 = (rnd(i * 1.7) - 0.5) * 34;
          if (rnd(i * 4.3) > Math.exp(-((x0 / 8.5) ** 2))) return null;
          const x = x0 + Math.sin(t * 0.5 + i) * 0.3;
          const up = rnd(i * 6.1) ** 2 * 5.2 + 0.12 + Math.cos(t * 0.4 + i * 2) * 0.15;
          const [px, py] = P(v, x, mound(x0) + up);
          const late = i % 3 !== 0;
          return <Speck key={i} x={px} y={py} r={3.4 + rnd(i * 8.9) * 3} a={(late ? more : 1) * (0.45 + 0.5 * rnd(i * 3.1))} />;
        })}
        {/* nothing is drawn farther out, because nobody knows */}
        <rect x={0} y={0} width={W} height={H} fill="url(#nearDark)" />
      </Svg>
      <Txt x={W - 72} y={786} size={22} font="mono" weight={700} align="right" spacing="0.18em" color={C.mute} a={span(t, c.b8 + 0.4, c.b9, 0.4, 0.2)}>{label('schematic')}</Txt>
    </>
  );
};

/* ------------------------------------------------------------------ lead-9: nobody knows yet */
const JARS: {x: number; fill: 'soil' | 'water' | 'wipe'}[] = [
  {x: 360, fill: 'soil'},
  {x: 760, fill: 'wipe'},
  {x: 1160, fill: 'water'},
  {x: 1560, fill: 'soil'},
];
const JarsShot: React.FC<{t: number}> = ({t}) => {
  const z = lerp(0.95, 1.02, ramp(t, c.b9, c.end, E.lin));
  const sweep = ramp(t, c.sampling, c.sampling + 1.1, E.inOutQuad);
  return (
    <Svg a={fadeIn(t, c.b9, 0.25)}>
      <g transform={`translate(${W / 2} 560) scale(${z}) translate(${-W / 2} -560)`}>
        <rect x={150} y={706} width={1620} height={24} rx={4} fill="#59636f" stroke="#0a1220" strokeWidth={3} />
        <rect x={150} y={730} width={1620} height={10} fill="#27303d" />
        {JARS.map((j, i) => {
          const k = t >= c.b9 + 0.1 + i * 0.16 ? Math.min(1.05, pop(t, c.b9 + 0.1 + i * 0.16, 3, 0.6)) : 0;
          const tag = ramp(t, c.nobody + i * 0.14, c.nobody + 0.5 + i * 0.14, E.out);
          return (
            <g key={j.x} transform={`translate(${j.x} 706) scale(${k}) translate(${-j.x} -706)`}>
              <Jar x={j.x} y={706} k={2} fill={j.fill} tag={tag} time={t} seed={i * 7 + 1} />
            </g>
          );
        })}
        {/* the light of whoever comes to read them */}
        {sweep > 0 && sweep < 1 ? <rect x={lerp(60, 1780, sweep)} y={380} width={90} height={330} fill="#ffffff" opacity={0.07} transform={`skewX(-14)`} /> : null}
      </g>
    </Svg>
  );
};

export const options: StageOptions = {
  hideCaption: (id) => id === 'lead-2',
};

export const Health: React.FC<{t: number}> = ({t}) => {
  if (t < c.b2) return <BodyShot t={t} />;
  if (t < c.b3) return <StatementShot t={t} />;
  if (t < c.b5) return <PeopleShot t={t} />;
  if (t < c.b7) return <PlaygroundShot t={t} />;
  if (t < c.b8) return <FarShot t={t} />;
  if (t < c.b9) return <HazeShot t={t} />;
  return <JarsShot t={t} />;
};
