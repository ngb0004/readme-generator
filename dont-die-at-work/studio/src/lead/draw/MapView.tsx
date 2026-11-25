import {geoMercator, geoPath} from 'd3-geo';
import type {GeoProjection} from 'd3-geo';
import React from 'react';
import {feature, mesh} from 'topojson-client';
import usAtlas from 'us-atlas/counties-10m.json';
import {C} from '../../engine/theme';
import {E, Ease, inv, lerp} from '../../engine/time';
import {H, W} from '../kit';

/* eslint-disable @typescript-eslint/no-explicit-any */
const us = usAtlas as any;
const STATES: any[] = (feature(us, us.objects.states) as any).features;
const COUNTIES: any[] = (feature(us, us.objects.counties) as any).features;
/** Counties of the three states in the story. County ids are FIPS codes: the first two digits are the state. */
const NEAR = COUNTIES.filter((c) => ['19', '17', '29'].includes(String(c.id).slice(0, 2)));
const STATE_LINES = mesh(us, us.objects.states, (a: any, b: any) => a !== b);
/** The Iowa-Illinois line is the Mississippi River. */
const MISSISSIPPI = mesh(us, us.objects.states, (a: any, b: any) => (a.id === '19' && b.id === '17') || (a.id === '17' && b.id === '19'));

export const FIPS = {iowa: '19', illinois: '17', missouri: '29', desMoinesCo: '19057', leeCo: '19111', vanBurenCo: '19177'};

/**
 * Places, as [longitude, latitude]. `plant` is the Iowa Army Ammunition Plant, which lies beside
 * Middletown; the map shows where things are relative to each other and is not a survey.
 */
export const PLACE: Record<string, [number, number]> = {
  plant: [-91.262, 40.805],
  middletown: [-91.261, 40.829],
  burlington: [-91.113, 40.808],
  mediapolis: [-91.164, 41.008],
  keokuk: [-91.394, 40.402],
  quincy: [-91.41, 39.936],
  knoxCity: [-92.008, 40.143],
  macon: [-92.472, 39.74],
  desMoines: [-93.609, 41.587],
  cedarRapids: [-91.668, 41.978],
  stLouis: [-90.199, 38.627],
  chicago: [-87.63, 41.878],
};

/** Camera: the point at the centre of the frame, and how many pixels one degree of longitude takes. */
export type Cam = {lon: number; lat: number; k: number};
export type CamKey = Cam & {at: number; ease?: Ease; cut?: boolean};
export const CAMS = {
  us: {lon: -96.5, lat: 38.6, k: 30},
  midwest: {lon: -91.6, lat: 40.6, k: 150},
  iowa: {lon: -92.6, lat: 41.6, k: 210},
  region: {lon: -91.5, lat: 40.55, k: 470},
  county: {lon: -91.23, lat: 40.82, k: 2300},
} satisfies Record<string, Cam>;

export const camAt = (t: number, keys: CamKey[]): Cam => {
  let a = keys[0];
  let b = keys[0];
  for (let i = 0; i < keys.length; i++) {
    if (keys[i].at <= t) {
      a = keys[i];
      b = keys[i + 1] && !keys[i + 1].cut ? keys[i + 1] : keys[i];
    }
  }
  const u = a === b ? 0 : (b.ease ?? E.inOut)(inv(a.at, b.at, t));
  return {lon: lerp(a.lon, b.lon, u), lat: lerp(a.lat, b.lat, u), k: Math.exp(lerp(Math.log(a.k), Math.log(b.k), u))};
};

/** `focus` is where the camera's centre lands in the frame (default: a little above the middle). */
export const projection = (cam: Cam, focus: [number, number] = [W / 2, 500]): GeoProjection =>
  geoMercator()
    .center([cam.lon, cam.lat])
    .scale((cam.k * 180) / Math.PI)
    .translate(focus);

const MILES_PER_DEG_LAT = 69.05;
/** The point `miles` from `from` on a compass bearing (degrees clockwise from north). Fine at these distances. */
export const dest = (from: [number, number], bearing: number, miles: number): [number, number] => {
  const b = (bearing * Math.PI) / 180;
  const dLat = (miles * Math.cos(b)) / MILES_PER_DEG_LAT;
  const dLon = (miles * Math.sin(b)) / (MILES_PER_DEG_LAT * Math.cos((from[1] * Math.PI) / 180));
  return [from[0] + dLon, from[1] + dLat];
};
/** A circle of `miles` round a point, as an SVG path. */
export const ring = (proj: GeoProjection, centre: [number, number], miles: number, n = 72) =>
  'M ' + Array.from({length: n + 1}, (_, i) => proj(dest(centre, (360 * i) / n, miles))!.join(',')).join(' L ') + ' Z';
