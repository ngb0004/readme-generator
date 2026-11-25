import React from 'react';
import {C} from '../../engine/theme';
import {E, clamp, ramp} from '../../engine/time';
import {BarrelCut} from '../draw/Barrel';
import {H, PaperCard, Txt, W, fadeIn, pop, span} from '../kit';
import {label, os} from '../script';
import {StageOptions} from '../Stage';
import {S, at, word} from '../timeline';
import {Drum, PLASTIC, PriceTag, STEEL} from './parts/TimelinePictures';

// 3. WHY THERE IS A STOCKPILE. The 1984 paper tells it; the page stays up and the sentence being
// read is marked. Beside it, drums: how many there were, how many were destroyed, what was left.
const c = {
  start: S.surplus.start,
  paper: S.surplus.start + 0.15,
  b2: at('sur-2'),
  quote2: word('sur-2', 'quote') - 0.2,
  b3: at('sur-3'),
  b4: at('sur-4'),
  vast: word('sur-4', 'vast') - 0.2,
  demand: word('sur-4', 'demand') - 0.4,
  b5: at('sur-5'),
  nobody: word('sur-5', 'Nobody') - 0.1,
  b6: at('sur-6'),
  destroying: word('sur-6', 'destroying') - 0.2,
  stopped: word('sur-6', 'stopped') - 0.15,
  half: word('sur-6', 'half') - 0.25,
  b7: at('sur-7'),
  leaking: word('sur-7', 'leaking') - 0.3,
  repacked: word('sur-7', 'repacked') - 0.2,
  bought: word('sur-7', 'another') - 0.15,
  b8: at('sur-8', 0.2),
  end: S.surplus.end,
};

// which sentence of the paper is on the page, and when the marker runs over it
const READ: {from: number; quote: string; hi: number}[] = [
  {from: c.start, quote: '', hi: 0},
  {from: c.b2, quote: os('sur-2', 0), hi: c.quote2},
  {from: c.b3, quote: os('sur-3', 0), hi: c.b3 + 0.5},
  {from: c.b4, quote: os('sur-4', 0), hi: c.vast},
  {from: c.b5, quote: os('sur-5', 0), hi: c.b5 + 0.2},
  {from: c.b6, quote: os('sur-6', 0), hi: c.half},
];

const BASE = 800; // the floor the drums stand on
const PILE_X = 1330;

export const options: StageOptions = {hideCaption: (id) => id === 'sur-8'};

