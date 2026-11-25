import React from 'react';
import {C} from '../../engine/theme';
import {E, clamp, ramp} from '../../engine/time';
import {Bunker} from '../draw/Bunker';
import {MapBase, PLACE, Pin, camAt, projection} from '../draw/MapView';
import {ViewKey, viewAt} from '../draw/view';
import {Backdrop, Chip, H, PaperCard, QuoteCard, Txt, W, fadeIn, pop, span} from '../kit';
import {label, os} from '../script';
import {StageOptions} from '../Stage';
import {at, word} from '../timeline';
import {BARN_TOP, Barn, Coin, DrumGrid, Instructions, KID_HAND, Kid, MoundRow, SWING_SEAT, Speck, Swings} from './parts/EndingPictures';

// 12. THE ENDING, as finished the night before the blast: what is not known yet, what the
// Army has promised, the question that is left open, and 1984 one more time.
const c = {
  b1: at('end-1'),
  b2: at('end-2'),
  boom: word('end-2', 'happened') - 0.12,
  map: word('end-3', 'EPA') - 0.2,
  first: word('end-3', 'first') - 0.1,
  final: word('end-3', 'final') - 0.1,
  b4: at('end-4'),
  lucky: word('end-4', 'lucky'),
  luck: word('end-4', 'luck') - 0.05,
  b5: at('end-5'),
  farm: word('end-5', 'farm') - 0.1,
  play: word('end-5', 'playground') - 0.1,
  kid: word('end-5', 'kid') - 0.1,
  b6: at('end-6'),
  sure: word('end-6', 'To') - 0.15,
  b7: at('end-7'),
  asked: word('end-7', 'asked') - 0.2,
  once: word('end-7', 'Once') - 0.1,
  b8: at('end-8'),
  year: word('end-8', '1984') - 0.12,
  wet: word('end-8', 'Keep', 0) - 0.08,
  check: word('end-8', 'Keep', 1) - 0.08,
  drums: word('end-8', 'Do') - 0.08,
  b9: at('end-9'),
  b10: at('end-10'),
  what: word('end-10', 'This', 1) - 0.1,
  nobody: word('end-10', 'nobody') - 0.08,
  b11: at('end-11'),
};

const VIEWS: ViewKey[] = [
  {at: 0, cut: true, x: 0, y: 3.6, s: 40},
  {at: c.boom, x: 0, y: 3.4, s: 45, ease: E.lin},
  {at: c.map, x: 0, y: 9.4, s: 25, ease: E.out},
];
/** The row of magazines: close on the first, then back and along until the row runs out of frame. */
const GAP = 36;
const MOUNDS: ViewKey[] = [
  {at: c.b6, cut: true, x: 3, y: 3.2, s: 30},
  {at: c.sure - 0.1, x: 90, y: 25, s: 9, ease: E.inOutQuad},
];
const HEAD = () => [os('sur-1', 0), os('sur-1', 1), os('sur-1', 2)];
const WORKS = {barriers: 1, tanks: 1, foam: 1, gel: 1, mist: 1};

export const options: StageOptions = {};

