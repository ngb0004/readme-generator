import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {FPS} from '../../engine/theme';
import {H, W} from '../kit';
import {Surplus, options} from '../scenes/Surplus';
import {DevFilm} from '../Stage';
import {DURATION} from '../timeline';

const Dev: React.FC = () => <DevFilm section="surplus" Scene={Surplus} options={options} />;
registerRoot(() => <Composition id="LeadDev" component={Dev} width={W} height={H} fps={FPS} durationInFrames={DURATION} />);
