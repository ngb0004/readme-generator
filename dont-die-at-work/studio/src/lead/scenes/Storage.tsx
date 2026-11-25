import React from 'react';
import {C} from '../../engine/theme';
import {E, clamp, lerp, ramp, track} from '../../engine/time';
import {BarrelCut} from '../draw/Barrel';
import {Bunker} from '../draw/Bunker';
import {P, ViewKey, viewAt} from '../draw/view';
import {Chip, H, Leader, PaperCard, Txt, W, fadeIn, span} from '../kit';
import {label, os} from '../script';
import {StageOptions} from '../Stage';
import {S, at, word} from '../timeline';
import {Floor, Gauge, ListRow, PaperStrip, Pour, Snowflake, Wisps, barrelGeom} from './parts/StorageKit';

// 3. HOW IT IS STORED. One drum, cut open: why it is kept wet, then the 1984 paper's list of
// what can go wrong, with the drum acting out each entry.
const c = {
  start: S.storage.start,
  dry: word('sto-1', 'Dry') - 0.15,
  wet: word('sto-1', 'So') - 0.1,
  bath: word('sto-1', 'wet') + 0.05,
  bunker: word('sto-1', 'inside') - 0.05,
  concrete: word('sto-1', 'concrete') - 0.15,
  b2: at('sto-2'),
  b3: at('sto-3'),
  under: word('sto-3', 'It') - 0.15,
  b4: at('sto-4'),
  freezes: word('sto-4', 'freezes') - 0.2,
  goOff: word('sto-4', 'go') - 0.15,
  alcohol: word('sto-4', 'alcohol') - 0.1,
  b5: at('sto-5'),
  evap: word('sto-5', 'Alcohol') - 0.1,
  somebody: word('sto-5', 'somebody') - 0.1,
  check: word('sto-5', 'checking') - 0.1,
  topUp: word('sto-5', 'topping') - 0.1,
  b6: at('sto-6'),
  y1984: word('sto-6', '1984') - 0.1,
  drums: word('sto-6', 'steel') - 0.1,
  rusts: word('sto-6', 'rusts') - 0.15,
  b7: at('sto-7'),
  looking: word('sto-7', 'looking'),
  end: S.storage.end,
};

// The bunker, for "inside concrete bunkers buried in earth": in close, then back to take in the mound.
const VIEWS: ViewKey[] = [
  {at: c.bunker, cut: true, x: 0, y: 2.2, s: 96},
  {at: c.b2 - 0.3, x: 0, y: 2.9, s: 66, ease: E.out},
];

// The list sits in a column on the right, under the paper's title block.
const LX = 1000;
const LW = 848;
const ROW = {head: 122, r1: 254, r2: 340, r3: 546, r4: 690};

export const options: StageOptions = {};

