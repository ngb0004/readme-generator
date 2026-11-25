import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Captions} from '../engine/Captions';
import {C, FONT, FPS} from '../engine/theme';
import {useFonts} from './fonts';
import {Backdrop, Grade16} from './kit';
import {SCRIPT, isCommentary, isEstimate, label, os, provenance, thumbLine} from './script';
import {B, BEATS, beatAt} from './timeline';
import {SCENES} from './Video';

// A Short cut from the film. The film is drawn wide, so the picture sits in a band across the
// middle, exactly as it plays in the film; the headline above and the word-by-word captions
// below are sized for a phone. Narration, picture and sources are the film's own.
export const SW = 1080;
export const SH = 1920;
const BAND = {top: 628, h: Math.round((SW * 1080) / 1920)};

type Cut = NonNullable<typeof SCRIPT.shorts>[number];
export const SHORTS: Cut[] = SCRIPT.shorts ?? [];
/** A Short runs from a breath before its first line to a beat after its last. */
export const shortRange = (cut: Cut) => ({from: Math.max(0, B[cut.from].start - 0.3), to: B[cut.to].end + 0.9});
export const shortFrames = (cut: Cut) => Math.ceil((shortRange(cut).to - shortRange(cut).from) * FPS);

const CAPTION_TINT: Record<string, string> = {LEAD: C.cyan, DUST: C.cyan, NEVER: C.red, "CAN'T": C.red, CANNOT: C.red};
const metal: React.CSSProperties = {backgroundImage: 'linear-gradient(180deg, #ffffff 6%, #d5e0ec 36%, #8296ab 58%, #c2d0de 92%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'};

export const Short: React.FC<{id: string}> = ({id}) => {
  useFonts();
  const cut = SHORTS.find((s) => s.id === id)!;
  const {from, to} = shortRange(cut);
  const frame = useCurrentFrame();
  const t = Math.min(from + frame / FPS, to - 0.001);
  const section = B[cut.from].section;
  const {Scene, options} = SCENES[section];
  const beat = beatAt(t);
  const speaking = beat && t < beat.end + 0.6;
  const prov = beat && speaking ? (isEstimate(beat.id) ? label('estimate') : isCommentary(beat.id) ? label('commentary') : `${label('source')}: ${provenance(beat.id).join(' · ')}`) : '';
  const big: React.CSSProperties = {position: 'absolute', left: 0, top: 296, width: SW, textAlign: 'center', fontFamily: FONT.display, fontSize: 226, lineHeight: 1, whiteSpace: 'nowrap'};
  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #0a1322 0%, #05080f 100%)'}}>
      {/* the headline: the same words as the film's thumbnail */}
      <div style={{position: 'absolute', left: 0, top: 206, width: SW, textAlign: 'center', fontFamily: FONT.display, fontSize: 92, lineHeight: 1, color: C.white, WebkitTextStroke: '9px #04060a', paintOrder: 'stroke fill'}}>{thumbLine(0)}</div>
      <div style={{...big, color: '#04060a', WebkitTextStroke: '24px #04060a'}}>{thumbLine(1)}</div>
      <div style={{...big, ...metal}}>{thumbLine(1)}</div>

      {/* the film, as it plays */}
      <div style={{position: 'absolute', left: 0, top: BAND.top, width: SW, height: BAND.h, overflow: 'hidden', background: C.bg, borderTop: `6px solid ${C.yellow}`, borderBottom: `6px solid ${C.yellow}`, boxSizing: 'content-box'}}>
        <div style={{position: 'relative', width: 1920, height: 1080, transform: `scale(${SW / 1920})`, transformOrigin: '0 0'}}>
          <Backdrop />
          <Scene t={t} />
        </div>
      </div>
      <div style={{position: 'absolute', left: 40, top: BAND.top + BAND.h + 26, fontFamily: FONT.mono, fontWeight: 700, fontSize: 22, letterSpacing: '0.12em', color: C.white, opacity: 0.8}}>{prov}</div>

      <Captions time={t} beats={BEATS} hide={options.hideCaption} y={1312} tint={CAPTION_TINT} />

      {cut.day_of ? (
        <div style={{position: 'absolute', left: 0, top: 534, width: SW, display: 'flex', justifyContent: 'center'}}>
          <div style={{background: C.red, color: '#04060a', fontFamily: FONT.display, fontSize: 56, lineHeight: 1, padding: '12px 26px 5px', whiteSpace: 'nowrap'}}>
            {thumbLine(2)} · {os('cold-4', 1)}
          </div>
        </div>
      ) : null}
      <div style={{position: 'absolute', left: 0, top: 1456, width: SW, textAlign: 'center', fontFamily: FONT.mono, fontWeight: 700, fontSize: 27, letterSpacing: '0.14em', color: C.yellow}}>{label('short_footer')}</div>
      <Grade16 frame={frame} />
    </AbsoluteFill>
  );
};
