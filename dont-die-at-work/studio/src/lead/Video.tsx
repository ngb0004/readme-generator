import React from 'react';
import {useCurrentFrame} from 'remotion';
import {FPS} from '../engine/theme';
import {E, ramp} from '../engine/time';
import {EndCard} from './EndCard';
import {Cold, options as cold} from './scenes/Cold';
import {Decision, options as decision} from './scenes/Decision';
import {Ending, options as ending} from './scenes/Ending';
import {Evac, options as evac} from './scenes/Evac';
import {Failure, options as failure} from './scenes/Failure';
import {Farms, options as farms} from './scenes/Farms';
import {Health, options as health} from './scenes/Health';
import {Ours, options as ours} from './scenes/Ours';
import {Storage, options as storage} from './scenes/Storage';
import {Surplus, options as surplus} from './scenes/Surplus';
import {Thanks, options as thanks} from './scenes/Thanks';
import {Timeline, options as timeline} from './scenes/Timeline';
import {What, options as what} from './scenes/What';
import {Zone, options as zone} from './scenes/Zone';
import {SCRIPT} from './script';
import {Scene, Stage, StageOptions} from './Stage';
import {S} from './timeline';

// One scene per section of script.json, in the script's order.
export const SCENES: Record<string, {Scene: Scene; options: StageOptions}> = {
  cold: {Scene: Cold, options: cold},
  what: {Scene: What, options: what},
  surplus: {Scene: Surplus, options: surplus},
  storage: {Scene: Storage, options: storage},
  timeline: {Scene: Timeline, options: timeline},
  failure: {Scene: Failure, options: failure},
  decision: {Scene: Decision, options: decision},
  zone: {Scene: Zone, options: zone},
  ours: {Scene: Ours, options: ours},
  evac: {Scene: Evac, options: evac},
  lead: {Scene: Health, options: health},
  farms: {Scene: Farms, options: farms},
  ending: {Scene: Ending, options: ending},
  thanks: {Scene: Thanks, options: thanks},
};

export const Film: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  if (t >= S[SCRIPT.sections[SCRIPT.sections.length - 1]].end) return <EndCard t={t} />;
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
