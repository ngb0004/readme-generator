import React from 'react';
import {useThree} from '@react-three/fiber';
import {Camera} from '../engine/cam';
import {Figure, handPos} from '../engine/Figure';
import {FrameSync} from '../engine/sync';
import {H} from '../engine/theme';
import {V3} from '../engine/time';
import {LOOKS, actorA, actorB, actorC, actorP, hookTip, ladderAt, responders} from './actors';
import {direct} from './direct';
import {Gas, Motes} from './Gas';
import {GhostElbow, HardHat, Ladder, Missing, Shaft, Wire} from './Props';
import {SceneLights} from './Rig';
import {T} from './timeline';
import {ReactorTop, Refinery} from './World';

const Exposure: React.FC<{value: number}> = ({value}) => {
  const gl = useThree((s) => s.gl);
  gl.toneMappingExposure = value;
  return null;
};

/** The whole 3D film as a function of time. */
export const Scene: React.FC<{time: number}> = ({time: t}) => {
  const d = direct(t);
  // Point sprites are sized in pixels; keep them the same world size at any focal length.
  const fovScale = (H / (2 * Math.tan((d.cam.fov * Math.PI) / 360))) * 0.0024;

  const a = actorA(t);
  const b = actorB(t);
  const c = actorC(t);
  const p = actorP(t);
  const hand = handPos(a, -1);
  const tail: V3 = [hand[0] - 0.75, hand[1] + 1.05, hand[2] - 0.3];
  const ladder = ladderAt(t);

  return (
    <>
      <FrameSync />
      <Exposure value={1.28} />
      <Camera state={d.cam} />
      <fogExp2 attach="fog" args={['#0a1220', 0.0075]} />
      <SceneLights s={d.light} />
      <Refinery />
      <ReactorTop wedge={d.wedge} tapeGlow={d.tapeGlow} />
      <Shaft level={d.shaftCone} />
      <Motes time={t} level={d.motes} fovScale={fovScale} />
      <Gas time={t} level={d.gas} fovScale={fovScale} plume={d.plume} />

      {d.showCrew ? (
        <>
          <Figure p={a} look={d.showFallen ? {...LOOKS.A, glow: 0.12} : LOOKS.A} />
          <Figure p={b} look={t > T.downToo + 0.4 ? {...LOOKS.B, glow: 0.12} : LOOKS.B} />
          <Figure p={c} look={LOOKS.C} />
          <Figure p={p} look={LOOKS.P} />
          {t >= T.responders - 0.2 ? responders(t).map((r, i) => <Figure key={i} p={r} look={LOOKS.R} />) : null}
          {t >= T.est ? <Ladder pos={ladder.pos} rot={ladder.rot} /> : null}
          {d.wire > 0 ? <Wire hand={hand} tail={tail} tip={hookTip(t)} via={[Math.min(-0.16, hand[0] + 0.2), Math.min(0.55, hand[1] - 0.25), 0.02]} /> : null}
        </>
      ) : null}

      <GhostElbow lift={d.elbow.lift} opacity={d.elbow.opacity} />
      <Missing barricade={d.missing.barricade} sign={d.missing.sign} time={t} />

      {d.hats > 0.5 ? (
        <>
          <HardHat color={LOOKS.A.hat} pos={[-0.86, -0.02, 0.46]} rot={[0, 0.9, 0]} />
          <HardHat color={LOOKS.B.hat} pos={[-0.42, -0.02, 0.66]} rot={[0, 0.35, 0]} />
        </>
      ) : null}
    </>
  );
};
