import timings from '../../../specials/five-tons-of-neglect/assets/timings.json';
import {FPS} from '../engine/theme';
import {SCRIPT} from './script';

type Word = {w: string; start: number; end: number};
export type Beat = {id: string; section: string; start: number; end: number; words: Word[]};
export const BEATS = timings.beats as Beat[];
export const B = Object.fromEntries(BEATS.map((b) => [b.id, b])) as Record<string, Beat>;

const key = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
/** When the narrator starts saying `w` in a beat (nth occurrence). Animation locks to these. */
export const word = (beat: string, w: string, nth = 0) => {
  if (!B[beat]) throw new Error(`no beat ${beat}`);
  const hits = B[beat].words.filter((x) => key(x.w) === key(w));
  if (!hits[nth]) throw new Error(`"${w}" #${nth} is not in beat ${beat}`);
  return hits[nth].start;
};
/** The moment a beat's shot starts: a breath before its first word. */
export const at = (beat: string, lead = 0.14) => {
  if (!B[beat]) throw new Error(`no beat ${beat}`);
  return B[beat].start - lead;
};
export const endOf = (beat: string) => B[beat].end;

/** The end card (sources) holds after the last word. */
export const END_CARD = 9;
export const SPEECH_END = timings.speech_end;
export const END = SPEECH_END + END_CARD;
export const DURATION = Math.ceil(END * FPS);

/** Each section runs from a breath before its first word to the start of the next section. */
export const S = (() => {
  const out: Record<string, {start: number; end: number}> = {};
  SCRIPT.sections.forEach((id, i) => {
    const first = BEATS.find((b) => b.section === id)!;
    const next = BEATS.find((b) => b.section === SCRIPT.sections[i + 1]);
    out[id] = {start: i === 0 ? 0 : first.start - 0.3, end: next ? next.start - 0.3 : SPEECH_END + 0.6};
  });
  return out;
})();
export const beatAt = (t: number): Beat | undefined => {
  let cur: Beat | undefined;
  for (const b of BEATS) {
    if (b.start - 0.14 <= t) cur = b;
    else break;
  }
  return cur;
};

// The cue sheet handed to the sound arrangement: every beat and every section, by name.
export const T: Record<string, number> = {
  ...Object.fromEntries(BEATS.map((b) => [b.id, b.start])),
  ...Object.fromEntries(Object.entries(S).map(([id, r]) => [`sec:${id}`, r.start])),
  speechEnd: SPEECH_END,
  end: END,
};
