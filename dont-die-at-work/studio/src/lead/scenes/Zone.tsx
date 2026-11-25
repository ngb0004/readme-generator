import React from 'react';
import {C} from '../../engine/theme';
import {E, clamp, ramp, track} from '../../engine/time';
import {CamKey, FIPS, MapBase, PLACE, Pin, camAt, projection} from '../draw/MapView';
import {Chip, Leader, QuoteCard, Txt, W, fadeIn, pop, span} from '../kit';
import {label, os} from '../script';
import {StageOptions} from '../Stage';
import {S, at, word} from '../timeline';
import {BASE, BandFill, BandMarks, BlankedPage, FIRST, HILITE, IOWA, Measure, NEWEST, River, SoftLayer, Water, WindField, WindHand, mix, onBand, ppm, xy} from './parts/ZoneMap';

// WHERE THE DUST GOES. The first maps ran northeast; the date moved, the wind turned, and the
// newest maps run southwest. Both are drawn as schematics of what was reported, and labelled so.
const c = {
  start: S.zone.start,
  wind: word('zone-1', 'Wherever') - 0.15,
  b2: at('zone-2'),
  sent: word('zone-2', 'sent') - 0.1,
  miles: word('zone-2', 'About') - 0.12,
  b3: at('zone-3'),
  river: word('zone-3', 'Mississippi') - 0.12,
  over: word('zone-3', 'over') - 0.12,
  agency: word('zone-3', 'environmental') - 0.2,
  b4: at('zone-4'),
  firstMap: word('zone-4', 'first') - 0.15,
  middle: word('zone-4', 'middle') - 0.12,
  b5: at('zone-5'),
  turned: word('zone-5', 'wind') - 0.12,
  b6: at('zone-6'),
  other: word('zone-6', 'other') - 0.12,
  sw: word('zone-6', 'Southwest') - 0.12,
  into: word('zone-6', 'into') - 0.12,
  b7: at('zone-7'),
  quote: word('zone-7', 'People') - 0.25,
  b8: at('zone-8'),
  different: word('zone-8', 'Different') - 0.12,
  decided: word('zone-8', 'Decided') - 0.12,
  wednesday: word('zone-8', 'Wednesday') - 0.12,
  b9: at('zone-9'),
  forecasts: word('zone-9', 'forecasts') - 0.2,
  how: word('zone-9', 'How') - 0.12,
  called: word('zone-9', 'called') - 0.12,
  end: S.zone.end,
};

// Framings: the plant; the first map; Mediapolis; both maps at once; the newest map.
const ZA = {lon: -91.26, lat: 40.86, k: 460};
const ZB = {lon: -90.8, lat: 41.355, k: 322};
const ZC = {lon: -91.2, lat: 40.878, k: 1500};
const ZD = {lon: -91.15, lat: 40.8, k: 205};
const ZE = {lon: -91.85, lat: 40.25, k: 380};
const CAM: CamKey[] = [
  {at: c.start, cut: true, ...ZA, k: 540},
  {at: c.b2 + 0.3, ...ZA, ease: E.lin},
  {at: c.sent + 1.7, ...ZB, ease: E.inOutQuad},
  {at: c.b4, lon: ZB.lon + 0.1, lat: ZB.lat + 0.04, k: ZB.k * 1.07, ease: E.lin},
  {at: c.b4 + 1.5, ...ZC, ease: E.inOutQuad},
  {at: c.b5, ...ZC, k: 1640, ease: E.lin},
  {at: c.b5 + 1.15, ...ZD, ease: E.inOutQuad},
  {at: c.b6 + 0.5, ...ZD, k: 212, ease: E.lin},
  {at: c.sw + 0.5, ...ZE, ease: E.inOutQuad},
  {at: c.b7 + 0.3, ...ZE, k: 398, ease: E.lin},
  {at: c.b7 + 2.7, ...ZD, ease: E.inOutQuad},
  {at: c.b9, ...ZD, k: 214, ease: E.lin},
  {at: c.end, ...ZD, lon: -91.3, k: 236, ease: E.lin},
];

