import React from 'react';
import script from '../../../videos/001-valero-nitrogen-duct-tape/script.json';
import {joints} from '../engine2d/Pictogram';
import {P} from '../engine2d/view';
import {Captions} from '../engine/Captions';
import {Big, Chip, Dim, Grade, Leader, Reticle, Tag} from '../engine/hud';
import {C, FONT, FPS, H, W} from '../engine/theme';
import {E, clamp, ramp, spring, window as win} from '../engine/time';
import {actorA, actorB, actorC} from './actors';
import {half} from './Section';
import {BAR_X, SIGN_X} from './World';
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

  const giant = win(t, T.standing + 1.0, T.ma2, 0.3, 0.12);

  // ---- the job
  const loc = (k: number) => win(t, T.i1 + k, T.out - 0.05, 0.3, 0.15);
  const lid = win(t, T.i1 + 0.9, T.out, 0.3, 0.12);

  // ---- the gas coming out, and the man leaning over it
  const leak = win(t, T.leaking + 0.1, T.lean + 0.7, 0.25, 0.2);
  const ring = win(t, T.lean + 0.9, T.f1, 0.3, 0.05);
  const aHead = pt(joints(v, actorA(t)).head);

  // ---- nothing warns them
  const noSign = win(t, T.noSign + 0.05, T.permit, 0.2, 0.1);
  const noBarrier = win(t, T.noBarrier + 0.05, T.permit, 0.2, 0.1);

  // ---- what the training covered
  const inside = win(t, T.tr + 0.5, T.i2, 0.3, 0.15);
  const outside = win(t, T.never, T.i2, 0.25, 0.15);
  const cavity = (() => {
    const pts: string[] = [];
    for (let i = 0; i <= 30; i++) {
      const y = TRAY_Y + 0.08 + ((0 - TRAY_Y - 0.08) * i) / 30;
      pts.push(`${at(half(y) - 0.03, y).x},${at(0, y).y}`);
    }
    for (let i = 30; i >= 0; i--) {
      const y = TRAY_Y + 0.08 + ((0 - TRAY_Y - 0.08) * i) / 30;
      pts.push(`${at(-half(y) + 0.03, y).x},${at(0, y).y}`);
    }
    return pts.join(' ');
  })();

  // ---- the tape
  const spot = win(t, T.five + 0.95, T.i3, 0.25, 0.15);
  const cant = t >= T.comeOut;
  const fast = win(t, T.wire + 0.15, T.wire + 1.7, 0.2, 0.25);

  // ---- on the rim
  const likely = win(t, T.sits + 0.35, T.calm + 0.25, 0.25, 0.2);
  const pooled = win(t, T.calm + 0.35, T.i6, 0.3, 0.01);
  const a = actorA(t);
  const aHip = at(a.x, a.y + 0.45);

  // ---- who he is
  const bHead = pt(joints(v, actorB(t), true).head);
  const years = win(t, word('inc-8', 'twenty-five') - 0.1, T.stop, 0.25, 0.15);
  const taught = win(t, T.taught + 0.3, T.stop, 0.25, 0.15);
  const banner = win(t, T.stop + 0.1, T.br1, 0.01, 0.12);
  const bannerScale = 1 + 0.9 * Math.pow(1 - clamp((t - T.stop - 0.1) / 0.22), 3);
  const stay = pop(t, T.stayOut);

  // ---- rescue
  const arrive = pop(t, word('inc-11', 'under') - 0.05);
  const arrived = win(t, word('inc-11', 'under') - 0.05, T.meter + 0.9, 0.01, 0.2);
  const zero = pop(t, T.nearZero);

  // ---- afterwards
  const putUp = win(t, T.wentUp + 0.55, T.l2, 0.25, 0.1);
  const before = win(t, T.required + 0.15, T.l2, 0.25, 0.1);

  // ---- the picture to remember
  const zone = win(t, T.l2 + 0.25, T.l3, 0.3, 0.1);

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

      {/* the job */}
      {shot(T.i1, T.out) ? (
        <>
          <Big x={70} y={226} a={loc(0.15)} size={124} align="left" stroke={8}>{os('inc-1', 0)}</Big>
          <div style={{position: 'absolute', left: 74, top: 362, fontFamily: FONT.label, fontWeight: 700, fontSize: 60, letterSpacing: '0.06em', color: C.yellow, opacity: loc(0.4), textShadow: '0 4px 14px rgba(0,0,0,0.9)'}}>{os('inc-1', 1)}</div>
          <Leader from={{x: at(1.3, 0).x, y: at(0, 3.05).y + 44}} to={at(1.3, 2.86)} a={lid} color="#bcd3f5" />
          <Chip x={at(1.3, 0).x - 110} y={at(0, 3.05).y - 30} a={lid} size={50} color="#bcd3f5">{os('inc-1', 2)}</Chip>
        </>
      ) : null}

      {/* the gas keeps coming out; lean over it and that is what you could be breathing */}
      {shot(T.out, T.f1) ? (
        <>
          <Big x={540} y={232} a={leak} size={150} stroke={10} color={C.cyan}>{os('out-1', 0)}</Big>
          {ring > 0 ? (
            <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, opacity: ring}}>
              <circle cx={aHead.x} cy={aHead.y} r={0.3 * v.s * (1.5 - 0.5 * ring)} fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth={12} />
              <circle cx={aHead.x} cy={aHead.y} r={0.3 * v.s * (1.5 - 0.5 * ring)} fill="none" stroke={C.cyan} strokeWidth={6} strokeDasharray="20 14" strokeDashoffset={-t * 40} />
            </svg>
          ) : null}
        </>
      ) : null}

      {/* nothing warns them: where the sign and the barrier should have been */}
      {shot(T.f1, T.permit) ? (
        <>
          <Chip x={at(SIGN_X, 0).x - 330} y={at(0, 2.2).y - 110} a={noSign} size={54} color={C.red} mark="✕">{os('flag-1', 0)}</Chip>
          <Chip x={at(-BAR_X, 0).x} y={at(0, 0).y + 64} a={noBarrier} size={54} color={C.red} mark="✕">{os('flag-1', 1)}</Chip>
        </>
      ) : null}

      {/* training covered the inside of the tank; it never covered the air outside it */}
      {shot(T.tr, T.i2) ? (
        <>
          <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
            <polygon points={cavity} fill="rgba(244,246,250,0.10)" stroke={C.white} strokeWidth={5} strokeDasharray="18 12" opacity={inside} />
            <ellipse cx={at(0, 0).x} cy={at(0, 0.84).y} rx={1.62 * v.s} ry={1.12 * v.s} fill="rgba(255,59,47,0.13)" stroke={C.red} strokeWidth={6} strokeDasharray="20 14" strokeDashoffset={-t * 34} opacity={outside} />
          </svg>
          <Chip x={540} y={at(0, TRAY_Y).y + 50} a={inside} size={52} color={C.white} mark="✓" align="center">{os('train-1', 0)}</Chip>
          <Chip x={540} y={at(0, 2.0).y - 118} a={outside} size={64} color={C.red} mark="✕" align="center">{os('train-1', 1)}</Chip>
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
              <Chip x={540} y={at(0, 1.6).y - 74} a={pooled} size={46} color={C.cyan} align="center">{os('calm-1', 0)}</Chip>
            </>
          ) : null}
        </>
      ) : null}

      {/* who he is, and the moment */}
      {shot(T.i8, T.br1) ? (
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

      {/* rescue: there in under two minutes; the meter alarms the moment it is in the hole */}
      {shot(T.i11, T.i12) ? (
        <>
          <div style={{position: 'absolute', left: 70, top: 232, opacity: arrived, transform: `scale(${0.8 + 0.2 * arrive})`, transformOrigin: '0 0'}}>
            <div style={{fontFamily: FONT.mono, fontWeight: 700, fontSize: 30, letterSpacing: '0.16em', color: C.white, textShadow: '0 3px 12px #000'}}>{os('inc-11', 0)}</div>
            <div style={{fontFamily: FONT.display, fontSize: 132, lineHeight: 1.02, color: C.yellow, WebkitTextStroke: '8px #04060a', paintOrder: 'stroke fill'}}>{os('inc-11', 1)}</div>
          </div>
          {t >= T.nearZero ? (
            <div style={{position: 'absolute', left: 0, top: 236, width: W, textAlign: 'center', fontFamily: FONT.display, fontSize: 124, lineHeight: 1, color: C.red, whiteSpace: 'nowrap', transform: `scale(${0.7 + 0.3 * zero})`, opacity: Math.min(1, zero * 2), WebkitTextStroke: '10px #04060a', paintOrder: 'stroke fill', filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.8))'}}>{os('inc-11', 2)}</div>
          ) : null}
        </>
      ) : null}

      {/* afterwards: the sign that the site's own rules had called for */}
      {shot(T.af, T.l2) ? (
        <>
          <Leader from={{x: 470, y: 292}} to={at(SIGN_X - 0.42, 1.86)} a={putUp} color={C.red} />
          <Chip x={70} y={246} a={putUp} size={66} color={C.red}>{os('after-1', 0)}</Chip>
          <Chip x={70} y={372} a={before} size={66} color={C.yellow}>{os('after-1', 1)}</Chip>
        </>
      ) : null}

      {/* the picture to remember: outside the tank, and in it all the same */}
      {shot(T.l2, T.l3) ? (
        <>
          <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, opacity: zone}}>
            <ellipse cx={at(0, 0).x} cy={at(0, 0.72).y} rx={1.18 * v.s} ry={0.9 * v.s} fill="rgba(255,59,47,0.10)" stroke={C.red} strokeWidth={6} strokeDasharray="20 14" strokeDashoffset={-t * 34} />
          </svg>
          <Chip x={540} y={236} a={zone} size={62} color={C.red} align="center">{os('lesson-2', 0)}</Chip>
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