export const Surplus: React.FC<{t: number}> = ({t}) => {
  const now = READ.reduce((a, r) => (t >= r.from ? r : a), READ[0]);
  const paperA = 1 - ramp(t, c.b7 - 0.1, c.b7 + 0.3);
  const year = t >= c.b8;

  // sur-4: a vast supply (a wall of drums) and almost no demand (one empty outline)
  const pile = span(t, c.b4 + 0.2, c.b6 + 0.1, 0.3, 0.3);
  // sur-6: eight drums; the first four are destroyed, then the work stops
  const row = span(t, c.b6 + 0.1, c.b7 + 0.2, 0.3, 0.3);
  const xs = Array.from({length: 8}, (_, i) => 300 + i * 190);
  // sur-7: what was left, leaking, then repacked
  const left = span(t, c.b7, c.b8, 0.3, 0.2);
  const rust = ramp(t, c.b7 + 0.6, c.leaking + 0.9);
  const swap = ramp(t, c.repacked, c.repacked + 0.8, E.inOutQuad);

  return (
    <>
      {/* the page */}
      {!year ? (
        <div style={{position: 'absolute', inset: 0, opacity: paperA}}>
          <PaperCard t={t} at={c.paper} head={[os('sur-1', 0), os('sur-1', 1), os('sur-1', 2)]} quote={now.quote} hiAt={now.hi} x={t < c.b4 ? 300 : 72} y={t < c.b4 ? 150 : 128} w={t < c.b4 ? 1320 : 1130} size={t < c.b4 ? 54 : 46} tilt={-1.2} />
        </div>
      ) : null}

      {/* sur-4 and sur-5: supply and demand */}
      {pile > 0.01 ? (
        <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, opacity: pile}}>
          <line x1={PILE_X - 90} y1={BASE} x2={W - 60} y2={BASE} stroke="#3a4a66" strokeWidth={4} />
          {Array.from({length: 4}, (_, r) =>
            Array.from({length: 5 - (r > 2 ? 1 : 0)}, (_, i) => {
              const n = r * 5 + i;
              const when = c.vast + n * 0.035;
              return t >= when ? <Drum key={`${r}-${i}`} x={PILE_X + i * 96 + (r % 2) * 48 - 40} base={BASE - r * 132 - 4} h={124 * Math.min(1.06, pop(t, when, 4, 0.6))} look={STEEL} /> : null;
            }),
          )}
          {/* demand: room for one, and nobody asking */}
          <Drum x={PILE_X + 440} base={BASE - 4} h={124} ghost a={fadeIn(t, c.demand, 0.4)} />
          <PriceTag x={PILE_X + 150} y={BASE - 420} s={86} time={t} a={span(t, c.b5 + 0.1, c.b6, 0.25, 0.25)} />
          {t >= c.nobody ? <line x1={PILE_X + 96} y1={BASE - 366} x2={PILE_X + 96 + 108 * ramp(t, c.nobody, c.nobody + 0.3, E.out)} y2={BASE - 366 + 150 * ramp(t, c.nobody, c.nobody + 0.3, E.out)} stroke={C.red} strokeWidth={12} strokeLinecap="round" opacity={span(t, c.nobody, c.b6, 0.05, 0.25)} /> : null}
        </svg>
      ) : null}

      {/* sur-6: destroyed one by one, and then it stops */}
      {row > 0.01 ? (
        <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, opacity: row}}>
          <line x1={180} y1={BASE} x2={W - 180} y2={BASE} stroke="#3a4a66" strokeWidth={4} />
          {xs.map((x, i) => {
            const goneAt = c.destroying + 0.15 + i * 0.5;
            const gone = i < 4 && t >= goneAt;
            const k = gone ? clamp((t - goneAt) / 0.3) : 0;
            return (
              <g key={i}>
                <Drum x={x} base={BASE - 4} h={190} ghost a={k} />
                <Drum x={x} base={BASE - 4} h={190} look={STEEL} a={1 - k} />
              </g>
            );
          })}
          {/* the work stops here */}
          {t >= c.stopped ? (
            <g opacity={Math.min(1, (t - c.stopped) / 0.1)}>
              <line x1={(xs[3] + xs[4]) / 2} y1={BASE + 26} x2={(xs[3] + xs[4]) / 2} y2={BASE - 240 * ramp(t, c.stopped, c.stopped + 0.25, E.out)} stroke={C.red} strokeWidth={10} strokeLinecap="round" />
            </g>
          ) : null}
        </svg>
      ) : null}

      {/* sur-7: the half that stayed */}
      {left > 0.01 ? (
        <div style={{position: 'absolute', inset: 0, opacity: left}}>
          <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
            <line x1={120} y1={BASE - 60} x2={1000} y2={BASE - 60} stroke="#3a4a66" strokeWidth={4} />
            {[250, 470, 690, 910].map((x, i) => (
              <g key={i}>
                <g opacity={1 - swap}>
                  <BarrelCut x={x} y={BASE - 64} s={318} time={t} steel open={0} rust={rust * (0.75 + 0.25 * ((i * 7) % 3) / 2)} level={0.8} />
                </g>
                <g opacity={swap} transform={`translate(0 ${(1 - swap) * -40})`}>
                  <Drum x={x} base={BASE - 64} h={292} look={PLASTIC} />
                </g>
              </g>
            ))}
          </svg>
          <Txt x={1090} y={300} w={780} size={128} font="display" color={C.yellow} outline={9} lh={1.02} a={fadeIn(t, c.bought, 0.15)} scale={0.84 + 0.16 * pop(t, c.bought)}>{os('sur-7', 0)}</Txt>
          <Txt x={W - 72} y={790} size={22} font="mono" weight={700} align="right" spacing="0.18em" color={C.mute} a={0.9}>{label('schematic')}</Txt>
        </div>
      ) : null}

      {/* sur-8: the year, alone */}
      {year ? (
        <div style={{position: 'absolute', inset: 0, background: '#03050a'}}>
          <Txt x={W / 2} y={250} w={W} size={400} font="display" align="center" color={C.yellow} outline={16} scale={0.7 + 0.3 * pop(t, c.b8)}>{os('sur-8', 0)}</Txt>
        </div>
      ) : null}
    </>
  );
};