/** The same direction as the newest map, reached by turning the short way round (through north and west). */
const SOUTHWEST = NEWEST.bearing - 360;
/** Which way the wind arrow points. It swings loose until the first map pins it down. */
const windAt = (t: number) => {
  const loose = 1 - ramp(t, c.b2, c.sent + 0.4, E.inOutQuad);
  const swing = loose * (95 * Math.sin((t - c.wind) * 2.1) + 22 * Math.sin((t - c.wind) * 5.3 + 1));
  const set = track(t, [
    [c.turned, FIRST.bearing],
    [c.turned + 1.25, SOUTHWEST, E.inOut],
    [c.decided, SOUTHWEST],
    [c.decided + 0.85, FIRST.bearing, E.inOut],
    [c.wednesday - 0.1, FIRST.bearing],
    [c.wednesday + 0.85, SOUTHWEST, E.inOut],
  ]);
  return set + swing;
};

type Tag = {key: string; ll: [number, number]; from: number; to: number};
// State names, set where there is room in each framing.
const STATES: Tag[] = [
  {key: 'iowa', ll: [-92.05, 41.15], from: c.start + 0.3, to: c.sent + 0.3},
  {key: 'illinois', ll: [-90.45, 41.0], from: c.start + 0.5, to: c.sent + 0.3},
  {key: 'missouri', ll: [-92.05, 40.45], from: c.start + 0.7, to: c.sent + 0.3},
  {key: 'iowa', ll: [-91.95, 41.5], from: c.sent + 1.6, to: c.b4 + 0.2},
  {key: 'iowa', ll: [-92.75, 41.45], from: c.b5 + 1.0, to: c.sw - 0.2},
  {key: 'illinois', ll: [-89.55, 40.95], from: c.b5 + 1.1, to: c.sw - 0.2},
  {key: 'missouri', ll: [-92.75, 39.95], from: c.b5 + 1.2, to: c.sw - 0.2},
  {key: 'iowa', ll: [-92.5, 40.74], from: c.sw + 0.6, to: c.b7 + 0.6},
  {key: 'illinois', ll: [-90.85, 40.25], from: c.sw + 0.7, to: c.b7 + 0.6},
  {key: 'missouri', ll: [-92.85, 40.43], from: c.sw + 0.8, to: c.b7 + 0.6},
  {key: 'iowa', ll: [-92.75, 41.45], from: c.b7 + 2.6, to: c.end + 1},
  {key: 'illinois', ll: [-89.55, 40.95], from: c.b7 + 2.6, to: c.end + 1},
  {key: 'missouri', ll: [-92.75, 39.95], from: c.b7 + 2.6, to: c.end + 1},
];

export const options: StageOptions = {};

