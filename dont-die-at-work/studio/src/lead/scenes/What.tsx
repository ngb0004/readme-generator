import React from 'react';
import {C} from '../../engine/theme';
import {E, clamp, ramp, rnd} from '../../engine/time';
import {Bunker} from '../draw/Bunker';
import {ViewKey, viewAt} from '../draw/view';
import {Chip, H, Txt, W, fadeIn, pop, span} from '../kit';
import {label, os} from '../script';
import {StageOptions} from '../Stage';
import {S, at, word} from '../timeline';
import {Drum, PLASTIC} from './parts/TimelinePictures';

// 2. WHAT IT IS. Told in type, three hazard signs and the barrels themselves. There is no
// drawing of a munition in this film: the narration says what a detonator is for, and that is
// as far as it goes.
const c = {
  start: S.what.start,
  main: word('what-1', 'main') - 0.2,
  trigger: word('what-1', 'small') - 0.2,
  deton: word('what-1', 'detonator') - 0.15,
  b2: at('what-2'),
  azide: word('what-2', 'lead') - 0.15,
  b3: at('what-3'),
  heat: Math.min(word('what-3', 'heat') - 0.15, at('what-3') + 0.4), // the first sign lands with the line, not a second into it
  knock: word('what-3', 'knock') - 0.15,
  friction: word('what-3', 'friction') - 0.15,
  point: word('what-3', 'That') - 0.1,
  b4: at('what-4'),
  cup: word('what-4', 'cup') - 0.3,
  b5: at('what-5'),
  barrels: word('what-5', 'sixty-eight') - 0.2,
  b6: at('what-6'),
  stopped: word('what-6', 'stopped') - 0.2,
  b7: at('what-7'),
  end: S.what.end,
};

const VIEWS: ViewKey[] = [
  {at: c.b7, cut: true, x: 0, y: 2.6, s: 62},
  {at: c.end, x: 0, y: 2.0, s: 84, ease: E.lin},
];

/** A hazard sign: a yellow diamond with a plain picture in it. */
const Sign: React.FC<{x: number; y: number; t: number; at: number; kind: 'heat' | 'shock' | 'friction'}> = ({x, y, t, at: when, kind}) => {
  if (t < when) return null;
  const k = Math.min(1.12, pop(t, when, 3.2, 0.55));
  const u = t - when;
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      <rect x={-118} y={-118} width={236} height={236} rx={16} transform="rotate(45)" fill={C.yellow} stroke="#04060a" strokeWidth={6} />
      <rect x={-100} y={-100} width={200} height={200} rx={10} transform="rotate(45)" fill="none" stroke="#04060a" strokeWidth={5} />
      {kind === 'heat' ? (
        <g transform={`scale(${1 + 0.04 * Math.sin(u * 9)})`}>
          <path d="M 0 -84 C 44 -40 64 -6 50 34 C 40 66 16 80 0 80 C -16 80 -40 66 -50 34 C -58 8 -40 -14 -26 -30 C -24 -6 -10 4 -2 4 C -14 -30 -8 -60 0 -84 Z" fill="#04060a" />
          <path d="M 0 -6 C 16 12 26 26 20 44 C 16 58 6 64 0 64 C -6 64 -16 58 -20 44 C -24 30 -12 16 0 -6 Z" fill={C.yellow} />
        </g>
      ) : kind === 'shock' ? (
        <g>
          <polygon points={Array.from({length: 16}, (_, i) => {
            const r = i % 2 ? 34 : 78 + 6 * Math.sin(u * 11 + i);
            const a = (Math.PI * i) / 8;
            return `${Math.cos(a) * r},${Math.sin(a) * r + 8}`;
          }).join(' ')} fill="#04060a" />
          <circle cx={0} cy={8} r={15} fill={C.yellow} />
        </g>
      ) : (
        <g>
          <rect x={-78 + 12 * Math.sin(u * 8)} y={-34} width={110} height={30} rx={6} fill="#04060a" />
          <rect x={-32 - 12 * Math.sin(u * 8)} y={6} width={110} height={30} rx={6} fill="#04060a" />
          {[-52, -20, 12, 44].map((dx, i) => (
            <line key={dx} x1={dx} y1={-2} x2={dx + 14} y2={4} stroke="#04060a" strokeWidth={5} strokeLinecap="round" opacity={0.5 + 0.5 * Math.sin(u * 14 + i)} />
          ))}
          <path d="M -70 60 h 44 M 30 60 h 44" stroke="#04060a" strokeWidth={6} strokeLinecap="round" />
        </g>
      )}
    </g>
  );
};

export const options: StageOptions = {};

