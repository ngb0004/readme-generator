import React from 'react';
import {C, FONT} from '../../engine/theme';
import {E, clamp, ramp, rnd} from '../../engine/time';
import {CamKey, FIPS, MapBase, PLACE, Pin, camAt, dest, projection, ring} from '../draw/MapView';
import {Chip, Leader, Panel, Txt, W, fadeIn, pop, span} from '../kit';
import {label, os} from '../script';
import {StageOptions} from '../Stage';
import {S, at, word} from '../timeline';
import {
  BandFill, BandMarks, CONE, County, FarmMark, IOWA, Measure, MileGrid, NEWEST, PicBed, PicBus, PicIndoors, PicMeal, PicPhone, PicWindow, PicWipe,
  SoftLayer, Water, WindField, conePath, onBand, ppm, xy,
} from './parts/ZoneMap';

// WHO LEAVES, WHO STAYS. A small zone is helped to leave; a far larger area is told to stay
// indoors and clean up afterwards. Every zone here is a schematic of what the Army announced.
const c = {
  start: S.evac.start,
  helped: word('evac-1', 'helped') - 0.12,
  town: word('evac-1', 'Everyone') - 0.12,
  cone: word('evac-1', 'cone-shaped') - 0.15,
  five: word('evac-1', 'five') - 0.12,
  extra: word('evac-1', 'one') - 0.15,
  b2: at('evac-2'),
  fema: word('evac-2', 'FEMA') - 0.12,
  rides: word('evac-2', 'rides') - 0.1,
  hotel: word('evac-2', 'hotel') - 0.1,
  meals: word('evac-2', 'meals') - 0.1,
  through: word('evac-2', 'through') - 0.1,
  b3: at('evac-3'),
  b4: at('evac-4'),
  twenty: word('evac-4', 'twenty') - 0.12,
  alert: word('evac-4', 'emergency') - 0.12,
  stay: word('evac-4', 'stay') - 0.12,
  b6: at('evac-6'),
  farther: word('evac-6', 'farther') - 0.12,
  close: word('evac-6', 'close') - 0.12,
  keep: word('evac-6', 'keep') - 0.12,
  after: word('evac-6', 'afterwards') - 0.12,
  b7: at('evac-7'),
  counties: word('evac-7', 'counties') - 0.12,
  federal: word('evac-7', 'federal') - 0.12,
  n350: word('evac-7', '350') - 0.12,
  b8: at('evac-8'),
  b9: at('evac-9'),
  left: word('evac-9', 'helped') - 0.12,
  told: word('evac-9', 'told') - 0.12,
  clean: word('evac-9', 'clean') - 0.12,
  that: word('evac-9', 'That') - 0.1,
  end: S.evac.end,
};

// Framings: the plant and the town; the cone; the 20-mile ring; the whole newest map; the three
// counties; the far end of the map; and the cone against everything round it.
const E0 = {lon: -91.275, lat: 40.812, k: 5200};
const EA = {lon: -91.3067, lat: 40.7711, k: 3800};
const EC = {lon: -91.7333, lat: 40.7568, k: 785};
const ED = {lon: -91.095, lat: 40.204, k: 360};
const EE = {lon: -91.56, lat: 40.7, k: 760};
const EF = {lon: -92.2, lat: 39.95, k: 520};
const EG = {lon: -91.3208, lat: 40.6156, k: 680};
const CAM: CamKey[] = [
  {at: c.start, cut: true, ...E0},
  {at: c.cone, ...E0, k: 4800, ease: E.lin},
  {at: c.five + 0.5, ...EA, ease: E.inOutQuad},
  {at: c.b3, ...EA, k: 4050, ease: E.lin},
  {at: c.b4 + 0.7, ...EC, ease: E.inOutQuad},
  {at: c.b6, ...EC, k: 820, ease: E.lin},
  {at: c.farther + 1.3, ...ED, ease: E.inOutQuad},
  {at: c.b7 - 0.1, ...ED, k: 372, ease: E.lin},
  {at: c.b7 + 1.0, ...EE, ease: E.inOutQuad},
  {at: c.b8, ...EE, k: 790, ease: E.lin},
  {at: c.b8 + 1.7, ...EF, ease: E.inOutQuad},
  {at: c.b9 + 0.2, ...EF, k: 560, ease: E.lin},
  {at: c.b9 + 1.9, ...EG, ease: E.inOutQuad},
  {at: c.end, ...EG, k: 740, ease: E.lin},
];