export const Zone: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(t, CAM);
  const proj = projection(cam);
  const s = ppm(proj);
  const plant = xy(proj, PLACE.plant);
  const medi = xy(proj, PLACE.mediapolis);
  const bearing = windAt(t);

  // the quote card covers the map; the map furniture steps back while it is up
  const card = span(t, c.quote, c.b8, 0.25, 0.3);
  // zone-8: for a moment the wind swings back, and so do the maps
  const swap = ramp(t, c.decided + 0.25, c.decided + 0.9) * (1 - ramp(t, c.wednesday + 0.15, c.wednesday + 0.9));
  // zone-9: these are forecasts, and the picture says so
  const doubt = ramp(t, c.forecasts, c.forecasts + 1.3, E.inOutQuad);

  // The first map (northeast). It starts as the round patch over the plant that the maps open on.
  // In Mediapolis it steps back, then lands on the town when the narration says the map did.
  const neGrow = ramp(t, c.sent, c.miles + 0.55, E.inOutQuad);
  const landed = 1 - 0.8 * span(t, c.b4 + 0.5, c.firstMap + 0.55, 0.7, 0.55);
  const neA = t < c.b7 ? fadeIn(t, c.start + 0.3, 0.9) * landed * (1 - ramp(t, c.b5 + 0.05, c.turned + 0.15, E.inOutQuad)) : ramp(t, c.b7 + 1.1, c.b7 + 2.3);
  const neLive = t < c.b7 ? 1 : swap * (1 - doubt);
  // the newest map (southwest): the same patch, once the wind has turned
  const swGrow = ramp(t, c.other + 0.25, c.into + 1.0, E.inOutQuad);
  const swA = ramp(t, c.turned + 0.8, c.turned + 1.6);
  const swLive = (1 - 0.9 * swap) * (1 - doubt);

  const lit = {
    [FIPS.iowa]: IOWA,
    [FIPS.illinois]: mix(BASE, HILITE, span(t, c.over, c.b5 + 0.5, 0.7, 0.9)),
    [FIPS.missouri]: mix(BASE, HILITE, span(t, c.into - 0.3, c.b7 + 1.8, 0.7, 0.9)),
  };

  const handA = Math.max(span(t, c.wind, c.miles + 0.2, 0.35, 0.5), span(t, c.b5 + 0.5, c.sw + 1.2, 0.35, 0.5), span(t, c.b8 + 0.15, c.b9 + 0.3, 0.35, 0.5));
  const fieldA = (0.35 + 0.65 * Math.max(span(t, c.wind, c.b3, 0.5, 0.8), span(t, c.b5, c.b7, 0.4, 0.8), span(t, c.b8, c.b9, 0.4, 0.8))) * (1 - card) * fadeIn(t, c.wind, 0.6);

  // the "about 100 miles" rule, laid beside the first map
  const ruleFrom = xy(proj, onBand(FIRST, 0, -16));
  const ruleTo = xy(proj, onBand(FIRST, FIRST.length, -16));
  const ruleMid: [number, number] = [(ruleFrom[0] + ruleTo[0]) / 2, (ruleFrom[1] + ruleTo[1]) / 2];
  const ruleA = span(t, c.miles, c.b4 + 0.2, 0.7, 0.3);

  const town = (key: string, a: number, side: 'left' | 'right' = 'right', color = '#b9c9e2') => {
    const [x, y] = xy(proj, PLACE[key]);
    return (
      <Txt key={key} x={side === 'right' ? x + 18 : x - 18} y={y - 15} size={25} font="mono" weight={700} spacing="0.12em" align={side === 'right' ? 'left' : 'right'} color={color} a={a} nowrap>
        {label(key)}
      </Txt>
    );
  };
  const closeUp = span(t, c.b4 + 1.0, c.b5 + 0.25, 0.4, 0.25);
  const wide8 = span(t, c.b8 - 0.2, c.end + 1, 0.4, 0.3);
  const newest = span(t, c.sw + 0.5, c.b7 + 0.9, 0.4, 0.4);

  return (
    <>
      <svg width={W} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
        <Water />
        <MapBase proj={proj} cam={cam} lit={lit} />
        <River proj={proj} a={span(t, c.river, c.b4 + 0.4, 0.4, 0.8)} />
      </svg>

      <SoftLayer blur={clamp(s * 1.15, 5, 30)}>
        <BandFill proj={proj} band={FIRST} grow={neGrow} a={neA} live={neLive} />
        <BandFill proj={proj} band={NEWEST} grow={swGrow} a={swA} live={swLive} />
      </SoftLayer>

      <svg width={W} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
        <WindField time={t} bearing={bearing} a={fieldA} />
        <BandMarks proj={proj} band={FIRST} time={t} grow={neGrow} a={neA * (1 - card)} live={neLive} doubt={t < c.b7 ? 0 : Math.max(doubt, 1 - neLive)} seed={3} />
        <BandMarks proj={proj} band={NEWEST} time={t} grow={swGrow} a={swA * (1 - card)} live={swLive} doubt={doubt} seed={11} />
        <Measure from={ruleFrom} to={ruleTo} a={ruleA} color={C.cyan} />

        {/* zone-4: the line from the plant to the town */}
        {closeUp > 0 ? <line x1={plant[0]} y1={plant[1]} x2={medi[0]} y2={medi[1]} stroke={C.white} strokeWidth={3} strokeDasharray="4 12" strokeLinecap="round" opacity={0.6 * closeUp * ramp(t, c.b4 + 1.4, c.b4 + 2.6)} /> : null}

        {/* towns */}
        <Pin proj={proj} at={PLACE.burlington} a={Math.max(closeUp, newest)} r={7} color="#9fb3d1" />
        <Pin proj={proj} at={PLACE.mediapolis} a={Math.max(span(t, c.b4 + 0.3, c.b5 + 0.4, 0.4, 0.3), wide8 * fadeIn(t, c.different, 0.3))} r={t < c.b5 + 0.4 ? 11 : 7} color={t >= c.middle && t < c.b5 + 0.4 ? C.cyan : C.white} time={t - c.middle} ping={t >= c.middle && t < c.b5} />
        <Pin proj={proj} at={PLACE.keokuk} a={newest * fadeIn(t, c.sw + 1.0, 0.3)} r={7} color="#9fb3d1" />
        <Pin proj={proj} at={PLACE.quincy} a={newest * fadeIn(t, c.into + 0.5, 0.3)} r={7} color="#9fb3d1" />
        <Pin proj={proj} at={PLACE.knoxCity} a={Math.max(newest * fadeIn(t, c.into - 0.1, 0.3), wide8 * fadeIn(t, c.different + 0.35, 0.3))} r={8} />
        <Pin proj={proj} at={PLACE.macon} a={Math.max(newest * fadeIn(t, c.into + 0.9, 0.3), wide8 * fadeIn(t, c.different + 0.55, 0.3))} r={8} />
        <Pin proj={proj} at={PLACE.plant} time={t} ping color={C.red} r={t >= c.b4 + 1 && t < c.b5 + 0.5 ? 13 : 11} />

        <WindHand proj={proj} bearing={bearing} a={handA * (1 - card)} len={t < c.b5 ? 230 : t < c.b7 ? 190 : 140} name={t < c.b7 ? label('wind') : undefined} />
      </svg>

      {/* state names */}
      {STATES.map((g, i) => {
        const [x, y] = xy(proj, g.ll);
        return (
          <Txt key={i} x={x} y={y} w={700} size={30} font="mono" weight={700} align="center" spacing="0.5em" color="#6f8bb5" a={span(t, g.from, g.to, 0.5, 0.35) * (1 - card) * 0.9}>
            {label(g.key)}
          </Txt>
        );
      })}

      {/* zone-1: the plant */}
      <Txt x={plant[0] - 26} y={plant[1] + 22} size={26} font="mono" weight={700} spacing="0.12em" align="right" a={span(t, c.start + 0.4, c.sent, 0.4, 0.3)} nowrap>
        {label('plant')}
      </Txt>

      {/* zone-2: the first maps */}
      <Chip x={72} y={150} size={58} a={span(t, c.b2 + 0.4, c.b4 + 0.2, 0.35, 0.25)}>{os('zone-2', 0)}</Chip>
      <Leader from={{x: 520, y: 292}} to={{x: ruleMid[0] - 12, y: ruleMid[1] + 4}} a={span(t, c.miles + 0.5, c.b4 + 0.2, 0.4, 0.2)} color={C.cyan} />
      <Chip x={72} y={254} size={58} color={C.cyan} a={span(t, c.miles + 0.1, c.b4 + 0.2, 0.35, 0.25)}>{os('zone-2', 1)}</Chip>

      {/* zone-3: up the river, and into Illinois */}
      {(() => {
        const a = span(t, c.river + 0.2, c.b4 + 0.2, 0.4, 0.25);
        const [rx, ry] = xy(proj, [-90.19, 41.84]);
        return (
          <>
            <Leader from={{x: rx + 150, y: ry + 60}} to={{x: rx + 10, y: ry + 6}} a={a} color="#8fd0ff" />
            <Txt x={rx + 162} y={ry + 46} size={26} font="mono" weight={700} spacing="0.12em" color="#8fd0ff" a={a} nowrap>{label('mississippi')}</Txt>
          </>
        );
      })()}
      <Txt x={W - 72} y={440} size={110} font="display" align="right" outline={9} scale={0.85 + 0.15 * pop(t, c.over + 0.5)} a={span(t, c.over + 0.5, c.b4 + 0.2, 0.2, 0.25)}>
        {label('illinois')}
      </Txt>
      <Chip x={W - 72} y={584} size={54} align="right" color={C.red} a={span(t, c.agency, c.b4 + 0.2, 0.35, 0.25)}>{os('zone-3', 0)}</Chip>

      {/* zone-4: the town in the middle of it */}
      <Txt x={medi[0] + 34} y={medi[1] - 70} size={120} font="display" outline={10} scale={0.85 + 0.15 * pop(t, c.b4 + 1.25)} a={span(t, c.b4 + 1.25, c.b5 + 0.2, 0.2, 0.2)} nowrap>
        {os('zone-4', 0)}
      </Txt>
      <Txt x={plant[0] - 22} y={plant[1] + 20} size={26} font="mono" weight={700} spacing="0.12em" align="right" a={closeUp} nowrap>{label('plant')}</Txt>
      {town('burlington', Math.max(closeUp, newest))}

      {/* zone-6: the newest maps */}
      <Chip x={72} y={150} size={58} a={span(t, c.b6 + 0.5, c.b7 + 0.9, 0.35, 0.3)}>{os('zone-6', 0)}</Chip>
      <Chip x={72} y={640} size={54} color={C.cyan} a={span(t, c.into, c.b7 + 0.9, 0.35, 0.3)}>{os('zone-6', 1)}</Chip>
      {town('keokuk', newest * fadeIn(t, c.sw + 1.0, 0.3))}
      {town('quincy', newest * fadeIn(t, c.into + 0.5, 0.3))}
      {town('knoxCity', Math.max(newest * fadeIn(t, c.into - 0.1, 0.3), wide8 * fadeIn(t, c.different + 0.35, 0.3)), 'left', C.white)}
      {town('macon', Math.max(newest * fadeIn(t, c.into + 0.9, 0.3), wide8 * fadeIn(t, c.different + 0.55, 0.3)), 'left', C.white)}

      {/* zone-8: same blast, different people */}
      {town('mediapolis', wide8 * fadeIn(t, c.different, 0.3), 'right', C.white)}
      <Txt x={plant[0] + 20} y={plant[1] - 14} size={25} font="mono" weight={700} spacing="0.12em" a={wide8 * fadeIn(t, c.b8 + 0.1, 0.3)} nowrap>{label('middletown')}</Txt>

      {/* zone-9: what these maps are */}
      <Chip x={72} y={160} size={58} a={span(t, c.forecasts, c.end + 1, 0.35, 0.3)}>{os('zone-9', 0)}</Chip>
      <BlankedPage x={96} y={290} w={330} a={fadeIn(t, c.how, 0.45)} />
      <Chip x={W - 72} y={560} size={54} align="right" color={C.white} a={span(t, c.called, c.end + 1, 0.35, 0.3)}>{os('zone-9', 1)}</Chip>

      {/* every plume here is a picture of a reported map */}
      <Txt x={W - 72} y={792} size={24} font="mono" weight={700} align="right" spacing="0.14em" color={C.mute} a={span(t, c.start + 0.6, c.end + 1, 0.5, 0.3) * (1 - card)} nowrap>
        {label('schematic_map')}
      </Txt>

      {/* zone-7: the professor's words */}
      <QuoteCard t={t} at={c.quote} quote={os('zone-7', 0)} by={os('zone-7', 1)} a={1 - ramp(t, c.b8 - 0.3, c.b8)} />
    </>
  );
};
