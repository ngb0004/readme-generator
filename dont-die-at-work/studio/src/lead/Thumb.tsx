import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C} from '../engine/theme';
import {Bunker} from './draw/Bunker';
import {useFonts} from './fonts';
import {Backdrop, Grade16, H, Txt, W} from './kit';
import {os} from './script';

/** Thumbnail: the title over the cut-open bunker. */
export const Thumb: React.FC = () => {
  useFonts();
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <Backdrop />
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
        <Bunker v={{cx: 1340, cy: 860, s: 74}} time={3} cut={1} crust={1} />
        <defs>
          <radialGradient id="thumbGlow">
            <stop offset="0%" stopColor={C.red} stopOpacity={0.42} />
            <stop offset="100%" stopColor={C.red} stopOpacity={0} />
          </radialGradient>
        </defs>
        <circle cx={1340} cy={790} r={420} fill="url(#thumbGlow)" />
      </svg>
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(4,6,10,0.92) 0%, rgba(4,6,10,0.75) 42%, rgba(4,6,10,0) 70%)'}} />
      <Txt x={84} y={150} w={1200} size={270} font="display" lh={0.96} outline={14}>{os('cold-title', 0)}</Txt>
      <Txt x={84} y={410} w={1300} size={270} font="display" lh={0.96} color={C.yellow} outline={14}>{os('cold-title', 1)}</Txt>
      <Txt x={90} y={720} w={1100} size={50} font="mono" weight={700} spacing="0.12em" nowrap>{os('cold-title', 2)}</Txt>
      <Grade16 frame={0} />
    </AbsoluteFill>
  );
};
