import timings from '../../../videos/001-valero-nitrogen-duct-tape/assets/timings.json';
import {FPS} from '../engine/theme';

type Word = {w: string; start: number; end: number};
type Beat = {id: string; section: string; start: number; end: number; words: Word[]};
export const BEATS = timings.beats as Beat[];
export const B = Object.fromEntries(BEATS.map((b) => [b.id, b])) as Record<string, Beat>;

const key = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
/** When the narrator starts saying `w` in a beat (nth occurrence). Animation locks to these. */
export const word = (beat: string, w: string, nth = 0) => {
  const hits = B[beat].words.filter((x) => key(x.w) === key(w));
  if (!hits[nth]) throw new Error(`"${w}" #${nth} is not in beat ${beat}`);
  return hits[nth].start;
};
const cut = (beat: string, lead = 0.14) => B[beat].start - lead;

export const END = timings.speech_end + 1.35;
export const DURATION = Math.ceil(END * FPS);

// Every cut and cue, in seconds, derived from the voice. Re-record the voice and the film retimes.
export const T = {
  // hook
  die: word('hook-1', 'die'),
  h2: cut('hook-2'),
  h3: cut('hook-3'),
  breathing: word('hook-3', 'And') - 0.15,
  // the machine: what the tank is, what it is for, why it is open, why it is full of nitrogen
  gasCalled: word('mach-1', 'nitrogen'),
  standing: word('mach-1', 'And') - 0.12,
  ma2: cut('mach-2'),
  purpose: word('mach-2', 'making') - 0.05,
  inside: word('mach-2', 'Inside') - 0.1,
  cooked: word('mach-2', 'cooked') - 0.05,
  breaks: word('mach-2', 'until') - 0.05,
  gasoline: word('mach-2', 'gasoline') - 0.05,
  jet: word('mach-2', 'jet') - 0.05,
  ma3: cut('mach-3'),
  wears: word('mach-3', 'When') - 0.05,
  shut: word('mach-3', 'shut') - 0.1,
  opened: word('mach-3', 'opened') - 0.08,
  refilled: word('mach-3', 'refilled') - 0.08,
  ma4: cut('mach-4'),
  cantTouch: word('mach-4', 'reacts') - 0.05,
  pumped: word('mach-4', 'pumped') - 0.1,
  onPurpose: word('mach-4', 'purpose') - 0.05,
  kept: word('mach-4', 'kept') - 0.1,
  bolted: word('mach-4', 'bolted') - 0.05,
  // what nitrogen does to you
  m1: cut('mech-1'),
  allThereIs: word('mech-1', 'until') - 0.1,
  m2: cut('mech-2'),
  one: word('mech-2', 'One'),
  two: word('mech-2', 'two'),
  blackOut: word('mech-2', 'black'),
  noSmell: word('mech-2', 'No', 0),
  noTaste: word('mech-2', 'No', 1),
  noWarning: word('mech-2', 'No', 2),
  // the job, and what nobody told them
  i1: cut('inc-1', 0.2),
  out: cut('out-1'),
  leaking: word('out-1', 'leaking') - 0.1,
  lean: word('out-1', 'Lean') - 0.12,
  f1: cut('flag-1'),
  noSign: word('flag-1', 'No', 0) - 0.05,
  noBarrier: word('flag-1', 'No', 1) - 0.05,
  permit: word('flag-1', 'Their') - 0.15,
  na: word('flag-1', 'not') - 0.05,
  tr: cut('train-1'),
  never: word('train-1', 'Never') - 0.08,
  // incident
  i2: cut('inc-2'),
  five: word('inc-2', 'five') - 0.1,
  comeOut: word('inc-2', 'It') - 0.05,
  i3: cut('inc-3'),
  crew: word('inc-3', 'special') - 0.08,
  delay: word('inc-3', 'delay'),
  wire: word('inc-3', 'So') - 0.12,
  fishing: word('inc-3', 'go') - 0.1,
  i4: cut('inc-4'),
  kneel: word('inc-4', 'He', 1) - 0.08,
  cant: word('inc-4', 'He', 2) - 0.05,
  i5: cut('inc-5'),
  sits: word('inc-5', 'sits') - 0.15,
  legs: word('inc-5', 'legs') - 0.1,
  calm: cut('calm-1'),
  around: word('calm-1', 'gas') - 0.1,
  i6: cut('inc-6', 0.1),
  i7: cut('inc-7', 0.25),
  i8: cut('inc-8'),
  taught: word('inc-8', 'A') - 0.1,
  stop: cut('stop-1'),
  stayOut: word('stop-1', 'stay') - 0.06,
  br1: cut('breath-1'),
  hold: word('breath-1', 'hold') - 0.05,
  under: word('breath-1', 'underwater') - 0.1,
  br2: cut('breath-2', 0.05),
  fight: word('breath-2', 'fight') - 0.05,
  feels: word('breath-2', 'Nitrogen') - 0.08,
  justBreathe: word('breath-2', 'You', 1) - 0.05,
  i9: cut('inc-9'),
  climbs: word('inc-9', 'climbs') - 0.1,
  i10: cut('inc-10', 0.1),
  lying: word('inc-10', "he's"),
  i11: cut('inc-11'),
  meter: word('inc-11', 'They') - 0.1,
  alarm: word('inc-11', 'alarms') - 0.06,
  nearZero: word('inc-11', 'almost') - 0.05,
  i12: cut('inc-12', 0.2),
  // lesson, tribute, sign-off
  af: cut('after-1', 0.2),
  wentUp: word('after-1', 'went') - 0.1,
  required: word('after-1', 'The') - 0.1,
  l2: cut('lesson-2', 0.1),
  l3: cut('lesson-3'),
  doNot: word('lesson-3', 'you') - 0.05,
  callIt: word('lesson-3', 'you', 1) - 0.05,
  tribute: cut('tribute-1', 0.25),
  weTell: word('tribute-1', 'We') - 0.15,
  signoff: cut('signoff', 0.22),
  end: END,
};
