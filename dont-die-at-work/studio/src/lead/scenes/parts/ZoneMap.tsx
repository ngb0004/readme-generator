import {geoPath} from 'd3-geo';
import type {GeoProjection} from 'd3-geo';
import React from 'react';
import {feature, mesh} from 'topojson-client';
import usAtlas from 'us-atlas/counties-10m.json';
import {C, FONT} from '../../../engine/theme';
import {clamp, lerp, noise, rnd} from '../../../engine/time';
import {PLACE, dest} from '../../draw/MapView';
import {H, INK, PAPER, W} from '../../kit';

// Map furniture shared by the two map scenes (Zone and Evac): the dust bands, the wind, the
// relocation zone, a mile grid and a few pictograms. Everything here is a schematic of what the
// Army's maps and advisories were reported to show. Nothing here is a forecast or a measurement.

/* eslint-disable @typescript-eslint/no-explicit-any */
const us = usAtlas as any;
const COUNTY: Record<string, any> = Object.fromEntries((feature(us, us.objects.counties) as any).features.map((f: any) => [String(f.id), f]));
/** The Iowa-Illinois line is the Mississippi River. */
const RIVER = mesh(us, us.objects.states, (a: any, b: any) => (a.id === '19' && b.id === '17') || (a.id === '17' && b.id === '19'));

type LL = [number, number];
type XY = [number, number];

/**
 * A reported dust map, reduced to a long oval: which way it ran from the plant, how far, and
 * roughly how wide. CBS describes the Army's maps as a circle near the plant that "becomes a long
 * oval"; the bearings come from the towns the reports name. Miles and compass degrees.
 */
export type Band = {bearing: number; length: number; half: number; back: number};
/** First maps (for Nov. 20): northeast, "about 100 miles", with Mediapolis in the middle of it. */
export const FIRST: Band = {bearing: 26, length: 100, half: 11, back: 4};
/** Newest maps (for Nov. 25): from near Burlington southwest, past Knox City, toward Macon. */
export const NEWEST: Band = {bearing: 221, length: 100, half: 11, back: 5};
/** The recommended relocation zone: "a 5-mile cone" southwest of the plant, plus one mile. The angle is not given. */
export const CONE = {bearing: 221, length: 5, angle: 46, pad: 1};

export const BASE = '#0d1727';
export const IOWA = '#111f35';
export const HILITE = '#1c3152';

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
/** Blend two #rrggbb colours. */
export const mix = (a: string, b: string, k: number) => {
  const [x, y] = [hex(a), hex(b)];
  return '#' + x.map((v, i) => Math.round(lerp(v, y[i], clamp(k))).toString(16).padStart(2, '0')).join('');
};

/** Screen position of a place. */
export const xy = (proj: GeoProjection, p: LL): XY => proj(p) as XY;
/** Pixels per mile at the plant, for this projection. */
export const ppm = (proj: GeoProjection) => {
  const a = xy(proj, PLACE.plant);
  const b = xy(proj, dest(PLACE.plant, 90, 10));
  return Math.hypot(b[0] - a[0], b[1] - a[1]) / 10;
};
/** A point `along` miles down a band's axis and `across` miles to its right. */
export const onBand = (b: Band, along: number, across = 0): LL => dest(dest(PLACE.plant, b.bearing, along), b.bearing + 90, across);
/** The unit vector on screen for a compass bearing (the map is north-up and conformal). */
export const heading = (bearing: number): XY => [Math.sin((bearing * Math.PI) / 180), -Math.cos((bearing * Math.PI) / 180)];

/**
 * The outline of a band. `grow` runs 0..1: it starts as a round patch over the plant and
 * stretches into the long oval, the way the reported maps step through the day.
 */
