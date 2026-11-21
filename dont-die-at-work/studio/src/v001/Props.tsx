import * as THREE from 'three';
import React, {useMemo} from 'react';
import {V3} from '../engine/time';
import {D, FLANGE_R, TRAY_Y} from './dims';

const once = <T,>(make: () => T) => {
  let v: T | undefined;
  return () => (v ??= make());
};
const M = once(() => ({
  alu: new THREE.MeshStandardMaterial({color: '#c3cad6', roughness: 0.35, metalness: 0.85}),
  wire: new THREE.MeshStandardMaterial({color: '#e8edf5', roughness: 0.3, metalness: 0.9, emissive: '#aab4c6', emissiveIntensity: 0.55}),
  ghost: new THREE.MeshBasicMaterial({color: '#9fdcff', transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide}),
  ghostWire: new THREE.MeshBasicMaterial({color: '#c9ecff', transparent: true, opacity: 0.4, depthWrite: false, wireframe: true, blending: THREE.AdditiveBlending}),
  missing: new THREE.MeshBasicMaterial({color: '#ff3b2f', transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide}),
  shaft: new THREE.MeshBasicMaterial({color: '#ffe3b5', transparent: true, opacity: 0.07, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide}),
}));

export const LADDER_LEN = 3.1;
/** Where the ladder ends up: down through the manway, feet on the tray. */
export const LADDER_IN: {pos: V3; rot: V3} = {pos: [-0.2, TRAY_Y + 0.05 + LADDER_LEN / 2, -0.04], rot: [0, 0, -0.05]};

export const Ladder: React.FC<{pos: V3; rot: V3}> = ({pos, rot}) => {
  const m = M();
  const rungs: number[] = [];
  for (let y = -LADDER_LEN / 2 + 0.2; y < LADDER_LEN / 2; y += 0.3) rungs.push(y);
  return (
    <group position={pos} rotation={rot}>
      {[-0.2, 0.2].map((z) => (
        <mesh key={z} material={m.alu} position={[0, 0, z]} castShadow>
          <boxGeometry args={[0.07, LADDER_LEN, 0.028]} />
        </mesh>
      ))}
      {rungs.map((y) => (
        <mesh key={y} material={m.alu} position={[0, y, 0]} rotation-x={Math.PI / 2} castShadow>
          <cylinderGeometry args={[0.016, 0.016, 0.4, 8]} />
        </mesh>
      ))}
    </group>
  );
};

/** The fifteen-foot wire: from a tail behind the hands, through them, down the manway to a bent hook. */
export const Wire: React.FC<{hand: V3; tail: V3; tip: V3; via?: V3}> = ({hand, tail, tip, via}) => {
  const m = M();
  const geo = useMemo(() => {
    const pts = [
      new THREE.Vector3(...tail),
      new THREE.Vector3(...hand),
      ...(via ? [new THREE.Vector3(...via)] : []),
      new THREE.Vector3(tip[0], tip[1] + 0.5, tip[2]),
      new THREE.Vector3(tip[0], tip[1] + 0.06, tip[2]),
      new THREE.Vector3(tip[0] + 0.02, tip[1], tip[2]),
      new THREE.Vector3(tip[0] + 0.07, tip[1] - 0.01, tip[2]),
      new THREE.Vector3(tip[0] + 0.09, tip[1] + 0.05, tip[2]),
    ];
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.35), 80, 0.011, 6);
  }, [hand[0], hand[1], hand[2], tail[0], tail[1], tail[2], tip[0], tip[1], tip[2], via?.[0], via?.[1], via?.[2]]);
  return <mesh geometry={geo} material={m.wire} castShadow />;
};

