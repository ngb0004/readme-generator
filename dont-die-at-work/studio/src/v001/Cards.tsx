import React from 'react';
import script from '../../../videos/001-valero-nitrogen-duct-tape/script.json';
import {Pictogram, STAND, mix, pose} from '../engine2d/Pictogram';
import {View} from '../engine2d/view';
import {C, FONT, H, W} from '../engine/theme';
import {E, clamp, lerp, noise, ramp, rnd, spring, window as win} from '../engine/time';
import {LOOKS} from './actors';
import {T, word} from './timeline';

/** Every word on screen comes out of script.json, which the verify gate has checked against the sources. */
export const os = (beat: string, i: number): string => {
  const b = (script.beats as {id: string; onscreen: string[]}[]).find((x) => x.id === beat);
  if (!b || b.onscreen[i] === undefined) throw new Error(`no on-screen text ${beat}[${i}]`);
  return b.onscreen[i];
};

const Sheet: React.FC<{children: React.ReactNode; opacity?: number}> = ({children, opacity = 1}) => (
  <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 90% 60% at 50% 38%, #0c1626 0%, #05080f 70%)', opacity}}>
    <div style={{position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(#152136 1px, transparent 1px), linear-gradient(90deg, #152136 1px, transparent 1px)', backgroundSize: '48px 48px', opacity: 0.45}} />
    {children}
  </div>
);
const pop = (t: number, at: number, f = 3.4, d = 0.6) => clamp(spring(t - at, f, d), 0, 1.2);
const stroke = (px: number): React.CSSProperties => ({WebkitTextStroke: `${px}px #04060a`, paintOrder: 'stroke fill'});

// ---------------------------------------------------------------- 80 killed at work
export const Stat80: React.FC<{t: number}> = ({t}) => {
  const t0 = T.h3;
  const slam = pop(t, word('hook-3', 'eighty') - 0.08);
  const cols = 16;
  return (
    <Sheet>
      <div style={{position: 'absolute', left: 0, top: 236, width: W, textAlign: 'center', fontFamily: FONT.mono, fontWeight: 700, fontSize: 30, letterSpacing: '0.16em', color: C.mute, opacity: ramp(t, t0 + 0.2, t0 + 0.6)}}>{os('hook-3', 2)}</div>
      <div style={{position: 'absolute', left: 0, top: 262, width: W, textAlign: 'center', fontFamily: FONT.display, fontSize: 520, lineHeight: 1, color: C.white, transform: `scale(${0.7 + 0.3 * slam})`, opacity: Math.min(1, slam * 2), filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.7))'}}>{os('hook-3', 0)}</div>
      <div style={{position: 'absolute', left: 0, top: 762, width: W, textAlign: 'center', fontFamily: FONT.display, fontSize: 118, color: C.red, letterSpacing: '0.01em', opacity: ramp(t, word('hook-3', 'people'), word('hook-3', 'people') + 0.25)}}>{os('hook-3', 1)}</div>
      {/* one figure for each of them */}
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
        {Array.from({length: 80}, (_, i) => {
          const cx = 112 + (i % cols) * 57;
          const cy = 968 + Math.floor(i / cols) * 62;
          const born = t0 + 0.25 + (i / 80) * 1.3;
          const k = clamp(spring(t - born, 5, 0.6), 0, 1.15);
          const gone = ramp(t, born + 0.5, born + 0.9);
          if (k <= 0) return null;
          const col = gone > 0.5 ? '#4a5a72' : C.yellow;
          return (
            <g key={i} transform={`translate(${cx} ${cy}) scale(${k})`} fill={col}>
              <circle cx={0} cy={-17} r={8} />
              <rect x={-9} y={-7} width={18} height={30} rx={8} />
            </g>
          );
        })}
      </svg>
    </Sheet>
  );
};

// ---------------------------------------------------------------- you're breathing it right now
export const Breathing: React.FC<{t: number}> = ({t}) => {
  const t0 = T.breathing;
  const v: View = {cx: 300, cy: 1330, s: 390};
  const breathe = Math.sin((t - t0) * 2.6);
  const p = pose({x: 0, y: 0.9, lean: 2 + breathe * 0.8, head: -4});
  const slam = pop(t, t0 + 0.2);
  return (
    <Sheet>
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
        {/* air drifting to the face: mostly nitrogen */}
        {Array.from({length: 90}, (_, i) => {
          const k = (rnd(i * 1.9) + (t - t0) * (0.22 + rnd(i * 3.7) * 0.2)) % 1;
          const x = lerp(1060, 372, Math.pow(k, 0.9));
          const y = lerp(640 + rnd(i * 5.3) * 520, 742, Math.pow(k, 1.6)) + noise(t * 1.5 + i, i) * 14 * (1 - k);
          const n2 = rnd(i * 7.1) < 0.78;
          return <circle key={i} cx={x} cy={y} r={n2 ? 9 : 7} fill={n2 ? C.cyan : '#ffffff'} opacity={Math.sin(k * Math.PI) * (n2 ? 0.9 : 0.8)} />;
        })}
        <Pictogram v={v} p={p} look={LOOKS.A} glow />
        <rect x={0} y={1250} width={W} height={680} fill="#05080f" />
      </svg>
      <div style={{position: 'absolute', left: 0, top: 232, width: W, textAlign: 'center', fontFamily: FONT.display, fontSize: 300, lineHeight: 1, color: C.cyan, transform: `scale(${0.75 + 0.25 * slam})`, opacity: Math.min(1, slam * 2), ...stroke(10)}}>{os('hook-3', 3)}</div>
      <div style={{position: 'absolute', left: 0, top: 528, width: W, textAlign: 'center', fontFamily: FONT.display, fontSize: 84, color: C.white, opacity: ramp(t, t0 + 0.45, t0 + 0.75), ...stroke(8)}}>{os('hook-3', 4)}</div>
    </Sheet>
  );
};

// ---------------------------------------------------------------- harmless, until it's all there is
export const AirMix: React.FC<{t: number}> = ({t}) => {
  const t0 = T.m1;
  const out = ramp(t, T.allThereIs, T.allThereIs + 1.2, E.inOutQuad);
  const box = {x: 150, y: 420, w: 780, h: 700};
  const v: View = {cx: box.x + box.w / 2, cy: box.y + box.h - 28, s: 300};
  const fall = ramp(t, T.allThereIs + 0.9, T.allThereIs + 1.6, E.in);
  const p = mix(pose({x: 0, y: 0.905}), pose({x: 0.1, y: 0.16, rot: 88, lean: 0, head: 10, armA: 30, foreA: 20, legA: 14, shinA: -20}), fall);
  return (
    <Sheet>
      <div style={{position: 'absolute', left: 0, top: 236, width: W, textAlign: 'center', fontFamily: FONT.display, fontSize: 104, color: out > 0.6 ? C.cyan : C.white, opacity: ramp(t, t0 + 0.1, t0 + 0.4), ...stroke(8)}}>{out > 0.6 ? os('mech-1', 3) : os('mech-1', 0)}</div>
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
        <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={18} fill="rgba(13,22,38,0.9)" stroke="#8db1e6" strokeWidth={4} />
        {Array.from({length: 100}, (_, i) => {
          const oxygen = i % 100 >= 78 && i % 100 < 99;
          const bx = box.x + 40 + rnd(i * 2.3) * (box.w - 80) + noise(t * 0.6 + i, i) * 26;
          const by = box.y + 40 + rnd(i * 4.9) * (box.h - 80) + noise(t * 0.5 + i * 2, i + 5) * 26;
          if (oxygen) {
            // the oxygen is pushed out of the room; nitrogen takes its place
            const k = clamp(out * 1.6 - rnd(i * 8.1) * 0.6);
            const x = lerp(bx, box.x + box.w + 120, k);
            const y = lerp(by, box.y - 60 - rnd(i) * 80, k);
            return (
              <g key={i}>
                <circle cx={x} cy={y} r={11} fill="#ffffff" opacity={1 - k} />
                <circle cx={bx} cy={by} r={11} fill={C.cyan} opacity={k * 0.9} />
              </g>
            );
          }
          return <circle key={i} cx={bx} cy={by} r={11} fill={i % 100 === 99 ? '#7f8ba0' : C.cyan} opacity={0.9} />;
        })}
        <Pictogram v={v} p={p} look={LOOKS.A} dead={fall * 0.6} glow />
      </svg>
      <div style={{position: 'absolute', left: box.x, top: 1140, width: box.w, display: 'flex', justifyContent: 'space-between', fontFamily: FONT.label, fontWeight: 700, fontSize: 48, letterSpacing: '0.04em', opacity: ramp(t, t0 + 0.5, t0 + 0.9)}}>
        <span style={{color: C.cyan}}>● {os('mech-1', 1)}</span>
        <span style={{color: C.white, opacity: 1 - out * 0.75, textDecoration: out > 0.7 ? 'line-through' : undefined}}>● {os('mech-1', 2)}</span>
      </div>
    </Sheet>
  );
};

// ---------------------------------------------------------------- one or two breaths
export const Breaths: React.FC<{t: number}> = ({t}) => {
  const v: View = {cx: 500, cy: 1560, s: 580};
  const out = ramp(t, T.blackOut - 0.05, T.blackOut + 0.5, E.in);
  const inhale = Math.max(win(t, T.one - 0.1, T.one + 0.5, 0.25, 0.25), win(t, T.two - 0.05, T.two + 0.6, 0.25, 0.3));
  const p = pose({x: 0, y: 0.9, lean: 1 + inhale * 2.5 + out * 14, head: -6 + inhale * -6 + out * 34, armA: 6, armB: -6});
  const iris = lerp(1500, 0, out);
  const chip = (i: number, at: number, y: number) => {
    const k = pop(t, at - 0.04);
    return (
      <div style={{position: 'absolute', left: 0, top: y, width: W, textAlign: 'center', fontFamily: FONT.display, fontSize: 150, color: C.white, transform: `scale(${0.7 + 0.3 * k})`, opacity: t >= at - 0.04 ? Math.min(1, k * 2) : 0, ...stroke(10)}}>
        <span style={{color: C.red}}>{os('mech-2', i).split(' ')[0]}</span> {os('mech-2', i).split(' ').slice(1).join(' ')}
      </div>
    );
  };
  return (
    <Sheet>
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
        {Array.from({length: 60}, (_, i) => {
          const k = (rnd(i * 2.9) + t * (0.3 + rnd(i * 5.3) * 0.25)) % 1;
          const x = lerp(1080, 600, Math.pow(k, 0.8));
          const y = lerp(420 + rnd(i * 6.1) * 620, 610, Math.pow(k, 1.5));
          return <circle key={i} cx={x} cy={y} r={9} fill={C.cyan} opacity={Math.sin(k * Math.PI) * 0.85 * (0.25 + inhale)} />;
        })}
        <Pictogram v={v} p={p} look={LOOKS.A} dead={out * 0.7} glow />
        <rect x={0} y={1230} width={W} height={700} fill="#05080f" />
        {/* the lights go out */}
        <defs>
          <radialGradient id="iris">
            <stop offset="0" stopColor="#000" stopOpacity={0} />
            <stop offset={clamp(iris / 1500, 0.001, 0.98)} stopColor="#000" stopOpacity={0} />
            <stop offset={clamp(iris / 1500 + 0.12, 0.01, 1)} stopColor="#000" stopOpacity={0.97} />
          </radialGradient>
        </defs>
        {out > 0 ? <rect width={W} height={H} fill="url(#iris)" /> : null}
      </svg>
      <div style={{position: 'absolute', left: 0, top: 222, width: W, display: 'flex', justifyContent: 'center', gap: 90, opacity: 1 - out}}>
        {[T.one, T.two].map((at, i) => (
          <div key={i} style={{textAlign: 'center'}}>
            <div style={{width: 112, height: 112, borderRadius: 112, border: `8px solid ${C.cyan}`, background: t >= at ? C.cyan : 'transparent', transform: `scale(${t >= at ? pop(t, at, 3, 0.5) : 1})`, boxShadow: t >= at ? `0 0 60px ${C.cyan}` : undefined, margin: '0 auto'}} />
            <div style={{fontFamily: FONT.mono, fontWeight: 700, fontSize: 30, letterSpacing: '0.14em', color: C.white, marginTop: 12}}>{os('mech-2', i)}</div>
          </div>
        ))}
      </div>
      {chip(2, T.noSmell, 380)}
      {chip(3, T.noTaste, 560)}
      {chip(4, T.noWarning, 740)}
    </Sheet>
  );
};

// ---------------------------------------------------------------- the safe way / the fast way (over the dimmed drawing)
export const SafeWay: React.FC<{t: number}> = ({t}) => {
  const a = win(t, T.i3 + 0.05, T.wire, 0.25, 0.18);
  if (a <= 0) return null;
  const row = (text: string, at: number, y: number) => {
    const k = pop(t, at);
    return (
      <div style={{position: 'absolute', left: 0, top: y, width: W, display: 'flex', justifyContent: 'center', opacity: t >= at ? Math.min(1, k * 2) : 0, transform: `scale(${0.8 + 0.2 * k})`}}>
        <div style={{background: 'rgba(5,8,14,0.9)', borderLeft: `10px solid ${C.white}`, padding: '14px 34px', fontFamily: FONT.label, fontWeight: 700, fontSize: 64, letterSpacing: '0.04em', color: C.white}}>+ {text}</div>
      </div>
    );
  };
  const d = pop(t, T.delay - 0.05);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: a}}>
      <div style={{position: 'absolute', left: 0, top: 330, width: W, textAlign: 'center', fontFamily: FONT.mono, fontWeight: 700, fontSize: 38, letterSpacing: '0.2em', color: C.mute}}>{os('inc-3', 0)}</div>
      {row(os('inc-3', 1), word('inc-3', 'permit') - 0.1, 420)}
      {row(os('inc-3', 2), word('inc-3', 'permit') + 0.12, 540)}
      <div style={{position: 'absolute', left: 0, top: 680, width: W, textAlign: 'center', fontFamily: FONT.display, fontSize: 250, color: C.red, transform: `scale(${0.7 + 0.3 * d})`, opacity: t >= T.delay - 0.05 ? Math.min(1, d * 2) : 0, ...stroke(12)}}>= {os('inc-3', 3)}</div>
    </div>
  );
};