export const Ending: React.FC<{t: number}> = ({t}) => {
  const v = viewAt(t, VIEWS);
  const inBunker = t < c.map;
  const onMap = t >= c.map && t < c.b5 + 0.35;
  const onThree = t >= c.b5 - 0.1 && t < c.b6;
  const onRow = t >= c.b6 && t < c.b8;
  const blast = t >= c.boom ? clamp((t - c.boom) / (c.map - c.boom)) * 0.9 : 0;

  // the map with nothing on it
  const cam = camAt(t, [
    {at: c.map, cut: true, lon: -91.95, lat: 41.0, k: 500},
    {at: c.b5 + 0.4, lon: -91.9, lat: 40.97, k: 440, ease: E.lin},
  ]);
  const proj = projection(cam);
  const plant = proj(PLACE.plant)!;
  const name = (lon: number, lat: number, key: string, a: number) => {
    const [x, y] = proj([lon, lat])!;
    return <Txt x={x} y={y} w={700} size={34} font="mono" weight={700} align="center" spacing="0.34em" color="#4f6a93" a={a}>{label(key)}</Txt>;
  };

  // end-5: three places a speck could come down
  const K = 1.4;
  const BASE = 690;
  const spots = [
    {x: 420, at: c.farm, top: BARN_TOP},
    {x: 960, at: c.play, top: SWING_SEAT},
    {x: 1500, at: c.kid, top: KID_HAND},
  ];

  // end-6, end-7: the review, and the question
  const mv = viewAt(t, MOUNDS, 0.5);
  const scan = -16 + 222 * ramp(t, c.b6 + 0.45, c.sure - 0.1, E.lin);
  const veil6 = Math.min(ramp(t, c.sure - 0.1, c.sure + 0.3), 1 - ramp(t, c.b7 - 0.3, c.b7 + 0.1));
  const veil7 = ramp(t, c.asked - 0.1, c.asked + 0.35);
  const hot = (i: number) => (i > 5 ? 0 : span(t, c.once + i * 0.62, c.once + i * 0.62 + 1.5, 0.25, 0.9));

  // end-8: 1984 again
  const shrink = ramp(t, c.wet - 0.4, c.wet - 0.05, E.inOutQuad);

  return (
    <>
      {/* end-1, end-2: the night before; then the blast */}
      {inBunker ? (
        <>
          <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
            <Bunker v={v} time={t} cut={1} crust={1} works={WORKS} blast={blast} wind={0.3} />
          </svg>
          <div style={{position: 'absolute', inset: 0, background: 'rgba(3,5,9,0.66)', opacity: 1 - ramp(t, c.b2 - 0.25, c.b2 + 0.3)}} />
          {t < c.b2 + 0.3 ? (
            <>
              <div style={{position: 'absolute', left: W / 2 - 330, top: 352, width: 660, height: 5, background: C.yellow, opacity: span(t, c.b1 - 0.05, c.b2, 0.3, 0.3), transform: `scaleX(${ramp(t, c.b1 - 0.05, c.b1 + 0.55, E.out)})`}} />
              <Txt x={W / 2} y={392} w={1500} size={54} font="mono" weight={700} align="center" spacing="0.14em" lh={1.5} a={span(t, c.b1 - 0.05, c.b2, 0.4, 0.3)} rise={14}>{label('edition')}</Txt>
            </>
          ) : null}
          <Txt x={W - 72} y={790} size={22} font="mono" weight={700} align="right" spacing="0.18em" color={C.mute} a={span(t, c.b2 + 0.2, c.map, 0.4, 0.2) * 0.9}>{label('schematic')}</Txt>
        </>
      ) : null}

      {/* end-3: nobody knows where it came down. end-4: luck. */}
      {onMap ? (
        <>
          <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
            <MapBase proj={proj} cam={cam} />
            <Pin proj={proj} at={PLACE.plant} time={t} ping color={C.red} r={12} />
          </svg>
          {name(-93.05, 41.62, 'iowa', fadeIn(t, c.map + 0.3, 0.5))}
          {name(-90.62, 41.05, 'illinois', fadeIn(t, c.map + 0.45, 0.5))}
          {name(-92.55, 40.36, 'missouri', fadeIn(t, c.map + 0.6, 0.5))}
          <Txt x={plant[0] + 22} y={plant[1] - 15} size={26} font="mono" weight={700} spacing="0.12em" a={fadeIn(t, c.map + 0.3, 0.4)}>{label('plant')}</Txt>
          <Chip x={72} y={150} size={48} a={span(t, c.first, c.b4 + 0.2, 0.4, 0.3)}>{os('end-3', 0)}</Chip>
          <Chip x={72} y={250} size={48} a={span(t, c.final, c.b4 + 0.2, 0.4, 0.3)}>{os('end-3', 1)}</Chip>
          <div style={{position: 'absolute', inset: 0, background: 'rgba(3,5,9,0.62)', opacity: ramp(t, c.b4 - 0.1, c.b4 + 0.4)}} />
          <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
            <Coin t={t} toss={c.b4} land={c.lucky} cx={W / 2} y={560} dull={ramp(t, c.luck, c.luck + 1.2)} />
          </svg>
        </>
      ) : null}

      {/* end-5: or it did not */}
      {onThree ? (
        <>
          <div style={{position: 'absolute', inset: 0, opacity: ramp(t, c.b5 - 0.1, c.b5 + 0.3)}}>
            <Backdrop tone="deep" />
          </div>
          <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
            <Barn x={spots[0].x} y={BASE} k={K} a={fadeIn(t, c.farm - 0.25, 0.3)} />
            <Swings x={spots[1].x} y={BASE} k={K} a={fadeIn(t, c.play - 0.25, 0.3)} t={t} />
            <Kid x={spots[2].x} y={BASE} k={K} a={fadeIn(t, c.kid - 0.25, 0.3)} />
            {spots.map((s) => (
              <Speck key={s.x} t={t} land={s.at + 0.3} x={s.x + s.top.x * K} y={BASE + s.top.y * K} />
            ))}
          </svg>
        </>
      ) : null}

      {/* end-6: the review of every site. end-7: how many more times? */}
      {onRow ? (
        <>
          <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
            <MoundRow v={mv} t={t} n={12} gap={GAP} scan={scan} />
          </svg>
          <Txt x={W - 72} y={790} size={22} font="mono" weight={700} align="right" spacing="0.18em" color={C.mute} a={span(t, c.b6 + 0.3, c.sure, 0.4, 0.3) * 0.9}>{label('schematic')}</Txt>
          <div style={{position: 'absolute', inset: 0, background: 'rgba(3,5,9,0.8)', opacity: Math.max(veil6, veil7)}} />
          <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
            <MoundRow v={mv} t={t} n={12} gap={GAP} hot={hot} only="hot" />
          </svg>
          {t < c.b7 + 0.1 ? <QuoteCard t={t} at={c.sure} quote={os('end-6', 0)} by={os('end-6', 1)} y={220} size={76} w={1500} backdrop={0} a={1 - ramp(t, c.b7 - 0.3, c.b7 + 0.05)} /> : null}
          <QuoteCard t={t} at={c.asked} quote={os('end-7', 0)} by={os('end-7', 1)} y={190} size={92} w={1620} backdrop={0} />
        </>
      ) : null}

      {/* end-8: it was written down */}
      {t >= c.b8 && t < c.b9 ? (
        <>
          <div style={{position: 'absolute', inset: 0}}>
            <Backdrop tone="deep" />
          </div>
          <PaperCard t={t} at={c.b8 + 0.1} head={HEAD()} quote="" x={760} y={210} w={1080} tilt={-2} a={1 - shrink} />
          <Txt x={96} y={250 - 216 * shrink} size={290} font="display" color={C.yellow} outline={14} scale={(0.7 + 0.3 * pop(t, c.year)) * (1 - 0.48 * shrink)} a={t >= c.year ? 1 : 0}>{os('end-8', 0)}</Txt>
          <Instructions t={t} wet={c.wet} check={c.check} drums={c.drums} />
          <Txt x={W - 72} y={790} size={22} font="mono" weight={700} align="right" spacing="0.18em" color={C.mute} a={fadeIn(t, c.wet + 0.3, 0.4) * 0.9}>{label('schematic')}</Txt>
        </>
      ) : null}

      {/* end-9: and kept it anyway. end-10, end-11: the title again. */}
      {t >= c.b9 ? (
        <>
          <div style={{position: 'absolute', inset: 0}}>
            <Backdrop tone="deep" />
          </div>
          <DrumGrid t={t} start={c.b9} />
          <div style={{position: 'absolute', inset: 0, background: `rgba(3,5,9,${0.9 * ramp(t, c.b10 - 0.1, c.b10 + 0.6)})`}} />
          <Txt x={W / 2} y={210} w={W} size={250} font="display" align="center" lh={0.98} scale={0.86 + 0.14 * pop(t, c.what)} a={t >= c.what ? 1 : 0}>{os('cold-title', 0)}</Txt>
          <Txt x={W / 2} y={450} w={W} size={250} font="display" align="center" lh={0.98} color={C.yellow} scale={0.86 + 0.14 * pop(t, c.nobody)} a={t >= c.nobody ? 1 : 0}>{os('cold-title', 1)}</Txt>
          <div style={{position: 'absolute', left: W / 2 - 420, top: 716, width: 840, height: 6, background: C.yellow, transform: `scaleX(${ramp(t, c.nobody + 0.2, c.nobody + 0.7, E.out)})`}} />
          <Txt x={W / 2} y={744} w={W} size={28} font="mono" weight={700} align="center" spacing="0.2em" a={fadeIn(t, c.b11, 0.5)}>{label('edition')}</Txt>
        </>
      ) : null}
    </>
  );
};
