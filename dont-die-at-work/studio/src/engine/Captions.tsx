import React, {useMemo} from 'react';
import {C, FONT, W} from './theme';
import {clamp, spring} from './time';

type Word = {w: string; start: number; end: number};
type Beat = {id: string; start: number; end: number; words: Word[]};
type Chunk = {words: Word[]; start: number; end: number; beat: string};

const clean = (w: string) => w.replace(/[.,:;!?]/g, '').toUpperCase();
const ends = (w: string) => /[.,:;!?]$/.test(w);

/** Two or three words at a time, never across a pause. */
const build = (beats: Beat[], maxWords = 3, maxChars = 15): Chunk[] => {
  const out: Chunk[] = [];
  beats.forEach((beat, bi) => {
    let cur: Word[] = [];
    const flush = () => {
      if (cur.length) out.push({words: cur, start: cur[0].start, end: cur[cur.length - 1].end, beat: beat.id});
      cur = [];
    };
    beat.words.forEach((w) => {
      const chars = cur.reduce((n, x) => n + clean(x.w).length + 1, 0);
      if (cur.length >= maxWords || chars + clean(w.w).length > maxChars) flush();
      cur.push(w);
      if (ends(w.w)) flush();
    });
    flush();
    // within a beat, a chunk holds until the next one starts, unless the narrator pauses
    for (let i = 0; i < out.length - 1; i++) {
      if (out[i].start >= beat.start && out[i + 1].start - out[i].end < 0.5) out[i].end = out[i + 1].start;
    }
    // the last chunk of a beat holds a moment, but never into the next beat: a caption must not outlive its shot
    const next = beats[bi + 1];
    out[out.length - 1].end = Math.min(beat.end + 0.18, next ? next.start - 0.04 : beat.end + 0.18);
  });
  return out;
};

const TINT: Record<string, string> = {
  DIED: C.red, KILLED: C.red, NEVER: C.red, DOWN: C.red, "CAN'T": C.red,
  NITROGEN: C.cyan, OXYGEN: C.cyan, BREATHING: C.cyan, BREATHS: C.cyan, AIR: C.cyan,
};

export const Captions: React.FC<{time: number; beats: Beat[]; y?: number; yFor?: (beatId: string) => number | undefined; hide?: (beatId: string) => boolean; width?: number; maxWords?: number; maxChars?: number; sizes?: [number, number, number]; outline?: number; tint?: Record<string, string>}> = ({time, beats, y = 1262, yFor, hide, width = W, maxWords = 3, maxChars = 15, sizes = [132, 116, 100], outline = 15, tint = TINT}) => {
  const chunks = useMemo(() => build(beats.filter((b) => !hide?.(b.id)), maxWords, maxChars), [beats, hide, maxWords, maxChars]);
  const chunk = chunks.find((c) => time >= c.start - 0.02 && time < c.end);
  if (!chunk) return null;
  const text = chunk.words.map((w) => clean(w.w)).join(' ');
  const size = text.length <= maxChars * 0.55 ? sizes[0] : text.length <= maxChars * 0.8 ? sizes[1] : sizes[2];
  const pop = 0.86 + 0.14 * clamp(spring(time - chunk.start + 0.02, 4.2, 0.62), 0, 1.15);
  return (
    <div style={{position: 'absolute', left: 0, top: yFor?.(chunk.beat) ?? y, width, display: 'flex', justifyContent: 'center', transform: `scale(${pop})`, transformOrigin: '50% 50%'}}>
      <div style={{fontFamily: FONT.display, fontSize: size, lineHeight: 1, letterSpacing: '0.012em', whiteSpace: 'nowrap', filter: 'drop-shadow(0 10px 18px rgba(0,0,0,0.75))'}}>
        {chunk.words.map((w, i) => {
          const next = chunk.words[i + 1];
          const active = time >= w.start - 0.02 && time < (next ? next.start - 0.02 : chunk.end);
          const said = time >= w.start - 0.02;
          const k = clean(w.w);
          const color = active ? C.yellow : said && tint[k] ? tint[k] : C.white;
          return (
            <span key={i} style={{display: 'inline-block', margin: '0 0.11em', color, WebkitTextStroke: `${outline}px #04060a`, paintOrder: 'stroke fill', transform: `scale(${active ? 1.07 : 1}) translateY(${active ? -4 : 0}px)`}}>
              {k}
            </span>
          );
        })}
      </div>
    </div>
  );
};