// ---------------------------------------------------------------- nobody saw what happened next
export const Black: React.FC<{t: number}> = ({t}) => (
  <div style={{position: 'absolute', inset: 0, background: '#000'}}>
    <div style={{position: 'absolute', left: 0, top: 700, width: W, textAlign: 'center', fontFamily: FONT.display, fontSize: 170, lineHeight: 1.05, color: C.white}}>
      <div style={{opacity: ramp(t, T.i6 + 0.05, T.i6 + 0.2)}}>{os('inc-6', 0)}</div>
      <div style={{color: C.red, fontSize: 122, opacity: t >= word('inc-6', 'what') - 0.03 ? 1 : 0}}>{os('inc-6', 1)}</div>
    </div>
  </div>
);

// ---------------------------------------------------------------- both men were pronounced dead
export const Dead: React.FC<{t: number}> = ({t}) => {
  const v: View = {cx: 540, cy: 1180, s: 330};
  const gone = ramp(t, word('inc-12', 'pronounced'), word('inc-12', 'pronounced') + 1.1, E.inOutQuad);
  return (
    <div style={{position: 'absolute', inset: 0, background: '#03050a'}}>
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, opacity: ramp(t, T.i12, T.i12 + 0.25)}}>
        <Pictogram v={v} p={pose({x: -0.5, y: 0.905})} look={LOOKS.A} dead={gone * 0.92} glow={gone < 0.5} />
        <Pictogram v={v} p={pose({x: 0.5, y: 0.905})} look={LOOKS.B} faceLeft dead={gone * 0.92} glow={gone < 0.5} />
        <line x1={200} y1={1184} x2={880} y2={1184} stroke="#2b3a52" strokeWidth={4} />
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------- did they even know?
export const PermitCard: React.FC<{t: number}> = ({t}) => {
  const inK = clamp(spring(t - T.l1, 2.6, 0.7), 0, 1.1);
  const circle = ramp(t, word('lesson-1', 'knew') - 0.1, word('lesson-1', 'knew') + 0.45, E.inOutQuad);
  const box = (label: string, checked: boolean) => (
    <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
      <div style={{width: 56, height: 56, border: '5px solid #1b1d22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT.display, fontSize: 52, color: '#1b1d22', lineHeight: 1}}>{checked ? '✕' : ''}</div>
      <div style={{fontFamily: FONT.label, fontWeight: 700, fontSize: 56, color: '#1b1d22'}}>{label}</div>
    </div>
  );
  const v: View = {cx: 540, cy: 1236, s: 190};
  return (
    <Sheet>
      <div style={{position: 'absolute', left: 110, top: 300, width: 860, transform: `translateY(${(1 - inK) * 700}px) rotate(-2deg)`, background: '#ece6d4', boxShadow: '0 40px 90px rgba(0,0,0,0.75)', borderRadius: 6, overflow: 'hidden'}}>
        <div style={{background: '#1b1d22', color: '#ece6d4', padding: '24px 44px', fontFamily: FONT.display, fontSize: 66, letterSpacing: '0.03em'}}>SAFE WORK PERMIT</div>
        <div style={{padding: '14px 44px 44px'}}>
          {[470, 330].map((w) => (
            <div key={w} style={{height: 18, width: w, background: '#c9c2ad', borderRadius: 3, marginTop: 26}} />
          ))}
          <div style={{marginTop: 36, borderTop: '4px solid #1b1d22', paddingTop: 28}}>
            <div style={{fontFamily: FONT.label, fontWeight: 700, fontSize: 60, color: '#1b1d22', letterSpacing: '0.02em'}}>{os('lesson-1', 0)}</div>
            <div style={{display: 'flex', gap: 62, marginTop: 26, position: 'relative'}}>
              {box('YES', false)}
              {box('NO', false)}
              {box(os('lesson-1', 1), true)}
              <svg width={320} height={150} style={{position: 'absolute', left: 470, top: -46, overflow: 'visible'}}>
                <ellipse cx={136} cy={74} rx={146} ry={62} fill="none" stroke={C.red} strokeWidth={10} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - circle} transform="rotate(-5 136 74)" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, opacity: ramp(t, T.l1 + 0.6, T.l1 + 1.0)}}>
        <Pictogram v={v} p={pose({x: -0.55, y: 0.905})} look={LOOKS.A} dead={0.55} />
        <Pictogram v={v} p={pose({x: 0.55, y: 0.905})} look={LOOKS.B} faceLeft dead={0.55} />
      </svg>
    </Sheet>
  );
};

