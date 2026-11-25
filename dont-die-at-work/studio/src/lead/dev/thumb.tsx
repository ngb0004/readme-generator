import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {FPS} from '../../engine/theme';
import {EndCard} from '../EndCard';
import {H, W} from '../kit';
import {Thumb} from '../Thumb';
import {DURATION} from '../timeline';
import {useCurrentFrame} from 'remotion';

// The thumbnail and the sources card, without the scenes: `LeadThumb` and `LeadEnd`.
const End: React.FC = () => <EndCard t={useCurrentFrame() / FPS} />;
registerRoot(() => (
  <>
    <Composition id="LeadThumb" component={Thumb} width={W} height={H} fps={FPS} durationInFrames={1} />
    <Composition id="LeadEnd" component={End} width={W} height={H} fps={FPS} durationInFrames={DURATION} />
  </>
));
