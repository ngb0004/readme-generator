import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, FONT, FPS} from '../engine/theme';
import {E, ramp} from '../engine/time';
import {Bunker} from './draw/Bunker';
import {Backdrop, Grade16, H, Txt, W, fadeIn} from './kit';
import {Cold, options as cold} from './scenes/Cold';
import {Decision, options as decision} from './scenes/Decision';
import {Ending, options as ending} from './scenes/Ending';
import {Evac, options as evac} from './scenes/Evac';
import {Failure, options as failure} from './scenes/Failure';
import {Farms, options as farms} from './scenes/Farms';
import {Health, options as health} from './scenes/Health';
import {Storage, options as storage} from './scenes/Storage';
import {Surplus, options as surplus} from './scenes/Surplus';
import {Timeline, options as timeline} from './scenes/Timeline';
import {What, options as what} from './scenes/What';
import {Zone, options as zone} from './scenes/Zone';
import {SCRIPT, label, os, publishers} from './script';
import {Scene, Stage, StageOptions} from './Stage';
import {END, S} from './timeline';

// One scene per section of script.json, in the script's order.
const SCENES: Record<string, {Scene: Scene; options: StageOptions}> = {
  cold: {Scene: Cold, options: cold},
  what: {Scene: What, options: what},
  surplus: {Scene: Surplus, options: surplus},
  storage: {Scene: Storage, options: storage},
  timeline: {Scene: Timeline, options: timeline},
  failure: {Scene: Failure, options: failure},
  decision: {Scene: Decision, options: decision},
  zone: {Scene: Zone, options: zone},
  evac: {Scene: Evac, options: evac},
  lead: {Scene: Health, options: health},
  farms: {Scene: Farms, options: farms},
  ending: {Scene: Ending, options: ending},
};

/** After the last word: who the facts came from. */
const EndCard: React.FC<{t: number}> = ({t}) => {
  const t0 = S.ending.end;
  const names = publishers();
  const cols = 3;
  const per = Math.ceil(names.length / cols);
  const out = 1 - ramp(t, END - 0.5, END - 0.05);
  return (
    <AbsoluteFill style={{background: C.bg, opacity: out}}>
      <Backdrop tone="deep" />
      <Txt x={W / 2} y={120} w={W} size={30} font="mono" weight={700} align="center" spacing="0.4em" color={C.yellow} a={fadeIn(t, t0 + 0.2, 0.5)}>{label('sources_title')}</Txt>
      <div style={{position: 'absolute', left: 190, top: 220, width: W - 380, display: 'flex', justifyContent: 'space-between'}}>
        {Array.from({length: cols}, (_, c) => (
          <div key={c} style={{width: (W - 380) / cols - 30}}>
            {names.slice(c * per, (c + 1) * per).map((n, i) => (
              <div key={n} style={{fontFamily: FONT.label, fontWeight: 700, fontSize: 46, letterSpacing: '0.04em', color: C.white, marginBottom: 20, opacity: fadeIn(t, t0 + 0.5 + (c * per + i) * 0.07, 0.4)}}>{n}</div>
            ))}
          </div>
        ))}
      </div>
      <Txt x={W / 2} y={760} w={1400} size={30} weight={500} align="center" color={C.mute} a={fadeIn(t, t0 + 1.8, 0.6)}>{label('sources_note')}</Txt>
      <Txt x={W / 2} y={880} w={W} size={24} font="mono" weight={700} align="center" spacing="0.2em" color={C.white} a={fadeIn(t, t0 + 2.4, 0.6) * 0.8}>{label('edition')}</Txt>
      <Grade16 frame={Math.round(t * FPS)} />
    </AbsoluteFill>
  );
};

export const Film: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  if (t >= S.ending.end) return <EndCard t={t} />;
  const section = SCRIPT.sections.find((id) => t >= S[id].start && t < S[id].end) ?? 'ending';
  const {Scene, options} = SCENES[section];
  const r = S[section];
  // a short dip to the ground between sections; the film opens on the picture, not on a fade
  const a = Math.min(section === 'cold' ? 1 : ramp(t, r.start, r.start + 0.3, E.out), 1 - ramp(t, r.end - 0.22, r.end, E.in));
  return (
    <Stage t={t} section={section} options={options}>
      <div style={{position: 'absolute', inset: 0, opacity: a}}>
        <Scene t={t} />
      </div>
    </Stage>
  );
};

/** Thumbnail: the title over the cut-open bunker. */
export const Thumb: React.FC = () => (
  <AbsoluteFill style={{background: C.bg}}>
    <Backdrop />
    <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
      <Bunker v={{cx: 1340, cy: 860, s: 74}} time={3} cut={1} crust={1} />
      <circle cx={1340} cy={800} r={330} fill={C.red} opacity={0.14} />
    </svg>
    <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(4,6,10,0.92) 0%, rgba(4,6,10,0.75) 42%, rgba(4,6,10,0) 70%)'}} />
    <Txt x={84} y={150} w={1200} size={270} font="display" lh={0.96} outline={14}>{os('cold-title', 0)}</Txt>
    <Txt x={84} y={410} w={1300} size={270} font="display" lh={0.96} color={C.yellow} outline={14}>{os('cold-title', 1)}</Txt>
    <Txt x={90} y={720} w={1100} size={54} font="mono" weight={700} spacing="0.14em">{os('cold-title', 2)}</Txt>
    <Grade16 frame={0} />
  </AbsoluteFill>
);
