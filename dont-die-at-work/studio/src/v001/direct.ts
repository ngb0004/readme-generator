import {CamKey, CamState, camAt} from '../engine/cam';
import {E, clamp, lerp, ramp, track, window as win} from '../engine/time';
import {LightState} from './Rig';
import {T} from './timeline';

// ---------------------------------------------------------------- camera
// One list, in time order. `cut` starts a new shot; otherwise the camera travels from the key before.
const ELEV = {t: [0, -1.02, 0] as [number, number, number], fov: 30};
export const CAM: CamKey[] = [
  // HOOK: dropping in on the roll of tape
  {at: 0, cut: true, p: [-0.1, -0.5, 0.44], t: [0.11, -1.72, 0.04], fov: 52},
  {at: 1.25, p: [0.04, -1.02, 0.5], t: [0.12, -1.78, 0.04], fov: 46, ease: E.outQuint},
  {at: T.hook2, p: [0.08, -1.1, 0.52], t: [0.12, -1.78, 0.04], fov: 45, ease: E.lin},
  // looking up at the men looking down
  {at: T.hook2, cut: true, p: [0.3, -1.38, 0.46], t: [0.0, 0.25, -0.02], fov: 66},
  {at: T.est, p: [0.2, -1.18, 0.34], t: [0.0, 0.45, -0.02], fov: 58, ease: E.out},
  // ESTABLISH: up the side of the reactor to the platform
  {at: T.est, cut: true, p: [10.5, -7.5, 15.5], t: [0, -2.6, 0], fov: 40},
  {at: T.job, p: [8.2, 3.6, 10.6], t: [0, 0.1, 0], fov: 36, ease: E.inOutQuad},
  // the job
  {at: T.job, cut: true, p: [5.3, 3.5, 7.1], t: [0.25, 0.75, 0], fov: 31},
  {at: T.spot, p: [4.5, 3.1, 6.2], t: [0.25, 0.7, 0], fov: 31, ease: E.out},
  // someone spots the tape: over the manway, looking in
  {at: T.spot, cut: true, p: [0.1, 3.3, 0.52], t: [0.12, -1.46, 0.26], fov: 40},
  {at: T.five, p: [0.1, 2.3, 0.4], t: [0.12, -1.46, 0.22], fov: 40, ease: E.out},
  // CUTAWAY: five feet down
  {at: T.five, cut: true, p: [1.0, 1.5, 15.2], ...ELEV},
  {at: T.goingIn, p: [0.8, 1.35, 13.2], ...ELEV, ease: E.out},
  {at: T.hook, p: [0.7, 1.3, 12.7], ...ELEV, ease: E.lin},
  // the wire hook
  {at: T.hook, cut: true, p: [-2.9, 1.5, 12.2], t: [-0.12, -0.86, 0], fov: 27},
  {at: T.permit, p: [-2.5, 1.4, 11.2], t: [-0.1, -0.86, 0], fov: 27, ease: E.out},
  // behind the permit, then the gas reveal
  {at: T.permit, cut: true, p: [0.6, 1.3, 13.4], ...ELEV},
  {at: T.full, p: [0.55, 1.3, 13.0], ...ELEV, ease: E.lin},
  {at: T.noSign, p: [0.3, 1.1, 10.6], t: [0, -0.86, 0], fov: 30, ease: E.inOutQuad},
  // what was missing: high, looking down on the platform
  {at: T.noSign, cut: true, p: [2.4, 5.6, 9.6], t: [0, -0.75, 0.2], fov: 34},
  {at: T.smell, p: [2.0, 5.2, 8.8], t: [0, -0.75, 0.2], fov: 34, ease: E.out},
  // no smell, no colour, no oxygen
  {at: T.smell, cut: true, p: [1.0, 1.0, 11.4], t: [0, -0.9, 0], fov: 30},
  {at: T.first, p: [0.85, 0.95, 10.2], t: [0, -0.9, 0], fov: 30, ease: E.lin},
  // the attempts
  {at: T.first, cut: true, p: [-1.6, 1.1, 11.6], t: [-0.3, -0.72, 0], fov: 28},
  {at: T.black, p: [-1.3, 1.0, 10.4], t: [-0.3, -0.7, 0], fov: 28, ease: E.lin},
  // on the tray
  {at: T.air, cut: true, p: [1.2, -0.1, 10.6], t: [-0.05, -2.0, 0], fov: 27},
  {at: T.foreman, p: [1.0, -0.2, 9.4], t: [-0.05, -2.0, 0], fov: 27, ease: E.lin},
  // the foreman and the ladder
  {at: T.foreman, cut: true, p: [4.4, 2.5, 8.4], t: [0.7, 0.2, -0.55], fov: 36},
  {at: T.climbs, p: [3.7, 2.2, 7.5], t: [0.55, 0.2, -0.45], fov: 36, ease: E.out},
  // down the ladder
  {at: T.climbs, cut: true, p: [0.7, 1.0, 12.4], t: [0, -0.9, 0], fov: 30},
  {at: T.few, p: [0.6, 0.6, 10.8], t: [0, -1.1, 0], fov: 30, ease: E.inOutQuad},
  // on the tray, both of them
  {at: T.few, cut: true, p: [1.3, 0.0, 11.4], t: [0.1, -1.9, 0], fov: 27},
  {at: T.third, p: [0.9, -0.2, 9.2], t: [0.1, -2.0, 0], fov: 27, ease: E.out},
  // THE MOMENT: the third man at the ladder
  {at: T.third, cut: true, p: [3.9, 1.75, 6.4], t: [0.45, 0.86, 0], fov: 29},
  {at: T.responders, p: [3.1, 1.6, 5.3], t: [0.6, 1.02, 0], fov: 29, ease: E.out},
  // responders
  {at: T.responders, cut: true, p: [-3.4, 3.1, 8.0], t: [0, 0.35, -0.3], fov: 35},
  {at: T.lesson, p: [-2.8, 2.8, 7.2], t: [0, 0.35, -0.3], fov: 35, ease: E.out},
  // LESSON: straight down on the manway
  {at: T.lesson, cut: true, p: [0.0, 8.6, 1.9], t: [0, 0, 0.42], fov: 30},
  {at: T.tribute, p: [0.0, 7.4, 1.6], t: [0, 0, 0.4], fov: 30, ease: E.out},
  // TRIBUTE
  {at: T.tribute, cut: true, p: [1.75, 1.25, 2.3], t: [-0.62, 0.2, 0.52], fov: 44},
  {at: T.end, p: [1.5, 1.14, 2.12], t: [-0.62, 0.17, 0.52], fov: 44, ease: E.lin},
];

