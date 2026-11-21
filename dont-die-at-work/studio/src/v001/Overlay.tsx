import React from 'react';
import script from '../../../videos/001-valero-nitrogen-duct-tape/script.json';
import {project} from '../engine/cam';
import {Captions} from '../engine/Captions';
import {handPos} from '../engine/Figure';
import {Big, Chip, Dim, Grade, Leader, Reticle, Tag} from '../engine/hud';
import {C, FONT, FPS, H, W} from '../engine/theme';
import {E, clamp, lerp, ramp, spring, window as win} from '../engine/time';
import {actorC, hookTip} from './actors';
import {cameraAt} from './direct';
import {TAPE, TRAY_Y} from './dims';
import {B, BEATS, T, word} from './timeline';

/**
 * Every word on screen comes out of script.json, which the verify gate has
 * already checked against the source report. Nothing is typed in here.
 */
const os = (beat: string, i: number): string => {
  const b = (script.beats as {id: string; onscreen: string[]}[]).find((x) => x.id === beat);
  if (!b || b.onscreen[i] === undefined) throw new Error(`no on-screen text ${beat}[${i}]`);
  return b.onscreen[i];
};
const SRC = `SOURCE: U.S. CHEMICAL SAFETY BOARD · CASE STUDY ${script.source.report_no}`;

