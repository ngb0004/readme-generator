import React from 'react';
import script from '../../../videos/001-valero-nitrogen-duct-tape/script.json';
import {joints} from '../engine2d/Pictogram';
import {P} from '../engine2d/view';
import {Captions} from '../engine/Captions';
import {Big, Chip, Dim, Grade, Leader, Reticle, Tag} from '../engine/hud';
import {C, FONT, FPS, H, W} from '../engine/theme';
import {E, clamp, ramp, spring, window as win} from '../engine/time';
import {actorA, actorB, actorC} from './actors';
import {os} from './Cards';
import {Direction} from './direct';
import {D, TRAY_Y} from './dims';
import {B, BEATS, T, word} from './timeline';

export const SRC = `SOURCE: U.S. CHEMICAL SAFETY BOARD · CASE STUDY ${(script.sources as {report_no: string}[])[0].report_no}`;
const pop = (t: number, at: number) => clamp(spring(t - at, 3.4, 0.6), 0, 1.2);
const pt = (p: [number, number]) => ({x: p[0], y: p[1]});

/** Labels pinned to the drawing, the provenance line, the grade and the captions. */
export const Overlay: React.FC<{t: number; d: Direction}> = ({t, d}) => {
  const v = d.view;
  const at = (x: number, y: number) => pt(P(v, x, y));
  const shot = (a: number, b: number) => t >= a && t < b;
  const tape = at(0.12, TRAY_Y + 0.085);

  // ---- the days before
  const days = win(t, T.n1 + 0.3, T.onlyWarning - 0.3, 0.3, 0.2);
  const only = win(t, T.onlyWarning + 0.75, T.n2, 0.25, 0.1);
  const giant = win(t, T.standing + 1.0, T.ma2, 0.3, 0.12);

  // ---- the job
  const loc = (k: number) => win(t, T.i1 + k, T.management - 0.2, 0.3, 0.2);
  const lid = win(t, T.i1 + 0.9, T.i2, 0.3, 0.15);
  const sealed = win(t, T.management + 0.1, T.i2, 0.25, 0.15);
  const sweep = ramp(t, T.management + 0.2, B['inc-1'].end + 0.1, E.out);

  // ---- the tape
  const spot = win(t, T.five + 0.95, T.i3, 0.25, 0.15);
  const cant = t >= T.comeOut;
  const fast = win(t, T.wire + 0.15, T.wire + 1.7, 0.2, 0.25);

  // ---- on the rim
  const likely = win(t, T.sits + 0.35, T.i6, 0.25, 0.01);
  const pooled = win(t, T.legs, T.i6, 0.3, 0.01);
  const a = actorA(t);
  const aHip = at(a.x, a.y + 0.45);

  // ---- who he is
  const bHead = pt(joints(v, actorB(t), true).head);
  const years = win(t, word('inc-8', 'twenty-five') - 0.1, T.stop, 0.25, 0.15);
  const taught = win(t, T.taught + 0.3, T.stop, 0.25, 0.15);
  const banner = win(t, T.stop + 0.1, T.i9, 0.01, 0.15);
  const bannerScale = 1 + 0.9 * Math.pow(1 - clamp((t - T.stop - 0.1) / 0.22), 3);
  const stay = pop(t, T.stayOut);

  // ---- rescue
  const bar = win(t, T.i11 + 0.2, T.i12, 0.3, 0.15);
  const fillK = ramp(t, T.i11 + 0.3, T.nearlyTen + 0.9, E.lin);
  const arrive = pop(t, word('inc-11', 'under') - 0.05);
  const dim24 = win(t, T.getting + 0.85, T.i12, 0.25, 0.15);
  const ten = pop(t, T.nearlyTen + 0.25);

  // ---- lesson
  const no = pop(t, T.doNot);
  const call = pop(t, T.callIt);
  const hand = pt(joints(v, actorC(t), true).hand);
  const stat = win(t, T.l3 + 0.3, T.tribute, 0.3, 0.2);

  // ---- tribute
  const mem = (k: number) => win(t, T.tribute + k, T.signoff, 0.5, 0.25, E.inOut);

  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden'}}>
      <Grade frame={Math.round(t * FPS)} />

      {/* provenance, always on */}
      <div style={{position: 'absolute', left: 70, top: 96, opacity: t >= T.signoff ? 0 : 0.78}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 12, fontFamily: FONT.mono, fontWeight: 700, fontSize: 23, letterSpacing: '0.16em', color: C.white}}>
          <span style={{width: 13, height: 13, borderRadius: 13, background: C.yellow, display: 'inline-block'}} />
          ANIMATED RECONSTRUCTION
        </div>
        <div style={{fontFamily: FONT.mono, fontSize: 19, letterSpacing: '0.1em', color: C.mute, marginTop: 7}}>{SRC}</div>
      </div>

      {/* a giant steel tank, full of it */}
      {shot(T.standing, T.ma2) ? (
        <>
          <Leader from={{x: 800, y: at(0, -0.9).y - 40}} to={at(0.7, -0.95)} a={giant} color={C.cyan} />
          <Chip x={640} y={at(0, -0.9).y - 112} a={giant} size={62} color={C.cyan}>{os('mach-1', 0)}</Chip>
        </>
      ) : null}

      {/* the days before */}
      <Big x={540} y={226} a={days} size={100} stroke={8} color={C.cyan}>{os('norm-1', 0)}</Big>
      {shot(T.onlyWarning + 0.6, T.n2) ? (
        <>
          <Leader from={{x: 300, y: at(0, 0.4).y - 196}} to={at(-0.52, 0.42)} a={only} color={C.red} />
          <Chip x={70} y={at(0, 0.4).y - 262} a={only} size={58} color={C.red}>{os('norm-1', 1)}</Chip>
        </>
      ) : null}

      {/* the job */}
      {shot(T.i1, T.i2) ? (
        <>
          <Big x={70} y={226} a={loc(0.15)} size={124} align="left" stroke={8}>{os('inc-1', 0)}</Big>
          <div style={{position: 'absolute', left: 74, top: 362, fontFamily: FONT.label, fontWeight: 700, fontSize: 60, letterSpacing: '0.06em', color: C.yellow, opacity: loc(0.4), textShadow: '0 4px 14px rgba(0,0,0,0.9)'}}>{os('inc-1', 1)}</div>
          <Chip x={74} y={448} a={loc(0.65)} size={44}>{os('inc-1', 2)}</Chip>
          <Leader from={{x: at(1.3, 0).x, y: at(0, 3.05).y + 44}} to={at(1.3, 2.86)} a={lid} color="#bcd3f5" />
          <Chip x={at(1.3, 0).x - 110} y={at(0, 3.05).y - 30} a={lid} size={50} color="#bcd3f5">{os('inc-1', 3)}</Chip>
          {sealed > 0 ? (
            <div style={{position: 'absolute', left: 70, top: 226, opacity: sealed, display: 'flex', alignItems: 'center', gap: 26}}>
              <svg width={170} height={170}>
                <circle cx={85} cy={85} r={70} fill="rgba(5,8,14,0.75)" stroke="rgba(255,255,255,0.22)" strokeWidth={12} />
                <circle cx={85} cy={85} r={70} fill="none" stroke={C.red} strokeWidth={12} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - sweep * 0.92} transform="rotate(-90 85 85)" />
                <line x1={85} y1={85} x2={85 + Math.sin(sweep * 0.92 * 6.283) * 48} y2={85 - Math.cos(sweep * 0.92 * 6.283) * 48} stroke={C.white} strokeWidth={7} strokeLinecap="round" />
              </svg>
              <div style={{fontFamily: FONT.display, fontSize: 66, lineHeight: 1.05, color: C.white, width: 560, textShadow: '0 4px 16px #000'}}>{os('inc-1', 4)}</div>
            </div>
          ) : null}
        </>
      ) : null}

      {/* the tape */}
      {shot(T.five + 0.9, T.i3) ? (
        <>
          <Dim from={at(-0.62, 0)} to={at(-0.62, TRAY_Y + 0.06)} a={ramp(t, T.five + 0.95, T.five + 1.4, E.out)} />
          <Big x={at(-0.62, 0).x - 40} y={at(0, TRAY_Y / 2).y - 76} a={spot} size={150} color={C.yellow} align="right" stroke={10}>{os('inc-2', 1)}</Big>
          <Reticle at={tape} r={58} a={spot} time={t} color={cant ? C.red : C.yellow} />
          <Chip x={Math.min(tape.x + 84, 620)} y={tape.y - 40} a={spot} size={54} color={cant ? C.red : C.yellow}>{cant ? os('inc-2', 2) : os('inc-2', 0)}</Chip>
        </>
      ) : null}
      <Chip x={540} y={236} a={fast} size={64} align="center">{os('inc-3', 4)}</Chip>

      {/* on the rim */}
      {shot(T.sits, T.i6) ? (
        <>
          <Leader from={{x: aHip.x - 190, y: aHip.y - 250}} to={aHip} a={likely} />
          <Chip x={70} y={aHip.y - 322} a={likely} size={52}>{os('inc-5', 0)}</Chip>
          {pooled > 0 ? (
            <>
              <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, opacity: pooled}}>
                <ellipse cx={at(0, 0).x} cy={at(0, 0.62).y} rx={1.12 * v.s} ry={0.86 * v.s} fill="none" stroke={C.cyan} strokeWidth={4} strokeDasharray="18 16" strokeDashoffset={-t * 30} />
              </svg>
              <Chip x={540} y={at(0, 1.6).y - 74} a={pooled} size={46} color={C.cyan} align="center">{os('inc-5', 1)}</Chip>
            </>
          ) : null}
        </>
      ) : null}

      {/* who he is, and the moment */}
      {shot(T.i8, T.i9) ? (
        <>
          <Chip x={70} y={bHead.y - 250} a={years} size={60}>{os('inc-8', 0)}</Chip>
          <Chip x={70} y={bHead.y + 330} a={taught} size={54}>{os('inc-8', 1)}</Chip>
          <Chip x={70} y={bHead.y + 420} a={taught} size={54}>{os('inc-8', 2)}</Chip>
        </>
      ) : null}
      {banner > 0 ? (
        <>
          <div style={{position: 'absolute', left: 0, top: 216, width: W, display: 'flex', justifyContent: 'center', opacity: banner, transform: `scale(${bannerScale}) rotate(-2deg)`}}>
            <div style={{background: C.yellow, color: '#07090d', padding: '16px 34px 12px', fontFamily: FONT.display, fontSize: 56, letterSpacing: '0.02em', boxShadow: '0 20px 50px rgba(0,0,0,0.6)', whiteSpace: 'nowrap'}}>{os('stop-1', 0)}</div>
          </div>
          {t >= T.stayOut ? (
            <div style={{position: 'absolute', left: 0, top: 880, width: W, textAlign: 'center', fontFamily: FONT.display, fontSize: 236, lineHeight: 1, color: C.red, transform: `scale(${0.6 + 0.4 * stay})`, opacity: Math.min(1, stay * 2) * banner, WebkitTextStroke: '14px #04060a', paintOrder: 'stroke fill', filter: 'drop-shadow(0 16px 30px rgba(0,0,0,0.8))'}}>{os('stop-1', 1)}</div>
          ) : null}
        </>
      ) : null}

      {/* rescue: under two minutes to arrive, nearly ten to get them air */}
      {bar > 0 ? (
        <div style={{position: 'absolute', left: 70, top: 232, width: 940, opacity: bar}}>
          <div style={{position: 'relative', height: 26, background: 'rgba(255,255,255,0.14)', borderRadius: 5}}>
            <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${fillK * 100}%`, background: C.red, borderRadius: 5}} />
            <div style={{position: 'absolute', left: '19%', top: -14, bottom: -14, width: 5, background: C.yellow}} />
            <div style={{position: 'absolute', left: '96%', top: -14, bottom: -14, width: 5, background: C.white}} />
          </div>
          <div style={{position: 'absolute', left: '19%', top: 52, transform: `scale(${0.8 + 0.2 * arrive})`, transformOrigin: '0 0', opacity: t >= word('inc-11', 'under') - 0.05 ? 1 : 0}}>
            <div style={{fontFamily: FONT.display, fontSize: 70, lineHeight: 1, color: C.yellow, textShadow: '0 4px 16px #000'}}>{os('inc-11', 1)}</div>
            <div style={{fontFamily: FONT.mono, fontWeight: 700, fontSize: 26, letterSpacing: '0.14em', color: C.white, marginTop: 6}}>{os('inc-11', 0)}</div>
          </div>
          <div style={{position: 'absolute', right: 0, top: 52, textAlign: 'right', transform: `scale(${0.8 + 0.2 * ten})`, transformOrigin: '100% 0', opacity: t >= T.nearlyTen + 0.25 ? 1 : 0}}>
            <div style={{fontFamily: FONT.display, fontSize: 70, lineHeight: 1, color: C.red, textShadow: '0 4px 16px #000'}}>{os('inc-11', 3)}</div>
            <div style={{fontFamily: FONT.mono, fontWeight: 700, fontSize: 26, letterSpacing: '0.14em', color: C.white, marginTop: 6}}>{os('inc-11', 4)}</div>
          </div>
        </div>
      ) : null}
      {dim24 > 0 ? (
        <>
          <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, opacity: dim24}}>
            {[8, 4].map((w) => (
              <g key={w} stroke={w === 8 ? 'rgba(0,0,0,0.6)' : C.yellow} strokeWidth={w} fill="none">
                <line x1={at(-D.manwayR, 0).x} y1={at(0, -0.62).y} x2={at(D.manwayR, 0).x} y2={at(0, -0.62).y} />
                <line x1={at(-D.manwayR, 0).x} y1={at(0, -0.62).y + 26} x2={at(-D.manwayR, 0).x} y2={at(0, -0.02).y} strokeDasharray="10 8" />
                <line x1={at(D.manwayR, 0).x} y1={at(0, -0.62).y + 26} x2={at(D.manwayR, 0).x} y2={at(0, -0.02).y} strokeDasharray="10 8" />
              </g>
            ))}
          </svg>
          <Big x={at(0, 0).x} y={at(0, -0.62).y + 30} a={dim24} size={150} color={C.yellow} stroke={10}>{os('inc-11', 2)}</Big>
        </>
      ) : null}

      {/* the lesson: the third man stops, and calls it in */}
      {shot(T.l3, T.tribute) ? (
        <>
          <div style={{position: 'absolute', left: 70, top: 226, opacity: stat}}>
            <div style={{display: 'flex', alignItems: 'baseline', gap: 22}}>
              <div style={{fontFamily: FONT.display, fontSize: 170, lineHeight: 0.9, color: C.yellow, WebkitTextStroke: '8px #04060a', paintOrder: 'stroke fill'}}>{os('lesson-3', 2)}</div>
              <div>
                <div style={{fontFamily: FONT.label, fontWeight: 600, fontSize: 34, letterSpacing: '0.05em', color: C.white, textShadow: '0 3px 12px #000'}}>{os('lesson-3', 3)}</div>
                <div style={{fontFamily: FONT.display, fontSize: 54, color: C.white, textShadow: '0 3px 12px #000'}}>{os('lesson-3', 4)}</div>
              </div>
            </div>
          </div>
          {t >= T.doNot ? (
            <div style={{position: 'absolute', left: 70, top: 940, transform: `scale(${0.75 + 0.25 * no})`, transformOrigin: '0 50%', opacity: Math.min(1, no * 2)}}>
              <div style={{background: C.red, color: C.white, fontFamily: FONT.display, fontSize: 96, padding: '12px 34px 6px', boxShadow: '0 20px 50px rgba(0,0,0,0.6)'}}>{os('lesson-3', 0)}</div>
            </div>
          ) : null}
          {t >= T.callIt ? (
            <>
              <div style={{position: 'absolute', left: 70, top: 1080, transform: `scale(${0.75 + 0.25 * call})`, transformOrigin: '0 50%', opacity: Math.min(1, call * 2)}}>
                <div style={{background: C.yellow, color: '#07090d', fontFamily: FONT.display, fontSize: 96, padding: '12px 34px 6px', boxShadow: '0 20px 50px rgba(0,0,0,0.6)'}}>{os('lesson-3', 1)}</div>
              </div>
              <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
                {[0, 1, 2].map((i) => {
                  const k = ((t - T.callIt) * 1.5 + i / 3) % 1;
                  return <circle key={i} cx={hand.x} cy={hand.y} r={30 + k * 170} fill="none" stroke={C.yellow} strokeWidth={6} opacity={(1 - k) * 0.9} />;
                })}
              </svg>
            </>
          ) : null}
        </>
      ) : null}

      {/* tribute */}
      {shot(T.tribute, T.signoff) ? (
        <div style={{position: 'absolute', left: 0, top: 252, width: W, textAlign: 'center'}}>
          <div style={{fontFamily: FONT.mono, fontWeight: 500, fontSize: 32, letterSpacing: '0.42em', color: C.mute, opacity: mem(0.15)}}>{os('tribute-1', 0)}</div>
          <div style={{fontFamily: FONT.display, fontSize: 104, color: C.white, marginTop: 18, opacity: mem(0.4), letterSpacing: '0.012em', textShadow: '0 8px 30px rgba(0,0,0,0.8)'}}>{os('tribute-1', 1)}</div>
          <div style={{fontFamily: FONT.label, fontWeight: 600, fontSize: 46, letterSpacing: '0.1em', color: C.yellow, marginTop: 12, opacity: mem(0.7)}}>{os('tribute-1', 2).toUpperCase()}</div>
          <div style={{width: 120, height: 4, background: C.yellow, margin: '40px auto 30px', opacity: win(t, T.weTell, T.signoff, 0.5, 0.25)}} />
          <div style={{fontFamily: FONT.label, fontWeight: 500, fontSize: 52, color: C.white, opacity: win(t, T.weTell + 0.2, T.signoff, 0.5, 0.25) * 0.94, textShadow: '0 4px 18px rgba(0,0,0,0.9)'}}>{os('tribute-1', 3)}</div>
        </div>
      ) : null}

      <Captions time={t} beats={BEATS} hide={hideCaption} yFor={captionY} />
    </div>
  );
};

// These beats are set as full-screen type instead of captions.
const hideCaption = (id: string) => id === 'inc-6' || id === 'signoff';
const captionY = (id: string) => (id === 'tribute-1' ? 1336 : undefined);
