import React from 'react';
import {C, FONT} from '../../engine/theme';
import {E, clamp, ramp, rnd} from '../../engine/time';
import {Bunker, M, barrelXs} from '../draw/Bunker';
import {CAMS, MapBase, PLACE, Pin, camAt, projection, ring} from '../draw/MapView';
import {P, ViewKey, viewAt} from '../draw/view';
import {Chip, H, Leader, PaperCard, Txt, W, fadeIn, pop, span} from '../kit';
import {label, os} from '../script';
import {StageOptions} from '../Stage';
import {at, endOf, word} from '../timeline';

// 1. COLD OPEN. The mound, what is under it, what is about to happen, who was told what, and 1984.
const c = {
  b1: 0,
  barrels: word('cold-1', 'sixty-eight') - 0.15,
  b2: at('cold-2'),
  sensitive: word('cold-2', 'sensitive') - 0.1,
  b3: at('cold-3'),
  moved: word('cold-3', 'cannot') - 0.1,
  b4: at('cold-4'),
  blow: word('cold-4', 'blow') - 0.05,
  when: word('cold-4', 'Wednesday') - 0.1,
  b5: at('cold-5'),
  b6: at('cold-6'),
  miles: word('cold-6', 'twenty') - 0.2,
  b7: at('cold-7'),
  b8: at('cold-8'),
  year: word('cold-8', '1984') - 0.12,
  b9: at('cold-9'),
  title: at('cold-title', 0.25),
  end: endOf('cold-title') + 0.9,
};

const VIEWS: ViewKey[] = [
  {at: 0, cut: true, x: 0, y: 3.4, s: 44},
  {at: c.barrels, x: 0, y: 3.1, s: 52, ease: E.lin},
  {at: c.b2 + 0.2, x: 0, y: 2.0, s: 96, ease: E.inOutQuad},
  {at: c.b3, x: 0, y: 1.5, s: 150, ease: E.inOutQuad},
  {at: c.b4, x: 0.2, y: 1.45, s: 158, ease: E.lin},
  {at: c.b4, cut: true, x: -9, y: 5.6, s: 30},
  {at: c.b6, x: -8, y: 7.0, s: 27, ease: E.lin},
  {at: c.b9, cut: true, x: 0, y: 1.9, s: 120},
  {at: c.title, x: 0, y: 1.8, s: 132, ease: E.lin},
];

/** A swing set, for the line about washing down the play equipment. */
const SwingSet: React.FC<{t: number; x: number; y: number}> = ({t, x, y}) => {
  const u = t - c.b7;
  const sway = Math.sin(u * 1.7) * 0.06;
  const seat = (sx: number, k: number) => {
    const ang = sway * k;
    const len = 250;
    const ex = sx + Math.sin(ang) * len;
    const ey = y - 330 + Math.cos(ang) * len;
    return (
      <g key={sx}>
        <line x1={sx - 26} y1={y - 330} x2={ex - 26} y2={ey} stroke="#c9d2de" strokeWidth={4} />
        <line x1={sx + 26} y1={y - 330} x2={ex + 26} y2={ey} stroke="#c9d2de" strokeWidth={4} />
        <rect x={ex - 40} y={ey - 6} width={80} height={14} rx={6} fill={C.yellow} />
      </g>
    );
  };
  const wash = ramp(u, 2.2, 4.4, E.inOutQuad);
  return (
    <g>
      <line x1={x - 430} y1={y} x2={x + 430} y2={y} stroke="#3c5a3a" strokeWidth={4} />
      {[-1, 1].map((sd) => (
        <g key={sd} stroke="#8fa3c2" strokeWidth={14} strokeLinecap="round">
          <line x1={x + sd * 240} y1={y - 336} x2={x + sd * 330} y2={y} />
          <line x1={x + sd * 240} y1={y - 336} x2={x + sd * 170} y2={y} />
        </g>
      ))}
      <line x1={x - 250} y1={y - 336} x2={x + 250} y2={y - 336} stroke="#aab8d2" strokeWidth={16} strokeLinecap="round" />
      {seat(x - 95, 1)}
      {seat(x + 95, -0.7)}
      {/* dust that has settled on it: lead is drawn cyan */}
      {Array.from({length: 70}, (_, i) => {
        const land = clamp((u - 0.2 - rnd(i * 3.1) * 1.4) / 0.9);
        if (land <= 0) return null;
        const onBar = i % 3 !== 0;
        const dx = x - 250 + rnd(i * 5.7) * 500;
        const restY = onBar ? y - 348 : y - 6;
        const dy = restY - (1 - land) * (260 + rnd(i * 2.3) * 200);
        const gone = clamp(wash * 1.5 - rnd(i * 9.1) * 0.5);
        return <circle key={i} cx={dx + (onBar ? 0 : (rnd(i) - 0.5) * 300)} cy={dy + gone * (onBar ? 348 : 0)} r={6} fill={C.cyan} opacity={0.9 * (onBar ? 1 - gone * 0.1 : 1)} />;
      })}
      {/* the hose */}
      {wash > 0 && wash < 1
        ? Array.from({length: 26}, (_, i) => {
            const k = (rnd(i * 2.9) + u * 1.8) % 1;
            const sx = x - 620 + k * 560;
            const sy = y - 200 - Math.sin(k * Math.PI) * 190 + rnd(i * 7.7) * 40;
            return <circle key={i} cx={sx} cy={sy} r={5} fill="#bfe3ff" opacity={0.85 * Math.sin(k * Math.PI)} />;
          })
        : null}
    </g>
  );
};