const Permit: React.FC<{t: number}> = ({t}) => {
  const a = win(t, T.permit, T.full + 0.05, 0.4, 0.28);
  if (a <= 0) return null;
  const inK = clamp(spring(t - T.permit, 2.6, 0.7), 0, 1.1);
  const out = ramp(t, T.full - 0.23, T.full + 0.05, E.in);
  const circle = ramp(t, T.leftOut - 0.05, T.leftOut + 0.5, E.inOutQuad);
  const row = (label: string, w: number) => (
    <div style={{display: 'flex', alignItems: 'center', gap: 20, marginTop: 26}}>
      <div style={{fontFamily: FONT.mono, fontSize: 24, color: '#6a6558', letterSpacing: '0.1em', width: 150}}>{label}</div>
      <div style={{height: 18, width: w, background: '#c9c2ad', borderRadius: 3}} />
    </div>
  );
  const box = (label: string, checked: boolean) => (
    <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
      <div style={{width: 50, height: 50, border: '5px solid #1b1d22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT.display, fontSize: 46, color: '#1b1d22', lineHeight: 1}}>{checked ? '✕' : ''}</div>
      <div style={{fontFamily: FONT.label, fontWeight: 700, fontSize: 50, color: '#1b1d22'}}>{label}</div>
    </div>
  );
  return (
    <div style={{position: 'absolute', left: 110, top: 350, width: 860, transform: `translateY(${(1 - inK) * 900 - out * 1300}px) rotate(${-2.2 + out * -6}deg)`, background: '#ece6d4', boxShadow: '0 40px 90px rgba(0,0,0,0.75)', borderRadius: 6, overflow: 'hidden'}}>
      <div style={{background: '#1b1d22', color: '#ece6d4', padding: '26px 44px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
        <div style={{fontFamily: FONT.display, fontSize: 68, letterSpacing: '0.03em'}}>{os('hidden-1', 0)}</div>
        <div style={{fontFamily: FONT.mono, fontSize: 24, opacity: 0.6, letterSpacing: '0.12em'}}>R1</div>
      </div>
      <div style={{padding: '18px 44px 46px'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 20, marginTop: 22}}>
          <div style={{fontFamily: FONT.mono, fontSize: 24, color: '#6a6558', letterSpacing: '0.1em', width: 150}}>WORK</div>
          <div style={{fontFamily: FONT.label, fontWeight: 600, fontSize: 44, color: '#1b1d22', letterSpacing: '0.02em'}}>{os('hidden-1', 1)}</div>
        </div>
        {row('HAZARDS', 470)}
        {row('PPE', 330)}
        <div style={{marginTop: 40, borderTop: '4px solid #1b1d22', paddingTop: 30}}>
          <div style={{fontFamily: FONT.label, fontWeight: 700, fontSize: 56, color: '#1b1d22', letterSpacing: '0.02em'}}>{os('hidden-1', 2)}</div>
          <div style={{display: 'flex', gap: 62, marginTop: 28, position: 'relative'}}>
            {box(os('hidden-1', 3), false)}
            {box(os('hidden-1', 4), false)}
            {box(os('hidden-1', 5), true)}
            <svg width={300} height={140} style={{position: 'absolute', left: 452, top: -44, overflow: 'visible'}}>
              <ellipse cx={128} cy={70} rx={136} ry={58} fill="none" stroke={C.red} strokeWidth={10} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - circle} transform="rotate(-5 128 70)" />
            </svg>
          </div>
        </div>
        {row('ISSUED', 260)}
      </div>
    </div>
  );
};

export const Overlay: React.FC<{time: number}> = ({time: t}) => {
  const cam = cameraAt(t);
  const P = (p: [number, number, number]) => project(cam, p);
  const inShot = (a: number, b: number) => t >= a && t < b;

  // ---- hook: the air you breathe
  const air = win(t, word('hook-2', 'breathing') - 0.05, T.est, 0.2, 0.12);
  const airPop = 1 + 0.35 * Math.pow(1 - clamp((t - word('hook-2', 'breathing') + 0.05) / 0.25), 3);

  // ---- establishing card
  const loc = (d: number) => win(t, T.est + d, T.job - 0.05, 0.3, 0.2);

  // ---- the job
  const job = win(t, T.job + 0.3, T.spot, 0.3, 0.15);

  // ---- tape spotted / five feet
  const tape = P([TAPE[0], TAPE[1] - 0.02, TAPE[2]]);
  const spot = win(t, T.spot + 0.35, T.five, 0.25, 0.01);
  const five = win(t, T.five + 0.5, T.goingIn, 0.3, 0.15);
  const cant = t >= T.cant;
  const dimTop = P([-0.72, 0, 0.5]);
  const dimBot = P([-0.72, TRAY_Y, 0.5]);

  // ---- going in means...
  const chipA = win(t, word('buildup-3', 'permit') - 0.08, T.hook, 0.22, 0.12);
  const chipB = win(t, word('buildup-3', 'permit') + 0.1, T.hook, 0.22, 0.12);
  const chipC = win(t, T.delay - 0.05, T.hook, 0.2, 0.12);
  const hook = win(t, T.hook + 0.5, T.permit, 0.3, 0.15);
  const tip = P(hookTip(t));

  // ---- nitrogen / missing
  const n2 = win(t, T.nitrogen, T.noSign, 0.3, 0.15);
  const n2At = P([0.62, -0.95, 0.9]);
  const noSign = win(t, T.noSign + 0.15, T.smell, 0.22, 0.01);
  const noBarr = win(t, T.noBarr + 0.15, T.smell, 0.22, 0.01);
  const signAt = P([1.2, 1.42, 1.1]);
  const barrAt = P([-0.5, 0.98, 1.54]);

  // ---- oxygen
  const smell = win(t, B['hidden-2'].start, T.first, 0.2, 0.15);
  const color = win(t, word('hidden-2', 'No', 1), T.first, 0.2, 0.15);
  const o2 = win(t, T.oxygen, T.first, 0.25, 0.15);
  const o2bar = lerp(1, 0.025, ramp(t, T.oxygen + 0.12, word('hidden-2', 'no', 2) + 0.05, E.inOutQuad));
  const zeroAt = word('hidden-2', 'no', 2);
  const o2zero = t >= zeroAt;

  // ---- ledge
  const ledge = win(t, T.sit + 0.3, T.black, 0.2, 0.01);
  const ledgeAt = P([-0.36, 0.42, 0.1]);

  // ---- nobody saw
  const black = inShot(T.black, T.air);

  // ---- breaths
  const br = win(t, T.air + 0.25, T.foreman, 0.25, 0.12);
  const pip = (at: number) => clamp(spring(t - at, 3.2, 0.5), 0, 1.25);

  // ---- the moment
  const stamp = win(t, T.third + 0.12, T.responders, 0.01, 0.12);
  const stampScale = 1 + 0.9 * Math.pow(1 - clamp((t - T.third - 0.12) / 0.22), 3);
  const stay = win(t, T.stops + 0.05, T.responders, 0.22, 0.12);
  const radio = win(t, T.radios + 0.05, T.responders, 0.22, 0.12);
  const hand = P(handPos(actorC(t), -1));

  // ---- responders
  const two = win(t, T.responders + 0.25, T.lesson, 0.25, 0.12);
  const sweep = ramp(t, T.responders + 0.3, T.two + 0.35, E.out);

  // ---- lesson card
  const les = win(t, T.lesson + 0.12, T.tribute, 0.25, 0.15);
  const statPop = 1 + 0.4 * Math.pow(1 - clamp((t - T.lesson - 0.12) / 0.3), 3);
  const never = clamp(spring(t - word('lesson-1', 'tank') + 0.05, 3, 0.6), 0, 1.15);

  // ---- tribute + sign-off
  const mem = (d: number) => win(t, T.tribute + d, T.signoff, 0.5, 0.25, E.inOut);
  const line = (d: number) => win(t, T.weTell + d, T.signoff, 0.5, 0.25, E.inOut);
  const slam = (at: number) => clamp(spring(t - at + 0.03, 3.4, 0.6), 0, 1.2);
  const end = t >= T.signoff;
  const fadeOut = 1 - ramp(t, T.end - 0.3, T.end - 0.02);

  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden'}}>
      <Grade frame={Math.round(t * FPS)} />

      {/* provenance, always on */}
      <div style={{position: 'absolute', left: 70, top: 96, opacity: end ? 0 : 0.78}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 12, fontFamily: FONT.mono, fontWeight: 700, fontSize: 23, letterSpacing: '0.16em', color: C.white}}>
          <span style={{width: 13, height: 13, borderRadius: 13, background: C.yellow, display: 'inline-block'}} />
          ANIMATED RECONSTRUCTION
        </div>
        <div style={{fontFamily: FONT.mono, fontSize: 19, letterSpacing: '0.1em', color: C.mute, marginTop: 7}}>{SRC}</div>
      </div>

      {/* hook */}
      <Tag x={540} y={258} a={air} align="center" color={C.white} size={34}>{os('hook-2', 0)}</Tag>
      <Big x={540} y={306} a={air} size={236} color={C.cyan} stroke={10} scale={airPop}>{os('hook-2', 1)}</Big>
      <Big x={540} y={538} a={air} size={96} color={C.white} stroke={8}>{os('hook-2', 2)}</Big>

      {inShot(0, T.hook2) ? <Reticle at={tape} r={170} a={win(t, word('hook-1', 'duct') - 0.1, T.hook2, 0.22, 0.01)} time={t} /> : null}

      {/* where and when */}
      <Big x={70} y={236} a={loc(0.2)} size={128} align="left" stroke={8}>{os('buildup-1', 0)}</Big>
      <div style={{position: 'absolute', left: 74, top: 376, fontFamily: FONT.label, fontWeight: 700, fontSize: 62, letterSpacing: '0.06em', color: C.yellow, opacity: loc(0.45), textShadow: '0 4px 14px rgba(0,0,0,0.9)'}}>{os('buildup-1', 1)}</div>
      <Chip x={74} y={466} a={loc(0.7)} size={44}>{os('buildup-1', 2)}</Chip>

      {/* the job */}
      <Tag x={74} y={246} a={job} color={C.cyan} size={32}>{os('buildup-1', 3)}</Tag>
      <Big x={70} y={292} a={job} size={84} align="left" stroke={8}>{os('buildup-1', 4)}</Big>

      {/* the tape */}
      {inShot(T.spot, T.five) ? (
        <>
          <Reticle at={tape} r={46} a={spot} time={t} />
          <Chip x={Math.min(tape.x + 70, 640)} y={tape.y - 34} a={spot} size={48}>{os('buildup-2', 0)}</Chip>
        </>
      ) : null}
      {inShot(T.five, T.goingIn) ? (
        <>
          <Dim from={dimTop} to={dimBot} a={ramp(t, T.five + 0.5, T.five + 1.0, E.out)} />
          <Big x={dimTop.x - 44} y={(dimTop.y + dimBot.y) / 2 - 70} a={five} size={132} color={C.yellow} align="right" stroke={10}>{os('buildup-2', 1)}</Big>
          <Reticle at={tape} r={34} a={five} time={t} color={cant ? C.red : C.yellow} />
          <Chip x={tape.x + 56} y={tape.y - 30} a={five} size={44} color={cant ? C.red : C.yellow}>{cant ? os('buildup-2', 2) : os('buildup-2', 0)}</Chip>
        </>
      ) : null}

      {/* going in means... */}
      <Chip x={540} y={800} a={chipA} align="center" size={50} mark="+">{os('buildup-3', 0)}</Chip>
      <Chip x={540} y={888} a={chipB} align="center" size={50} mark="+">{os('buildup-3', 1)}</Chip>
      <Big x={540} y={990} a={chipC} size={150} color={C.red} stroke={10} scale={1 + 0.5 * Math.pow(1 - clamp((t - T.delay + 0.05) / 0.2), 3)}>= {os('buildup-3', 2)}</Big>
      {inShot(T.hook, T.permit) ? (
        <>
          <Leader from={{x: tip.x, y: tip.y - 170}} to={{x: tip.x - 130, y: tip.y - 280}} a={hook} />
          <Chip x={Math.max(70, tip.x - 470)} y={tip.y - 352} a={hook} size={50}>{os('buildup-3', 3)}</Chip>
        </>
      ) : null}

      {/* the permit */}
      <Permit t={t} />

      {/* nitrogen, and what was not there */}
      {inShot(T.full, T.noSign) ? (
        <>
          <Leader from={n2At} to={{x: n2At.x + 40, y: n2At.y - 150}} a={n2} color={C.cyan} />
          <Chip x={Math.min(n2At.x - 40, 640)} y={n2At.y - 228} a={n2} size={54} color={C.cyan}>{os('hidden-1', 6)}</Chip>
        </>
      ) : null}
      {inShot(T.noSign, T.smell) ? (
        <>
          <Leader from={signAt} to={{x: Math.min(signAt.x, 900) - 60, y: signAt.y - 110}} a={noSign} color={C.red} />
          <Chip x={Math.min(signAt.x, 900) - 420} y={signAt.y - 180} a={noSign} size={50} color={C.red} mark="✕">{os('hidden-1', 7)}</Chip>
          <Leader from={barrAt} to={{x: barrAt.x - 20, y: barrAt.y + 120}} a={noBarr} color={C.red} />
          <Chip x={Math.max(70, barrAt.x - 180)} y={barrAt.y + 120} a={noBarr} size={50} color={C.red} mark="✕">{os('hidden-1', 8)}</Chip>
        </>
      ) : null}

      {/* no smell, no colour, no oxygen */}
      <Chip x={70} y={236} a={smell} size={50} color={C.cyan} mark="✕">{os('hidden-2', 0)}</Chip>
      <Chip x={70} y={326} a={color} size={50} color={C.cyan} mark="✕">{os('hidden-2', 1)}</Chip>
      {o2 > 0 ? (
        <div style={{position: 'absolute', left: 0, top: 742, width: W, opacity: o2}}>
          <Tag x={540} y={0} a={1} align="center" size={32}>{o2zero ? os('hidden-2', 2) : os('hidden-2', 4)}</Tag>
          <Big x={540} y={44} a={1} size={o2zero ? 150 : 190} color={o2zero ? C.red : C.white} stroke={10} scale={o2zero ? 1 + 0.25 * Math.pow(1 - clamp((t - zeroAt) / 0.25), 3) : 1}>
            {o2zero ? os('hidden-2', 7) : os('hidden-2', 3)}
          </Big>
          <div style={{position: 'absolute', left: 190, top: 300, width: 700, height: 22, background: 'rgba(255,255,255,0.16)', borderRadius: 4}}>
            <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${o2bar * 100}%`, background: o2bar < 0.93 ? C.red : C.cyan, borderRadius: 4}} />
            <div style={{position: 'absolute', left: '100%', top: -12, bottom: -12, width: 4, background: C.white}} />
            <div style={{position: 'absolute', left: `${(19.5 / 21) * 100}%`, top: -12, bottom: -12, width: 4, background: C.yellow}} />
            <div style={{position: 'absolute', right: 0, top: -50, fontFamily: FONT.mono, fontWeight: 700, fontSize: 24, letterSpacing: '0.1em', color: C.white, whiteSpace: 'nowrap', textShadow: '0 2px 8px #000'}}>
              {os('hidden-2', 3)} {os('hidden-2', 4)}
            </div>
            <div style={{position: 'absolute', right: 46, top: 40, fontFamily: FONT.mono, fontWeight: 700, fontSize: 24, letterSpacing: '0.1em', color: C.yellow, whiteSpace: 'nowrap', textShadow: '0 2px 8px #000'}}>
              {os('hidden-2', 5)} {os('hidden-2', 6)}
            </div>
          </div>
        </div>
      ) : null}

      {/* the ledge */}
      {inShot(T.sit, T.black) ? (
        <>
          <Leader from={ledgeAt} to={{x: ledgeAt.x + 150, y: ledgeAt.y + 170}} a={ledge} />
          <Chip x={ledgeAt.x + 100} y={ledgeAt.y + 170} a={ledge} size={44}>{os('reveal-1', 0)}</Chip>
          <Chip x={ledgeAt.x + 100} y={ledgeAt.y + 244} a={ledge} size={44}>{os('reveal-1', 1)}</Chip>
        </>
      ) : null}

      {/* nobody saw him go in */}
      {black ? (
        <>
          <Big x={540} y={800} a={1} size={150}>{os('reveal-2', 0)}</Big>
          <Big x={540} y={960} a={t >= word('reveal-2', 'go') ? 1 : 0} size={150} color={C.red}>{os('reveal-2', 1)}</Big>
        </>
      ) : null}

      {/* one or two breaths */}
      {br > 0 ? (
        <div style={{position: 'absolute', left: 0, top: 232, width: W, opacity: br}}>
          <div style={{display: 'flex', justifyContent: 'center', gap: 34}}>
            {[T.breath1, T.breath2].map((at, i) => (
              <div key={i} style={{width: 92, height: 92, borderRadius: 92, border: `6px solid ${C.cyan}`, background: t >= at ? C.cyan : 'transparent', transform: `scale(${t >= at ? pip(at) : 1})`, boxShadow: t >= at ? `0 0 40px ${C.cyan}` : undefined}} />
            ))}
          </div>
          <Big x={540} y={124} a={1} size={178} color={C.white} stroke={10}>
            <span style={{color: C.cyan}}>{os('reveal-3', 0)}</span> {os('reveal-3', 1)}
          </Big>
        </div>
      ) : null}

      {/* the moment it could've been stopped */}
      {stamp > 0 ? (
        <div style={{position: 'absolute', left: 0, top: 226, width: W, display: 'flex', justifyContent: 'center', opacity: stamp, transform: `scale(${stampScale}) rotate(-2deg)`}}>
          <div style={{background: C.yellow, color: '#07090d', padding: '18px 40px 14px', textAlign: 'center', fontFamily: FONT.display, boxShadow: '0 20px 50px rgba(0,0,0,0.6)'}}>
            <div style={{fontSize: 62, lineHeight: 1.02, letterSpacing: '0.02em'}}>{os('stop-1', 0)}</div>
            <div style={{fontSize: 82, lineHeight: 1.02, letterSpacing: '0.01em'}}>{os('stop-1', 1)}</div>
          </div>
        </div>
      ) : null}
      <Chip x={70} y={880} a={stay} size={58} mark="✓">{os('stop-1', 2)}</Chip>
      <Chip x={70} y={980} a={radio} size={58} mark="✓">{os('stop-1', 3)}</Chip>
      {radio > 0 ? (
        <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, opacity: radio}}>
          {[0, 1, 2].map((i) => {
            const k = ((t - T.radios) * 1.5 + i / 3) % 1;
            return <circle key={i} cx={hand.x} cy={hand.y} r={30 + k * 170} fill="none" stroke={C.yellow} strokeWidth={6} opacity={(1 - k) * 0.9} />;
          })}
        </svg>
      ) : null}

      {/* under two minutes */}
      {two > 0 ? (
        <div style={{position: 'absolute', left: 70, top: 226, opacity: two, display: 'flex', alignItems: 'center', gap: 30}}>
          <svg width={210} height={210}>
            <circle cx={105} cy={105} r={88} fill="rgba(5,8,14,0.7)" stroke="rgba(255,255,255,0.22)" strokeWidth={14} />
            <circle cx={105} cy={105} r={88} fill="none" stroke={C.yellow} strokeWidth={14} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - sweep * 0.94} transform="rotate(-90 105 105)" />
            <line x1={105} y1={105} x2={105 + Math.sin(sweep * 0.94 * Math.PI * 2) * 62} y2={105 - Math.cos(sweep * 0.94 * Math.PI * 2) * 62} stroke={C.white} strokeWidth={8} strokeLinecap="round" />
          </svg>
          <div>
            <div style={{fontFamily: FONT.mono, fontWeight: 700, fontSize: 40, letterSpacing: '0.2em', color: C.white, textShadow: '0 3px 10px #000'}}>{os('stop-2', 0)}</div>
            <div style={{fontFamily: FONT.display, fontSize: 190, lineHeight: 0.95, color: C.yellow, WebkitTextStroke: '10px #04060a', paintOrder: 'stroke fill'}}>{os('stop-2', 1)}</div>
          </div>
        </div>
      ) : null}

      {/* the lesson */}
      {les > 0 ? (
        <div style={{position: 'absolute', left: 0, top: 250, width: W, opacity: les, textAlign: 'center'}}>
          <div style={{fontFamily: FONT.display, fontSize: 400, lineHeight: 0.9, color: C.yellow, transform: `scale(${statPop})`, filter: 'drop-shadow(0 14px 30px rgba(0,0,0,0.7))'}}>{os('lesson-1', 0)}</div>
          <div style={{fontFamily: FONT.label, fontWeight: 600, fontSize: 52, letterSpacing: '0.07em', color: C.white, marginTop: 20}}>{os('lesson-1', 1)}</div>
          <div style={{fontFamily: FONT.display, fontSize: 92, color: C.white, marginTop: 10, letterSpacing: '0.01em'}}>{os('lesson-1', 2)}</div>
          <div style={{display: 'flex', justifyContent: 'center', marginTop: 70, transform: `scale(${never})`, opacity: Math.min(1, never * 2)}}>
            <div style={{background: C.red, color: C.white, fontFamily: FONT.display, fontSize: 96, padding: '16px 44px 10px', letterSpacing: '0.015em', boxShadow: '0 20px 50px rgba(0,0,0,0.6)'}}>{os('lesson-1', 3)}</div>
          </div>
        </div>
      ) : null}

      {/* tribute */}
      {inShot(T.tribute, T.signoff) ? (
        <div style={{position: 'absolute', left: 0, top: 262, width: W, textAlign: 'center'}}>
          <div style={{fontFamily: FONT.mono, fontWeight: 500, fontSize: 32, letterSpacing: '0.42em', color: C.mute, opacity: mem(0.15)}}>{os('tribute-1', 0)}</div>
          <div style={{fontFamily: FONT.display, fontSize: 104, color: C.white, marginTop: 18, opacity: mem(0.4), letterSpacing: '0.012em', textShadow: '0 8px 30px rgba(0,0,0,0.8)'}}>{os('tribute-1', 1)}</div>
          <div style={{fontFamily: FONT.label, fontWeight: 600, fontSize: 46, letterSpacing: '0.1em', color: C.yellow, marginTop: 12, opacity: mem(0.7)}}>{os('tribute-1', 2).toUpperCase()}</div>
          <div style={{width: 120, height: 4, background: C.yellow, margin: '40px auto 34px', opacity: line(0)}} />
          {[3, 4, 5].map((i, k) => (
            <div key={i} style={{fontFamily: FONT.label, fontWeight: 500, fontSize: 48, color: C.white, opacity: line(k * 0.55) * 0.94, marginTop: 8, textShadow: '0 4px 18px rgba(0,0,0,0.9)'}}>{os('tribute-1', i)}</div>
          ))}
        </div>
      ) : null}

      {/* sign-off */}
      {end ? (
        <div style={{position: 'absolute', left: 0, top: 500, width: W, textAlign: 'center', opacity: fadeOut}}>
          {[
            [os('signoff', 0), word('signoff', "Don't"), C.white],
            [os('signoff', 1), word('signoff', 'at'), C.white],
            [os('signoff', 2), word('signoff', 'today'), C.yellow],
          ].map(([text, at, col], i) => (
            <div key={i} style={{fontFamily: FONT.display, fontSize: 250, lineHeight: 0.98, color: col as string, transform: `scale(${slam(at as number)})`, opacity: t >= (at as number) - 0.03 ? 1 : 0, filter: 'drop-shadow(0 16px 30px rgba(0,0,0,0.8))'}}>{text}</div>
          ))}
          <div style={{width: 760, height: 6, background: C.yellow, margin: '44px auto 26px', transform: `scaleX(${ramp(t, word('signoff', 'today'), word('signoff', 'today') + 0.4, E.out)})`}} />
          <div style={{fontFamily: FONT.mono, fontSize: 22, letterSpacing: '0.1em', color: C.mute, opacity: ramp(t, word('signoff', 'today') + 0.1, word('signoff', 'today') + 0.5)}}>{SRC}</div>
        </div>
      ) : null}

      <Captions time={t} beats={BEATS} hide={hideCaption} yFor={captionY} />
    </div>
  );
};

// "Nobody saw him go in" and the sign-off are set as full-screen type instead of captions.
const hideCaption = (id: string) => id === 'reveal-2' || id === 'signoff';
// In the tribute the captions sit lower, clear of the two hard hats.
const captionY = (id: string) => (id === 'tribute-1' ? 1336 : undefined);