// ---------------------------------------------------------------- the one that kills you looks just like the rest
export const Hatches: React.FC<{t: number}> = ({t}) => {
  const n = 5;
  const lethal = 3;
  const reveal = win(t, T.theOne, word('lesson-2', 'look') + 0.1, 0.12, 0.35);
  return (
    <Sheet>
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
        {Array.from({length: n}, (_, i) => {
          const cx = i < 3 ? 210 + i * 330 : 375 + (i - 3) * 330;
          const cy = i < 3 ? 520 : 890;
          const born = T.l2 + 0.1 + i * 0.12;
          const k = clamp(spring(t - born, 4, 0.6), 0, 1.1);
          const ok = t >= word('lesson-2', 'cost') + i * 0.13 && i !== lethal;
          const hot = i === lethal ? reveal : 0;
          return (
            <g key={i} transform={`translate(${cx} ${cy}) scale(${k * 1.55})`}>
              {hot > 0 ? <circle r={150} fill={C.cyan} opacity={0.25 * hot} filter="url(#softH)" /> : null}
              {/* an open hatch, seen from above: a ring of studs round a hole */}
              <circle r={78} fill="#1d2b40" stroke={hot > 0.3 ? C.red : '#8db1e6'} strokeWidth={5} />
              <circle r={38} fill={hot > 0.3 ? '#0f5f7a' : '#05080f'} stroke="#4b648c" strokeWidth={3} />
              {Array.from({length: 12}, (_, j) => (
                <circle key={j} cx={Math.sin((j / 12) * 6.283) * 60} cy={Math.cos((j / 12) * 6.283) * 60} r={7} fill="#51688d" />
              ))}
              {ok ? <path d="M -30 122 l 20 22 l 42 -46" fill="none" stroke="#7ee08a" strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" /> : null}
              {hot > 0.3 ? <path d="M -26 108 l 52 52 M 26 108 l -52 52" stroke={C.red} strokeWidth={13} strokeLinecap="round" /> : null}
            </g>
          );
        })}
        <defs>
          <filter id="softH" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="22" />
          </filter>
        </defs>
      </svg>
    </Sheet>
  );
};

// ---------------------------------------------------------------- sign-off
export const Signoff: React.FC<{t: number; source: string}> = ({t, source}) => {
  const slam = (at: number) => clamp(spring(t - at + 0.03, 3.4, 0.6), 0, 1.2);
  const fade = 1 - ramp(t, T.end - 0.3, T.end - 0.02);
  const lines: [string, number, string][] = [
    [os('signoff', 0), word('signoff', "Don't"), C.white],
    [os('signoff', 1), word('signoff', 'at'), C.white],
    [os('signoff', 2), word('signoff', 'today'), C.yellow],
  ];
  return (
    <div style={{position: 'absolute', inset: 0, background: `rgba(3,5,9,${0.86 * ramp(t, T.signoff, T.signoff + 0.3)})`, opacity: fade}}>
      <div style={{position: 'absolute', left: 0, top: 500, width: W, textAlign: 'center'}}>
        {lines.map(([text, at, col], i) => (
          <div key={i} style={{fontFamily: FONT.display, fontSize: 250, lineHeight: 0.98, color: col, transform: `scale(${slam(at)})`, opacity: t >= at - 0.03 ? 1 : 0, filter: 'drop-shadow(0 16px 30px rgba(0,0,0,0.8))'}}>{text}</div>
        ))}
        <div style={{width: 760, height: 6, background: C.yellow, margin: '44px auto 26px', transform: `scaleX(${ramp(t, word('signoff', 'today'), word('signoff', 'today') + 0.4, E.out)})`}} />
        <div style={{fontFamily: FONT.mono, fontSize: 22, letterSpacing: '0.1em', color: C.mute, opacity: ramp(t, word('signoff', 'today') + 0.1, word('signoff', 'today') + 0.5)}}>{source}</div>
      </div>
    </div>
  );
};
export {STAND};
