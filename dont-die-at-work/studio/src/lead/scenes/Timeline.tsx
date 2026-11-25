import React from 'react';
import {C, FONT} from '../../engine/theme';
import {E, Ease, clamp, lerp, ramp, track} from '../../engine/time';
import {BarrelCut} from '../draw/Barrel';
import {CAMS, MapBase, PLACE, Pin, camAt, dest, plume, projection} from '../draw/MapView';
import {Chip, H, Leader, PaperCard, Txt, W, fadeIn, pop, span} from '../kit';
import {label, os} from '../script';
import {StageOptions} from '../Stage';
import {B, S, at, word} from '../timeline';
import {Blast, Drop, Drum, Gavel, Hall, Inset, NoBlast, PLASTIC, Page, Permit, Post, PriceTag, Shell, Tick} from './parts/TimelinePictures';
import {DAYS, RAIL, SLOTS, T0, T1, TRUE, YEARS, day, stack, travelX, trueX} from './parts/TimelineRail';

// 5. WHO KNEW, AND WHEN. One line from the 1984 paper to the morning of the blast. The camera
// rides along it: decades go by in a whip-pan, then the routine, then the month it stopped, then
// a last six weeks where the stops come days apart. It ends on the whole line at true scale.

/** The two quotes are set as full-screen type, so their captions are hidden. Set true to caption them as well. */
const QUOTE_CAPTIONS = false;

const st = (beat: string) => B[beat].start;
const PAN = 0.7;
const c = {
  start: S.timeline.start,
  zoomIn: S.timeline.start + 1.25,
  b2: at('tl-2'),
  risks: word('tl-2', 'risks') - 0.3,
  half: word('tl-2', 'half') - 0.1,
  p3: st('tl-3') - 0.2,
  assess: word('tl-3', 'Defense') - 0.15,
  concern: word('tl-3', 'concern') - 0.05,
  stock: word('tl-3', 'stockpile') - 0.2,
  deter: word('tl-3', 'deteriorating') - 0.05,
  p4: st('tl-4') - 0.2,
  gathers: word('tl-4', 'gathers') - 0.25,
  moves: word('tl-4', 'moves') - 0.15,
  iowa: word('tl-4', 'Iowa') - 0.1,
  some: word('tl-4', 'Some') - 0.1,
  goes: word('tl-4', 'goes') - 0.3,
  plastic: word('tl-4', 'plastic') - 0.15,
  p5: st('tl-5') - 0.2,
  stops: word('tl-5', 'stops') - 0.2,
  p7: st('tl-7') - 0.2,
  inspect: word('tl-7', 'inspection') - 0.1,
  topup: word('tl-7', 'top-up') - 0.1,
  sept: word('tl-8', 'September') + 0.1, // the sweep reaches the last top-up as he names the month
  according: word('tl-8', 'According') - 0.2,
  that: word('tl-8', 'that') - 0.05,
  last: word('tl-8', 'last') - 0.05,
  b9: at('tl-9'),
  asks: word('tl-9', 'contractor') - 0.2,
  price: word('tl-9', 'price') - 0.2,
  p10: st('tl-10') - 0.25,
  finds: word('tl-10', 'finds') - 0.15,
  cryst: word('tl-10', 'crystallized') - 0.25,
  shuts: word('tl-10', 'shuts') - 0.2,
  b11: at('tl-11'),
  cmdr: word('tl-11', 'commander') - 0.25,
  quote11: word('tl-11', 'there') - 0.12,
  b12: at('tl-12'),
  hires: word('tl-12', 'hires') - 0.25,
  noBlast: word('tl-12', 'No') - 0.1,
  may: word('tl-12', 'May') - 0.1,
  dropped: word('tl-12', 'dropped') - 0.12,
  chosen: word('tl-12', 'detonation') - 0.15,
  p14: st('tl-14') - 0.2,
  open: word('tl-14', 'open') - 0.2,
  left: word('tl-14', 'left') - 0.15,
  p16: st('tl-16') - 0.2,
  grants: word('tl-16', 'grants') - 0.3,
  b17: at('tl-17'),
  five: word('tl-17', 'five') - 0.08,
  maps: word('tl-17', 'publishes') - 0.15,
  dust: word('tl-17', 'dust') - 0.15,
  b18: at('tl-18'),
  gov: word('tl-18', "governor's") - 0.2,
  p19: st('tl-19') - 0.2,
  n20: word('tl-19', '20') - 0.35,
  n23: word('tl-19', '23') - 0.35,
  lawsuit: word('tl-19', 'lawsuit') - 0.1,
  post: word('tl-19', 'post') - 0.1,
  n25: word('tl-19', '25') - 0.35,
  b21: at('tl-21'),
  warning: word('tl-21', 'warning') - 0.15,
  public: word('tl-21', 'public') - 0.1,
  five21: word('tl-21', 'five') - 0.1,
  b22: at('tl-22'),
  senator: word('tl-22', 'senators') - 0.35,
  quote22: word('tl-22', 'These') - 0.15,
  b23: at('tl-23'),
  later: word('tl-23', 'Later', 1) - 0.03,
  end: S.timeline.end,
};

// ---------------------------------------------------------------- dates
// Each stop's place on the rail is its date. Where the script gives only a month or a year, the
// comment says what was assumed; none of these is printed on screen.
const D = {
  y84: T0,
  y04: day(2004, 7, 1), // "2004"
  y09: day(2009, 7, 1), // "2009"
  y11: day(2011, 7, 1), // "around 2011"
  sep: SLOTS[20], // "September 2025"
  sep24: day(2025, 9, 24),
  mar: day(2026, 3, 11),
  cmdr: day(2026, 3, 19), // "plant commander, March 2026": the date it was reported
  contract: day(2026, 3, 25), // "within two weeks"
  may: day(2026, 5, 8), // "by May"
  oct15: day(2026, 10, 15),
  n13: day(2026, 11, 13),
  n15: day(2026, 11, 15),
  n16: day(2026, 11, 16), // "the next day"
  n20: day(2026, 11, 20),
  n23: day(2026, 11, 23),
  n25: T1,
};