const YELLOW_FILL = 'rgba(255,194,26,0.26)';
const COUNTIES = [FIPS.desMoinesCo, FIPS.leeCo, FIPS.vanBurenCo];

export const options: StageOptions = {};

export const Evac: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(t, CAM);
  const proj = projection(cam);
  const s = ppm(proj);
  const plant = xy(proj, PLACE.plant);
  const mid = xy(proj, PLACE.middletown);

  // the relocation zone
  const townA = pop(t, c.town, 3, 0.7);
  const reach = ramp(t, c.cone, c.five + 0.6, E.inOutQuad);
  const padA = ramp(t, c.extra, c.extra + 0.7, E.out);
  const tip = xy(proj, dest(PLACE.plant, CONE.bearing, CONE.length));
  const tipOut = xy(proj, dest(PLACE.plant, CONE.bearing, CONE.length + CONE.pad));
  const axisMid = xy(proj, dest(PLACE.plant, CONE.bearing, CONE.length * 0.55));
  const last = ramp(t, c.b9 + 0.4, c.b9 + 1.9);
  const glow = last * (0.55 + 0.45 * Math.sin((t - c.left) * 4.2)) * (t >= c.left ? 1 : 0.4);

  // the 20-mile alert
  const ringK = ramp(t, c.twenty - 0.1, c.twenty + 0.9, E.out);
  const ringA = (t < c.b7 ? 1 : t < c.b9 ? 0.4 : 0.4 + 0.6 * last) * (ringK > 0 ? 1 : 0);
  const ringW = xy(proj, dest(PLACE.plant, 270, 20));

  // the newest dust map
  const bandA = ramp(t, c.b6 + 0.1, c.b6 + 0.7);
  const grow = ramp(t, c.b6 + 0.3, c.farther + 1.9, E.inOutQuad);
  const farms = ramp(t, c.federal, c.n350 + 0.8);

  const closeA = span(t, c.start, c.b3 + 0.5, 0.01, 0.5); // the first two beats, close on the plant
  const ringLabels = span(t, c.b4 + 0.8, c.b6 + 0.6, 0.4, 0.4);
  const farEnd = span(t, c.b8 + 1.2, c.b9 + 0.6, 0.5, 0.4);
  const listA = span(t, c.close - 0.5, c.b7 + 0.1, 0.4, 0.3);

  const town = (key: string, a: number, side: 'left' | 'right' = 'right', color = '#b9c9e2') => {
    const [x, y] = xy(proj, PLACE[key]);
    return (
      <Txt key={key} x={side === 'right' ? x + 18 : x - 18} y={y - 15} size={25} font="mono" weight={700} spacing="0.12em" align={side === 'right' ? 'left' : 'right'} color={color} a={a} nowrap>
        {label(key)}
      </Txt>
    );
  };
  const row = (i: number, when: number, text: string, Pic: React.FC<{x: number; y: number; s: number; pop?: number}>) => {
    const k = pop(t, when);
    const y = 318 + i * 132;
    return (
      <React.Fragment key={i}>
        <svg width={W} height={1080} style={{position: 'absolute', left: 0, top: 0, opacity: listA * (t >= when ? Math.min(1, k * 2) : 0)}}>
          <Pic x={1122} y={y + 44} s={92} pop={0.8 + 0.2 * Math.min(1, k)} />
        </svg>
        <Txt x={1196} y={y + 2} w={640} size={44} weight={700} spacing="0.03em" lh={1.06} a={listA * (t >= when ? Math.min(1, k * 2) : 0)}>
          {text}
        </Txt>
      </React.Fragment>
    );
  };

  return (
    <>
      <svg width={W} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
        <Water />
        <MapBase proj={proj} cam={cam} lit={{[FIPS.iowa]: IOWA}} />
        <MileGrid proj={proj} a={clamp((s - 22) / 26)} />
        {/* evac-7: the three counties under the proclamation */}
        {COUNTIES.map((f, i) => (
          <County key={f} proj={proj} fips={f} a={span(t, c.b7 + 0.2 + i * 0.3, c.b8 + 1.0, 0.35, 0.6)} />
        ))}
      </svg>

      <SoftLayer blur={clamp(s * 1.15, 5, 30)}>
        <BandFill proj={proj} band={NEWEST} grow={grow} a={bandA * (t < c.b9 ? 1 : 1 - 0.25 * last)} />
      </SoftLayer>

      <svg width={W} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
        <WindField time={t} bearing={NEWEST.bearing} a={0.6 * fadeIn(t, c.b6 + 0.4, 1)} />
        <BandMarks proj={proj} band={NEWEST} time={t} grow={grow} a={bandA} seed={11} />

        {/* evac-4: stay indoors out to 20 miles */}
        {ringK > 0 ? <path d={ring(proj, PLACE.plant, 20 * ringK)} fill="rgba(69,227,255,0.06)" stroke={C.cyan} strokeWidth={5} strokeDasharray="18 14" strokeDashoffset={-t * 26} opacity={ringA} /> : null}
        <Measure from={plant} to={ringW} a={span(t, c.twenty + 0.5, c.b6 + 0.3, 0.6, 0.3)} color={C.cyan} />

        {/* evac-7: farms in the path (a texture, not a count) */}
        {farms > 0
          ? Array.from({length: 74}, (_, i) => {
              const k = clamp(farms * 1.6 - rnd(i * 4.7) * 0.6);
              if (k <= 0) return null;
              const u = rnd(i * 1.93);
              const along = 3 + u * 62;
              const w = Math.sqrt(Math.max(0, 1 - Math.pow((2 * (along + NEWEST.back)) / (NEWEST.length + NEWEST.back) - 1, 2)));
              const [x, y] = xy(proj, onBand(NEWEST, along, (rnd(i * 7.31) * 2 - 1) * NEWEST.half * w * 0.86));
              return <FarmMark key={i} x={x} y={y} s={0.95} a={k * span(t, c.federal, c.b8 + 1.2, 0.2, 0.6)} />;
            })
          : null}

        {/* evac-1: everyone in Middletown, and the cone */}
        <path d={ring(proj, PLACE.middletown, 0.55)} fill={YELLOW_FILL} stroke={C.yellow} strokeWidth={4} opacity={t >= c.town ? Math.min(1, townA * 2) * (s > 30 ? 1 : 0) : 0} transform={`translate(${mid[0]} ${mid[1]}) scale(${0.6 + 0.4 * Math.min(1.1, townA)}) translate(${-mid[0]} ${-mid[1]})`} />
        {padA > 0 ? <path d={conePath(proj, reach, CONE.pad * padA)} fill="rgba(255,194,26,0.09)" stroke={C.yellow} strokeWidth={clamp(s * 0.06, 2, 4)} strokeDasharray={s > 30 ? '12 10' : '5 5'} opacity={0.95} /> : null}
        {reach > 0 ? (
          <>
            {glow > 0 ? <path d={conePath(proj, 1, CONE.pad)} fill={C.yellow} opacity={0.35 * glow} filter="url(#evacGlow)" /> : null}
            <path d={conePath(proj, reach)} fill={last > 0 ? 'rgba(255,194,26,0.75)' : YELLOW_FILL} stroke={C.yellow} strokeWidth={clamp(s * 0.08, 2.5, 5)} strokeLinejoin="round" />
          </>
        ) : null}
        <defs>
          <filter id="evacGlow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation={14} />
          </filter>
        </defs>
        <Measure from={plant} to={tip} a={span(t, c.five, c.b2 + 0.4, 0.6, 0.3)} />
        <Measure from={tip} to={tipOut} a={span(t, c.extra + 0.2, c.b2 + 0.4, 0.4, 0.3)} />

        {/* towns */}
        <Pin proj={proj} at={PLACE.burlington} a={Math.max(closeA, ringLabels)} r={7} color="#9fb3d1" />
        <Pin proj={proj} at={PLACE.mediapolis} a={ringLabels} r={7} color="#9fb3d1" />
        <Pin proj={proj} at={PLACE.keokuk} a={span(t, c.farther + 1.4, c.b8 + 0.8, 0.4, 0.4)} r={7} color="#9fb3d1" />
        <Pin proj={proj} at={PLACE.knoxCity} a={Math.max(span(t, c.farther + 1.8, c.b7, 0.4, 0.3), farEnd)} r={8} />
        <Pin proj={proj} at={PLACE.macon} a={Math.max(span(t, c.farther + 2.1, c.b7, 0.4, 0.3), farEnd)} r={8} />
        <Pin proj={proj} at={PLACE.plant} time={t} ping color={C.red} r={s > 30 ? 14 : 10} />
      </svg>

      {/* evac-1 */}
      <Chip x={72} y={150} size={60} a={span(t, c.helped, c.b3 + 0.3, 0.35, 0.3)}>{os('evac-1', 0)}</Chip>
      <Txt x={mid[0] + 62} y={mid[1] - 50} size={88} font="display" outline={8} scale={0.85 + 0.15 * Math.min(1.1, townA)} a={span(t, c.town + 0.1, c.b3 + 0.3, 0.15, 0.3)} nowrap>{label('middletown')}</Txt>
      <Txt x={plant[0] + 26} y={plant[1] - 15} size={26} font="mono" weight={700} spacing="0.12em" a={span(t, c.start + 0.5, c.b3 + 0.3, 0.4, 0.3)} nowrap>{label('plant')}</Txt>
      {town('burlington', Math.max(closeA * fadeIn(t, c.five + 0.6, 0.4), ringLabels))}
      <Leader from={{x: 1196, y: 556}} to={{x: axisMid[0] + 8, y: axisMid[1] + 6}} a={span(t, c.five + 0.3, c.b2 + 0.4, 0.35, 0.2)} color={C.white} />
      <Chip x={1190} y={520} size={56} color={C.white} a={span(t, c.five + 0.1, c.b2 + 0.4, 0.35, 0.25)}>{os('evac-1', 1)}</Chip>
      <Leader from={{x: 1196, y: 676}} to={{x: (tip[0] + tipOut[0]) / 2 + 10, y: (tip[1] + tipOut[1]) / 2 + 4}} a={span(t, c.extra + 0.4, c.b2 + 0.4, 0.35, 0.2)} />
      <Chip x={1190} y={640} size={56} a={span(t, c.extra + 0.2, c.b2 + 0.4, 0.35, 0.25)}>{os('evac-1', 2)}</Chip>

      {/* evac-2: what the help is */}
      <Panel x={56} y={282} w={742} h={428} a={span(t, c.fema - 0.15, c.b3 + 0.3, 0.3, 0.3)} accent={C.yellow} />
      <Txt x={96} y={312} w={690} size={50} weight={700} spacing="0.03em" a={span(t, c.fema, c.b3 + 0.3, 0.3, 0.3)} nowrap>{os('evac-2', 0)}</Txt>
      <svg width={W} height={1080} style={{position: 'absolute', left: 0, top: 0, opacity: span(t, c.fema, c.b3 + 0.3, 0.2, 0.3)}}>
        <PicBus x={196} y={478} s={170} a={t >= c.rides ? 1 : 0} pop={0.7 + 0.3 * Math.min(1.1, pop(t, c.rides))} />
        <PicBed x={428} y={474} s={160} a={t >= c.hotel ? 1 : 0} pop={0.7 + 0.3 * Math.min(1.1, pop(t, c.hotel))} />
        <PicMeal x={660} y={476} s={150} a={t >= c.meals ? 1 : 0} pop={0.7 + 0.3 * Math.min(1.1, pop(t, c.meals))} />
      </svg>
      <Txt x={96} y={612} w={690} size={50} weight={700} spacing="0.03em" color={C.yellow} a={span(t, c.through, c.b3 + 0.3, 0.3, 0.3)} nowrap>{os('evac-2', 1)}</Txt>

      {/* evac-4: everyone else */}
      <Chip x={72} y={150} size={66} color={C.cyan} a={span(t, c.twenty, c.b6 + 0.3, 0.35, 0.3)}>{os('evac-4', 0)}</Chip>
      <svg width={W} height={1080} style={{position: 'absolute', left: 0, top: 0, opacity: span(t, c.alert, c.b6 + 0.3, 0.25, 0.3)}}>
        <PicPhone x={196} y={520} s={300} time={t} buzz={span(t, c.alert, c.alert + 1.5, 0.1, 0.5)} pop={0.8 + 0.2 * Math.min(1.1, pop(t, c.alert))} />
      </svg>
      <Chip x={356} y={486} size={46} color={C.yellow} a={span(t, c.stay, c.b6 + 0.3, 0.35, 0.3)}>{os('evac-4', 1)}</Chip>
      {town('mediapolis', ringLabels)}

      {/* evac-6: the instructions for everyone farther out */}
      <Panel x={1040} y={282} w={808} h={428} a={listA} accent={C.cyan} />
      {row(0, c.close, os('evac-6', 0), PicWindow)}
      {row(1, c.keep, os('evac-6', 1), PicIndoors)}
      {row(2, c.after, os('evac-6', 2), PicWipe)}
      {town('keokuk', span(t, c.farther + 1.4, c.b8 + 0.8, 0.4, 0.4))}
      {town('knoxCity', Math.max(span(t, c.farther + 1.8, c.b7, 0.4, 0.3), farEnd), 'left', C.white)}
      {town('macon', Math.max(span(t, c.farther + 2.1, c.b7, 0.4, 0.3), farEnd), 'left', C.white)}

      {/* evac-7: the counties and the farms */}
      <Chip x={72} y={140} size={50} a={span(t, c.counties, c.b8 + 0.9, 0.35, 0.3)}>{os('evac-7', 0)}</Chip>
      <Chip x={W - 72} y={600} size={62} align="right" color={C.white} a={span(t, c.n350, c.b8 + 0.9, 0.35, 0.3)}>{os('evac-7', 1)}</Chip>

      {/* evac-9: the gap */}
      <Leader from={{x: 690, y: 206}} to={{x: axisMid[0] - 8, y: axisMid[1] - 8}} a={span(t, c.left + 0.2, c.end + 1, 0.4, 0.2)} />
      <Chip x={72} y={170} size={54} a={span(t, c.left, c.end + 1, 0.35, 0.3)}>{os('evac-1', 0)}</Chip>
      <Chip x={W - 72} y={560} size={46} align="right" color={C.cyan} a={span(t, c.told, c.end + 1, 0.35, 0.3)}>{os('evac-4', 1)}</Chip>
      <Chip x={W - 72} y={650} size={40} align="right" color={C.cyan} a={span(t, c.clean, c.end + 1, 0.35, 0.3)}>{os('evac-6', 2)}</Chip>

      {/* every zone here is a picture of a reported map */}
      <Txt x={W - 72} y={792} size={24} font="mono" weight={700} align="right" spacing="0.14em" color={C.mute} a={fadeIn(t, c.cone, 0.5)} nowrap style={{fontFamily: FONT.mono}}>
        {label('schematic_map')}
      </Txt>
    </>
  );
};