export const Storage: React.FC<{t: number}> = ({t}) => {
  const inBunker = t >= c.bunker && t < c.b2;
  const alone = t >= c.b7;
  const centre = ramp(t, c.b7 - 0.05, c.b7 + 1.2, E.inOut);

  // ---- the drum
  const bx = t < c.b2 ? W / 2 : lerp(470, W / 2, centre);
  const bs = t < c.b2 ? lerp(540, 575, ramp(t, c.start, c.dry + 0.4, E.out)) : lerp(575, 612, ramp(t, c.b7, c.end, E.lin));
  const by = 826;
  const level = track(t, [
    [c.wet + 0.1, 0],
    [c.wet + 1.5, 1, E.inOutQuad],
    [c.evap + 0.2, 1],
    [c.check - 0.3, 0.4, E.inOutQuad],
    [c.topUp + 0.15, 0.4],
    [c.topUp + 0.9, 1, E.inOutQuad],
  ]);
  const g = barrelGeom(bx, by, bs, level);
  const open = ramp(t, c.dry - 0.15, c.dry + 0.3, E.out);
  const pulse = 0.72 + 0.28 * Math.sin(t * 7.5);
  const glowDry = ramp(t, c.dry, c.dry + 0.4) * (1 - ramp(t, c.wet + 0.2, c.wet + 1.0));
  const glowIce = ramp(t, c.goOff - 0.2, c.goOff + 0.5) * (1 - ramp(t, c.alcohol + 0.5, c.alcohol + 1.3));
  const glow = Math.max(glowDry, glowIce) * pulse;
  const ice = clamp(ramp(t, c.freezes, c.freezes + 1.4) - ramp(t, c.alcohol + 0.5, c.alcohol + 1.8));
  // 1984: the same drum in steel, and what the paper says happens to steel
  const steel = ramp(t, c.b6 + 0.25, c.b6 + 0.65) * (1 - ramp(t, c.b7 - 0.05, c.b7 + 0.45));
  const rust = track(t, [[c.drums, 0], [c.rusts - 0.3, 0.5, E.lin], [c.rusts + 0.9, 1, E.inOutQuad]]);

  // ---- what happens round it
  const fillA = span(t, c.wet + 0.05, c.wet + 1.5, 0.15, 0.25);
  const alcoholA = span(t, c.alcohol - 0.1, c.b5 - 0.55, 0.3, 0.3);
  const topUpA = span(t, c.topUp, c.topUp + 1.0, 0.2, 0.25);
  const wispA = span(t, c.evap + 0.1, c.check + 0.1, 0.35, 0.4);
  const flakeA = ramp(t, c.freezes, c.freezes + 0.35, E.out) * (1 - ramp(t, c.alcohol + 0.6, c.alcohol + 1.5));
  const gaugeA = ramp(t, c.b3, c.b3 + 0.4);
  const checkA = t >= c.check && t < c.b6 ? Math.min(clamp((t - c.check) / 0.3), 1 - ramp(t, c.b6 - 0.3, c.b6)) : 0;
  // sto-7: somebody keeps looking. A ring opens from the pointer at an even pace, until the line ends.
  const PINGS = [0.5, 1.6, 2.7, 3.8].map((d) => c.b7 + d).filter((p) => p < c.looking);
  const pingAt = PINGS.filter((p) => t >= p).pop();
  const ping = pingAt === undefined ? -1 : (t - pingAt) / 0.95;

  // ---- the bunker shot
  const v = viewAt(t, VIEWS);
  const wpt = (x: number, y: number) => ({x: P(v, x, y)[0], y: P(v, x, y)[1]});

  const listA = 1 - ramp(t, c.b7 - 0.15, c.b7 + 0.3);
  // the row it stands in: there before the drum is cut open, and again, dim, when the lights go down
  const rowA = t < c.b2 ? 0.55 * (1 - ramp(t, c.dry - 0.35, c.dry + 0.25)) : 0.34 * ramp(t, c.b7 + 0.5, c.b7 + 1.6);
  const [freezeIf, freezeThen] = os('sto-4', 0).split(': ');

  return (
    <>
      {/* sto-7: the room goes dark round the one drum */}
      {alone ? <div style={{position: 'absolute', inset: 0, background: '#03050a', opacity: 0.74 * ramp(t, c.b7 - 0.05, c.b7 + 0.9)}} /> : null}

      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
        {inBunker ? (
          <Bunker v={v} time={t} cut={1} wind={0.3} />
        ) : (
          <>
            <Floor g={g} half={rowA > 0.01 ? 1100 : 470} />
            {rowA > 0.01
              ? [-2, -1, 1, 2].map((n) => {
                  const nx = bx + n * g.w * 1.42;
                  return (
                    <g key={n} opacity={rowA}>
                      <Floor g={barrelGeom(nx, by, bs)} half={0} />
                      <BarrelCut x={nx} y={by} s={bs} time={t} open={0} />
                    </g>
                  );
                })
              : null}
            {steel < 0.999 ? (
              <g opacity={1 - steel}>
                <BarrelCut x={bx} y={by} s={bs} time={t} level={level} open={open} glow={glow} ice={ice} />
              </g>
            ) : null}
            {steel > 0.001 ? (
              <g opacity={steel}>
                <BarrelCut x={bx + 0.6} y={by} s={bs} time={t} level={level} steel rust={rust} />
              </g>
            ) : null}
            <Gauge g={g} a={gaugeA} ping={ping} check={checkA} />
            <Wisps g={g} time={t} a={wispA} />
            <Pour g={g} time={t} a={fillA} color="#7fbdf5" />
            <Pour g={g} time={t} a={alcoholA} color={C.warm} />
            <Pour g={g} time={t} a={topUpA} color={C.warm} />
            <Snowflake x={g.left - 118} y={lerp(g.bathTop, g.powderTop, 0.5)} r={62} a={flakeA} spin={t * 14} />
          </>
        )}
      </svg>
      <Txt x={W - 72} y={790} size={22} font="mono" weight={700} align="right" spacing="0.18em" color={C.mute} a={fadeIn(t, c.start + 0.6, 0.5)}>{label('schematic')}</Txt>

      {/* sto-1: kept wet */}
      {t < c.bunker ? (
        <>
          <Leader from={{x: 1262, y: 372}} to={{x: g.inner.x + g.inner.w - 44, y: lerp(g.bathTop, g.powderTop, 0.4)}} a={span(t, c.bath + 0.1, c.bunker, 0.3, 0.12)} color="#bfe0ff" />
          <Chip x={1268} y={338} size={56} color="#bfe0ff" a={span(t, c.bath, c.bunker, 0.35, 0.12)}>{os('sto-1', 2)}</Chip>
        </>
      ) : null}

      {/* sto-1: inside concrete, under earth */}
      {inBunker ? (
        <>
          <Leader from={{x: 440, y: 226}} to={wpt(-4.6, 2.9)} a={span(t, c.bunker + 0.35, c.b2, 0.3, 0.12)} />
          <Chip x={96} y={150} size={52} a={span(t, c.bunker + 0.25, c.b2, 0.35, 0.12)}>{os('sto-1', 0)}</Chip>
          <Leader from={{x: 1296, y: 226}} to={wpt(2.7, 3.2)} a={span(t, c.concrete + 0.1, c.b2, 0.3, 0.12)} color={C.white} />
          <Chip x={1250} y={150} size={52} color={C.white} a={span(t, c.concrete, c.b2, 0.35, 0.12)}>{os('sto-1', 1)}</Chip>
        </>
      ) : null}

      {/* sto-2: the paper arrives, then folds down to the strip that heads the list */}
      {t >= c.b2 && t < c.b3 + 0.4 ? (
        <div style={{position: 'absolute', inset: 0, transform: `translateY(${-70 * ramp(t, c.b3 - 0.1, c.b3 + 0.3, E.in)}px)`}}>
          <PaperCard t={t} at={c.b2 + 0.05} head={[os('sur-1', 0), os('sur-1', 1), os('sur-1', 2)]} quote="" x={LX - 10} y={150} w={LW + 10} tilt={-1.4} a={1 - ramp(t, c.b3 - 0.1, c.b3 + 0.28)} />
        </div>
      ) : null}

      {/* sto-3 to sto-6: what can go wrong */}
      {t >= c.b3 && listA > 0 ? (
        <>
          <PaperStrip x={LX} y={ROW.head} w={LW} a={ramp(t, c.b3 + 0.05, c.b3 + 0.4, E.out) * listA} title={os('sur-1', 0)} sub={os('sur-1', 2)} flip={ramp(t, c.y1984, c.y1984 + 0.4, E.out)} headline={os('sto-6', 1)} />
          <ListRow t={t} x={LX} y={ROW.r1} w={LW} a={listA} lines={[{text: os('sto-3', 0), at: c.under}]} />
          <ListRow
            t={t} x={LX} y={ROW.r2} w={LW} a={listA} mark={C.red}
            lines={[
              {text: freezeIf + ':', at: c.freezes - 0.1},
              {text: freezeThen, at: c.goOff, color: C.red},
              {text: os('sto-4', 1), at: c.alcohol, sub: true},
            ]}
          />
          <ListRow
            t={t} x={LX} y={ROW.r3} w={LW} a={listA}
            lines={[
              {text: os('sto-5', 0), at: c.evap - 0.1},
              {text: os('sto-5', 1), at: c.somebody, sub: true, color: C.yellow},
            ]}
          />
          <ListRow t={t} x={LX} y={ROW.r4} w={LW} a={listA} mark={C.red} lines={[{text: os('sto-6', 0), at: c.rusts, color: C.red}]} />
        </>
      ) : null}
    </>
  );
};