// ---------------------------------------------------------------- camera
// The camera's position is the world x that sits at the left edge of the frame. Each leg whips to
// a stop, then creeps on while the stop is read.
const camFor = (d: number, screenX: number) => travelX(d) - screenX;
type Leg = {go: number; dur: number; to: number; creep: number};
const LEGS: Leg[] = [
  {go: c.start - 1, dur: 0, to: camFor(D.y84, 220), creep: 4},
  {go: c.p3, dur: PAN, to: camFor(D.y04, 220), creep: 5},
  {go: c.p4, dur: PAN, to: camFor(D.y09, 220), creep: 4},
  {go: c.p5, dur: PAN, to: camFor(D.y11, 220), creep: 5},
  {go: c.p7, dur: 1.0, to: camFor(D.sep, 1600), creep: 0},
  {go: c.sept + 0.25, dur: 1.0, to: camFor(D.sep, 420), creep: 3},
  {go: c.p10, dur: 0.8, to: camFor(D.mar, 300), creep: 2},
  {go: c.p14, dur: PAN, to: camFor(D.oct15, 200), creep: 3},
  {go: c.p16, dur: PAN, to: camFor(D.n13, 200), creep: 0},
  {go: c.p19, dur: 0.8, to: camFor(D.n25, 1420), creep: 0},
];
const CAM: [number, number, Ease?][] = [];
LEGS.forEach((leg, i) => {
  const arrive = leg.go + leg.dur;
  const leave = LEGS[i + 1] ? LEGS[i + 1].go : c.end + 1;
  CAM.push(i === 0 ? [arrive, leg.to] : [arrive, leg.to, E.inOut]);
  CAM.push([leave, leg.to + leg.creep * (leave - arrive), E.lin]);
});
/** 0 while the camera rides the rail; 1 when the whole line is in frame at true scale. */
const morph = (t: number) => (t < c.b21 ? 1 - ramp(t, c.zoomIn, c.b2 + 0.1, E.inOut) : ramp(t, c.b21 + 0.05, c.b21 + 1.75, E.inOut));

// ---------------------------------------------------------------- the routine's sweep
const SLOT_X = SLOTS.map(travelX);
const SWEEP = 360; // pixels a second: four months a second
const CURSOR: [number, number, Ease?][] = [
  [c.sept - 6, SLOT_X[20] - SWEEP * 6],
  [c.sept, SLOT_X[20], E.lin],
  [c.that, SLOT_X[20], E.lin],
  [c.that + 3.0, SLOT_X[25] + 40, E.lin],
  [c.p10, SLOT_X[25] + 40, E.lin],
  [c.p10 + 0.6, travelX(D.mar), E.inOut],
];
/** When the sweep passes month `i`: a check lands (to September 2025) or an empty ring does (after). */
const stampAt = (i: number) => c.sept - (SLOT_X[20] - SLOT_X[i]) / SWEEP;
const emptyAt = (i: number) => c.that + ((SLOT_X[i] - SLOT_X[20]) / (SLOT_X[25] + 40 - SLOT_X[20])) * 3.0;
const SEPTEMBERS = [8, 20];

// ---------------------------------------------------------------- the dots
type Ev = {d: number; show: number; red?: boolean};
const EVENTS: Ev[] = [
  {d: D.y84, show: c.b2},
  {d: D.y04, show: c.p3},
  {d: D.y09, show: c.p4},
  {d: D.y11, show: c.p5},
  {d: D.sep, show: c.sept, red: true},
  {d: D.sep24, show: c.asks, red: true},
  {d: D.mar, show: c.p10 + 0.5, red: true},
  {d: D.cmdr, show: c.cmdr, red: true},
  {d: D.contract, show: c.hires, red: true},
  {d: D.may, show: c.may, red: true},
  {d: D.oct15, show: c.p14, red: true},
  {d: D.n13, show: c.p16, red: true},
  {d: D.n15, show: c.b17, red: true},
  {d: D.n16, show: c.gov, red: true},
  {d: D.n20, show: c.n20, red: true},
  {d: D.n23, show: c.n23, red: true},
  {d: D.n25, show: c.n25, red: true},
];
const TRAVEL_LEVEL = stack(EVENTS.map((e) => travelX(e.d)), 30);
const TRUE_LEVEL = stack(EVENTS.map((e) => trueX(e.d)), 18);

// ---------------------------------------------------------------- small parts
const DATE_Y = 118;
const BLUE = '#57b4ff';
const Svg: React.FC<{children: React.ReactNode; a?: number}> = ({children, a = 1}) => (
  <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: a}}>
    {children}
  </svg>
);
const Pole: React.FC<{x: number; top: number; a?: number; color?: string}> = ({x, top, a = 1, color = '#aab8d2'}) => {
  if (a <= 0.001) return null;
  const y = lerp(RAIL - 18, top, clamp(a));
  return (
    <g>
      <line x1={x} y1={RAIL - 18} x2={x} y2={y} stroke="#04060a" strokeWidth={10} />
      <line x1={x} y1={RAIL - 18} x2={x} y2={y} stroke={color} strokeWidth={4} />
    </g>
  );
};
/** A stop's date, flying from the top of its pole. */
const DateFlag: React.FC<{x: number; t: number; at: number; size: number; color?: string; top?: number; a?: number; children: React.ReactNode}> = ({x, t, at: when, size, color = C.white, top = DATE_Y, a = 1, children}) => (
  <Txt x={x + 30} y={top} size={size} font="display" color={color} outline={Math.round(size / 22)} nowrap lh={1} scale={0.82 + 0.18 * pop(t, when)} a={a * (t >= when ? 1 : 0)}>
    {children}
  </Txt>
);
/** A chip that can be struck through. */
const Line: React.FC<{x: number; y: number; a: number; size: number; color?: string; strike?: number; children: React.ReactNode}> = ({x, y, a, size, color = C.yellow, strike = 0, children}) => {
  const k = clamp(a);
  if (k <= 0.001) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y, opacity: Math.min(1, k * 3)}}>
      <div style={{position: 'relative', display: 'inline-block', background: 'rgba(5,8,14,0.88)', borderLeft: `${Math.max(6, size * 0.2)}px solid ${strike > 0.5 ? C.mute : color}`, padding: `${size * 0.2}px ${size * 0.5}px ${size * 0.2}px ${size * 0.42}px`, fontFamily: FONT.label, fontWeight: 700, fontSize: size, letterSpacing: '0.045em', color: C.white, whiteSpace: 'nowrap', clipPath: `inset(0 ${(1 - k) * 100}% 0 0)`, boxShadow: '0 10px 30px rgba(0,0,0,0.55)'}}>
        <span style={{opacity: 1 - 0.5 * strike}}>{children}</span>
        <div style={{position: 'absolute', left: size * 0.3, right: size * 0.3, top: '50%', height: Math.max(5, size * 0.1), marginTop: -size * 0.05, background: C.red, transform: `scaleX(${clamp(strike)})`, transformOrigin: '0 50%'}} />
      </div>
    </div>
  );
};
/** A date in display type that can be struck through. */
const Slipped: React.FC<{x: number; y: number; size: number; t: number; at: number; color?: string; strike?: number; children: React.ReactNode}> = ({x, y, size, t, at: when, color = C.white, strike = 0, children}) => {
  if (t < when) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `scale(${0.8 + 0.2 * pop(t, when)})`, transformOrigin: '0% 100%'}}>
      <div style={{position: 'relative', display: 'inline-block', fontFamily: FONT.display, fontSize: size, lineHeight: 1, whiteSpace: 'nowrap', color, WebkitTextStroke: '6px #04060a', paintOrder: 'stroke fill'}}>
        <span style={{opacity: 1 - 0.55 * strike}}>{children}</span>
        <div style={{position: 'absolute', left: -8, right: -8, top: '50%', height: size * 0.1, marginTop: -size * 0.02, background: C.red, transform: `scaleX(${clamp(strike)}) rotate(-3deg)`, transformOrigin: '0 50%'}} />
      </div>
    </div>
  );
};
/** Someone's words under a short red or yellow bar, set small enough to sit beside a stop. */
const Cited: React.FC<{x: number; y: number; w: number; a: number; quote: string; by: string; size?: number; accent?: string}> = ({x, y, w, a, quote, by, size = 62, accent = C.red}) => {
  const k = clamp(a);
  if (k <= 0.001) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y + (1 - k) * 18, width: w, opacity: k, display: 'flex', gap: 26}}>
      <div style={{width: 10, background: accent, flex: 'none'}} />
      <div>
        <div style={{fontFamily: FONT.label, fontWeight: 600, fontSize: size, lineHeight: 1.12, color: C.white, textShadow: '0 3px 14px rgba(0,0,0,0.85)'}}>{quote}</div>
        <div style={{marginTop: 16, fontFamily: FONT.mono, fontWeight: 700, fontSize: 22, letterSpacing: '0.14em', color: accent}}>{by}</div>
      </div>
    </div>
  );
};
/** A full-screen quotation in the kit's QuoteCard style, but naming the speaker first, as the narrator does. */
const Said: React.FC<{t: number; byAt: number; quoteAt: number; out: number; quote: string; by: string; accent?: string}> = ({t, byAt, quoteAt, out, quote, by, accent = C.yellow}) => {
  const vis = span(t, byAt, out, 0.3, 0.22);
  if (vis <= 0.001) return null;
  const k = pop(t, quoteAt, 2.6, 0.8);
  const said = t >= quoteAt ? Math.min(1, k * 2.2) : 0;
  const w = 1500;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: vis}}>
      <div style={{position: 'absolute', inset: 0, background: 'rgba(3,5,9,0.86)'}} />
      <div style={{position: 'absolute', left: (W - w) / 2, top: 290, width: w, display: 'flex', gap: 34}}>
        <div style={{width: 12, background: accent, flex: 'none', transform: `scaleY(${lerp(0.16, 1, said)})`, transformOrigin: '50% 0%'}} />
        <div>
          <div style={{fontFamily: FONT.mono, fontWeight: 700, fontSize: 30, letterSpacing: '0.16em', color: accent, opacity: fadeIn(t, byAt + 0.1, 0.4)}}>{by}</div>
          <div style={{marginTop: 30, fontFamily: FONT.label, fontWeight: 600, fontSize: 80, lineHeight: 1.14, color: C.white, letterSpacing: '0.005em', opacity: said, transform: `translateY(${(1 - Math.min(1, k)) * 24}px)`}}>{quote}</div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- the stops
