import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {FPS} from '../../engine/theme';
import {H, W} from '../kit';
import {Cold, options} from '../scenes/Cold';
import {DevFilm} from '../Stage';
import {DURATION} from '../timeline';

const Dev: React.FC = () => <DevFilm section="cold" Scene={Cold} options={options} />;
registerRoot(() => <Composition id="LeadDev" component={Dev} width={W} height={H} fps={FPS} durationInFrames={DURATION} />);