export const bandPath = (proj: GeoProjection, b: Band, grow = 1, o: {inset?: number; wobble?: number; time?: number} = {}) => {
  const g = clamp(grow);
  const len = b.back + b.length * g;
  const half = lerp(Math.min(b.half, b.back * 1.15), b.half, Math.pow(g, 0.75)) * (1 - (o.inset ?? 0));
  const n = 44;
  const side = (sign: number) =>
    Array.from({length: n + 1}, (_, i) => {
      const u = (1 - Math.cos((Math.PI * i) / n)) / 2; // closer together at the two ends, where it curves
      const w = Math.sqrt(Math.max(0, 1 - Math.pow(2 * u - 1, 2)));
      const wob = o.wobble ? 1 + o.wobble * noise(u * 6 + (o.time ?? 0) * 0.45 + sign * 9, 5 + sign) : 1;
      return xy(proj, onBand(b, -b.back + len * u, sign * half * w * wob));
    });
  const pts = [...side(-1), ...side(1).reverse()];
  return 'M ' + pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L ') + ' Z';
};

/**
 * A layer that is blurred as a whole, so the dust has no edge that could be read as a measured
 * line. It is larger than the frame so the blur does not thin out at the borders.
 */
export const SoftLayer: React.FC<{blur: number; a?: number; children: React.ReactNode}> = ({blur, a = 1, children}) => {
  const m = 140;
  return (
    <svg width={W + 2 * m} height={H + 2 * m} viewBox={`${-m} ${-m} ${W + 2 * m} ${H + 2 * m}`} style={{position: 'absolute', left: -m, top: -m, filter: `blur(${Math.max(2, blur).toFixed(1)}px)`, opacity: a}}>
      {children}
    </svg>
  );
};

/** The soft body of a band: goes inside a SoftLayer. `live` 1 = the map in force, 0 = a superseded or doubtful one. */
export const BandFill: React.FC<{proj: GeoProjection; band: Band; grow?: number; a?: number; live?: number}> = ({proj, band, grow = 1, a = 1, live = 1}) => {
  const k = clamp(a);
  if (k <= 0.003 || grow <= 0) return null;
  const l = clamp(live);
  return (
    <g opacity={k}>
      <path d={bandPath(proj, band, grow)} fill={C.cyan} opacity={lerp(0.07, 0.24, l)} />
      <path d={bandPath(proj, band, grow, {inset: 0.42})} fill={C.cyan} opacity={lerp(0.02, 0.2, l)} />
    </g>
  );
};

/**
 * The crisp parts of a band: dust drifting down it (lead is drawn cyan), and a dashed outline when
 * the map is superseded (`live` 0) or shown as the guess it is (`doubt` 1, which also makes the edge waver).
 */
export const BandMarks: React.FC<{proj: GeoProjection; band: Band; time: number; grow?: number; a?: number; live?: number; doubt?: number; seed?: number}> = ({proj, band, time, grow = 1, a = 1, live = 1, doubt = 0, seed = 0}) => {
  const k = clamp(a);
  const g = clamp(grow);
  if (k <= 0.003 || g <= 0) return null;
  const l = clamp(live);
  const d = clamp(doubt);
  const s = ppm(proj);
  const len = band.back + band.length * g;
  const half = lerp(Math.min(band.half, band.back * 1.15), band.half, Math.pow(g, 0.75));
  const dash = Math.max(1 - l, d);
  return (
    <g opacity={k}>
      {l > 0.02
        ? Array.from({length: 110}, (_, i) => {
            const u = (rnd(i * 1.37 + seed) + time * (0.016 + rnd(i * 2.9) * 0.02)) % 1;
            const w = Math.sqrt(Math.max(0, 1 - Math.pow(2 * u - 1, 2)));
            const across = (rnd(i * 5.3 + seed) * 2 - 1) * half * w * 0.82;
            const [x, y] = xy(proj, onBand(band, -band.back + len * u, across));
            if (x < -20 || x > W + 20 || y < -20 || y > H + 20) return null;
            return <circle key={i} cx={x} cy={y} r={clamp(s * 0.22, 2.2, 5) * (0.7 + rnd(i * 7.7) * 0.6)} fill={C.cyan} opacity={0.75 * l * Math.sin(Math.PI * u) * (0.5 + 0.5 * rnd(i * 3.1))} />;
          })
        : null}
      {dash > 0.02 ? (
        <path d={bandPath(proj, band, g, {wobble: 0.1 * d, time})} fill="none" stroke={C.cyan} strokeWidth={3} strokeDasharray="14 12" strokeDashoffset={-time * 9} strokeLinejoin="round" opacity={0.75 * dash} />
      ) : null}
    </g>
  );
};

