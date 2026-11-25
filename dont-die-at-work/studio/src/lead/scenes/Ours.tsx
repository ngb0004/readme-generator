import React from 'react';
import estimate from '../../../../specials/five-tons-of-neglect/estimate.json';
import {C, FONT} from '../../engine/theme';
import {E, clamp, lerp, ramp, track} from '../../engine/time';
import {FIPS, MapBase, PLACE, Pin, camAt, projection} from '../draw/MapView';
import {Chip, H, Leader, Panel, Txt, W, fadeIn, pop, span} from '../kit';
import {label, os} from '../script';
import {StageOptions} from '../Stage';
import {S, at, word} from '../timeline';
import {BASE, BandFill, BandMarks, HILITE, IOWA, Measure, NEWEST, SoftLayer, Water, WindField, WindHand, heading, mix, ppm, xy} from './parts/ZoneMap';

// OUR OWN MAP. Where the forecast wind carries air that leaves the plant at 9 a.m. Every point
// drawn here comes out of estimate.json, which estimate.py computes from the saved Weather
// Service forecast. It shows where the air goes and when. It says nothing about how much lead.
type Pt = {hour: string; lon: number; lat: number; miles: number; from_deg: number | null; mph: number | null; half_width_miles: number};
const ALOFT = estimate.transport as Pt[];
const GROUND = estimate.surface as Pt[];
const BEARING = estimate.summary.transport_bearing_deg;
const FAN = estimate.method.direction_error_deg;
const NOON = ALOFT.findIndex((p) => p.hour === '12:00');
const LAST = ALOFT.length - 1;

const c = {
  start: S.ours.start,
  b2: at('our-2'),
  hourly: word('our-2', 'hour') - 0.15,
  ground: word('our-2', 'ground') - 0.3,
  above: word('our-2', 'above') - 0.4,
  b3: at('our-3'),
  blows: word('our-3', 'northeast') - 0.25,
  mph: word('our-3', 'twelve') - 0.2,
  b4: at('our-4'),
  ride: word('our-4', 'Ride'),
  noon: word('our-4', 'noon'),
  by: word('our-4', 'By'),
  hundred: word('our-4', 'hundred'),
  b5: at('our-5'),
  missouri: word('our-5', 'Missouri') - 0.3,
  near: word('our-5', 'Near') - 0.1,
  behind: word('our-5', 'behind'),
  army: word('our-5', "Army's") - 0.25,
  between: word('our-5', 'between') - 0.1,
  b6: at('our-6'),
  what: word('our-6', 'What') - 0.15,
  much: word('our-6', 'how') - 0.1,
  basis: word('our-6', 'basis') - 0.3,
  b7: at('our-7'),
  shifts: word('our-7', 'shifts') - 0.15,
  end: S.ours.end,
};

const FOCUS: [number, number] = [W / 2 + 220, 480];
const CAM = [
  {at: c.start, lon: -91.9, lat: 40.28, k: 420},
  {at: c.b4, lon: -91.95, lat: 40.25, k: 450, ease: E.inOutQuad},
  {at: c.end, lon: -91.97, lat: 40.24, k: 468, ease: E.lin},
];

/** An arrow in a strip of hours: which way that hour's wind carries things, longer when it is stronger. */
const HourArrow: React.FC<{x: number; y: number; from: number; mph: number; a: number; color: string}> = ({x, y, from, mph, a, color}) => {
  if (a <= 0.01) return null;
  const [dx, dy] = heading(from + 180);
  const len = mph * 4.6;
  const x0 = x - (dx * len) / 2;
  const y0 = y - (dy * len) / 2;
  const x1 = x + (dx * len) / 2;
  const y1 = y + (dy * len) / 2;
  const h = 16;
  return (
    <g opacity={Math.min(1, a)} transform={`translate(${x} ${y}) scale(${0.6 + 0.4 * Math.min(1, a)}) translate(${-x} ${-y})`}>
      <line x1={x0} y1={y0} x2={x1} y2={y1} stroke={color} strokeWidth={8} strokeLinecap="round" />
      <polygon points={`${x1 + dx * h},${y1 + dy * h} ${x1 - dy * h * 0.7},${y1 + dx * h * 0.7} ${x1 + dy * h * 0.7},${y1 - dx * h * 0.7}`} fill={color} />
    </g>
  );
};

export const options: StageOptions = {};

