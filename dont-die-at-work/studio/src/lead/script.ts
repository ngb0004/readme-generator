import script from '../../../specials/five-tons-of-neglect/script.json';

type Claim = {claim: string; src: string; page: number; quote: string};
export type ScriptBeat = {id: string; section: string; narration: string; onscreen: string[]; claims: Claim[]; exempt?: string};
type Source = {id: string; short: string; publisher: string; title: string; url: string; kind: string};

export const SCRIPT = script as unknown as {
  title: string;
  sections: string[];
  section_titles: Record<string, string>;
  labels: Record<string, string>;
  sources: Source[];
  beats: ScriptBeat[];
  thumbnail?: {lines: string[]; claims_from: string};
  shorts?: {id: string; from: string; to: string; day_of?: boolean; publish_at?: string; title: string; blurb?: string}[];
};
const BY_ID = Object.fromEntries(SCRIPT.beats.map((b) => [b.id, b])) as Record<string, ScriptBeat>;
const SRC = Object.fromEntries(SCRIPT.sources.map((s) => [s.id, s])) as Record<string, Source>;

/** Every word on screen comes out of script.json, which the verify gate has checked against the sources. */
export const os = (beat: string, i: number): string => {
  const b = BY_ID[beat];
  if (!b || b.onscreen[i] === undefined) throw new Error(`no on-screen text ${beat}[${i}]`);
  return b.onscreen[i];
};
export const label = (key: string): string => {
  if (SCRIPT.labels[key] === undefined) throw new Error(`no label ${key}`);
  return SCRIPT.labels[key];
};
/**
 * A label that is not in script.json yet. It renders `fallback` so work can continue, and
 * `grep labelOr` finds every one that still has to be moved into the script before a release.
 */
export const labelOr = (key: string, fallback: string): string => SCRIPT.labels[key] ?? fallback;
/** A line of the thumbnail's text: it is in script.json too, and the gate checks it against a beat's quotes. */
export const thumbLine = (i: number): string => {
  const line = SCRIPT.thumbnail?.lines[i];
  if (line === undefined) throw new Error(`no thumbnail line ${i}`);
  return line;
};
export const sectionTitle = (section: string): string => SCRIPT.section_titles[section] ?? '';
export const sectionIndex = (section: string): number => SCRIPT.sections.indexOf(section);
/** A beat that carries no sourced claim: opinion, a note to the viewer, or our own estimate. */
export const isCommentary = (beat: string): boolean => Boolean(BY_ID[beat]?.exempt);
/** True for lines that present the film's own calculation (see estimate.py beside the script). */
export const isEstimate = (beat: string): boolean => BY_ID[beat]?.exempt === 'estimate';

/** Who a beat's facts come from, shortest list first: shown in the corner while the beat plays. */
export const provenance = (beat: string): string[] => {
  const b = BY_ID[beat];
  if (!b) return [];
  const out: string[] = [];
  for (const c of b.claims) {
    const s = SRC[c.src]?.short;
    if (s && !out.includes(s)) out.push(s);
  }
  return out.slice(0, 3);
};

/** One line per publisher, for the end card. */
export const publishers = (): string[] => {
  const out: string[] = [];
  for (const s of SCRIPT.sources) if (!out.includes(s.short)) out.push(s.short);
  return out;
};
