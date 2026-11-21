import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, useCurrentFrame} from 'remotion';
import '@fontsource/anton/400.css';
import '@fontsource/barlow-condensed/500.css';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/700.css';
import {C, FPS} from '../engine/theme';
import {AirMix, Black, Breathing, Breaths, Dead, Hatches, PermitCard, SafeWay, Signoff, Stat80} from './Cards';
import {direct} from './direct';
import {Overlay, SRC} from './Overlay';
import {T} from './timeline';
import {World} from './World';

const FACES = ["400 100px 'Anton'", "500 40px 'Barlow Condensed'", "600 40px 'Barlow Condensed'", "700 40px 'Barlow Condensed'", "500 20px 'JetBrains Mono'", "700 20px 'JetBrains Mono'"];

export const Video: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const d = direct(t);
  const [fonts] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all(FACES.map((f) => document.fonts.load(f))).then(() => continueRender(fonts));
  }, [fonts]);
  const filters = [d.dim > 0.01 ? `blur(${d.dim * 9}px) brightness(${1 - d.dim * 0.62})` : '', d.grey > 0.01 ? `saturate(${1 - d.grey * 0.85}) contrast(${1 + d.grey * 0.08})` : ''].join(' ').trim();
  return (
    <AbsoluteFill style={{background: C.bg}}>
      {d.world ? (
        <AbsoluteFill style={{filter: filters || undefined}}>
          <World t={t} d={d} />
        </AbsoluteFill>
      ) : null}
      {t >= T.i3 && t < T.wire ? <SafeWay t={t} /> : null}
      {t >= T.h3 && t < T.breathing ? <Stat80 t={t} /> : null}
      {t >= T.breathing && t < T.m1 ? <Breathing t={t} /> : null}
      {t >= T.m1 && t < T.m2 ? <AirMix t={t} /> : null}
      {t >= T.m2 && t < T.m3 ? <Breaths t={t} /> : null}
      {t >= T.i6 && t < T.i7 ? <Black t={t} /> : null}
      {t >= T.i12 && t < T.l1 ? <Dead t={t} /> : null}
      {t >= T.l1 && t < T.l2 ? <PermitCard t={t} /> : null}
      {t >= T.l2 && t < T.l3 ? <Hatches t={t} /> : null}
      <Overlay t={t} d={d} />
      {t >= T.signoff ? <Signoff t={t} source={SRC} /> : null}
    </AbsoluteFill>
  );
};
