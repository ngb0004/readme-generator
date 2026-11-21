import React from 'react';

export type LightState = {
  key: number; // sodium work light on the platform
  moon: number; // cool sky + rim
  shaft: number; // light falling through the manway
  interior: number; // neutral light inside the head
  n2: number; // cyan cast from the gas visualisation
  diagram: number; // flat front fill for the cutaway, so the inside reads
  warm: number; // close warm light for the tribute
  alarm: number; // red wash once the alarm is raised
};

export const SceneLights: React.FC<{s: LightState}> = ({s}) => (
  <>
    <hemisphereLight args={['#6f92dc', '#161b27', 1.7 * s.moon]} />
    <directionalLight position={[-7, 5, 11]} intensity={0.75 * s.moon} color="#7d97d6" />
    <spotLight position={[-5.2, 6.6, 4.8]} angle={0.52} penumbra={0.8} intensity={1500 * s.key} color="#ffbd76" decay={2} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0005} shadow-normalBias={0.025} />
    <directionalLight position={[7, 8, -9]} intensity={2.6 * s.moon} color="#88aaff" />
    <pointLight position={[3.6, 2.6, -3.4]} intensity={95 * s.key} color="#ffcf9a" decay={2} />
    <spotLight position={[-0.03, 2.3, -0.03]} angle={0.21} penumbra={0.6} intensity={26 * s.shaft} color="#ffe2b8" decay={2} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0006} />
    <pointLight position={[0.1, -0.85, 0.75]} intensity={3.2 * s.interior + 7.5 * s.n2} color={s.n2 > 0.05 ? '#74e4ff' : '#c2d0ea'} decay={2} />
    {s.diagram > 0.01 ? <directionalLight position={[1.5, 0.6, 9]} intensity={1.5 * s.diagram} color="#cfdcf5" /> : null}
    {s.warm > 0.01 ? <pointLight position={[-0.1, 1.3, 1.9]} intensity={30 * s.warm} color="#ffcf96" decay={2} /> : null}
    {s.alarm > 0.01 ? <pointLight position={[-2.4, 2.6, -1.6]} intensity={150 * s.alarm} color="#ff2a1c" decay={2} /> : null}
  </>
);