export const What: React.FC<{t: number}> = ({t}) => {
  const one = span(t, c.start + 0.2, c.b3, 0.3, 0.25);
  const signs = span(t, c.b3, c.b4 + 0.05, 0.2, 0.25);
  const cupA = span(t, c.b4 + 0.1, c.barrels - 0.05, 0.4, 0.12);
  const grid = t >= c.barrels && t < c.b7;
  const dull = ramp(t, c.stopped, c.stopped + 0.9);
  const cols = 17;
  const rows = 4;

  return (
    <>
      {/* what-1 and what-2: a small trigger for a big charge, and what the trigger is made of */}
      {one > 0.01 ? (
        <div style={{position: 'absolute', inset: 0, opacity: one}}>
          <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
            {/* a spark, then the thing it sets off: sizes, nothing more */}
            {t >= c.trigger ? (
              <g transform={`translate(430 470) scale(${Math.min(1.15, pop(t, c.trigger, 3.4, 0.5))})`}>
                {Array.from({length: 10}, (_, i) => {
                  const a = (Math.PI * 2 * i) / 10 + 0.2;
                  const r = 46 + 16 * Math.sin(t * 13 + i * 1.7);
                  return <line key={i} x1={Math.cos(a) * 20} y1={Math.sin(a) * 20} x2={Math.cos(a) * r} y2={Math.sin(a) * r} stroke={C.yellow} strokeWidth={7} strokeLinecap="round" />;
                })}
                <circle r={15} fill={C.yellow} />
              </g>
            ) : null}
            <line x1={560} y1={470} x2={560 + 300 * ramp(t, c.trigger + 0.5, c.trigger + 1.2, E.out)} y2={470} stroke={C.white} strokeWidth={7} strokeLinecap="round" strokeDasharray="4 20" opacity={fadeIn(t, c.trigger + 0.5, 0.2)} />
          </svg>
          <Txt x={430} y={560} w={600} size={66} font="display" align="center" color={C.yellow} outline={6} a={fadeIn(t, c.deton, 0.2)} scale={0.85 + 0.15 * pop(t, c.deton)}>{os('what-1', 1)}</Txt>
          <Txt x={1320} y={378} w={1000} size={172} font="display" align="center" outline={12} nowrap a={fadeIn(t, c.main, 0.2)} scale={0.9 + 0.1 * pop(t, c.main)}>{os('what-1', 0)}</Txt>
          <Txt x={430} y={236} w={900} size={150} font="display" align="center" color={C.yellow} outline={11} a={fadeIn(t, c.azide, 0.15)} scale={0.8 + 0.2 * pop(t, c.azide)}>{os('what-2', 0)}</Txt>
          <Chip x={W / 2} y={700} align="center" size={56} color={C.white} a={fadeIn(t, c.azide + 0.9, 0.4)}>{os('what-2', 1)}</Chip>
        </div>
      ) : null}

      {/* what-3: what sets it off */}
      {signs > 0.01 ? (
        <div style={{position: 'absolute', inset: 0, opacity: signs}}>
          <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
            <Sign x={420} y={400} t={t} at={c.heat} kind="heat" />
            <Sign x={960} y={400} t={t} at={c.knock} kind="shock" />
            <Sign x={1500} y={400} t={t} at={c.friction} kind="friction" />
          </svg>
          {[c.heat, c.knock, c.friction].map((when, i) => (
            <Txt key={i} x={420 + i * 540} y={636} w={520} size={96} font="display" align="center" outline={8} a={fadeIn(t, when + 0.1, 0.2)}>{os('what-3', i)}</Txt>
          ))}
        </div>
      ) : null}

      {/* what-4: how little one weapon needs */}
      {cupA > 0.01 ? (
        <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, opacity: cupA}}>
          {[0, 1, 2].map((i) => {
            const k = ((t - c.b4) * 0.5 + i / 3) % 1;
            return <circle key={i} cx={W / 2} cy={470} r={130 + k * 330} fill="none" stroke={C.yellow} strokeWidth={3} opacity={(1 - k) * 0.35} />;
          })}
          <g transform={`translate(${W / 2} 470) scale(${2.1 + 1.1 * ramp(t, c.b4, c.b5 + 0.8, E.lin)})`}>
            <path d="M -30 -34 L -30 22 Q -30 36 -16 36 L 16 36 Q 30 36 30 22 L 30 -34" fill="#0a1019" stroke="#c9d2de" strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" />
            <path d="M -27 -2 L -27 21 Q -27 33 -15 33 L 15 33 Q 27 33 27 21 L 27 -2 Z" fill="#e3d6b6" />
            {Array.from({length: 9}, (_, i) => (
              <circle key={i} cx={-20 + rnd(i * 2.3) * 40} cy={4 + rnd(i * 5.1) * 24} r={2.2} fill="#b9a983" />
            ))}
          </g>
        </svg>
      ) : null}

      {/* what-5 and what-6: now sixty-eight barrels of it */}
      {grid ? (
        <>
          <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, opacity: 1 - ramp(t, c.b7 - 0.25, c.b7)}}>
            {Array.from({length: rows}, (_, r) => (
              <g key={r}>
                <line x1={70} y1={356 + r * 150} x2={W - 70} y2={356 + r * 150} stroke="#22324c" strokeWidth={3} />
                {Array.from({length: cols}, (_, i) => {
                  const n = r * cols + i;
                  const when = c.barrels + n * 0.012;
                  return t >= when ? <Drum key={i} x={128 + i * 104} base={356 + r * 150} h={112 * Math.min(1.08, pop(t, when, 4, 0.6))} look={PLASTIC} dull={dull} /> : null;
                })}
              </g>
            ))}
          </svg>
          <Chip x={72} y={128} size={84} a={span(t, c.barrels + 0.25, c.b6 + 0.1, 0.3, 0.2)}>{os('what-5', 0)}</Chip>
          <Chip x={72} y={128} size={60} color={C.red} a={span(t, c.stopped, c.b7 - 0.1, 0.4, 0.2)}>{os('what-6', 0)}</Chip>
        </>
      ) : null}

      {/* what-7: so why is it still here */}
      {t >= c.b7 ? (
        <>
          <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, opacity: fadeIn(t, c.b7, 0.3)}}>
            <Bunker v={viewAt(t, VIEWS)} time={t} cut={1} wind={0.3} />
          </svg>
          <Txt x={W - 72} y={790} size={22} font="mono" weight={700} align="right" spacing="0.18em" color={C.mute} a={fadeIn(t, c.b7 + 0.4, 0.4)}>{label('schematic')}</Txt>
        </>
      ) : null}
    </>
  );
};