/** Faint streaks sliding downwind across the whole frame. */
export const WindField: React.FC<{time: number; bearing: number; a?: number}> = ({time, bearing, a = 1}) => {
  const k = clamp(a);
  if (k <= 0.003) return null;
  const [dx, dy] = heading(bearing);
  return (
    <g opacity={k}>
      {Array.from({length: 64}, (_, i) => {
        const p = (rnd(i * 2.71) + time * (0.28 + rnd(i * 4.3) * 0.2)) % 1;
        const ox = rnd(i * 6.13) * (W + 300) - 150;
        const oy = rnd(i * 9.71) * (H + 100) - 50;
        const run = 320;
        const x = ox + dx * (p - 0.5) * run;
        const y = oy + dy * (p - 0.5) * run;
        const len = 46 + rnd(i * 3.3) * 40;
        return <line key={i} x1={x} y1={y} x2={x + dx * len} y2={y + dy * len} stroke="#cfe1ff" strokeWidth={2.2} strokeLinecap="round" opacity={0.2 * Math.sin(Math.PI * p)} />;
      })}
    </g>
  );
};

/** An arrow out of the plant, pointing where the wind is carrying things. `name` is the label at its tip. */
export const WindHand: React.FC<{proj: GeoProjection; bearing: number; a?: number; len?: number; name: string}> = ({proj, bearing, a = 1, len = 230, name}) => {
  const k = clamp(a);
  if (k <= 0.003) return null;
  const [px, py] = xy(proj, PLACE.plant);
  const [dx, dy] = heading(bearing);
  const L = len * (0.55 + 0.45 * k);
  const tx = px + dx * L;
  const ty = py + dy * L;
  const head = 34;
  const nx = -dy;
  const ny = dx;
  const pts = [
    [tx + dx * head, ty + dy * head],
    [tx + nx * head * 0.62, ty + ny * head * 0.62],
    [tx - nx * head * 0.62, ty - ny * head * 0.62],
  ]
    .map((p) => p.join(','))
    .join(' ');
  // keep the word clear of the shaft: push it out past the head, on the side the arrow leans to
  const lx = tx + dx * (head + 54) + (dx < -0.3 ? -40 : dx > 0.3 ? 40 : 0);
  const ly = ty + dy * (head + 34) + 10;
  return (
    <g opacity={k}>
      <line x1={px + dx * 26} y1={py + dy * 26} x2={tx} y2={ty} stroke="#04060a" strokeWidth={17} strokeLinecap="round" />
      <polygon points={pts} fill="#04060a" stroke="#04060a" strokeWidth={10} strokeLinejoin="round" />
      <line x1={px + dx * 26} y1={py + dy * 26} x2={tx} y2={ty} stroke={C.white} strokeWidth={9} strokeLinecap="round" />
      <polygon points={pts} fill={C.white} />
      <text x={lx} y={ly} textAnchor="middle" fontFamily={FONT.mono} fontWeight={700} fontSize={28} letterSpacing="0.2em" fill={C.white} stroke="#04060a" strokeWidth={7} paintOrder="stroke">
        {name}
      </text>
    </g>
  );
};

/** One-mile squares round the plant, for scale once the camera is close. */
export const MileGrid: React.FC<{proj: GeoProjection; a?: number; reach?: number}> = ({proj, a = 1, reach = 14}) => {
  const k = clamp(a);
  if (k <= 0.003) return null;
  const lines: React.ReactNode[] = [];
  for (let i = -reach; i <= reach; i++) {
    const v0 = xy(proj, dest(dest(PLACE.plant, 90, i), 0, -reach));
    const v1 = xy(proj, dest(dest(PLACE.plant, 90, i), 0, reach));
    const h0 = xy(proj, dest(dest(PLACE.plant, 0, i), 90, -reach));
    const h1 = xy(proj, dest(dest(PLACE.plant, 0, i), 90, reach));
    lines.push(<line key={`v${i}`} x1={v0[0]} y1={v0[1]} x2={v1[0]} y2={v1[1]} />, <line key={`h${i}`} x1={h0[0]} y1={h0[1]} x2={h1[0]} y2={h1[1]} />);
  }
  return (
    <g stroke="#2a3d5c" strokeWidth={1.4} opacity={0.75 * k}>
      {lines}
    </g>
  );
};