export const options: StageOptions = {
  hideCaption: (id) => id === 'cold-title',
  bare: (t) => t >= c.title - 0.1,
};

export const Cold: React.FC<{t: number}> = ({t}) => {
  const v = viewAt(t, VIEWS);
  const pt = (x: number, y: number) => ({x: P(v, x, y)[0], y: P(v, x, y)[1]});
  const inBunker = t < c.b6 || (t >= c.b9 && t < c.title);
  const onMap = t >= c.b6 && t < c.b7;
  const cut = t < c.b4 ? ramp(t, c.barrels - 0.5, c.barrels + 0.7, E.inOutQuad) : t < c.b9 ? 1 : 1;
  const blast = t >= c.blow && t < c.b6 ? clamp((t - c.blow) / (c.b6 - c.blow)) * 0.9 : 0;
  const xs = barrelXs();

  // the map: Iowa, then in to the plant and the towns round it
  const cam = camAt(t, [
    {at: c.b6, cut: true, ...CAMS.iowa},
    {at: c.b6 + 1.6, ...CAMS.region, k: 620, lon: -91.25, lat: 40.82, ease: E.inOutQuad},
    {at: c.b7, lon: -91.25, lat: 40.8, k: 680, ease: E.lin},
  ]);
  const proj = projection(cam);
  const plant = proj(PLACE.plant)!;
  const mid = proj(PLACE.middletown)!;
  const ringA = ramp(t, c.miles, c.miles + 0.9, E.out);

  return (
    <>
      {inBunker ? (
        <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
          <Bunker v={v} time={t} cut={cut} blast={blast} wind={0.3} />
          {/* something is wrong in there */}
          {t >= c.sensitive && t < c.b4
            ? xs.map((x, i) => {
                const [bx, by] = P(v, x, 0.1 + M.barrelH / 2);
                const k = 0.5 + 0.5 * Math.sin(t * 3.2 + i * 0.9);
                return <circle key={i} cx={bx} cy={by} r={M.barrelW * v.s * 0.9} fill={C.red} opacity={0.1 + 0.12 * k} />;
              })
            : null}
        </svg>
      ) : null}

      {/* cold-1: where, and how many */}
      {t < c.b2 ? (
        <>
          <Txt x={72} y={736} size={86} font="display" a={span(t, 0.5, c.b2, 0.5, 0.25)} outline={8}>{os('cold-1', 0)}</Txt>
          <Leader from={{x: 1330, y: 388}} to={pt(1.9, 1.3)} a={span(t, c.barrels + 0.5, c.b2, 0.35, 0.15)} />
          <Chip x={1338} y={332} a={span(t, c.barrels + 0.4, c.b2, 0.35, 0.15)} size={62}>{os('cold-1', 1)}</Chip>
          <Txt x={W - 72} y={790} size={22} font="mono" weight={700} align="right" spacing="0.18em" color={C.mute} a={span(t, c.barrels + 0.6, c.b2, 0.4, 0.2)}>{label('schematic')}</Txt>
        </>
      ) : null}

      {/* cold-2: what it is, how much */}
      {t >= c.b2 && t < c.b3 ? (
        <>
          <Txt x={W / 2} y={128} size={178} font="display" align="center" color={C.yellow} outline={12} scale={0.8 + 0.2 * pop(t, c.b2 + 0.5)} a={span(t, c.b2 + 0.5, c.b3, 0.2, 0.2)}>{os('cold-2', 0)}</Txt>
          <Chip x={W / 2} y={330} align="center" size={56} color={C.white} a={span(t, c.b2 + 1.5, c.b3, 0.35, 0.2)}>{os('cold-2', 1)}</Chip>
        </>
      ) : null}

      {/* cold-3: all of it, and it cannot be moved */}
      {t >= c.b3 && t < c.b4 ? (
        <>
          <Chip x={W / 2} y={150} align="center" size={60} a={span(t, c.b3 + 0.3, c.b4, 0.35, 0.2)}>{os('cold-3', 0)}</Chip>
          {t >= c.moved ? (
            <div style={{position: 'absolute', left: 0, top: 300, width: W, display: 'flex', justifyContent: 'center', transform: `scale(${1 + 0.8 * Math.pow(1 - clamp((t - c.moved) / 0.22), 3)}) rotate(-4deg)`, opacity: span(t, c.moved, c.b4, 0.05, 0.2)}}>
              <div style={{border: `12px solid ${C.red}`, color: C.red, fontFamily: FONT.display, fontSize: 150, lineHeight: 1, padding: '14px 46px 6px', background: 'rgba(4,6,10,0.72)'}}>{os('cold-3', 1)}</div>
            </div>
          ) : null}
        </>
      ) : null}

      {/* cold-4 and cold-5: when, and what comes out */}
      {t >= c.b4 && t < c.b6 ? (
        <>
          <Txt x={72} y={150} size={104} font="display" a={span(t, c.when, c.b5, 0.25, 0.25)} outline={9}>{os('cold-4', 0)}</Txt>
          <Txt x={72} y={262} size={150} font="display" color={C.yellow} a={span(t, c.when + 0.7, c.b5, 0.25, 0.25)} outline={11}>{os('cold-4', 1)}</Txt>
          <Txt x={72} y={150} w={900} size={74} weight={700} color={C.cyan} a={span(t, c.b5 + 0.2, c.b6, 0.35, 0.2)} outline={7}>{os('cold-5', 0)}</Txt>
          <Txt x={76} y={340} size={26} font="mono" weight={700} spacing="0.18em" color={C.white} a={span(t, c.b5 + 0.8, c.b6, 0.35, 0.2)}>{os('cold-5', 1)}</Txt>
        </>
      ) : null}

      {/* cold-6: who was told what */}
      {onMap ? (
        <>
          <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
            <MapBase proj={proj} cam={cam} lit={{'19': '#132238'}} />
            <path d={ring(proj, PLACE.plant, 20)} fill="rgba(69,227,255,0.10)" stroke={C.cyan} strokeWidth={5} strokeDasharray="18 14" strokeDashoffset={-t * 30} opacity={ringA} />
            <Pin proj={proj} at={PLACE.burlington} a={fadeIn(t, c.b6 + 1.8)} r={7} color="#9fb3d1" />
            <Pin proj={proj} at={PLACE.plant} time={t} ping color={C.red} r={11} />
          </svg>
          <Txt x={proj(PLACE.burlington)![0] + 16} y={proj(PLACE.burlington)![1] - 16} size={26} font="mono" weight={700} spacing="0.12em" color="#9fb3d1" a={fadeIn(t, c.b6 + 1.9)}>{label('burlington')}</Txt>
          <Txt x={proj(PLACE.plant)![0] - 16} y={proj(PLACE.plant)![1] + 22} size={26} font="mono" weight={700} spacing="0.12em" align="right" color={C.white} a={fadeIn(t, c.b6 + 0.6)}>{label('middletown')}</Txt>
          <Leader from={{x: mid[0] - 330, y: mid[1] - 170}} to={{x: mid[0] - 10, y: mid[1] - 10}} a={span(t, c.b6 + 1.4, c.b7, 0.35, 0.15)} color={C.red} />
          <Chip x={mid[0] - 660} y={mid[1] - 230} size={58} color={C.red} a={span(t, c.b6 + 1.3, c.b7, 0.35, 0.15)}>{os('cold-6', 0)}</Chip>
          <Chip x={plant[0] + 150} y={plant[1] + 170} size={58} color={C.cyan} a={span(t, c.miles + 0.5, c.b7, 0.35, 0.15)}>{os('cold-6', 1)}</Chip>
        </>
      ) : null}

      {/* cold-7: the advice to parents */}
      {t >= c.b7 && t < c.b8 ? (
        <>
          <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, opacity: fadeIn(t, c.b7, 0.3)}}>
            <SwingSet t={t} x={W / 2} y={720} />
          </svg>
          <Chip x={W / 2} y={150} align="center" size={56} a={span(t, c.b7 + 0.6, c.b8, 0.4, 0.2)}>{os('cold-7', 0)}</Chip>
        </>
      ) : null}

      {/* cold-8: it was written down */}
      {t >= c.b8 && t < c.b9 ? (
        <>
          <div style={{position: 'absolute', inset: 0, background: '#03050a', opacity: fadeIn(t, c.b8, 0.25)}} />
          <Txt x={W / 2} y={330} w={W} size={170} font="display" align="center" outline={10} a={span(t, c.b8 + 0.1, c.year - 0.1, 0.25, 0.25)}>{os('cold-8', 1)}</Txt>
          <PaperCard t={t} at={c.year + 0.5} head={[os('sur-1', 0), os('sur-1', 1), os('sur-1', 2)]} quote="" x={760} y={210} w={1080} tilt={-2} />
          <Txt x={96} y={250} size={290} font="display" color={C.yellow} outline={14} scale={0.7 + 0.3 * pop(t, c.year)} a={t >= c.year ? 1 : 0}>{os('cold-8', 0)}</Txt>
        </>
      ) : null}

      {/* title */}
      {t >= c.title ? (
        <div style={{position: 'absolute', inset: 0, background: `rgba(3,5,9,${0.9 * fadeIn(t, c.title, 0.35)})`}}>
          <Txt x={W / 2} y={250} w={W} size={250} font="display" align="center" lh={0.98} scale={0.86 + 0.14 * pop(t, c.title + 0.1)} a={t >= c.title + 0.1 ? 1 : 0}>{os('cold-title', 0)}</Txt>
          <Txt x={W / 2} y={490} w={W} size={250} font="display" align="center" lh={0.98} color={C.yellow} scale={0.86 + 0.14 * pop(t, word('cold-title', 'neglect') - 0.05)} a={t >= word('cold-title', 'neglect') - 0.05 ? 1 : 0}>{os('cold-title', 1)}</Txt>
          <div style={{position: 'absolute', left: W / 2 - 420, top: 760, width: 840, height: 6, background: C.yellow, transform: `scaleX(${ramp(t, word('cold-title', 'neglect') + 0.2, word('cold-title', 'neglect') + 0.7, E.out)})`}} />
          <Txt x={W / 2} y={790} w={W} size={40} font="mono" weight={700} align="center" spacing="0.22em" a={fadeIn(t, word('cold-title', 'neglect') + 0.4, 0.5)}>{os('cold-title', 2)}</Txt>
        </div>
      ) : null}
    </>
  );
};
