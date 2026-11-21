// Real dimensions, from CSB Case Study 2006-02-I-DE Figures 6 and 7 ("figures
// approximately to scale") and the text. Metres. Origin: centre of the manway
// opening, at the top face of the manway flange. +y is up.
export const IN = 0.0254;
export const FT = 0.3048;

export const D = {
  reactorR: (11.5 * FT) / 2, // 11'6" across the head (Fig. 6)
  manwayR: 12 * IN, // 24" diameter reactor opening (Fig. 7)
  studCircleR: 21 * IN, // 42" across the stud circle (Fig. 6)
  studR: 2.125 * IN, // 4 1/4" dia. studs (Fig. 7)
  studH: 24 * IN, // 24" tall studs (Fig. 7)
  studCount: 16, // "16 total" (Fig. 6)
  ledge: 6.875 * IN, // 6 7/8" wide ledge between studs and opening (Fig. 7)
  trayDepth: 5 * FT, // tape on the tray "about five feet below the opening"
  wireLen: 15 * FT, // "Fifteen foot wire with hook formed on end" (Fig. 4)
};

// Modelling choices (not from the report).
export const WALL = 0.09;
export const NECK = 0.3; // inside of the head starts this far below the flange face
export const YC = -(NECK + D.reactorR); // centre of the hemispherical head
export const FLANGE_R = D.studCircleR + 0.13;
export const FLANGE_T = 0.13;
export const PLAT_R = 3.1;
export const Y_BOTTOM = -27;
export const TRAY_Y = -D.trayDepth;
/** Inside radius of the vessel at height y. */
export const innerR = (y: number) =>
  y <= YC ? D.reactorR : Math.sqrt(Math.max(0, D.reactorR ** 2 - (y - YC) ** 2));

// Where the roll of tape lies on the tray.
export const TAPE: [number, number, number] = [0.12, TRAY_Y + 0.062, 0.1];