/**
 * A plume drawn as a long teardrop from `from` along `bearing`: `length` miles long, `spread`
 * miles wide at its far end. A schematic of a reported forecast, never a forecast of its own.
 */
export const plume = (proj: GeoProjection, from: [number, number], bearing: number, length: number, spread: number, grow = 1, n = 24) => {
  const L = length * grow;
  const side = (sign: number) =>
    Array.from({length: n + 1}, (_, i) => {
      const u = i / n;
      const centre = dest(from, bearing, L * u);
      const half = (spread / 2) * Math.pow(u, 0.75) * (1 - 0.35 * Math.pow(u, 6));
      return proj(dest(centre, bearing + sign * 90, half))!;
    });
  const tip = Array.from({length: 9}, (_, i) => {
    const a = bearing - 90 + (180 * i) / 8;
    return proj(dest(dest(from, bearing, L), a, (spread / 2) * 0.65))!;
  });
  const pts = [...side(-1), ...tip, ...side(1).reverse()];
  return 'M ' + pts.map((p) => p.join(',')).join(' L ') + ' Z';
};
/** A wedge: `length` miles along `bearing`, `angle` degrees wide. The relocation zone is "a 5-mile cone". */
export const cone = (proj: GeoProjection, from: [number, number], bearing: number, length: number, angle: number, pad = 0) => {
  const start = pad ? dest(from, bearing + 180, pad) : from;
  const arc = Array.from({length: 17}, (_, i) => proj(dest(from, bearing - angle / 2 - (pad ? 8 : 0) + ((angle + (pad ? 16 : 0)) * i) / 16, length + pad))!);
  return 'M ' + [proj(start)!, ...arc].map((p) => p.join(',')).join(' L ') + ' Z';
};

/**
 * The base map. States everywhere; county lines for Iowa, Illinois and Missouri once the camera
 * is close; the Mississippi drawn where it is the state line.
 *   lit    FIPS ids (state or county) to fill brighter
 *   river  0..1
 */
export const MapBase: React.FC<{proj: GeoProjection; cam: Cam; lit?: Record<string, string>; river?: number; counties?: number}> = ({proj, cam, lit = {}, river = 1, counties}) => {
  const path = geoPath(proj);
  const countyA = counties ?? (cam.k < 120 ? 0 : Math.min(1, (cam.k - 120) / 200));
  const [x0, y0] = [-200, -200];
  const visible = (f: any) => {
    const [[bx0, by0], [bx1, by1]] = path.bounds(f);
    return bx1 > x0 && bx0 < W + 200 && by1 > y0 && by0 < H + 200;
  };
  return (
    <g>
      {STATES.filter(visible).map((s) => (
        <path key={s.id} d={path(s) ?? ''} fill={lit[String(s.id)] ?? '#0d1727'} stroke="none" />
      ))}
      {countyA > 0.01
        ? NEAR.filter(visible).map((c) => (
            <path key={c.id} d={path(c) ?? ''} fill={lit[String(c.id)] ?? 'none'} stroke="#22324c" strokeWidth={1.2} opacity={lit[String(c.id)] ? 1 : countyA} />
          ))
        : null}
      <path d={path(STATE_LINES) ?? ''} fill="none" stroke="#5b769f" strokeWidth={cam.k < 80 ? 1.2 : 2.4} />
      {river > 0.01 && cam.k > 60 ? <path d={path(MISSISSIPPI) ?? ''} fill="none" stroke="#3f9be6" strokeWidth={cam.k < 300 ? 4 : 7} strokeLinejoin="round" opacity={river} /> : null}
    </g>
  );
};

/** A dot with a ring that pings: a town. */
export const Pin: React.FC<{proj: GeoProjection; at: [number, number]; a?: number; color?: string; r?: number; time?: number; ping?: boolean}> = ({proj, at, a = 1, color = C.white, r = 8, time = 0, ping}) => {
  const [x, y] = proj(at)!;
  const k = (time * 0.9) % 1;
  return (
    <g opacity={a}>
      {ping ? <circle cx={x} cy={y} r={r * (1 + k * 4)} fill="none" stroke={color} strokeWidth={3} opacity={(1 - k) * 0.8} /> : null}
      <circle cx={x} cy={y} r={r} fill={color} stroke="#04060a" strokeWidth={3} />
    </g>
  );
};