/** The river, picked out. */
export const River: React.FC<{proj: GeoProjection; a?: number}> = ({proj, a = 1}) => {
  const k = clamp(a);
  if (k <= 0.003) return null;
  const d = geoPath(proj)(RIVER) ?? '';
  return (
    <g opacity={k} fill="none" strokeLinejoin="round" strokeLinecap="round">
      <path d={d} stroke="#3f9be6" strokeWidth={18} opacity={0.28} />
      <path d={d} stroke="#8fd0ff" strokeWidth={6} />
    </g>
  );
};

/** One county, filled and outlined. */
export const County: React.FC<{proj: GeoProjection; fips: string; a?: number; fill?: string; stroke?: string}> = ({proj, fips, a = 1, fill = 'rgba(255,194,26,0.16)', stroke = C.yellow}) => {
  const k = clamp(a);
  if (k <= 0.003 || !COUNTY[fips]) return null;
  return <path d={geoPath(proj)(COUNTY[fips]) ?? ''} fill={fill} stroke={stroke} strokeWidth={3.5} strokeLinejoin="round" opacity={k} />;
};
/** The middle of a county on screen, for a label. */
export const countyCentre = (proj: GeoProjection, fips: string): XY => geoPath(proj).centroid(COUNTY[fips]) as XY;

/** The wedge of the relocation zone. `reach` 0..1 grows it out of the plant; `pad` adds the extra mile. */
export const conePath = (proj: GeoProjection, reach = 1, pad = 0) => {
  const r = clamp(reach);
  const len = CONE.length * r;
  if (len <= 0) return '';
  const half = CONE.angle / 2;
  if (!pad) {
    const arc = Array.from({length: 19}, (_, i) => xy(proj, dest(PLACE.plant, CONE.bearing - half + (CONE.angle * i) / 18, len)));
    return 'M ' + [xy(proj, PLACE.plant), ...arc].map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L ') + ' Z';
  }
  // the same wedge pushed out by `pad` miles on every side: two edges moved sideways, a wider arc, a rounded back
  const edge = (sign: number) => {
    const b = CONE.bearing + sign * half;
    return [dest(dest(PLACE.plant, b, 0), b + sign * 90, pad), dest(dest(PLACE.plant, b, len), b + sign * 90, pad)];
  };
  const arc = Array.from({length: 19}, (_, i) => dest(PLACE.plant, CONE.bearing - half + (CONE.angle * i) / 18, len + pad));
  const back = Array.from({length: 13}, (_, i) => dest(PLACE.plant, CONE.bearing + half + 90 + ((360 - CONE.angle - 180) * i) / 12, pad));
  const [l0, l1] = edge(-1);
  const [r0, r1] = edge(1);
  const pts = [l0, l1, ...arc, r1, r0, ...back].map((p) => xy(proj, p));
  return 'M ' + pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L ') + ' Z';
};

/** A dimension line between two points on the map, with end ticks. `a` draws it from the first end. */
export const Measure: React.FC<{from: XY; to: XY; a: number; color?: string; width?: number}> = ({from, to, a, color = C.white, width = 3}) => {
  const k = clamp(a);
  if (k <= 0.003) return null;
  const x = from[0] + (to[0] - from[0]) * k;
  const y = from[1] + (to[1] - from[1]) * k;
  const l = Math.hypot(to[0] - from[0], to[1] - from[1]) || 1;
  const nx = (-(to[1] - from[1]) / l) * 13;
  const ny = ((to[0] - from[0]) / l) * 13;
  const seg = (x1: number, y1: number, x2: number, y2: number, key: string) => (
    <g key={key}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(0,0,0,0.65)" strokeWidth={width + 4} strokeLinecap="round" />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={width} strokeLinecap="round" />
    </g>
  );
  return (
    <g>
      {seg(from[0], from[1], x, y, 'm')}
      {seg(from[0] - nx, from[1] - ny, from[0] + nx, from[1] + ny, 'a')}
      {k > 0.97 ? seg(to[0] - nx, to[1] - ny, to[0] + nx, to[1] + ny, 'b') : null}
    </g>
  );
};

