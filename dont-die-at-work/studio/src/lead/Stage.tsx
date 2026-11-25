import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, useCurrentFrame} from 'remotion';
import '@fontsource/anton/400.css';
import '@fontsource/barlow-condensed/500.css';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/700.css';
import {Captions} from '../engine/Captions';
import {C, FONT, FPS} from '../engine/theme';
import {ramp} from '../engine/time';
import {Backdrop, Grade16, H, W} from './kit';
import {isCommentary, label, provenance, sectionIndex, sectionTitle} from './script';
import {BEATS, S, SPEECH_END, beatAt} from './timeline';

const FACES = ["400 100px 'Anton'", "500 40px 'Barlow Condensed'", "600 40px 'Barlow Condensed'", "700 40px 'Barlow Condensed'", "500 20px 'JetBrains Mono'", "700 20px 'JetBrains Mono'"];
const CAPTION_TINT: Record<string, string> = {LEAD: C.cyan, DUST: C.cyan, NEVER: C.red, "CAN'T": C.red, CANNOT: C.red, 'LATER': C.yellow};

export type Scene = React.FC<{t: number}>;
export type StageOptions = {
  /** Beats whose words are set as full-screen type, so the caption would repeat them. */
  hideCaption?: (beatId: string) => boolean;
  /** Hide the corner furniture (section tag, source line) on title and end cards. */
  bare?: (t: number) => boolean;
};

/**
 * What every frame of the film has in common: the ground, the section tag, the line saying
 * where the current sentence's facts come from, the captions and the grade.
 */
export const Stage: React.FC<{t: number; section: string; options?: StageOptions; children: React.ReactNode}> = ({t, section, options, children}) => {
  const [fonts] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all(FACES.map((f) => document.fonts.load(f))).then(() => continueRender(fonts));
  }, [fonts]);
  const beat = beatAt(t);
  const bare = options?.bare?.(t) ?? false;
  const title = sectionTitle(section);
  const r = S[section];
  const tagA = bare || !title ? 0 : ramp(t, r.start + 0.2, r.start + 0.7);
  const speaking = beat && t < beat.end + 0.6;
  const prov = beat && speaking ? (isCommentary(beat.id) ? [label('commentary')] : provenance(beat.id)) : [];
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <Backdrop />
      {children}
      {/* corner furniture */}
      <div style={{position: 'absolute', left: 64, top: 44, opacity: tagA, display: 'flex', alignItems: 'baseline', gap: 18}}>
        <span style={{fontFamily: FONT.display, fontSize: 40, color: C.yellow, lineHeight: 1}}>{String(sectionIndex(section)).padStart(2, '0')}</span>
        <span style={{fontFamily: FONT.mono, fontWeight: 700, fontSize: 24, letterSpacing: '0.2em', color: C.white, textShadow: '0 2px 10px #000'}}>{title}</span>
      </div>
      <div style={{position: 'absolute', right: 64, top: 50, opacity: bare ? 0 : 0.62, fontFamily: FONT.mono, fontWeight: 700, fontSize: 18, letterSpacing: '0.18em', color: C.white, textShadow: '0 2px 10px #000'}}>{label('reconstruction')}</div>
      {!bare && prov.length ? (
        <div style={{position: 'absolute', left: 64, top: H - 62, display: 'flex', alignItems: 'center', gap: 12, fontFamily: FONT.mono, fontWeight: 700, fontSize: 20, letterSpacing: '0.14em', color: C.mute, textShadow: '0 2px 10px #000'}}>
          <span style={{width: 11, height: 11, borderRadius: 11, background: isCommentary(beat!.id) ? C.mute : C.yellow, display: 'inline-block'}} />
          <span style={{color: C.white, opacity: 0.85}}>{isCommentary(beat!.id) ? prov[0] : `${label('source')}: ${prov.join(' · ')}`}</span>
        </div>
      ) : null}
      {t < SPEECH_END + 0.4 ? (
        <Captions time={t} beats={BEATS} hide={options?.hideCaption} y={H - 190} width={W} maxWords={5} maxChars={30} sizes={[82, 74, 64]} outline={11} tint={CAPTION_TINT} />
      ) : null}
      <Grade16 frame={Math.round(t * FPS)} />
    </AbsoluteFill>
  );
};

/** For development: one scene on its own, on the real timeline, with the real furniture. */
export const DevFilm: React.FC<{section: string; Scene: Scene; options?: StageOptions}> = ({section, Scene, options}) => {
  const t = useCurrentFrame() / FPS;
  const r = S[section];
  if (t < r.start || t >= r.end) {
    return (
      <AbsoluteFill style={{background: '#000', color: '#555', fontFamily: 'monospace', fontSize: 40, alignItems: 'center', justifyContent: 'center'}}>
        {section} runs {r.start.toFixed(1)}s to {r.end.toFixed(1)}s
      </AbsoluteFill>
    );
  }
  return (
    <Stage t={t} section={section} options={options}>
      <Scene t={t} />
    </Stage>
  );
};
