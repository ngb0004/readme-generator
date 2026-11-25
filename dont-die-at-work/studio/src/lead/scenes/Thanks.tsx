import React from 'react';
import {C, FONT} from '../../engine/theme';
import {E, clamp, ramp} from '../../engine/time';
import {H, Txt, W, fadeIn, pop, span} from '../kit';
import {os} from '../script';
import {StageOptions} from '../Stage';
import {S, at, word} from '../timeline';
import {PicPhone} from './parts/ZoneMap';

// ONE MORE THING. Why the film was made: a video in the feed that put "We are under attack!!" over
// the emergency alert. The claim is shown in its own words and answered. Nobody is pictured or named.
const c = {
  start: S.thanks.start,
  feed: word('thanks-1', 'video') - 0.2,
  attack: word('thanks-1', 'under') - 0.3,
  b2: at('thanks-2'),
  not: word('thanks-2', 'not') - 0.15,
  b3: at('thanks-3'),
  moron: word('thanks-3', 'peak') - 0.12,
  b4: at('thanks-4'),
  neglect: word('thanks-4', 'neglect') - 0.15,
  b5: at('thanks-5'),
  sub: word('thanks-5', 'subscribe') - 0.15,
  end: S.thanks.end,
};

export const options: StageOptions = {};

export const Thanks: React.FC<{t: number}> = ({t}) => {
  const one = span(t, c.start + 0.1, c.b5 + 0.05, 0.3, 0.25);
  const struck = ramp(t, c.not, c.not + 0.3, E.out);
  const k = Math.min(1.1, pop(t, c.attack, 3.2, 0.55));
  const slam = Math.pow(1 - clamp((t - c.moron) / 0.22), 3);
  const aside = ramp(t, c.b4 - 0.05, c.b4 + 0.4, E.inOutQuad); // the claim steps back for the answer
  return (
    <>
      <div style={{position: 'absolute', inset: 0, background: '#03050a', opacity: fadeIn(t, c.start, 0.3)}} />
      {one > 0.01 ? (
        <div style={{position: 'absolute', inset: 0, opacity: one}}>
          <div style={{position: 'absolute', inset: 0, opacity: 1 - 0.9 * aside}}>
            <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
              <PicPhone x={330} y={400} s={300} a={fadeIn(t, c.feed, 0.3)} buzz={clamp(1 - (t - c.attack) / 1.2)} time={t} />
            </svg>
            <Txt x={560} y={206} size={26} font="mono" weight={700} spacing="0.18em" color={C.mute} a={fadeIn(t, c.feed + 0.2, 0.3)}>{os('thanks-1', 1)}</Txt>
            {/* the claim, set the way it was set over the alert: a red bar */}
            {t >= c.attack ? (
              <div style={{position: 'absolute', left: 556, top: 260, transform: `scale(${k})`, transformOrigin: '0% 50%'}}>
                <div style={{position: 'relative', display: 'inline-block', background: C.red, borderRadius: 18, padding: '18px 44px 22px', fontFamily: FONT.label, fontWeight: 700, fontSize: 118, lineHeight: 1.05, color: C.white, whiteSpace: 'nowrap', boxShadow: '0 20px 50px rgba(0,0,0,0.6)', opacity: 1 - 0.35 * struck}}>
                  {os('thanks-1', 0)}
                  <div style={{position: 'absolute', left: -14, right: -14, top: '50%', height: 14, marginTop: -7, background: C.white, transform: `scaleX(${struck}) rotate(-2deg)`, transformOrigin: '0 50%'}} />
                </div>
              </div>
            ) : null}
            <Txt x={560} y={470} w={1300} size={120} font="display" outline={8} a={fadeIn(t, c.not, 0.15)} scale={0.85 + 0.15 * pop(t, c.not)}>{os('thanks-2', 0)}</Txt>
            {/* the verdict on the claim: commentary, and marked as such in the corner */}
            {t >= c.moron ? (
              <div style={{position: 'absolute', left: 1010, top: 180, transform: `scale(${1 + 0.9 * slam}) rotate(-9deg)`, transformOrigin: '50% 50%', opacity: Math.min(1, (t - c.moron) / 0.05)}}>
                <div style={{border: `14px solid ${C.yellow}`, color: C.yellow, fontFamily: FONT.display, fontSize: 168, lineHeight: 1, padding: '18px 44px 6px', background: 'rgba(4,6,10,0.86)', whiteSpace: 'nowrap', boxShadow: '0 20px 50px rgba(0,0,0,0.7)'}}>{os('thanks-3', 0)}</div>
              </div>
            ) : null}
          </div>
          <Txt x={W / 2} y={400} w={W} size={280} font="display" align="center" color={C.yellow} outline={13} a={t >= c.neglect ? 1 : 0} scale={0.8 + 0.2 * pop(t, c.neglect)}>{os('thanks-4', 0)}</Txt>
        </div>
      ) : null}
      {t >= c.b5 ? (
        <div style={{position: 'absolute', inset: 0, opacity: fadeIn(t, c.b5, 0.25)}}>
          <Txt x={W / 2} y={250} w={W} size={300} font="display" align="center" color={C.yellow} outline={14} a={t >= c.sub ? 1 : 0} scale={0.8 + 0.2 * pop(t, c.sub)}>{os('thanks-5', 0)}</Txt>
          <Txt x={W / 2} y={610} w={W} size={84} font="display" align="center" outline={7} a={fadeIn(t, c.sub + 0.5, 0.4)}>{os('cold-title', 0)} {os('cold-title', 1)}</Txt>
        </div>
      ) : null}
    </>
  );
};
