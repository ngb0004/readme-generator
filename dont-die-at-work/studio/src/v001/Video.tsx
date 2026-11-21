import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import '@fontsource/anton/400.css';
import '@fontsource/barlow-condensed/500.css';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/700.css';
import {C, FPS, H, W} from '../engine/theme';
import {direct} from './direct';
import {Overlay} from './Overlay';
import {Scene} from './Scene';

const FACES = ["400 100px 'Anton'", "500 40px 'Barlow Condensed'", "600 40px 'Barlow Condensed'", "700 40px 'Barlow Condensed'", "500 20px 'JetBrains Mono'", "700 20px 'JetBrains Mono'"];

export const Video: React.FC<{overlays?: boolean}> = ({overlays = true}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const d = direct(t);
  const [fonts] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all(FACES.map((f) => document.fonts.load(f))).then(() => continueRender(fonts));
  }, [fonts]);
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <AbsoluteFill style={{filter: d.dim > 0.01 ? `blur(${d.dim * 9}px) brightness(${1 - d.dim * 0.62})` : undefined}}>
        <ThreeCanvas width={W} height={H} shadows gl={{antialias: true}} camera={{fov: 35}}>
          <Scene time={t} />
        </ThreeCanvas>
      </AbsoluteFill>
      {d.black > 0 ? <AbsoluteFill style={{background: '#000', opacity: d.black}} /> : null}
      {overlays ? <Overlay time={t} /> : null}
    </AbsoluteFill>
  );
};