type StopProps = {t: number; x: number};
const off = (x: number) => x < -1900 || x > W + 80;

/** 1984: the paper, and the half that was never destroyed. */
const Stop84: React.FC<StopProps> = ({t, x}) => {
  if (t < c.b2 - 0.02 || off(x)) return null;
  return (
    <>
      <Svg>
        <Pole x={x} top={DATE_Y + 40} a={fadeIn(t, c.b2, 0.3)} />
        {Array.from({length: 8}, (_, i) =>
          i < 4 ? (
            <Drum key={i} x={x + 470 + i * 112} base={RAIL - 6} h={150} ghost a={fadeIn(t, c.half - 0.25 + i * 0.05, 0.3)} />
          ) : (
            <Drum key={i} x={x + 470 + i * 112} base={RAIL - 6} h={150} a={t >= c.half + (i - 4) * 0.09 ? Math.min(1, pop(t, c.half + (i - 4) * 0.09) * 1.5) : 0} />
          ),
        )}
      </Svg>
      <DateFlag x={x} t={t} at={c.b2} size={230} color={C.yellow}>
        {os('tl-2', 0)}
      </DateFlag>
      <Chip x={x + 34} y={404} size={54} a={fadeIn(t, c.risks + 0.3, 0.35)}>
        {os('tl-2', 1)}
      </Chip>
      <div style={{position: 'absolute', left: x + 1010, top: 164, transform: 'scale(0.64)', transformOrigin: '0 0'}}>
        <PaperCard t={t} at={c.risks} head={[os('sur-1', 0), os('sur-1', 1), os('sur-1', 2)]} quote="" x={0} y={0} w={1080} tilt={2} />
      </div>
    </>
  );
};

/** 2004: an assessment flags the same drums, twenty years on. */
const Stop04: React.FC<StopProps> = ({t, x}) => {
  if (t < c.p3 - 0.02 || off(x)) return null;
  const worry = fadeIn(t, c.deter, 0.5);
  const flag = t >= c.concern ? Math.min(1.15, pop(t, c.concern)) : 0;
  return (
    <>
      <Svg>
        <Pole x={x} top={DATE_Y + 40} />
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            {worry > 0.01 ? <rect x={x + 470 + i * 122 - 62} y={RAIL - 180} width={124} height={184} rx={20} fill="none" stroke={C.red} strokeWidth={5} opacity={worry * (0.45 + 0.4 * Math.sin(t * 4 + i))} /> : null}
            <Drum x={x + 470 + i * 122} base={RAIL - 6} h={160} dull={ramp(t, c.stock, c.deter + 1.2)} />
          </g>
        ))}
        <Page x={x + 1110} y={176} w={330} h={390} tilt={-3} a={fadeIn(t, c.assess, 0.3)} drop={(1 - E.out(clamp((t - c.assess) / 0.5))) * 90}>
          {flag > 0 ? (
            <g transform={`translate(262 70) scale(${flag})`}>
              <circle r={44} fill={C.red} stroke="#04060a" strokeWidth={4} />
              <rect x={-6} y={-26} width={12} height={32} rx={5} fill={C.white} />
              <circle cy={20} r={7} fill={C.white} />
            </g>
          ) : null}
        </Page>
      </Svg>
      <DateFlag x={x} t={t} at={c.p3} size={230}>
        {os('tl-3', 0)}
      </DateFlag>
      <Chip x={x + 34} y={404} size={50} color={C.red} a={fadeIn(t, c.stock, 0.4)}>
        {os('tl-3', 1)}
      </Chip>
    </>
  );
};

