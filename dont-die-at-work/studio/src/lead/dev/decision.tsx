import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {FPS} from '../../engine/theme';
import {H, W} from '../kit';
import {Decision, options} from '../scenes/Decision';
import {DevFilm} from '../Stage';
import {DURATION} from '../timeline';

const Dev: React.FC = () => <DevFilm section="decision" Scene={Decision} options={options} />;
registerRoot(() => <Composition id="LeadDev" component={Dev} width={W} height={H} fps={FPS} durationInFrames={DURATION} />);
