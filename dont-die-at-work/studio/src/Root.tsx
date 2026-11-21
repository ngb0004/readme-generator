import React from 'react';
import {Composition} from 'remotion';
import {FPS, H, W} from './engine/theme';
import {DURATION} from './v001/timeline';
import {Thumb} from './v001/Thumb';
import {Video} from './v001/Video';

// One composition per video. Its id goes in that video's script.json ("composition").
export const Root: React.FC = () => (
  <>
    <Composition id="V001" component={Video} width={W} height={H} fps={FPS} durationInFrames={DURATION} />
    <Composition id="V001Thumb" component={Thumb} width={W} height={H} fps={FPS} durationInFrames={1} />
  </>
);
