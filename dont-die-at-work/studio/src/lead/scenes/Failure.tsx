import React from 'react';
import {C} from '../../engine/theme';
import {E, clamp, lerp, ramp, track} from '../../engine/time';
import {BarrelCut} from '../draw/Barrel';
import {Bunker, M, barrelXs} from '../draw/Bunker';
import {P, ViewKey, viewAt} from '../draw/view';
import {Chip, H, Leader, PaperCard, QuoteCard, Txt, W, fadeIn, span} from '../kit';
import {label, os} from '../script';
import {StageOptions} from '../Stage';
import {S, at, word} from '../timeline';
import {Cross, Snow, Stamp, Truck} from './parts/FailureKit';
import {Floor, Gauge, ListRow, PaperStrip, Pour, Wisps, barrelGeom} from './parts/StorageKit';

// 6. HOW IT WENT BAD. The drum from the storage scene, with nobody looking after it: the bath
// goes down, crystals grow, and three things become impossible, one stamp each.
const c = {
  start: S.failure.start,
  drop: word('fail-1', 'The') - 0.45,
  down: word('fail-1', 'liquid') - 0.1,
  b2: at('fail-2'),
  dries: word('fail-2', 'dries') - 0.1,
  long: word('fail-2', 'Long') - 0.15,
  b3: at('fail-3'),
  quote: word('fail-3', 'Breaking') - 0.2,
  deton: word('fail-3', 'detonation') - 0.1,
  b4: at('fail-4'),
  outside: word('fail-4', 'crystals') - 0.2,
  lids: word('fail-4', 'lids') - 0.35,
  bolts: word('fail-4', 'bolts') - 0.3,
  b5: at('fail-5'),
  open: word('fail-5', 'open') - 0.2,
  atf: word('fail-5', 'The') - 0.05,
  oneLid: word('fail-5', 'one') - 0.15,
  setOff: word('fail-5', 'set') - 0.05,
  every: word('fail-5', 'every') - 0.1,
  b6: at('fail-6'),
  moved: word('fail-6', 'cannot') - 0.05,
  trucked: word('fail-6', 'trucked') - 0.35,
  b7: at('fail-7'),
  winter: word('fail-7', 'winter') - 0.05,
  freezes: word('fail-7', 'freezes') - 0.2,
  warned: word('fail-7', 'Freezing') - 0.1,
  b8: at('fail-8'),
  said: word('fail-8', 'said') - 0.2,
  end: S.failure.end,
};

// The bunker: in on the barrels to open, back inside for the chain of lids, then wide for the truck.
const VIEWS: ViewKey[] = [
  {at: c.start, cut: true, x: 0, y: 1.25, s: 118},
  {at: c.drop, x: 0, y: 0.95, s: 190, ease: E.in},
  {at: c.atf, cut: true, x: 0, y: 1.45, s: 146},
  {at: c.b6, x: 0, y: 1.45, s: 162, ease: E.lin},
  {at: c.b6, cut: true, x: -3.6, y: 2.9, s: 57},
  {at: c.b7, x: -3.3, y: 2.9, s: 61, ease: E.lin},
];

/** Where the top edge of the drum sits in the close-up on the lid. */
const LID = 520;
/** The lid that gets lifted in the ATF's warning: the third drum along. */
const FIRST = 2;
const STAMP_Y = 194;
const STAMP_X = [331, 960, 1589];
// the callback to the storage list sits on the right
const LX = 1000;
const LW = 848;

export const options: StageOptions = {};

