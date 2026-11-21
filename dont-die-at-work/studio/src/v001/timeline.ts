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

export const END = timings.speech_end + 1.35;
export const DURATION = Math.ceil(END * FPS);

// Every cut and cue, in seconds, derived from the voice. Re-record the voice and the whole film retimes.
export const T = {
  hook2: B['hook-2'].start - 0.12,
  est: B['buildup-1'].start - 0.2,
  job: word('buildup-1', 'crew') - 0.2,
  spot: B['buildup-2'].start - 0.12,
  five: word('buildup-2', 'five') - 0.12,
  cant: word('buildup-2', 'It') - 0.1,
  goingIn: B['buildup-3'].start - 0.1,
  delay: word('buildup-3', 'delay'),
  hook: word('buildup-3', 'So') - 0.12,
  permit: B['hidden-1'].start - 0.15,
  leftOut: word('hidden-1', 'left'),
  full: word('hidden-1', 'the') - 0.15,
  nitrogen: word('hidden-1', 'nitrogen'),
  noSign: word('hidden-1', 'No', 0) - 0.1,
  noBarr: word('hidden-1', 'No', 1) - 0.1,
  smell: B['hidden-2'].start - 0.1,
  color: word('hidden-2', 'No', 1) - 0.05,
  oxygen: word('hidden-2', 'Almost') - 0.1,
  first: B['reveal-1'].start - 0.2,
  kneel: word('reveal-1', 'Then') - 0.12,
  sit: B['reveal-1'].end - 0.3,
  nobody: B['reveal-2'].start - 0.1,
  black: word('reveal-2', 'go') - 0.05,
  air: B['reveal-3'].start - 0.15,
  breath1: word('reveal-3', 'one'),
  breath2: word('reveal-3', 'two'),
  down: word('reveal-3', 'down'),
  foreman: B['reveal-4'].start - 0.15,
  grabs: word('reveal-4', 'grabs'),
  climbs: word('reveal-4', 'climbs') - 0.05,
  few: word('reveal-4', 'A', 1) - 0.12,
  downToo: word('reveal-4', "he's"),
  third: B['stop-1'].start - 0.25,
  reaches: word('stop-1', 'reaches'),
  stops: word('stop-1', 'He') - 0.05,
  radios: word('stop-1', 'radios') - 0.05,
  responders: B['stop-2'].start - 0.12,
  two: word('stop-2', 'two'),
  lesson: B['lesson-1'].start - 0.15,
  callIt: word('lesson-1', 'Call') - 0.1,
  tribute: B['tribute-1'].start - 0.3,
  weTell: word('tribute-1', 'We') - 0.15,
  signoff: B['signoff'].start - 0.22,
  end: END,
};
