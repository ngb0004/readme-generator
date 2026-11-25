import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT, FPS} from '../engine/theme';
import {ramp} from '../engine/time';
import {useFonts} from './fonts';
import {Backdrop, Grade16, Txt, W, fadeIn} from './kit';
import {SCRIPT, label, publishers} from './script';
import {END, S} from './timeline';

/** After the last word: who the facts came from. */
export const EndCard: React.FC<{t: number}> = ({t}) => {
  useFonts();
  const t0 = S[SCRIPT.sections[SCRIPT.sections.length - 1]].end; // the sources card follows the last section
  const names = publishers();
  const cols = 3;
  const per = Math.ceil(names.length / cols);
  const out = 1 - ramp(t, END - 0.5, END - 0.05);
  return (
    <AbsoluteFill style={{background: C.bg, opacity: out}}>
      <Backdrop tone="deep" />
      <Txt x={W / 2} y={120} w={W} size={30} font="mono" weight={700} align="center" spacing="0.4em" color={C.yellow} a={fadeIn(t, t0 + 0.2, 0.5)}>{label('sources_title')}</Txt>
      <div style={{position: 'absolute', left: 150, top: 220, width: W - 300, display: 'flex', justifyContent: 'space-between'}}>
        {Array.from({length: cols}, (_, c) => (
          <div key={c} style={{width: (W - 300) / cols - 30}}>
            {names.slice(c * per, (c + 1) * per).map((n, i) => (
              <div key={n} style={{fontFamily: FONT.label, fontWeight: 700, fontSize: 46, letterSpacing: '0.04em', color: C.white, marginBottom: 20, opacity: fadeIn(t, t0 + 0.5 + (c * per + i) * 0.07, 0.4)}}>{n}</div>
            ))}
          </div>
        ))}
      </div>
      <Txt x={W / 2} y={790} w={1500} size={30} weight={500} align="center" color={C.mute} a={fadeIn(t, t0 + 1.8, 0.6)}>{label('sources_note')}</Txt>
      <Txt x={W / 2} y={900} w={W} size={24} font="mono" weight={700} align="center" spacing="0.2em" color={C.white} a={fadeIn(t, t0 + 2.4, 0.6) * 0.8}>{label('edition')}</Txt>
      <Grade16 frame={Math.round(t * FPS)} />
    </AbsoluteFill>
  );
};