export const Ours: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(t, CAM);
  const proj = projection(cam, FOCUS);
  const s = ppm(proj);
  const plant = xy(proj, PLACE.plant);
  const P = (p: Pt) => xy(proj, [p.lon, p.lat]);
  const up = ALOFT.map(P);
  const low = GROUND.map(P);

  // how many hours of each track are drawn
  const gUp = track(t, [[c.ride, 0], [c.noon, NOON, E.inOutQuad], [c.by, NOON + 0.15, E.lin], [c.hundred + 0.1, LAST, E.inOutQuad]]);
  const gLow = lerp(0, LAST, ramp(t, c.near, c.behind + 0.2, E.inOutQuad));
  const partial = (pts: [number, number][], g: number) => {
    const n = Math.floor(clamp(g, 0, pts.length - 1));
    const f = clamp(g, 0, pts.length - 1) - n;
    const out = pts.slice(0, n + 1);
    if (f > 0.001 && n + 1 < pts.length) out.push([lerp(pts[n][0], pts[n + 1][0], f), lerp(pts[n][1], pts[n + 1][1], f)]);
    return out;
  };
  const line = (pts: [number, number][]) => pts.map((p) => p.join(',')).join(' ');
  // the two-sigma band either side of the upper track
  const core = (g: number) => {
    const pts = partial(up, g);
    if (pts.length < 2) return '';
    const half = (i: number) => (i < ALOFT.length ? ALOFT[i].half_width_miles : ALOFT[LAST].half_width_miles) * s;
    const side = (sign: number) =>
      pts.map((p, i) => {
        const a = pts[Math.max(0, i - 1)];
        const b = pts[Math.min(pts.length - 1, i + 1)];
        const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
        const w = i === pts.length - 1 && pts.length <= ALOFT.length ? half(Math.min(i, LAST)) : half(i);
        return [p[0] + (sign * -(b[1] - a[1]) * w) / l, p[1] + (sign * (b[0] - a[0]) * w) / l];
      });
    return 'M ' + [...side(1), ...side(-1).reverse()].map((p) => p.join(',')).join(' L ') + ' Z';
  };
  // what a ten-degree error in the wind would do: a fan either side
  const reach = estimate.summary.transport_reach_miles * s * clamp(gUp / LAST);
  const fanPt = (deg: number) => {
    const [dx, dy] = heading(deg);
    return [plant[0] + dx * reach, plant[1] + dy * reach];
  };
  const fanA = fadeIn(t, c.hundred + 0.3, 0.6) * (1 - 0.6 * span(t, c.b6, c.b7, 0.4, 0.3));
  const fan = `M ${plant.join(',')} L ${fanPt(BEARING - FAN).join(',')} A ${reach} ${reach} 0 0 1 ${fanPt(BEARING + FAN).join(',')} Z`;
  // our-7: if the wind shifts, the whole picture swings with it
  const sway = t >= c.b7 ? 9 * Math.sin((t - c.shifts) * 1.9) * ramp(t, c.shifts, c.shifts + 0.5) * (1 - ramp(t, c.end - 0.7, c.end - 0.2)) : 0;

  const armyA = fadeIn(t, c.army, 0.6);
  const openA = 1 - ramp(t, c.b2, c.b2 + 0.8); // the Army's map as the last section left it
  const question = span(t, c.what, c.b7, 0.4, 0.3);
  const ours = fadeIn(t, c.ride, 0.2) * (1 - 0.55 * question);
  const lit = {[FIPS.iowa]: IOWA, [FIPS.missouri]: mix(BASE, HILITE, span(t, c.missouri, c.b6, 0.6, 0.8)), [FIPS.illinois]: BASE};

  const noonPt = up[NOON];
  const endPt = up[LAST];
  const strip = span(t, c.ground - 0.5, c.b3 + 0.1, 0.3, 0.3);
  const windA = span(t, c.b2 + 0.4, c.b5, 0.6, 0.4);
  const handA = span(t, c.blows, c.ride + 0.2, 0.4, 0.3);
  const legend = span(t, c.near, c.b6, 0.35, 0.3);
  const hourDot = (pts: [number, number][], g: number, color: string, r: number) =>
    pts.map((p, i) => (i > 0 && g >= i - 0.02 ? <circle key={i} cx={p[0]} cy={p[1]} r={r * Math.min(1.25, pop(t, i <= NOON ? lerp(c.ride, c.noon, i / NOON) : c.by))} fill={color} stroke="#04060a" strokeWidth={3} /> : null));

  return (
    <>
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
        <Water />
        <MapBase proj={proj} cam={cam} lit={lit} />
      </svg>

      {/* the Army's newest map, as reported: a schematic, soft-edged */}
      <SoftLayer blur={clamp(s * 1.15, 5, 30)}>
        <BandFill proj={proj} band={NEWEST} a={Math.max(openA, armyA) * (1 - 0.5 * question)} live={openA > 0.01 ? 0.25 : 0.7} />
      </SoftLayer>

      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
        <WindField time={t} bearing={BEARING} a={windA * 0.9} />
        <BandMarks proj={proj} band={NEWEST} time={t} a={Math.max(openA, armyA) * (1 - 0.5 * question)} live={0} doubt={openA > 0.01 ? 1 : 0.15} seed={11} />

        <g transform={`rotate(${sway} ${plant[0]} ${plant[1]})`} opacity={ours}>
          {fanA > 0.01 ? (
            <>
              <path d={fan} fill={C.yellow} opacity={0.07 * fanA} />
              {[BEARING - FAN, BEARING + FAN].map((deg) => (
                <line key={deg} x1={plant[0]} y1={plant[1]} x2={fanPt(deg)[0]} y2={fanPt(deg)[1]} stroke={C.yellow} strokeWidth={2.5} strokeDasharray="6 12" opacity={0.6 * fanA} />
              ))}
            </>
          ) : null}
          {gUp > 0.05 ? <path d={core(gUp)} fill={C.yellow} opacity={0.2} /> : null}
          {/* near the ground: slower, so it trails */}
          {gLow > 0.02 ? (
            <>
              <polyline points={line(partial(low, gLow))} fill="none" stroke="#04060a" strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
              <polyline points={line(partial(low, gLow))} fill="none" stroke="#ffe08a" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 12" />
            </>
          ) : null}
          {/* the faster wind above: the front of the cloud */}
          {gUp > 0.02 ? (
            <>
              <polyline points={line(partial(up, gUp))} fill="none" stroke="#04060a" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
              <polyline points={line(partial(up, gUp))} fill="none" stroke={C.yellow} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
              {hourDot(up, gUp, C.yellow, 9)}
              {(() => {
                const head = partial(up, gUp).slice(-1)[0];
                return <circle cx={head[0]} cy={head[1]} r={13} fill={C.yellow} stroke="#04060a" strokeWidth={4} />;
              })()}
            </>
          ) : null}
          <Measure from={[plant[0] - 54, plant[1] - 44]} to={[endPt[0] - 54, endPt[1] - 44]} a={span(t, c.hundred - 0.1, c.near - 0.1, 0.5, 0.3)} color={C.yellow} />
        </g>

        <Pin proj={proj} at={PLACE.knoxCity} a={fadeIn(t, c.missouri, 0.4) * (1 - question)} r={7} color="#9fb3d1" />
        <Pin proj={proj} at={PLACE.macon} a={fadeIn(t, c.missouri + 0.3, 0.4) * (1 - question)} r={7} color="#9fb3d1" />
        <Pin proj={proj} at={PLACE.plant} time={t} ping color={C.red} r={11} />
        <WindHand proj={proj} bearing={BEARING} a={handA} len={300} name={label('wind')} />
      </svg>

      {/* place names */}
      <Txt x={plant[0] - 24} y={plant[1] - 96} size={24} font="mono" weight={700} align="right" spacing="0.12em" a={0.9}>{label('plant')}</Txt>
      <Txt x={xy(proj, PLACE.knoxCity)[0] + 16} y={xy(proj, PLACE.knoxCity)[1] + 6} size={22} font="mono" weight={700} spacing="0.12em" color="#9fb3d1" a={fadeIn(t, c.missouri + 0.1, 0.4) * (1 - question)}>{label('knoxCity')}</Txt>
      <Txt x={xy(proj, PLACE.macon)[0] + 16} y={xy(proj, PLACE.macon)[1] + 6} size={22} font="mono" weight={700} spacing="0.12em" color="#9fb3d1" a={fadeIn(t, c.missouri + 0.4, 0.4) * (1 - question)}>{label('macon')}</Txt>
      <Txt x={xy(proj, [-92.75, 40.36])[0]} y={xy(proj, [-92.75, 40.36])[1]} w={600} size={28} font="mono" weight={700} align="center" spacing="0.5em" color="#6f8bb5" a={span(t, c.missouri, c.b6, 0.5, 0.4) * 0.9}>{label('missouri')}</Txt>

      {/* our-2: the forecast, hour by hour */}
      <Chip x={72} y={150} size={50} a={Math.max(span(t, c.b2 + 0.2, c.b3, 0.4, 0.25), span(t, c.b7 + 0.1, c.end + 1, 0.4, 0.25))}>{os('our-2', 0)}</Chip>
      <Chip x={72} y={236} size={40} color={C.white} a={Math.max(span(t, c.b2 + 0.9, c.b3, 0.4, 0.25), span(t, c.b7 + 0.3, c.end + 1, 0.4, 0.25))}>{os('our-2', 1)}</Chip>
      <Panel x={72} y={326} w={760} h={340} a={strip}>
        <div style={{position: 'absolute', left: 30, top: 26, fontFamily: FONT.mono, fontWeight: 700, fontSize: 26, letterSpacing: '0.16em', color: C.yellow, opacity: fadeIn(t, c.above, 0.3)}}>{label('ours_aloft')}</div>
        <div style={{position: 'absolute', left: 30, top: 186, fontFamily: FONT.mono, fontWeight: 700, fontSize: 26, letterSpacing: '0.16em', color: '#ffe08a', opacity: fadeIn(t, c.ground, 0.3)}}>{label('ours_ground')}</div>
        <svg width={760} height={340} style={{position: 'absolute', left: 0, top: 0}}>
          {ALOFT.slice(0, LAST).map((p, i) => (
            <React.Fragment key={i}>
              <line x1={74 + i * 87} y1={162} x2={74 + i * 87} y2={172} stroke="#51607a" strokeWidth={2.5} />
              <line x1={74 + i * 87} y1={318} x2={74 + i * 87} y2={328} stroke="#51607a" strokeWidth={2.5} />
              <HourArrow x={74 + i * 87} y={112} from={p.from_deg ?? 0} mph={p.mph ?? 0} a={clamp((t - c.above - i * 0.07) / 0.25)} color={C.yellow} />
              <HourArrow x={74 + i * 87} y={268} from={GROUND[i].from_deg ?? 0} mph={GROUND[i].mph ?? 0} a={clamp((t - c.ground - i * 0.07) / 0.25)} color="#ffe08a" />
            </React.Fragment>
          ))}
        </svg>
      </Panel>

      {/* our-3: what the forecast says */}
      <Chip x={72} y={150} size={58} a={span(t, c.blows, c.near - 0.1, 0.4, 0.25)}>{os('our-3', 0)}</Chip>
      <Chip x={72} y={248} size={58} color={C.white} a={span(t, c.mph, c.near - 0.1, 0.4, 0.25)}>{os('our-3', 1)}</Chip>

      {/* our-4: where that carries it, and when */}
      <Txt x={noonPt[0] + 34} y={noonPt[1] - 62} size={44} font="display" color={C.yellow} outline={5} a={span(t, c.noon - 0.1, c.b6, 0.2, 0.3)} scale={0.8 + 0.2 * pop(t, c.noon - 0.1)}>{os('our-4', 0)}</Txt>
      <Txt x={endPt[0] - 28} y={endPt[1] - 96} size={52} font="display" align="right" color={C.yellow} outline={5} a={span(t, c.hundred - 0.25, c.b6, 0.2, 0.3)} scale={0.8 + 0.2 * pop(t, c.hundred - 0.25)}>{os('our-4', 1)}</Txt>
      <Chip x={72} y={372} size={70} a={span(t, c.hundred - 0.1, c.near - 0.1, 0.4, 0.25)}>{os('our-4', 2)}</Chip>

      {/* our-5: ours against the Army's */}
      <Chip x={72} y={150} size={56} a={legend}>{os('our-5', 0)}</Chip>
      <Txt x={104} y={250} size={26} font="mono" weight={700} spacing="0.14em" color={C.yellow} a={legend}>{label('ours_aloft')}</Txt>
      <Txt x={104} y={294} size={26} font="mono" weight={700} spacing="0.14em" color="#ffe08a" a={legend * fadeIn(t, c.near, 0.4)}>{label('ours_ground')}</Txt>
      <Chip x={72} y={356} size={50} color={C.cyan} a={legend * fadeIn(t, c.army, 0.4)}>{os('our-5', 1)}</Chip>
      <Leader from={{x: 560, y: 420}} to={{x: xy(proj, PLACE.knoxCity)[0] - 30, y: xy(proj, PLACE.knoxCity)[1] + 40}} a={legend * fadeIn(t, c.army + 0.3, 0.4)} color={C.cyan} />

      {/* our-6: the part no wind map can answer */}
      <Txt x={72} y={300} w={900} size={132} font="display" color={C.cyan} outline={9} scale={0.82 + 0.18 * pop(t, c.much)} a={span(t, c.much, c.b7, 0.15, 0.3)}>{os('our-6', 0)}</Txt>
      <Chip x={72} y={470} size={42} color={C.cyan} a={span(t, c.basis, c.b7, 0.4, 0.3)}>{os('our-6', 1)}</Chip>

      <Txt x={W - 72} y={796} w={1500} size={20} font="mono" weight={700} align="right" spacing="0.16em" color={C.mute} a={fadeIn(t, c.b2, 0.5)}>{label('ours_note')}</Txt>
      <Txt x={W - 72} y={766} w={1500} size={20} font="mono" weight={700} align="right" spacing="0.16em" color={C.mute} a={Math.max(openA, armyA) * 0.9}>{label('schematic_map')}</Txt>
    </>
  );
};
