import React from 'react';
import {Composition} from 'remotion';
import {FPS, H, LF, W} from './engine/theme';
import {Thumb as LeadThumb} from './lead/Thumb';
import {DURATION as LEAD_DURATION} from './lead/timeline';
import {Film as Lead} from './lead/Video';
import {DURATION} from './v001/timeline';
import {Thumb} from './v001/Thumb';
import {Video} from './v001/Video';

// One composition per film. Its id goes in that film's script.json ("composition").
export const Root: React.FC = () => (
  <>
    <Composition id="V001" component={Video} width={W} height={H} fps={FPS} durationInFrames={DURATION} />
    <Composition id="V001Thumb" component={Thumb} width={W} height={H} fps={FPS} durationInFrames={1} />
    <Composition id="Lead" component={Lead} width={LF.W} height={LF.H} fps={FPS} durationInFrames={LEAD_DURATION} />
    <Composition id="LeadThumb" component={LeadThumb} width={LF.W} height={LF.H} fps={FPS} durationInFrames={1} />
  </>
);
