import * as THREE from 'three';
import React, {useMemo} from 'react';
import {lerp} from './time';

/**
 * A stylised, faceless worker. Forward-kinematic rig: every joint is an angle,
 * every pose is a plain object, and poses blend linearly.
 * Local space: +y up, the figure faces +z, its left is +x. Angles in radians.
 */
export type Pose = {
  x: number; y: number; z: number; // where the hips are, on the ground plane (y = floor height)
  yaw: number; // heading
  pitch: number; // whole body tips forward about the hips (for lying down)
  roll: number;
  hip: number; // hip height above y
  spine: number; // + bends forward
  head: number; // + looks down
  headYaw: number;
  lSh: number; lShOut: number; lEl: number; // shoulder forward, shoulder out, elbow bend
  rSh: number; rShOut: number; rEl: number;
  lHip: number; lHipOut: number; lKn: number; // thigh forward, thigh out, knee bend
  rHip: number; rHipOut: number; rKn: number;
};

export const STAND: Pose = {
  x: 0, y: 0, z: 0, yaw: 0, pitch: 0, roll: 0, hip: 0.965, spine: 0.03, head: 0.04, headYaw: 0,
  lSh: 0.06, lShOut: 0.09, lEl: 0.16, rSh: 0.03, rShOut: 0.09, rEl: 0.2,
  lHip: 0.02, lHipOut: 0.035, lKn: 0.04, rHip: -0.02, rHipOut: 0.035, rKn: 0.04,
};

export const pose = (over: Partial<Pose>, base: Pose = STAND): Pose => ({...base, ...over});

export const mix = (a: Pose, b: Pose, t: number): Pose => {
  const out = {} as Pose;
  (Object.keys(a) as (keyof Pose)[]).forEach((k) => (out[k] = lerp(a[k], b[k], t)));
  return out;
};

/** Walk cycle layered on a standing pose. `phase` advances 1 per stride. */
export const walk = (base: Pose, phase: number, amount = 1): Pose => {
  const s = Math.sin(phase * Math.PI * 2) * amount;
  const c = Math.cos(phase * Math.PI * 2) * amount;
  return {
    ...base,
    hip: base.hip - 0.012 * amount + Math.abs(c) * 0.018 * amount,
    spine: base.spine + 0.07 * amount,
    lHip: 0.46 * s, rHip: -0.46 * s,
    lKn: 0.1 + Math.max(0, -c) * 0.75, rKn: 0.1 + Math.max(0, c) * 0.75,
    lSh: -0.4 * s, rSh: 0.4 * s, lEl: 0.3, rEl: 0.3,
  };
};

export type Look = {
  suit: string; // coverall
  vest: string; // hi-vis
  hat: string;
  skin?: string;
  tank?: boolean; // breathing-air cylinder on the back
  glow?: number; // how much the hi-vis and reflective tape self-illuminate (default 1)
};

const cache = new Map<string, THREE.Material>();
const mat = (color: string, o: Partial<THREE.MeshStandardMaterialParameters> = {}) => {
  const key = color + JSON.stringify(o);
  let m = cache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({color, roughness: 0.75, metalness: 0.02, ...o});
    cache.set(key, m);
  }
  return m as THREE.MeshStandardMaterial;
};

const Limb: React.FC<{len: number; r: number; m: THREE.Material; children?: React.ReactNode}> = ({len, r, m, children}) => (
  <>
    <mesh material={m} position-y={-len / 2} castShadow receiveShadow>
      <capsuleGeometry args={[r, len - r * 0.6, 6, 14]} />
    </mesh>
    <group position-y={-len}>{children}</group>
  </>
);

const UP = 0.3; // upper arm
const FORE = 0.27;
const THIGH = 0.45;
const SHIN = 0.45;

