import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {E, Ease, V3, inv, lerp, lerp3, noise} from './time';
import {H, W} from './theme';

export type CamState = {p: V3; t: V3; fov: number};
/** A camera keyframe. `cut` jumps to this key instead of travelling to it. */
export type CamKey = CamState & {at: number; ease?: Ease; cut?: boolean};

export const camAt = (time: number, keys: CamKey[], shake = 1): CamState => {
  let a = keys[0];
  let b = keys[0];
  for (let i = 0; i < keys.length; i++) {
    if (keys[i].at <= time) {
      a = keys[i];
      b = keys[i + 1] && !keys[i + 1].cut ? keys[i + 1] : keys[i];
    }
  }
  const k = a === b ? 0 : (b.ease ?? E.inOut)(inv(a.at, b.at, time));
  const p = lerp3(a.p, b.p, k);
  const t = lerp3(a.t, b.t, k);
  const fov = lerp(a.fov, b.fov, k);
  // A little operator drift so nothing ever sits perfectly still.
  const d = Math.hypot(p[0] - t[0], p[1] - t[1], p[2] - t[2]) * 0.004 * shake;
  return {
    p: [p[0] + noise(time * 0.45, 1) * d, p[1] + noise(time * 0.38, 2) * d, p[2] + noise(time * 0.41, 3) * d],
    t: [t[0] + noise(time * 0.33, 4) * d * 0.6, t[1] + noise(time * 0.29, 5) * d * 0.6, t[2]],
    fov,
  };
};

/** Applies a camera state to the canvas camera. Render it inside <ThreeCanvas>. */
export const Camera: React.FC<{state: CamState}> = ({state}) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  camera.position.set(...state.p);
  camera.up.set(0, 1, 0);
  camera.lookAt(...state.t);
  camera.fov = state.fov;
  camera.near = 0.05;
  camera.far = 400;
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  return null;
};

const scratch = new THREE.PerspectiveCamera();
/** World point -> pixel position, for pinning 2D labels to 3D things. */
export const project = (state: CamState, point: V3): {x: number; y: number; behind: boolean} => {
  scratch.fov = state.fov;
  scratch.aspect = W / H;
  scratch.near = 0.05;
  scratch.far = 400;
  scratch.position.set(...state.p);
  scratch.up.set(0, 1, 0);
  scratch.lookAt(...state.t);
  scratch.updateProjectionMatrix();
  scratch.updateMatrixWorld();
  const v = new THREE.Vector3(...point).project(scratch);
  return {x: (v.x * 0.5 + 0.5) * W, y: (1 - (v.y * 0.5 + 0.5)) * H, behind: v.z > 1};
};