const BEARINGS = [312, 262, 208, 118, 62];
/** 2009: everything that is left goes to one place, and into new barrels. */
const Stop09: React.FC<StopProps> = ({t, x}) => {
  if (t < c.p4 - 0.02 || off(x)) return null;
  const box = {x: x + 950, y: 150, w: 770, h: 440};
  const cam = camAt(t, [
    {at: c.gathers, cut: true, ...CAMS.us, k: 34},
    {at: c.iowa + 0.5, ...CAMS.midwest, k: 132, ease: E.inOutQuad},
    {at: c.p5 + PAN, lon: -91.9, lat: 40.75, k: 158, ease: E.lin},
  ]);
  const proj = projection(cam, [box.x + box.w / 2, box.y + box.h / 2]);
  const pin = proj(PLACE.plant)!;
  const mapA = fadeIn(t, c.gathers, 0.35);
  const pull = ramp(t, c.gathers + 0.35, c.moves + 0.9, E.inOutQuad);
  const there = fadeIn(t, c.iowa, 0.3);
  return (
    <>
      <Svg>
        <Pole x={x} top={DATE_Y + 40} />
        <Inset id="tl09map" x={box.x} y={box.y} w={box.w} h={box.h} a={mapA}>
          <MapBase proj={proj} cam={cam} lit={{'19': '#16304f'}} />
          {BEARINGS.map((b) => {
            const far = proj(dest(PLACE.plant, b, 980))!;
            const near = proj(dest(PLACE.plant, b, 90))!;
            const hx = lerp(far[0], near[0], pull);
            const hy = lerp(far[1], near[1], pull);
            const ang = (Math.atan2(near[1] - far[1], near[0] - far[0]) * 180) / Math.PI;
            return (
              <g key={b} opacity={0.95}>
                <line x1={far[0]} y1={far[1]} x2={hx} y2={hy} stroke={C.yellow} strokeWidth={5} strokeDasharray="14 11" strokeDashoffset={-t * 46} />
                <polygon points="0,0 -24,-11 -24,11" fill={C.yellow} transform={`translate(${hx} ${hy}) rotate(${ang})`} />
              </g>
            );
          })}
          <Pin proj={proj} at={PLACE.plant} a={fadeIn(t, c.moves + 0.5, 0.3)} time={t} ping color={C.yellow} r={12} />
        </Inset>
        {[0, 1, 2, 3].map((i) => {
          const m = ramp(t, c.plastic + i * 0.14, c.plastic + i * 0.14 + 0.3);
          const here = t >= c.goes + i * 0.07 ? Math.min(1, pop(t, c.goes + i * 0.07) * 1.5) : 0;
          return (
            <g key={i}>
              <Drum x={x + 470 + i * 122} base={RAIL - 6} h={160} a={here * (1 - m)} />
              <Drum x={x + 470 + i * 122} base={RAIL - 6} h={160} look={PLASTIC} a={here * m} />
            </g>
          );
        })}
      </Svg>
      <DateFlag x={x} t={t} at={c.p4} size={230}>
        {os('tl-4', 0)}
      </DateFlag>
      <Chip x={x + 34} y={404} size={50} a={fadeIn(t, c.moves, 0.4)}>
        {os('tl-4', 1)}
      </Chip>
      <Chip x={x + 34} y={494} size={50} color={C.white} a={fadeIn(t, c.some + 0.5, 0.4)}>
        {os('tl-4', 2)}
      </Chip>
      {mapA > 0.5 && !off(box.x) ? (
        <>
          <Txt x={box.x + 24} y={box.y + 16} size={24} font="mono" weight={700} spacing="0.18em" color={C.mute} a={fadeIn(t, c.iowa + 0.7, 0.4)}>
            {label('iowa')}
          </Txt>
          <Chip x={pin[0] + 26} y={pin[1] + 22} size={30} a={there}>
            {label('plant')}
          </Chip>
        </>
      ) : null}
    </>
  );
};

/** 2011: the weapons move on. The barrels do not. */
const Stop11: React.FC<StopProps> = ({t, x}) => {
  if (t < c.p5 - 0.02 || off(x)) return null;
  return (
    <>
      <Svg>
        <Pole x={x} top={DATE_Y + 40} />
        {[0, 1, 2, 3].map((i) => (
          <Drum key={i} x={x + 470 + i * 122} base={RAIL - 6} h={160} look={PLASTIC} />
        ))}
        <Shell x={x + 1090} y={352} len={560} dead={ramp(t, c.stops, c.stops + 0.45)} />
      </Svg>
      <DateFlag x={x} t={t} at={c.p5} size={230}>
        {os('tl-5', 0)}
      </DateFlag>
      <Chip x={x + 34} y={404} size={54} a={fadeIn(t, c.stops, 0.4)}>
        {os('tl-5', 1)}
      </Chip>
    </>
  );
};

/** The routine: one barrel, checked every month and topped up every September. Fixed in the frame while the sweep runs below. */
const Routine: React.FC<{t: number}> = ({t}) => {
  const out = c.sept + 0.7;
  if (t < c.p7 + 0.3 || t > out + 0.3) return null;
  const a = span(t, c.p7 + 0.55, out, 0.4, 0.3);
  const slot = (track(t, CURSOR) - SLOT_X[0]) / (SLOT_X[1] - SLOT_X[0]);
  const ph = ((((slot - 8) / 12) % 1) + 1) % 1;
  const level = t >= c.sept ? lerp(0.7, 1, ramp(t, c.sept, c.sept + 0.35)) : ph < 0.06 ? lerp(0.7, 1, ph / 0.06) : 1 - 0.3 * ((ph - 0.06) / 0.94);
  const bx = 1575;
  const by = 628;
  const pours = SEPTEMBERS.map(stampAt);
  const look = t >= c.inspect ? 0.5 + 0.5 * Math.sin((t - c.inspect) * Math.PI * 8) : 0; // the monthly look: four a second, with the sweep
  return (
    <>
      <Svg a={a}>
        <BarrelCut x={bx} y={by} s={400} time={t} level={level} />
        {/* the monthly check: a ring that blinks on the level line */}
        <circle cx={bx} cy={by - 368 * (0.3 + 0.52 * level)} r={150} fill="none" stroke={C.yellow} strokeWidth={4} strokeDasharray="6 16" opacity={0.25 + 0.35 * look} />
        {/* the September top-up */}
        {pours.map((p, i) => {
          const u = (t - p + 0.2) / 0.7;
          if (u <= 0 || u >= 1) return null;
          return (
            <g key={i}>
              {Array.from({length: 9}, (_, j) => {
                const v = (u * 1.6 + j / 9) % 1;
                return <Drop key={j} x={bx + 62} y={by - 368 - 230 + v * 190} s={11} a={Math.sin(Math.PI * u) * (1 - v * 0.3)} />;
              })}
            </g>
          );
        })}
        <g transform="translate(150 240)" opacity={fadeIn(t, c.inspect, 0.3)}>
          <circle r={25} fill="#0d1727" stroke={C.yellow} strokeWidth={4} />
          <Tick x={0} y={1} s={11} w={5} />
        </g>
        <Drop x={150} y={352} s={25} a={fadeIn(t, c.topup, 0.3)} />
      </Svg>
      <Chip x={198} y={200} size={54} a={span(t, c.inspect, out, 0.35, 0.3)}>
        {os('tl-7', 0)}
      </Chip>
      <Chip x={198} y={312} size={54} color={BLUE} a={span(t, c.topup, out, 0.35, 0.3)}>
        {os('tl-7', 1)}
      </Chip>
      <Txt x={bx} y={by + 24} w={600} size={20} font="mono" weight={700} align="center" spacing="0.18em" color={C.mute} a={a}>
        {label('schematic')}
      </Txt>
    </>
  );
};

