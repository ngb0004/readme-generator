import * as THREE from 'three';
import React, {useMemo} from 'react';
import {rnd} from '../engine/time';
import {D, TRAY_Y, innerR} from './dims';

const vert = /* glsl */ `
  attribute float aSize;
  attribute float aAlpha;
  varying float vAlpha;
  uniform float uScale;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uScale / -mv.z;
    vAlpha = aAlpha;
    gl_Position = projectionMatrix * mv;
  }`;
const frag = /* glsl */ `
  varying float vAlpha;
  uniform vec3 uColor;
  uniform float uOpacity;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float a = smoothstep(1.0, 0.0, d);
    gl_FragColor = vec4(uColor, a * a * vAlpha * uOpacity);
  }`;

const N_IN = 620; // wisps drifting inside the head
const N_FOG = 46; // large soft volumes that give the gas body
const N_OUT = 420; // what vents up through the manway and hangs over it
const N = N_IN + N_FOG + N_OUT;

/**
 * Nitrogen, drawn so you can see it. It is colourless in life; `level` fades
 * the visualisation in and out. Closed-form motion: frame N never depends on N-1.
 */
export const Gas: React.FC<{time: number; level: number; fovScale: number; plume?: number}> = ({time, level, fovScale, plume = 1}) => {
  const {geo, pos, size, alpha} = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(N * 3);
    const size = new Float32Array(N);
    const alpha = new Float32Array(N);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, -0.5, 0), 6);
    return {geo, pos, size, alpha};
  }, []);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        uniforms: {uColor: {value: new THREE.Color('#45e3ff')}, uOpacity: {value: 1}, uScale: {value: 1}},
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  const top = -0.36; // just under the neck
  const span = top - (TRAY_Y + 0.1);
  let i = 0;
  for (let k = 0; k < N_IN; k++, i++) {
    const s = k * 7.13;
    const rise = (rnd(s) + time * (0.035 + rnd(s + 1) * 0.06)) % 1;
    const y = TRAY_Y + 0.1 + rise * span;
    const a = rnd(s + 2) * Math.PI * 2 + time * (0.1 + rnd(s + 3) * 0.22) * (rnd(s + 4) > 0.5 ? 1 : -1);
    const r = Math.sqrt(rnd(s + 5)) * innerR(y) * 0.93;
    pos[i * 3] = Math.sin(a) * r + Math.sin(time * 0.7 + s) * 0.03;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = Math.cos(a) * r;
    size[i] = 26 + rnd(s + 6) * 60;
    alpha[i] = (0.1 + rnd(s + 7) * 0.2) * Math.min(1, rise * 8) * Math.min(1, (1 - rise) * 8);
  }
  for (let k = 0; k < N_FOG; k++, i++) {
    const s = k * 3.91 + 500;
    const y = TRAY_Y + 0.25 + rnd(s) * (span - 0.45);
    const a = rnd(s + 1) * Math.PI * 2 + time * 0.05;
    const r = Math.sqrt(rnd(s + 2)) * innerR(y) * 0.7;
    pos[i * 3] = Math.sin(a) * r;
    pos[i * 3 + 1] = y + Math.sin(time * 0.3 + s) * 0.05;
    pos[i * 3 + 2] = Math.cos(a) * r;
    size[i] = 520 + rnd(s + 3) * 420;
    alpha[i] = 0.05 + rnd(s + 4) * 0.035;
  }
  for (let k = 0; k < N_OUT; k++, i++) {
    const s = k * 5.77 + 900;
    const life = (rnd(s) + time * (0.09 + rnd(s + 1) * 0.07)) % 1;
    const a = rnd(s + 2) * Math.PI * 2 + life * 1.2 * (rnd(s + 3) - 0.5);
    // up the neck, then it mushrooms over the studs and hangs there in the calm air
    const y = -0.34 + Math.pow(life, 0.75) * (1.05 + rnd(s + 4) * 0.75);
    const spread = Math.pow(Math.max(0, life - 0.22), 1.25) * (1.0 + rnd(s + 5) * 1.5);
    const r = Math.sqrt(rnd(s + 6)) * D.manwayR * 0.9 + spread;
    pos[i * 3] = Math.sin(a) * r;
    pos[i * 3 + 1] = y - spread * 0.16;
    pos[i * 3 + 2] = Math.cos(a) * r;
    size[i] = 30 + rnd(s + 7) * 70 + life * 60;
    alpha[i] = (0.12 + rnd(s + 8) * 0.2) * Math.min(1, life * 7) * Math.pow(1 - life, 1.2) * plume;
  }
  geo.attributes.position.needsUpdate = true;
  geo.attributes.aSize.needsUpdate = true;
  geo.attributes.aAlpha.needsUpdate = true;
  mat.uniforms.uOpacity.value = level;
  mat.uniforms.uScale.value = fovScale;
  if (level < 0.004) return null;
  return <points geometry={geo} material={mat} frustumCulled={false} renderOrder={5} />;
};

/** Dust in the light falling through the manway. */
export const Motes: React.FC<{time: number; level: number; fovScale: number}> = ({time, level, fovScale}) => {
  const n = 150;
  const {geo, pos, size, alpha} = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3);
    const size = new Float32Array(n);
    const alpha = new Float32Array(n);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
    return {geo, pos, size, alpha};
  }, []);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        uniforms: {uColor: {value: new THREE.Color('#ffe9c9')}, uOpacity: {value: 1}, uScale: {value: 1}},
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );
  for (let k = 0; k < n; k++) {
    const s = k * 9.3 + 40;
    const fall = (rnd(s) + time * (0.02 + rnd(s + 1) * 0.03)) % 1;
    const y = -0.2 - fall * (-TRAY_Y - 0.25);
    const rr = (0.1 + (1 - (y - TRAY_Y) / -TRAY_Y) * 0.36) * Math.sqrt(rnd(s + 2));
    const a = rnd(s + 3) * 6.283 + time * 0.2;
    pos[k * 3] = 0.1 + Math.sin(a) * rr;
    pos[k * 3 + 1] = y;
    pos[k * 3 + 2] = 0.08 + Math.cos(a) * rr;
    size[k] = 5 + rnd(s + 4) * 9;
    alpha[k] = 0.25 + 0.5 * Math.abs(Math.sin(time * 1.3 + s));
  }
  geo.attributes.position.needsUpdate = true;
  geo.attributes.aSize.needsUpdate = true;
  geo.attributes.aAlpha.needsUpdate = true;
  mat.uniforms.uOpacity.value = level;
  mat.uniforms.uScale.value = fovScale;
  if (level < 0.004) return null;
  return <points geometry={geo} material={mat} frustumCulled={false} renderOrder={4} />;
};