export const Figure: React.FC<{p: Pose; look: Look; opacity?: number; ghost?: string}> = ({p, look, opacity = 1, ghost}) => {
  const m = useMemo(() => {
    if (ghost) {
      const g = new THREE.MeshBasicMaterial({color: ghost, transparent: true, opacity: 0.5, depthWrite: false});
      return {suit: g, vest: g, hat: g, skin: g, band: g, boot: g, glove: g, visor: g, tank: g};
    }
    return {
      suit: mat(look.suit),
      vest: mat(look.vest, {emissive: look.vest, emissiveIntensity: 0.16 * (look.glow ?? 1), roughness: 0.6}),
      hat: mat(look.hat, {roughness: 0.32, emissive: look.hat, emissiveIntensity: 0.07}),
      skin: mat(look.skin ?? '#b9a999', {roughness: 0.8}),
      band: mat('#e9edf2', {emissive: '#dfe6ee', emissiveIntensity: 0.55 * (look.glow ?? 1), roughness: 0.3}),
      boot: mat('#15181d', {roughness: 0.6}),
      glove: mat('#2a2f37', {roughness: 0.7}),
      visor: mat('#0c0f14', {roughness: 0.15, metalness: 0.6}),
      tank: mat('#d8c11c', {roughness: 0.35, metalness: 0.5}),
    };
  }, [look, ghost]);
  if (opacity <= 0.001) return null;

  return (
    <group position={[p.x, p.y, p.z]} rotation={[0, p.yaw, 0]} visible={opacity > 0.01}>
      <group position-y={p.hip} rotation={[p.pitch, 0, p.roll]}>
        {/* pelvis */}
        <mesh material={m.suit} position-y={0.02} scale={[1.12, 0.8, 0.8]} castShadow>
          <sphereGeometry args={[0.15, 16, 12]} />
        </mesh>
        {/* torso */}
        <group rotation-x={p.spine}>
          <mesh material={m.vest} position-y={0.27} scale={[1.18, 1, 0.78]} castShadow receiveShadow>
            <capsuleGeometry args={[0.15, 0.3, 8, 18]} />
          </mesh>
          {[0.17, 0.3].map((y) => (
            <mesh key={y} material={m.band} position-y={y} scale={[1.18, 1, 0.78]}>
              <cylinderGeometry args={[0.154, 0.154, 0.035, 20, 1, true]} />
            </mesh>
          ))}
          {look.tank ? (
            <mesh material={m.tank} position={[0, 0.3, -0.17]} castShadow>
              <capsuleGeometry args={[0.07, 0.34, 6, 12]} />
            </mesh>
          ) : null}
          {/* neck + head */}
          <mesh material={m.skin} position-y={0.53}>
            <cylinderGeometry args={[0.05, 0.06, 0.1, 10]} />
          </mesh>
          <group position-y={0.56} rotation={[p.head, p.headYaw, 0]}>
            <mesh material={m.skin} position-y={0.1} scale={[0.92, 1.08, 1]} castShadow>
              <sphereGeometry args={[0.105, 20, 16]} />
            </mesh>
            <mesh material={m.visor} position={[0, 0.115, 0.058]} scale={[1, 0.34, 0.62]}>
              <sphereGeometry args={[0.098, 16, 10]} />
            </mesh>
            <mesh material={m.hat} position-y={0.135} scale={[1.05, 0.86, 1.14]} castShadow>
              <sphereGeometry args={[0.122, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            </mesh>
            <mesh material={m.hat} position={[0, 0.137, 0.03]} scale={[1, 1, 1.22]} castShadow>
              <cylinderGeometry args={[0.137, 0.14, 0.014, 22]} />
            </mesh>
            <mesh material={m.hat} position={[0, 0.19, 0]} scale={[0.22, 1, 1]}>
              <sphereGeometry args={[0.1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            </mesh>
          </group>
          {/* arms */}
          {([[1, p.lSh, p.lShOut, p.lEl], [-1, p.rSh, p.rShOut, p.rEl]] as const).map(([side, sh, out, el]) => (
            <group key={side} position={[side * 0.215, 0.44, 0]} rotation={[-sh, 0, side * out]}>
              <mesh material={m.vest} scale={[1, 1, 1]}>
                <sphereGeometry args={[0.066, 12, 10]} />
              </mesh>
              <Limb len={UP} r={0.052} m={m.suit}>
                <group rotation-x={-el}>
                  <Limb len={FORE} r={0.045} m={m.suit}>
                    <mesh material={m.glove} position-y={-0.035} scale={[0.85, 1.15, 1]} castShadow>
                      <sphereGeometry args={[0.05, 12, 10]} />
                    </mesh>
                  </Limb>
                </group>
              </Limb>
            </group>
          ))}
        </group>
        {/* legs */}
        {([[1, p.lHip, p.lHipOut, p.lKn], [-1, p.rHip, p.rHipOut, p.rKn]] as const).map(([side, hp, out, kn]) => (
          <group key={side} position={[side * 0.095, 0, 0]} rotation={[-hp, 0, side * out]}>
            <Limb len={THIGH} r={0.082} m={m.suit}>
              <group rotation-x={kn}>
                <Limb len={SHIN} r={0.064} m={m.suit}>
                  <mesh material={m.boot} position={[0, -0.03, 0.06]} castShadow>
                    <boxGeometry args={[0.11, 0.1, 0.27]} />
                  </mesh>
                </Limb>
              </group>
            </Limb>
          </group>
        ))}
      </group>
    </group>
  );
};

/** World position of a hand, so props (wire, radio) can be put in it. */
export const handPos = (p: Pose, side: 1 | -1): [number, number, number] => {
  const sh = side === 1 ? p.lSh : p.rSh;
  const out = side === 1 ? p.lShOut : p.rShOut;
  const el = side === 1 ? p.lEl : p.rEl;
  const root = new THREE.Object3D();
  root.position.set(p.x, p.y, p.z);
  root.rotation.set(0, p.yaw, 0);
  const pelvis = new THREE.Object3D();
  pelvis.position.y = p.hip;
  pelvis.rotation.set(p.pitch, 0, p.roll);
  const torso = new THREE.Object3D();
  torso.rotation.x = p.spine;
  const shoulder = new THREE.Object3D();
  shoulder.position.set(side * 0.215, 0.44, 0);
  shoulder.rotation.set(-sh, 0, side * out);
  const elbow = new THREE.Object3D();
  elbow.position.y = -UP;
  elbow.rotation.x = -el;
  const hand = new THREE.Object3D();
  hand.position.y = -FORE - 0.04;
  root.add(pelvis);
  pelvis.add(torso);
  torso.add(shoulder);
  shoulder.add(elbow);
  elbow.add(hand);
  root.updateMatrixWorld(true);
  const v = new THREE.Vector3().setFromMatrixPosition(hand.matrixWorld);
  return [v.x, v.y, v.z];
};