/** September 2025: the last check, and the contractor's question. */
const StopSept: React.FC<StopProps> = ({t, x}) => {
  if (t < c.sept - 0.02 || off(x)) return null;
  const turned = ramp(t, c.last, c.last + 0.4);
  const nine = span(t, c.b9 + 0.1, c.p10 + 0.3, 0.3, 0.25);
  // the next stop is only six months along the rail, so this one clears as the camera leaves
  const out = 1 - ramp(t, c.p10 - 0.05, c.p10 + 0.3);
  if (out <= 0.001) return null;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: out}}>
      <Svg>
        <Pole x={x} top={DATE_Y + 40} a={fadeIn(t, c.sept, 0.3)} color={turned > 0.5 ? C.red : '#aab8d2'} />
        {[0, 1, 2].map((i) => (
          <Drum key={i} x={x + 1000 + i * 134} base={RAIL - 6} h={176} look={PLASTIC} a={nine * (t >= c.price - 0.4 + i * 0.07 ? Math.min(1, pop(t, c.price - 0.4 + i * 0.07) * 1.5) : 0)} />
        ))}
        <PriceTag x={x + 1326} y={RAIL - 176} s={72} time={t} a={nine * fadeIn(t, c.price, 0.3)} />
      </Svg>
      <DateFlag x={x} t={t} at={c.sept} size={150} top={DATE_Y + 24} a={1 - turned}>
        {os('tl-8', 0)}
      </DateFlag>
      <DateFlag x={x} t={t} at={c.sept} size={150} top={DATE_Y + 24} color={C.red} a={turned}>
        {os('tl-8', 0)}
      </DateFlag>
      <Cited x={x + 36} y={352} w={1060} a={span(t, c.according, c.b9, 0.35, 0.25)} quote={os('tl-8', 1)} by={os('tl-8', 2)} />
      <Txt x={x + 38} y={356} size={34} font="mono" weight={700} spacing="0.12em" color={C.yellow} a={nine * fadeIn(t, c.b9 + 0.2, 0.3)}>
        {os('tl-9', 0)}
      </Txt>
      <Chip x={x + 34} y={412} size={50} a={nine * fadeIn(t, c.asks, 0.4)}>
        {os('tl-9', 1)}
      </Chip>
      <Leader from={{x: x + 70, y: 494}} to={{x: x + 30, y: RAIL - 44}} a={nine * fadeIn(t, c.asks + 0.3, 0.35)} />
    </div>
  );
};

/** March 2026: crystals, a shutdown, a reassurance, and a way out that was dropped. */
const StopMar: React.FC<StopProps & {xContract: number; xMay: number}> = ({t, x, xContract, xMay}) => {
  if (t < c.p10 - 0.02 || off(x)) return null;
  const ten = span(t, c.p10, c.b12 - 0.05, 0.2, 0.25);
  const twelve = fadeIn(t, c.b12, 0.3);
  const cutA = ramp(t, c.dropped, c.dropped + 0.35);
  const branch = ramp(t, c.hires, c.hires + 0.7, E.out);
  const bx = 1585;
  const by = 640;
  const barrelA = span(t, c.finds - 0.5, c.b11 + 0.2, 0.4, 0.3);
  const up = RAIL - 64;
  const reach = lerp(xContract + 44, xMay - 4, clamp((branch - 0.4) / 0.6));
  // October is seven months along: clear this stop as the camera leaves for it
  const out = 1 - ramp(t, c.p14 - 0.05, c.p14 + 0.3);
  if (out <= 0.001) return null;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: out}}>
      <Svg>
        <Pole x={x} top={DATE_Y + 64} a={fadeIn(t, c.p10 + 0.45, 0.3)} color={C.red} />
        {/* the side track: a contract to treat it, which ends in May */}
        {branch > 0 ? (
          <g opacity={1 - 0.45 * cutA}>
            <path d={`M ${xContract} ${RAIL - 14} L ${lerp(xContract, xContract + 44, clamp(branch / 0.4))} ${lerp(RAIL - 14, up, clamp(branch / 0.4))} ${branch > 0.4 ? `L ${reach} ${up}` : ''}`} fill="none" stroke={C.white} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={cutA > 0.5 ? '10 10' : undefined} />
          </g>
        ) : null}
        {cutA > 0 ? <line x1={xMay} y1={up - 26 * cutA} x2={xMay} y2={up + 26 * cutA} stroke={C.red} strokeWidth={9} strokeLinecap="round" /> : null}
        <NoBlast x={x + 1300} base={560} w={330} a={span(t, c.noBlast, c.chosen + 0.1, 0.3, 0.3)} cut={cutA} />
        <Blast x={x + 1300} base={560} w={330} time={t} a={fadeIn(t, c.chosen, 0.35)} />
      </Svg>
      <Svg a={barrelA}>
        <BarrelCut x={bx} y={by} s={400} time={t} level={0.56} needles={ramp(t, c.finds, c.cryst + 1.3)} outside={0.32 * ramp(t, c.cryst, c.cryst + 1.6)} glow={ramp(t, c.cryst, c.cryst + 0.8)} />
      </Svg>
      <Txt x={bx} y={by + 24} w={600} size={20} font="mono" weight={700} align="center" spacing="0.18em" color={C.mute} a={barrelA}>
        {label('schematic')}
      </Txt>
      <DateFlag x={x} t={t} at={c.p10 + 0.45} size={150} top={DATE_Y + 24}>
        {os('tl-10', 0)}
      </DateFlag>
      <Chip x={x + 34} y={356} size={62} color={C.red} a={ten * fadeIn(t, c.cryst, 0.35)}>
        {os('tl-10', 1)}
      </Chip>
      <Chip x={x + 34} y={464} size={52} color={C.white} a={ten * fadeIn(t, c.shuts, 0.35)}>
        {os('tl-10', 2)}
      </Chip>
      <Line x={x + 34} y={360} size={52} color={C.white} a={twelve * fadeIn(t, c.hires, 0.4)} strike={cutA}>
        {os('tl-12', 0)}
      </Line>
      <Line x={x + 34} y={462} size={52} color={C.red} a={twelve * fadeIn(t, c.dropped + 0.1, 0.4)}>
        {os('tl-12', 1)}
      </Line>
    </div>
  );
};