export const cameraAt = (t: number): CamState => camAt(t, CAM, 1);

// ---------------------------------------------------------------- everything else that changes over time
export type Direction = {
  cam: CamState;
  wedge: number; // cutaway opening, radians
  gas: number; // how visible the nitrogen visualisation is
  plume: number;
  motes: number;
  shaftCone: number;
  tapeGlow: number;
  elbow: {lift: number; opacity: number};
  missing: {barricade: number; sign: number};
  wire: number;
  hats: number;
  light: LightState;
  black: number; // full-frame blackout
  dim: number; // darken + defocus the picture behind a card
  showCrew: boolean;
  showFallen: boolean;
};

export const direct = (t: number): Direction => {
  const inside = t < T.est; // camera is inside the vessel
  const cutaway = t >= T.five && t < T.lesson && !(t >= T.noSign && t < T.smell) && !(t >= T.foreman && t < T.climbs) && !(t >= T.third && t < T.lesson);
  const wedgeOpen = ramp(t, T.five - 0.05, T.five + 0.75, E.outQuint);
  const wedge = cutaway ? lerp(0.25, 2.0, wedgeOpen) : 0;

  // The gas is colourless. We show it in the hook (as a tease), reveal it on "full of nitrogen",
  // switch it off on "No colour", and bring it back for good on "almost no oxygen".
  const gas =
    t < T.est
      ? ramp(t, T.hook2, T.hook2 + 0.5) * 0.85
      : t < T.full
        ? 0
        : Math.min(ramp(t, T.nitrogen - 0.25, T.nitrogen + 0.9, E.out), 1 - 0.93 * win(t, T.color, T.oxygen + 0.05, 0.3, 0.25)) *
          (1 - 0.65 * ramp(t, T.lesson - 0.2, T.lesson + 0.3)) *
          (1 - ramp(t, T.tribute - 0.1, T.tribute + 0.2));

  const tribute = ramp(t, T.tribute - 0.05, T.tribute + 0.05);
  const alarm = t >= T.radios && t < T.lesson ? (0.45 + 0.55 * Math.pow(Math.max(0, Math.sin((t - T.radios) * Math.PI * 2 * 1.4)), 2)) * ramp(t, T.radios + 0.2, T.radios + 0.5) : 0;

  return {
    cam: cameraAt(t),
    wedge,
    gas,
    plume: t < T.est ? 0.5 : 1,
    motes: inside ? 1 : cutaway ? 0.5 : 0,
    shaftCone: inside ? 1 : cutaway ? 0.8 : 0.35,
    tapeGlow: inside ? 0.12 : win(t, T.five + 0.4, T.goingIn + 0.2, 0.3, 0.5) * 0.9 + 0.25,
    elbow: {
      lift: lerp(1.7, 0, ramp(t, T.job + 0.35, T.job + 1.9, E.inOutQuad)),
      opacity: win(t, T.job + 0.15, T.spot, 0.35, 0.01),
    },
    missing: {
      sign: win(t, T.noSign + 0.05, T.smell, 0.12, 0.01),
      barricade: win(t, T.noBarr + 0.05, T.smell, 0.12, 0.01),
    },
    wire: t >= T.hook - 0.3 && t < T.black ? 1 : 0,
    hats: tribute,
    light: {
      key: inside ? 0 : lerp(1, 0.5, tribute),
      moon: inside ? (t < T.hook2 ? 0.045 : 0.4) : 1,
      shaft: inside ? (t < T.hook2 ? 2.6 : 1.1) : lerp(0.85, 0.15, tribute),
      interior: inside ? (t < T.hook2 ? 0.05 : 0.5) : cutaway ? 1 : 0.3,
      n2: gas,
      diagram: cutaway ? 1 : 0,
      warm: tribute * 0.5,
      alarm,
    },
    black: win(t, T.black, T.air, 0.04, 0.05),
    dim: Math.max(win(t, T.permit, T.full + 0.1, 0.2, 0.3), win(t, T.lesson + 0.1, T.tribute, 0.3, 0.1) * 0.75, ramp(t, T.signoff, T.signoff + 0.4) * 0.9),
    showCrew: t < T.tribute,
    showFallen: t >= T.air && t < T.tribute,
  };
};
export {clamp, track};
