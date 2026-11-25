// Where things sit on the timeline's rail. No pictures here, only the arithmetic.
//
// The rail has two layouts and the scene blends between them:
//   travel  the camera rides along it. Each stretch gets the room its events need, so a year
//           is a few pixels wide in 1990 and a day is 120 pixels wide in November 2026.
//   true    the whole line on screen at once, every day the same width. This is the picture
//           the section ends on: four stops in forty years, then everything at the right edge.
// Every position comes from a real calendar date, so the true layout cannot be fudged.

/** Days since 1970. */
export const day = (y: number, m: number, d: number) => Date.UTC(y, m - 1, d) / 86400000;

/** The rail's height in the frame. Captions start at 890. */
export const RAIL = 730;
/** Pixels per month through the routine and the spring of 2026. */
export const MONTH = 90;
/** Pixels per day from the open house to the blast. */
export const DAY = 120;
const MEAN_MONTH = 30.4375;

/** The paper is read at the seminar: 29 August 1984. */
export const T0 = day(1984, 8, 29);
/** The detonation date. */
export const T1 = day(2026, 11, 25);
const JAN24 = day(2024, 1, 1);
const OCT15 = day(2026, 10, 15);
const X_JAN24 = 7300;
const X_OCT15 = X_JAN24 + (MONTH * (OCT15 - JAN24)) / MEAN_MONTH;

// Sources give only the year for 2004, 2009 and 2011, so those stops sit at mid-year.
const ANCHORS: [number, number][] = [
  [T0, 0],
  [day(2004, 7, 1), 1900],
  [day(2009, 7, 1), 3800],
  [day(2011, 7, 1), 5700],
  [JAN24, X_JAN24],
  [OCT15, X_OCT15],
  [T1, X_OCT15 + DAY * (T1 - OCT15)],
];

/** Travel layout: world x of a date, piecewise linear between the anchors above. */
export const travelX = (d: number) => {
  let i = 1;
  while (i < ANCHORS.length - 1 && d > ANCHORS[i][0]) i++;
  const [d0, x0] = ANCHORS[i - 1];
  const [d1, x1] = ANCHORS[i];
  return x0 + ((d - d0) / (d1 - d0)) * (x1 - x0);
};

/** True layout: screen x of a date when the whole line is in frame. */
export const TRUE = {left: 150, right: 1770};
export const trueX = (d: number) => TRUE.left + ((d - T0) / (T1 - T0)) * (TRUE.right - TRUE.left);

/**
 * Dots that would overlap pile up instead: each takes the lowest level where nothing earlier
 * sits within `sep` pixels of it.
 */
export const stack = (xs: number[], sep: number): number[] => {
  const levels: number[] = [];
  xs.forEach((x, i) => {
    let lv = 0;
    while (xs.some((o, j) => j < i && levels[j] === lv && Math.abs(o - x) < sep)) lv++;
    levels.push(lv);
  });
  return levels;
};

/** 1 January of every year the rail crosses. */
export const YEARS = Array.from({length: 2026 - 1985 + 1}, (_, i) => day(1985 + i, 1, 1));
/** The 15th of each month from January 2024 (slot 0) to September 2026 (slot 32). */
export const SLOTS = Array.from({length: 33}, (_, i) => day(2024 + Math.floor(i / 12), (i % 12) + 1, 15));
/** Every day from 16 October to 25 November 2026. */
export const DAYS = Array.from({length: T1 - OCT15}, (_, i) => OCT15 + i + 1);