/** 15 October: the open house, and what a senator says it left out. */
const StopOct: React.FC<StopProps> = ({t, x}) => {
  if (t < c.p14 - 0.02 || off(x)) return null;
  const gap = fadeIn(t, c.left, 0.4);
  return (
    <>
      <Svg>
        <Pole x={x} top={DATE_Y + 50} color={C.red} />
        <Hall x={x + 930} base={RAIL - 8} time={t} a={fadeIn(t, c.open - 0.3, 0.4)} gap={gap * (0.7 + 0.3 * Math.sin(t * 5))} />
      </Svg>
      <DateFlag x={x} t={t} at={c.p14} size={200} top={DATE_Y + 6}>
        {os('tl-14', 0)}
      </DateFlag>
      <Chip x={x + 34} y={384} size={50} color={C.white} a={fadeIn(t, c.open, 0.4)}>
        {os('tl-14', 1)}
      </Chip>
      <Chip x={x + 34} y={480} size={46} color={C.red} a={gap}>
        {os('tl-14', 2)}
      </Chip>
      <Txt x={x + 56} y={566} size={26} font="mono" weight={700} spacing="0.16em" color={C.red} a={fadeIn(t, c.left + 0.5, 0.4)}>
        {os('tl-14', 3)}
      </Txt>
    </>
  );
};

/** November: the permit, five days' notice, and a date that moves twice. All in one frame, a day every 120 pixels. */
const November: React.FC<{t: number; x13: number; x15: number; x16: number; x20: number; x23: number; x25: number}> = ({t, x13, x15, x16, x20, x23, x25}) => {
  if (t < c.p16 - 0.02 || t > c.b21 + 0.6) return null;
  const gone = 1 - ramp(t, c.b21, c.b21 + 0.4);
  const e13 = span(t, c.p16, c.b17 + 0.05, 0.1, 0.2);
  const shrink = ramp(t, c.p19, c.p19 + 0.6, E.inOutQuad);
  const seven = span(t, c.b17, c.p19 + 0.25, 0.2, 0.25); // what only tl-17 and tl-18 show
  // the plume on the Army's first maps: about 100 miles, to the north-east
  const box = {x: x15 + 830, y: 142, w: 540, h: 350};
  const cam = {lon: -90.72, lat: 41.47, k: 172};
  const proj = projection(cam, [box.x + box.w / 2, box.y + box.h / 2]);
  const mapA = seven * fadeIn(t, c.maps, 0.35);
  const grow = ramp(t, c.dust, c.dust + 1.8, E.out);
  const slam = clamp((t - c.five) / 0.22);
  const stampScale = lerp(1, 0.5, shrink) * (1 + 0.8 * Math.pow(1 - slam, 3));
  const tops = [250, 398, 546];
  const days = [x20, x23, x25];
  const whens = [c.n20, c.n23, c.n25];
  return (
    <div style={{position: 'absolute', inset: 0, opacity: gone}}>
      <Svg>
        <Pole x={x13} top={DATE_Y + 64} a={e13} color={C.red} />
        <Permit x={x13 + 800} y={186} a={e13 * fadeIn(t, c.p16 + PAN - 0.2, 0.3)} stamp={ramp(t, c.grants + 0.25, c.grants + 0.6)} />
        <Pole x={x15} top={DATE_Y + 64} a={fadeIn(t, c.b17, 0.3)} color={C.red} />
        {/* five days: the rail between the announcement and the first date */}
        {Array.from({length: 5}, (_, i) => {
          const a = fadeIn(t, c.five + 0.15 + i * 0.09, 0.2);
          const x0 = lerp(x15, x20, i / 5) + 9;
          const x1 = lerp(x15, x20, (i + 1) / 5) - 9;
          return a > 0 ? <line key={i} x1={x0} y1={RAIL} x2={lerp(x0, x1, a)} y2={RAIL} stroke={C.red} strokeWidth={20} strokeLinecap="round" /> : null;
        })}
        <Inset id="tl17map" x={box.x} y={box.y} w={box.w} h={box.h} a={mapA}>
          <MapBase proj={proj} cam={cam} lit={{'19': '#132238'}} />
          <defs>
            <filter id="tl17soft" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation={9} />
            </filter>
          </defs>
          {grow > 0 ? <path d={plume(proj, PLACE.plant, 28, 100, 26, grow)} fill={C.cyan} opacity={0.42} filter="url(#tl17soft)" /> : null}
          <Pin proj={proj} at={PLACE.plant} time={t} ping color={C.red} r={9} />
        </Inset>
        {days.map((x, i) => (
          <Pole key={i} x={x} top={tops[i] + 28} a={fadeIn(t, whens[i], 0.3)} color={i === 2 ? C.yellow : C.red} />
        ))}
        <Gavel x={(x23 + x25) / 2 - 52} y={632} s={56} a={fadeIn(t, c.lawsuit, 0.25)} hit={ramp(t, c.lawsuit + 0.15, c.lawsuit + 0.35, E.in)} />
        <Post x={(x23 + x25) / 2 + 50} y={640} s={52} a={fadeIn(t, c.post, 0.25)} />
      </Svg>
      {/* 13 November */}
      <DateFlag x={x13} t={t} at={c.p16} size={150} top={DATE_Y + 24} a={e13}>
        {os('tl-16', 0)}
      </DateFlag>
      <Chip x={x13 + 34} y={356} size={56} color={C.white} a={e13 * fadeIn(t, c.grants, 0.35)}>
        {os('tl-16', 1)}
      </Chip>
      <Txt x={x13} y={RAIL + 26} w={300} size={26} font="mono" weight={700} align="center" spacing="0.1em" a={fadeIn(t, c.b17 + 0.1, 0.3)}>
        {os('tl-16', 0)}
      </Txt>
      {/* 15 November */}
      <DateFlag x={x15} t={t} at={c.b17} size={150} top={DATE_Y + 24}>
        {os('tl-17', 0)}
      </DateFlag>
      {t >= c.five ? (
        <div style={{position: 'absolute', left: lerp(x15 - 190, x15 - 140, shrink), top: lerp(318, 322, shrink), transform: `scale(${stampScale}) rotate(-2.5deg)`, transformOrigin: '0% 0%', opacity: Math.min(1, slam * 4)}}>
          <div style={{border: `11px solid ${C.red}`, color: C.red, fontFamily: FONT.display, fontSize: 138, lineHeight: 1, padding: '14px 40px 6px', background: 'rgba(4,6,10,0.78)', whiteSpace: 'nowrap'}}>{os('tl-17', 1)}</div>
        </div>
      ) : null}
      {mapA > 0.01 ? (
        <>
          <Txt x={box.x + 18} y={box.y + 14} size={22} font="mono" weight={700} spacing="0.16em" color={C.mute} a={mapA}>
            {label('iowa')}
          </Txt>
          <Txt x={box.x + box.w - 18} y={box.y + box.h - 44} size={22} font="mono" weight={700} spacing="0.16em" align="right" color={C.mute} a={mapA}>
            {label('illinois')}
          </Txt>
          <Chip x={box.x} y={box.y + box.h + 18} size={44} color={C.cyan} a={seven * fadeIn(t, c.dust + 0.5, 0.4)}>
            {os('tl-17', 2)}
          </Chip>
          <Txt x={box.x} y={box.y + box.h + 96} w={box.w} size={18} font="mono" weight={700} spacing="0.12em" lh={1.35} color={C.mute} a={mapA * fadeIn(t, c.dust, 0.4)}>
            {label('schematic_map')}
          </Txt>
        </>
      ) : null}
      {/* the next day */}
      <Chip x={x15 - 190} y={548} size={42} color={C.red} a={seven * fadeIn(t, c.gov, 0.4)}>
        {os('tl-18', 0)}
      </Chip>
      <Leader from={{x: x16 + 34, y: 616}} to={{x: x16, y: RAIL - 18}} a={seven * fadeIn(t, c.gov + 0.3, 0.3)} color={C.red} />
      {/* the date, three times */}
      {days.map((x, i) => (
        <Slipped key={i} x={x + 26} y={tops[i]} size={112} t={t} at={whens[i]} color={i === 2 ? C.yellow : C.white} strike={i < 2 ? ramp(t, whens[i + 1], whens[i + 1] + 0.3) : 0}>
          {os('tl-19', i)}
        </Slipped>
      ))}
    </div>
  );
};