/** "The job": the five-ton top elbow that had to go back on, drawn as a hologram. */
export const GhostElbow: React.FC<{lift: number; opacity: number}> = ({lift, opacity}) => {
  const m = M();
  const fill = useMemo(() => m.ghost.clone(), [m]);
  const line = useMemo(() => m.ghostWire.clone(), [m]);
  fill.opacity = 0.2 * opacity;
  line.opacity = 0.42 * opacity;
  if (opacity < 0.01) return null;
  const parts: {g: React.ReactNode; p: V3; r?: V3}[] = [
    {g: <cylinderGeometry args={[FLANGE_R, FLANGE_R, 0.13, 32]} />, p: [0, 0.69, 0]},
    {g: <cylinderGeometry args={[0.16, D.manwayR, 0.42, 24, 1, true]} />, p: [0, 0.96, 0]},
    {g: <cylinderGeometry args={[0.16, 0.16, 0.5, 20, 1, true]} />, p: [0, 1.42, 0]},
    {g: <torusGeometry args={[0.5, 0.16, 14, 20, Math.PI / 2]} />, p: [0.5, 1.67, 0], r: [0, 0, Math.PI / 2]},
    {g: <cylinderGeometry args={[0.16, 0.16, 1.5, 20, 1, true]} />, p: [1.25, 2.17, 0], r: [0, 0, Math.PI / 2]},
    {g: <cylinderGeometry args={[0.27, 0.27, 0.09, 24]} />, p: [2.02, 2.17, 0], r: [0, 0, Math.PI / 2]},
  ];
  return (
    <group position-y={lift}>
      {parts.map((part, i) => (
        <group key={i} position={part.p} rotation={part.r ?? [0, 0, 0]}>
          <mesh material={fill}>{part.g}</mesh>
          <mesh material={line}>{part.g}</mesh>
        </group>
      ))}
    </group>
  );
};

/** What Valero's procedure required and was not there: a barricade and a warning sign. */
export const Missing: React.FC<{barricade: number; sign: number; time: number}> = ({barricade, sign, time}) => {
  const m = M();
  const bm = useMemo(() => m.missing.clone(), [m]);
  const sm = useMemo(() => m.missing.clone(), [m]);
  const flick = 0.82 + 0.18 * Math.sin(time * 23);
  bm.opacity = 0.62 * barricade * flick;
  sm.opacity = 0.7 * sign * flick;
  const R = 1.62;
  const posts = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (i / 10) * Math.PI * 2 + 0.3);
  return (
    <>
      {barricade > 0.01 ? (
        <group>
          {posts.map((a) => (
            <mesh key={a} material={bm} position={[Math.sin(a) * R, 0.5, Math.cos(a) * R]}>
              <cylinderGeometry args={[0.03, 0.03, 1.04, 8]} />
            </mesh>
          ))}
          {[0.98, 0.6].map((y) => (
            <mesh key={y} material={bm} position-y={y} rotation-x={Math.PI / 2}>
              <torusGeometry args={[R, 0.018, 6, 90]} />
            </mesh>
          ))}
        </group>
      ) : null}
      {sign > 0.01 ? (
        <group position={[1.2, 0, 1.1]} rotation-y={-0.35}>
          <mesh material={sm} position-y={0.62}>
            <cylinderGeometry args={[0.02, 0.02, 1.24, 8]} />
          </mesh>
          <mesh material={sm} position-y={1.42}>
            <boxGeometry args={[0.56, 0.4, 0.02]} />
          </mesh>
        </group>
      ) : null}
    </>
  );
};

/** Light spilling through the manway, drawn as a faint cone. */
export const Shaft: React.FC<{level: number}> = ({level}) => {
  const m = M();
  const mat = useMemo(() => m.shaft.clone(), [m]);
  mat.opacity = 0.075 * level;
  if (level < 0.01) return null;
  const h = -TRAY_Y - 0.02;
  return (
    <mesh material={mat} position={[0.01, -h / 2 - 0.01, 0.01]} renderOrder={3}>
      <cylinderGeometry args={[D.manwayR * 0.96, 0.52, h, 40, 1, true]} />
    </mesh>
  );
};

export const HardHat: React.FC<{color: string; pos: V3; rot?: V3}> = ({color, pos, rot = [0, 0, 0]}) => {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({color, roughness: 0.34, emissive: color, emissiveIntensity: 0.04}), [color]);
  return (
    <group position={pos} rotation={rot} scale={1.15}>
      {/* shell */}
      <mesh material={mat} scale={[1.0, 0.82, 1.16]} castShadow>
        <sphereGeometry args={[0.125, 36, 18, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      {/* brim all round, and the peak at the front */}
      <mesh material={mat} position={[0, 0.006, 0]} scale={[1.0, 1, 1.16]} castShadow receiveShadow>
        <cylinderGeometry args={[0.138, 0.142, 0.012, 36]} />
      </mesh>
      <mesh material={mat} position={[0, 0.007, 0.1]} scale={[0.86, 1, 0.9]} castShadow receiveShadow>
        <cylinderGeometry args={[0.105, 0.108, 0.012, 28]} />
      </mesh>
      {/* three low ribs over the crown */}
      {[-0.035, 0, 0.035].map((x) => (
        <mesh key={x} material={mat} position={[x, 0.004, 0]} scale={[0.09, 0.855, 1.1]}>
          <sphereGeometry args={[0.125, 10, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
      ))}
    </group>
  );
};