/** A small farmstead mark. Used as a texture over farmland, never as a count. */
export const FarmMark: React.FC<{x: number; y: number; s?: number; a?: number}> = ({x, y, s = 1, a = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={a}>
    <path d="M -9 8 L -9 -3 L 0 -11 L 9 -3 L 9 8 Z" fill="#d9c79a" stroke="#04060a" strokeWidth={2} strokeLinejoin="round" />
    <rect x={11} y={-8} width={6} height={16} rx={3} fill="#aeb7c4" stroke="#04060a" strokeWidth={2} />
  </g>
);

// ---- pictograms: flat and faceless, in the manner of a safety sign. (x, y) is the centre, s the size in px.
type Pic = {x: number; y: number; s: number; color?: string; a?: number; pop?: number};
const picT = ({x, y, s, a = 1, pop = 1}: Pic) => ({transform: `translate(${x} ${y}) scale(${(s / 100) * pop})`, opacity: clamp(a)});

export const PicBus: React.FC<Pic> = (p) => {
  const col = p.color ?? C.white;
  return (
    <g {...picT(p)}>
      <rect x={-50} y={-30} width={100} height={52} rx={9} fill={col} />
      {[-40, -18, 4, 26].map((wx) => (
        <rect key={wx} x={wx} y={-22} width={16} height={18} rx={2} fill="#0a1220" />
      ))}
      <rect x={-50} y={4} width={100} height={5} fill="#0a1220" opacity={0.35} />
      {[-28, 28].map((wx) => (
        <g key={wx}>
          <circle cx={wx} cy={24} r={12} fill="#0a1220" />
          <circle cx={wx} cy={24} r={5} fill={col} />
        </g>
      ))}
    </g>
  );
};
export const PicBed: React.FC<Pic> = (p) => {
  const col = p.color ?? C.white;
  return (
    <g {...picT(p)}>
      <rect x={-50} y={-30} width={10} height={62} rx={3} fill={col} />
      <rect x={40} y={-6} width={10} height={38} rx={3} fill={col} />
      <rect x={-40} y={2} width={80} height={16} rx={3} fill={col} />
      <rect x={-36} y={-14} width={28} height={14} rx={6} fill={col} />
      <path d="M -6 0 Q 16 -22 38 0 Z" fill={col} />
    </g>
  );
};
export const PicMeal: React.FC<Pic> = (p) => {
  const col = p.color ?? C.white;
  return (
    <g {...picT(p)}>
      <circle cx={0} cy={0} r={27} fill="none" stroke={col} strokeWidth={8} />
      <circle cx={0} cy={0} r={11} fill={col} />
      <g stroke={col} strokeWidth={6} strokeLinecap="round" fill="none">
        <line x1={-45} y1={-30} x2={-45} y2={32} />
        <path d="M -52 -30 L -52 -12 Q -45 -4 -38 -12 L -38 -30" />
        <line x1={45} y1={-4} x2={45} y2={32} />
      </g>
      <path d="M 45 -32 Q 56 -20 45 -2 Z" fill={col} stroke={col} strokeWidth={4} strokeLinejoin="round" />
    </g>
  );
};
/** A phone showing an emergency alert. `buzz` 0..1 shakes it. */
export const PicPhone: React.FC<Pic & {buzz?: number; time?: number}> = ({buzz = 0, time = 0, ...p}) => {
  const col = p.color ?? C.white;
  const shake = Math.sin(time * 58) * 3.2 * buzz;
  return (
    <g {...picT(p)}>
      <g transform={`rotate(${shake})`}>
        <rect x={-33} y={-60} width={66} height={120} rx={11} fill="#0a1220" stroke={col} strokeWidth={6} />
        <rect x={-9} y={-53} width={18} height={4} rx={2} fill={col} opacity={0.6} />
        <path d="M 0 -36 L 19 -4 L -19 -4 Z" fill={C.yellow} stroke={C.yellow} strokeWidth={5} strokeLinejoin="round" />
        <rect x={-2.6} y={-26} width={5.2} height={12} rx={2} fill="#0a1220" />
        <circle cx={0} cy={-9.5} r={3} fill="#0a1220" />
        {[8, 20, 32].map((ly, i) => (
          <rect key={ly} x={-23} y={ly} width={i === 2 ? 30 : 46} height={6} rx={3} fill={col} opacity={0.8} />
        ))}
      </g>
      {buzz > 0.02
        ? [-1, 1].map((sd) =>
            [0, 1].map((j) => (
              <path key={`${sd}${j}`} d={`M ${sd * (46 + j * 13)} -24 q ${sd * 9} 24 0 48`} fill="none" stroke={C.yellow} strokeWidth={5} strokeLinecap="round" opacity={buzz * (0.9 - j * 0.35)} />
            )),
          )
        : null}
    </g>
  );
};
/** A window, shut. */
export const PicWindow: React.FC<Pic> = (p) => {
  const col = p.color ?? C.white;
  return (
    <g {...picT(p)}>
      <rect x={-38} y={-40} width={76} height={80} rx={4} fill="#0a1220" stroke={col} strokeWidth={8} />
      <line x1={0} y1={-40} x2={0} y2={40} stroke={col} strokeWidth={6} />
      <line x1={-38} y1={0} x2={38} y2={0} stroke={col} strokeWidth={6} />
      <rect x={-46} y={40} width={92} height={9} rx={3} fill={col} />
      <rect x={-7} y={-6} width={14} height={12} rx={3} fill={C.yellow} />
    </g>
  );
};
/** A child and a dog under a roof. */
export const PicIndoors: React.FC<Pic> = (p) => {
  const col = p.color ?? C.white;
  return (
    <g {...picT(p)}>
      <path d="M -52 -8 L 0 -48 L 52 -8" fill="none" stroke={col} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M -40 -10 L -40 44 L 40 44 L 40 -10" fill="none" stroke={col} strokeWidth={7} strokeLinejoin="round" />
      {/* child */}
      <circle cx={-14} cy={0} r={8} fill={col} />
      <path d="M -24 38 L -22 14 Q -14 6 -6 14 L -4 38 Z" fill={col} />
      {/* dog */}
      <path d="M 8 38 L 8 24 Q 8 18 14 18 L 26 18 L 30 10 L 34 18 L 34 38 L 28 38 L 28 28 L 14 28 L 14 38 Z" fill={col} />
    </g>
  );
};
/** A cloth wiping a surface. */
export const PicWipe: React.FC<Pic> = (p) => {
  const col = p.color ?? C.white;
  return (
    <g {...picT(p)}>
      <rect x={-50} y={26} width={100} height={8} rx={3} fill={col} />
      <path d="M -30 22 L -24 -10 Q -4 -22 18 -12 L 26 22 Z" fill={col} />
      <path d="M -12 -14 Q -8 -40 12 -44 Q 30 -40 26 -14" fill="none" stroke={col} strokeWidth={8} strokeLinecap="round" />
      {[[-42, 10], [40, 6], [46, -12]].map(([dx, dy], i) => (
        <path key={i} d={`M ${dx} ${dy - 8} q 6 9 0 12 q -6 -3 0 -12 Z`} fill="#bfe3ff" />
      ))}
    </g>
  );
};

/** A sheet with every line struck out: something that exists and has not been shown. */
export const BlankedPage: React.FC<{x: number; y: number; w: number; a?: number; rows?: number}> = ({x, y, w, a = 1, rows = 5}) => {
  const k = clamp(a);
  if (k <= 0.003) return null;
  const h = 54 + rows * 30;
  return (
    <div style={{position: 'absolute', left: x, top: y + (1 - k) * 22, width: w, height: h, opacity: k, background: PAPER, borderRadius: 4, boxShadow: '0 24px 60px rgba(0,0,0,0.7)', transform: 'rotate(-1.4deg)'}}>
      <div style={{margin: '22px 28px 0', height: 4, background: INK}} />
      {Array.from({length: rows}, (_, i) => (
        <div key={i} style={{margin: '14px 28px 0', height: 16, width: `${[84, 66, 78, 58, 72, 40][i % 6]}%`, background: INK, borderRadius: 2}} />
      ))}
    </div>
  );
};