/** The whole line at true scale: what tl-21 and tl-23 point at. */
const Whole: React.FC<{t: number; k: number}> = ({t, k}) => {
  if (t < c.b21 || k < 0.02) return null;
  const a = clamp((k - 0.55) / 0.45);
  const dim = 1 - 0.75 * span(t, c.senator, c.b23 - 0.1, 0.3, 0.25);
  const x84 = trueX(D.y84);
  const said = span(t, c.warning, c.b22 + 0.1, 0.25, 0.3);
  const five = span(t, c.five21, c.b22 + 0.1, 0.1, 0.3);
  const towerTop = RAIL - (Math.max(...TRUE_LEVEL) + 1) * 20 - 4;
  const small: [number, string, number][] = [
    [x84, os('tl-2', 0), 0],
    [trueX(D.y04), os('tl-3', 0), 0],
    [trueX(D.y09), os('tl-4', 0), -30],
    [trueX(D.y11), os('tl-5', 0), 30],
  ];
  return (
    <div style={{position: 'absolute', inset: 0, opacity: dim}}>
      <Svg>
        <Pole x={x84} top={330} a={said} color={C.yellow} />
      </Svg>
      {small.map(([x, text, dx], i) => (
        <Txt key={i} x={x + dx} y={RAIL + 22} w={300} size={46} font="display" align="center" color={i === 0 ? C.yellow : C.white} outline={4} a={a}>
          {text}
        </Txt>
      ))}
      <Txt x={TRUE.right + 24} y={RAIL + 22} w={400} size={46} font="display" align="right" color={C.red} outline={4} a={a}>
        {os('tl-19', 2)}
      </Txt>
      <Txt x={x84 + 28} y={300} size={210} font="display" color={C.yellow} outline={10} nowrap lh={1} scale={0.82 + 0.18 * pop(t, c.warning)} a={said}>
        {os('tl-2', 0)}
      </Txt>
      <Chip x={x84 + 32} y={532} size={48} a={span(t, c.warning + 0.5, c.b22 + 0.1, 0.35, 0.3)}>
        {os('tl-2', 1)}
      </Chip>
      {t >= c.five21 ? (
        <div style={{position: 'absolute', right: W - TRUE.right - 26, top: 300, transform: `scale(${1 + 0.8 * Math.pow(1 - clamp((t - c.five21) / 0.22), 3)}) rotate(-2.5deg)`, transformOrigin: '100% 50%', opacity: five}}>
          <div style={{border: `10px solid ${C.red}`, color: C.red, fontFamily: FONT.display, fontSize: 122, lineHeight: 1, padding: '12px 34px 5px', background: 'rgba(4,6,10,0.78)', whiteSpace: 'nowrap'}}>{os('tl-17', 1)}</div>
        </div>
      ) : null}
      <Leader from={{x: TRUE.right - 60, y: 468}} to={{x: TRUE.right - 2, y: towerTop}} a={five * fadeIn(t, c.five21 + 0.3, 0.3)} color={C.red} />
    </div>
  );
};

export const options: StageOptions = {
  hideCaption: (id) => !QUOTE_CAPTIONS && (id === 'tl-11' || id === 'tl-22'),
};