export const Failure: React.FC<{t: number}> = ({t}) => {
  const bunkerA = t < c.drop;
  const bunkerB = t >= c.atf && t < c.b7;
  const inBunker = bunkerA || bunkerB;
  const late = t >= c.b7;

  // ---- the drum: full frame, then aside for the paper, then right in on the lid; small again for the winter
  const bx = late ? 540 : track(t, [[c.b3, 540], [c.b3 + 0.7, 380], [c.b4 - 0.1, 380], [c.b4 + 1.8, 560]]);
  const bs = late ? lerp(500, 512, ramp(t, c.b7, c.said, E.lin)) : track(t, [[c.down, 600], [c.b3, 690, E.lin], [c.b4 - 0.1, 690], [c.b4 + 1.8, 1040], [c.atf, 1090, E.lin]]);
  const by = late ? 830 : track(t, [[c.down, 812], [c.b3, 830, E.lin], [c.b4 - 0.1, 830], [c.b4 + 1.8, LID + 0.92 * 1040], [c.atf, LID + 0.92 * 1090, E.lin]]);
  const level = track(t, [[c.down, 1], [c.down + 1.5, 0.3, E.inOutQuad], [c.b7, 0.27, E.lin]]);
  const g = barrelGeom(bx, by, bs, level);
  const needles = ramp(t, c.dries + 0.2, c.long + 1.3);
  const outside = ramp(t, c.outside, c.bolts + 0.1);
  const ice = ramp(t, c.freezes - 0.2, c.freezes + 1.5);
  const pulse = 0.72 + 0.28 * Math.sin(t * 7.5);
  const glowWords = ramp(t, c.deton - 0.4, c.deton + 0.3) * (1 - ramp(t, c.b4, c.b4 + 1.0));
  const glowIce = ramp(t, c.freezes + 0.6, c.freezes + 2.2);
  const glow = Math.max(glowWords, glowIce) * pulse;
  const gaugeA = late ? ramp(t, c.b7, c.b7 + 0.4) : ramp(t, c.drop, c.drop + 0.3) * (1 - ramp(t, c.b3 - 0.1, c.b3 + 0.25));
  const closeUp = t >= c.b4 + 0.6 && t < c.atf;

  // ---- the bunker
  const v = viewAt(t, VIEWS);
  const xs = barrelXs();
  const glowAt = (i: number) => (i === FIRST ? c.setOff : c.every + (Math.abs(i - FIRST) - 1) * 0.33);
  const [lx, ly] = P(v, xs[FIRST], 0.1 + M.barrelH + 0.03);
  const pick = span(t, c.oneLid - 0.45, c.setOff + 0.15, 0.25, 0.15);
  const lift = ramp(t, c.oneLid, c.oneLid + 0.5, E.out);
  const [ax0, ay0] = P(v, -M.r, 0);
  const [ax1] = P(v, M.r, 0);
  const truckX = lerp(-31, -10.2, ramp(t, c.moved + 0.75, c.trucked + 0.3, E.out));
  const [tx, ty] = P(v, truckX - 3.8, 1.55);
  const crossK = clamp((t - (c.trucked + 0.4)) / 0.3);

  const [freezeIf, freezeThen] = os('sto-4', 0).split(': ');
  const cardA = ramp(t, c.warned, c.warned + 0.35, E.out) * (1 - ramp(t, c.b8 - 0.2, c.b8 + 0.1));
  const quoteOn = t >= c.said;

  return (
    <>
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
        {inBunker ? (
          <>
            <Bunker v={v} time={t} cut={1} crust={bunkerB ? 1 : 0} wind={0.3} />
            {t >= c.atf && t < c.b6 ? (
              <>
                {/* the ATF's warning, drawn out: one lid, then the rest */}
                <path d={`M ${ax0} ${ay0} A ${M.r * v.s} ${M.r * v.s} 0 0 1 ${ax1} ${ay0} Z`} fill={C.red} opacity={0.2 * ramp(t, c.every + 0.9, c.every + 1.6)} />
                {xs.map((x, i) => {
                  const k = ramp(t, glowAt(i), glowAt(i) + 0.3, E.out);
                  const ring = (t - glowAt(i)) / 0.7;
                  const [cx, cy] = P(v, x, 0.1 + M.barrelH / 2);
                  return k > 0 ? (
                    <g key={i}>
                      <circle cx={cx} cy={cy} r={M.barrelW * v.s * (0.78 + 0.3 * k)} fill={C.red} opacity={k * (0.36 + 0.14 * Math.sin(t * 8 + i))} />
                      {ring < 1 ? <circle cx={cx} cy={cy} r={M.barrelW * v.s * (0.6 + ring * 1.9)} fill="none" stroke={C.red} strokeWidth={5} opacity={(1 - ring) * 0.9} /> : null}
                    </g>
                  ) : null;
                })}
                {pick > 0.01 ? (
                  <g opacity={pick} stroke={C.yellow} strokeLinecap="round" strokeLinejoin="round" fill="none">
                    <ellipse cx={lx} cy={ly} rx={M.barrelW * v.s * 0.74} ry={M.barrelW * v.s * 0.26} strokeWidth={6} />
                    <line x1={lx} y1={ly - v.s * 0.28} x2={lx} y2={ly - v.s * (0.28 + 0.62 * lift)} strokeWidth={8} />
                    <path d={`M ${lx - v.s * 0.16} ${ly - v.s * (0.12 + 0.62 * lift)} L ${lx} ${ly - v.s * (0.3 + 0.62 * lift)} L ${lx + v.s * 0.16} ${ly - v.s * (0.12 + 0.62 * lift)}`} strokeWidth={8} opacity={lift} />
                  </g>
                ) : null}
              </>
            ) : null}
            {t >= c.b6 && t < c.b7 ? (
              <>
                <Truck v={v} x={truckX} a={ramp(t, c.moved + 0.7, c.moved + 0.9)} />
                <Cross x={tx} y={ty} r={v.s * 2.3} k={crossK} />
              </>
            ) : null}
          </>
        ) : (
          <>
            {closeUp ? null : <Floor g={g} half={late ? 400 : 470} />}
            <BarrelCut x={bx} y={by} s={bs} time={t} level={level} needles={needles} outside={outside} ice={ice} glow={glow} />
            <Gauge g={g} a={gaugeA} alarm={level < 0.4 ? 1 : 0} />
            <Wisps g={g} time={t} a={span(t, c.down - 0.2, c.b2 + 0.7, 0.3, 0.6)} />
            {/* fail-4: where the crystals are */}
            {t >= c.lids && t < c.atf ? (
              <g fill="none" stroke={C.yellow} strokeLinejoin="round">
                <rect x={g.left - g.w * 0.03} y={g.top - g.h * 0.042} width={g.w * 1.06} height={g.h * 0.084} rx={g.h * 0.02} strokeWidth={6} opacity={span(t, c.lids, c.b5, 0.2, 0.3) * (0.6 + 0.4 * Math.sin((t - c.lids) * 6))} />
                {g.bolts.map((b, i) => (
                  <circle key={i} cx={b.x} cy={b.y} r={g.w * 0.055} strokeWidth={6} opacity={span(t, c.bolts, c.b5, 0.2, 0.3) * (0.6 + 0.4 * Math.sin((t - c.bolts) * 6 + i))} />
                ))}
              </g>
            ) : null}
            {/* fail-5: the can that topped it up every September cannot be used */}
            {t >= c.b5 && t < c.atf ? (
              <>
                <Pour g={g} time={t} a={ramp(t, c.b5 + 0.1, c.b5 + 0.5, E.out)} color={C.warm} dry flip size={620} />
                <Cross x={g.port.x + 62} y={g.port.y - 186} r={96} k={clamp((t - c.open) / 0.3)} />
              </>
            ) : null}
            <Snow time={t} a={late ? ramp(t, c.b7 + 0.1, c.b7 + 1.2) : 0} />
          </>
        )}
      </svg>
      <Txt x={W - 72} y={790} size={22} font="mono" weight={700} align="right" spacing="0.18em" color={C.mute} a={fadeIn(t, c.start + 0.6, 0.5) * (1 - ramp(t, c.said - 0.2, c.said))}>{label('schematic')}</Txt>

      {/* fail-1: the label rides down with the pointer. fail-2: what grows where the bath was */}
      {t >= c.down && t < c.b3 + 0.2 ? (
        <>
          <Chip x={g.gaugeX + 54} y={g.bathTop - 40} size={54} color={C.red} a={span(t, c.down + 0.1, c.b3 + 0.1, 0.35, 0.15)}>{os('fail-1', 0)}</Chip>
          <Leader from={{x: 934, y: 356}} to={{x: g.inner.x + g.inner.w - g.s * 0.05, y: lerp(g.inner.y + g.inner.h * 0.12, g.bathTop, 0.5)}} a={span(t, c.long + 0.1, c.b3 + 0.1, 0.3, 0.15)} />
          <Chip x={940} y={300} size={54} a={span(t, c.long, c.b3 + 0.1, 0.35, 0.15)}>{os('fail-2', 0)}</Chip>
        </>
      ) : null}

      {/* fail-3: the paper's one line */}
      {t >= c.b3 && t < c.b4 + 0.1 ? (
        <PaperCard t={t} at={c.b3 + 0.35} head={[os('sur-1', 0), os('sur-1', 1), os('sur-1', 2)]} quote={os('fail-3', 0)} hiAt={c.quote} x={650} y={170} w={1196} size={54} tilt={-1} a={1 - ramp(t, c.b4 - 0.25, c.b4 + 0.05)} />
      ) : null}

      {/* fail-4: on the lids, on the bolts */}
      {t >= c.lids && t < c.b5 + 0.2 ? (
        <>
          <Leader from={{x: 1016, y: 508}} to={{x: g.right + g.w * 0.03, y: g.top}} a={span(t, c.lids + 0.1, c.b5 + 0.1, 0.25, 0.15)} />
          <Chip x={1022} y={466} size={60} a={span(t, c.lids, c.b5 + 0.1, 0.3, 0.15)}>{os('fail-4', 0)}</Chip>
          <Leader from={{x: 1016, y: 352}} to={{x: g.bolts[2].x + g.w * 0.04, y: g.bolts[2].y - g.h * 0.022}} a={span(t, c.bolts + 0.1, c.b5 + 0.1, 0.25, 0.15)} />
          <Chip x={1022} y={310} size={60} a={span(t, c.bolts, c.b5 + 0.1, 0.3, 0.15)}>{os('fail-4', 1)}</Chip>
        </>
      ) : null}

      {/* fail-7: freezing is on the 1984 list */}
      {late && cardA > 0 ? (
        <>
          <PaperStrip x={LX} y={330} w={LW} a={cardA} title={os('sur-1', 0)} sub={os('sur-1', 2)} />
          <ListRow
            t={t} x={LX} y={466} w={LW} a={cardA} mark={C.red} size={58}
            lines={[
              {text: freezeIf + ':', at: c.warned + 0.25},
              {text: freezeThen, at: c.warned + 0.6, color: C.red},
            ]}
          />
        </>
      ) : null}

      {/* fail-8: who is speaking, then his words */}
      {t >= c.b8 && !quoteOn ? <Chip x={LX} y={420} size={42} color={C.white} a={span(t, c.b8 + 0.25, c.said, 0.35, 0.12)}>{os('fail-8', 1)}</Chip> : null}
      {quoteOn ? <QuoteCard t={t} at={c.said} quote={os('fail-8', 0)} by={os('fail-8', 1)} y={372} w={1560} size={72} /> : null}

      {/* the three things that cannot be done: they stay to the end */}
      <Stamp t={t} at={c.open} cx={STAMP_X[0]} cy={STAMP_Y}>{os('fail-5', 0)}</Stamp>
      <Stamp t={t} at={c.moved} cx={STAMP_X[1]} cy={STAMP_Y} rot={-2}>{os('fail-6', 0)}</Stamp>
      <Stamp t={t} at={c.winter} cx={STAMP_X[2]} cy={STAMP_Y}>{os('fail-7', 0)}</Stamp>
    </>
  );
};