export const Timeline: React.FC<{t: number}> = ({t}) => {
  const cam = track(t, CAM);
  const k = morph(t);
  const travel = 1 - k;
  const sx = (d: number) => lerp(travelX(d) - cam, trueX(d), k);
  const x84 = sx(T0);
  const xEnd = sx(T1);
  const drawn = t < c.b2 ? lerp(x84, xEnd, ramp(t, c.start + 0.15, c.start + 1.15, E.inOutQuad)) : xEnd;
  const cursorX = track(t, CURSOR) - cam;
  const cursorA = travel * span(t, c.inspect - 0.25, c.finds + 0.4, 0.2, 0.4);
  const xSep = sx(D.sep);
  const redA = fadeIn(t, c.that, 0.4);
  const redTo = t < c.p10 ? Math.max(xSep, cursorX) : lerp(cursorX, xEnd, ramp(t, c.p10, c.p10 + 0.5, E.in));
  const live = EVENTS.reduce((n, e, i) => (t >= e.show ? i : n), -1);
  // tl-23: a light runs the length of the line and lands on the pile
  const sweeping = t >= c.b23;
  const light = lerp(TRUE.left, TRUE.right, ramp(t, c.b23 + 0.05, c.later, E.in));
  const hit = t >= c.later ? clamp((t - c.later) / 0.8) : -1;
  const dimmed = 1 - 0.75 * span(t, c.senator, c.b23 - 0.1, 0.3, 0.25);
  const onScreen = (x: number, pad = 40) => x > -pad && x < W + pad;

  return (
    <>
      {/* ---------------- the rail ---------------- */}
      <Svg a={dimmed}>
        <line x1={Math.max(-40, x84)} y1={RAIL} x2={Math.min(W + 40, drawn)} y2={RAIL} stroke="#04060a" strokeWidth={14} strokeLinecap="round" />
        <line x1={Math.max(-40, x84)} y1={RAIL} x2={Math.min(W + 40, drawn)} y2={RAIL} stroke="#aab8d2" strokeWidth={6} strokeLinecap="round" />
        {redA > 0 && redTo > xSep ? <line x1={Math.max(-40, xSep)} y1={RAIL} x2={Math.min(W + 40, redTo)} y2={RAIL} stroke={C.red} strokeWidth={6} strokeLinecap="round" opacity={redA} /> : null}
        {/* a tick for every new year */}
        {YEARS.map((d, i) => {
          const x = sx(d);
          if (!onScreen(x) || x > drawn) return null;
          const flare = sweeping ? clamp(1 - Math.abs(x - light) / 90) * (hit < 0 ? 1 : 1 - hit) : 0;
          return <line key={i} x1={x} y1={RAIL - 13 - flare * 16} x2={x} y2={RAIL + 13 + flare * 16} stroke={flare > 0.05 ? C.yellow : '#7f95b8'} strokeWidth={3 + flare * 3} />;
        })}
        {/* a mark for every day of the last six weeks */}
        {travel > 0.02
          ? DAYS.map((d, i) => {
              const x = sx(d);
              return onScreen(x) ? <line key={i} x1={x} y1={RAIL - 9} x2={x} y2={RAIL + 9} stroke="#b9584f" strokeWidth={2.5} opacity={travel} /> : null;
            })
          : null}
        {/* a bead for every month from January 2024: checked, topped up, or left empty */}
        {travel > 0.02
          ? SLOTS.map((d, i) => {
              const x = sx(d);
              if (!onScreen(x, 60) || i === 26) return null;
              if (i <= 20 && t >= stampAt(i)) {
                const s = Math.min(1.2, pop(t, stampAt(i), 4, 0.5));
                const sept = SEPTEMBERS.includes(i);
                return (
                  <g key={i} opacity={travel}>
                    <g transform={`translate(${x} ${RAIL}) scale(${s})`}>
                      <circle r={19} fill="#0d1727" stroke={C.yellow} strokeWidth={3.5} />
                      <Tick x={0} y={1} s={8.5} w={4.5} />
                    </g>
                    {sept ? <Drop x={x} y={RAIL - 58 - (1 - Math.min(1, s)) * 40} s={23} a={Math.min(1, s * 1.5)} /> : null}
                  </g>
                );
              }
              if (i > 20 && i < 26 && t >= emptyAt(i)) {
                const s = Math.min(1.2, pop(t, emptyAt(i), 3, 0.5));
                return <circle key={i} cx={x} cy={RAIL} r={19 * s} fill="#04060a" stroke={C.red} strokeWidth={4} strokeDasharray="7 6" opacity={travel * (0.75 + 0.25 * Math.sin(t * 3 + i))} />;
              }
              return <circle key={i} cx={x} cy={RAIL} r={6} fill="#04060a" stroke={i > 20 ? '#b9584f' : '#7f95b8'} strokeWidth={2.5} opacity={travel} />;
            })
          : null}
        {/* the sweep */}
        {cursorA > 0.01 ? (
          <g opacity={cursorA}>
            <line x1={cursorX} y1={RAIL - 46} x2={cursorX} y2={RAIL + 40} stroke={t >= c.that ? C.red : C.yellow} strokeWidth={3} />
            <polygon points={`${cursorX - 11},${RAIL - 60} ${cursorX + 11},${RAIL - 60} ${cursorX},${RAIL - 42}`} fill={t >= c.that ? C.red : C.yellow} />
          </g>
        ) : null}
        {/* the light that runs the line in tl-23 */}
        {sweeping && hit < 0 ? (
          <>
            <defs>
              <linearGradient id="tlSweep" gradientUnits="userSpaceOnUse" x1={light - 260} y1={0} x2={light} y2={0}>
                <stop offset="0" stopColor={C.yellow} stopOpacity={0} />
                <stop offset="1" stopColor={C.yellow} stopOpacity={0.95} />
              </linearGradient>
            </defs>
            <line x1={Math.max(TRUE.left, light - 260)} y1={RAIL} x2={light} y2={RAIL} stroke="url(#tlSweep)" strokeWidth={10} strokeLinecap="round" />
            <circle cx={light} cy={RAIL} r={11} fill={C.yellow} />
          </>
        ) : null}
        {/* one dot for each thing that happened */}
        {EVENTS.map((e, i) => {
          if (t < e.show) return null;
          const x = sx(e.d);
          if (!onScreen(x)) return null;
          const lv = lerp(TRAVEL_LEVEL[i], TRUE_LEVEL[i], k);
          const jolt = hit >= 0 && e.red ? (1 - hit) * Math.sin(t * 60 + i * 2.1) * 5 : 0;
          const y = RAIL - lv * lerp(27, 20, k);
          const r = lerp(12, 8, k) * Math.min(1.25, pop(t, e.show));
          const red = e.red && (i > 4 || t >= c.last);
          const flash = hit >= 0 && e.red ? 1 - hit : 0;
          return (
            <g key={i}>
              {i === live && travel > 0.5 ? <circle cx={x} cy={y} r={r + 6 + ((t * 0.9) % 1) * 26} fill="none" stroke={red ? C.red : C.yellow} strokeWidth={3} opacity={(1 - ((t * 0.9) % 1)) * 0.8 * travel} /> : null}
              <circle cx={x + jolt} cy={y} r={r * (1 + 0.35 * flash)} fill={flash > 0.4 ? C.white : red ? C.red : C.white} stroke="#04060a" strokeWidth={3} />
            </g>
          );
        })}
        {/* later shows up */}
        {hit >= 0 && hit < 1 ? <circle cx={TRUE.right - 14} cy={RAIL - 60} r={40 + hit * 330} fill="none" stroke={C.red} strokeWidth={10 * (1 - hit)} opacity={1 - hit} /> : null}
        {t >= c.public && t < c.b22 && k > 0.9 ? <circle cx={TRUE.right - 16} cy={RAIL - 64} r={96 + 8 * Math.sin(t * 5)} fill="none" stroke={C.red} strokeWidth={4} strokeDasharray="10 10" strokeDashoffset={-t * 24} opacity={fadeIn(t, c.public, 0.3)} /> : null}
      </Svg>

      {/* ---------------- the stops ---------------- */}
      {travel > 0.02 ? (
        <div style={{position: 'absolute', inset: 0, opacity: clamp(travel * 1.6 - 0.3)}}>
          <Stop84 t={t} x={x84} />
          <Stop04 t={t} x={sx(D.y04)} />
          <Stop09 t={t} x={sx(D.y09)} />
          <Stop11 t={t} x={sx(D.y11)} />
          <Routine t={t} />
          <StopSept t={t} x={xSep} />
          <StopMar t={t} x={sx(D.mar)} xContract={sx(D.contract)} xMay={sx(D.may)} />
          <StopOct t={t} x={sx(D.oct15)} />
          <November t={t} x13={sx(D.n13)} x15={sx(D.n15)} x16={sx(D.n16)} x20={sx(D.n20)} x23={sx(D.n23)} x25={sx(D.n25)} />
        </div>
      ) : null}
      <Whole t={t} k={k} />

      {/* ---------------- two people, in their own words ---------------- */}
      <Said t={t} byAt={c.cmdr} quoteAt={c.quote11} out={c.b12 + 0.1} quote={os('tl-11', 0)} by={os('tl-11', 1)} accent={C.red} />
      <Said t={t} byAt={c.senator} quoteAt={c.quote22} out={c.b23 - 0.05} quote={os('tl-22', 0)} by={os('tl-22', 1)} />
    </>
  );
};
