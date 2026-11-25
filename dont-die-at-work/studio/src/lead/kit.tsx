import React from 'react';
import {C, FONT, LF} from '../engine/theme';
import {E, clamp, ramp, rnd, spring, window as win} from '../engine/time';

// The long-form frame. Everything in src/lead is laid out for 1920x1080.
export const W = LF.W;
export const H = LF.H;
/** Keep text inside this box: YouTube's player chrome and the captions own the rest. */
export const SAFE = {left: 72, right: W - 72, top: 110, bottom: H - 250};

export const PAPER = '#ece6d4';
export const INK = '#1b1d22';

export const pop = (t: number, at: number, f = 3.4, d = 0.6) => clamp(spring(t - at, f, d), 0, 1.2);
/** 0 to 1 over `dur`, starting at `at`. */
export const fadeIn = (t: number, at: number, dur = 0.3) => ramp(t, at, at + dur, E.out);
/** 1 between a and b, with soft edges. */
export const span = (t: number, a: number, b: number, i = 0.25, o = 0.2) => win(t, a, b, i, o);

type Align = 'left' | 'center' | 'right';
const box = (x: number, w: number, align: Align) => (align === 'left' ? x : align === 'center' ? x - w / 2 : x - w);
const outlineCss = (px?: number): React.CSSProperties => (px ? {WebkitTextStroke: `${px}px #04060a`, paintOrder: 'stroke fill'} : {});

/** A block of text at (x, y). x is the left edge, the centre or the right edge, depending on `align`. */
export const Txt: React.FC<{
  x: number; y: number; w?: number; size: number; color?: string; font?: keyof typeof FONT; weight?: number; align?: Align;
  a?: number; spacing?: string; outline?: number; lh?: number; scale?: number; rise?: number; nowrap?: boolean; style?: React.CSSProperties; children: React.ReactNode;
}> = ({x, y, w = 1400, size, color = C.white, font = 'label', weight = 600, align = 'left', a = 1, spacing, outline, lh = 1.08, scale = 1, rise = 0, nowrap, style, children}) => {
  const k = clamp(a);
  if (k <= 0.001) return null;
  return (
    <div
      style={{
        position: 'absolute', left: box(x, w, align), top: y + (1 - k) * rise, width: w, textAlign: align, fontFamily: FONT[font], fontWeight: font === 'display' ? 400 : weight,
        fontSize: size, lineHeight: lh, letterSpacing: spacing, color, opacity: k, whiteSpace: nowrap ? 'nowrap' : undefined,
        transform: scale !== 1 ? `scale(${scale})` : undefined, transformOrigin: align === 'left' ? '0% 50%' : align === 'center' ? '50% 50%' : '100% 50%',
        textShadow: outline ? undefined : '0 3px 14px rgba(0,0,0,0.85)', ...outlineCss(outline), ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Boxed callout with an accent bar. `a` runs 0..1 and wipes it in from the left. */
export const Chip: React.FC<{x: number; y: number; a: number; color?: string; size?: number; align?: Align; mark?: string; children: React.ReactNode}> = ({x, y, a, color = C.yellow, size = 40, align = 'left', mark, children}) => {
  const k = clamp(a);
  if (k <= 0.001) return null;
  const w = 1600;
  return (
    <div style={{position: 'absolute', left: box(x, w, align), top: y, width: w, display: 'flex', justifyContent: align === 'left' ? 'flex-start' : align === 'center' ? 'center' : 'flex-end', opacity: Math.min(1, k * 3), pointerEvents: 'none'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: size * 0.3, background: 'rgba(5,8,14,0.88)', borderLeft: `${Math.max(6, size * 0.2)}px solid ${color}`, padding: `${size * 0.2}px ${size * 0.5}px ${size * 0.2}px ${size * 0.42}px`, fontFamily: FONT.label, fontWeight: 700, fontSize: size, letterSpacing: '0.045em', color: C.white, whiteSpace: 'nowrap', clipPath: `inset(0 ${(1 - k) * 100}% 0 0)`, boxShadow: '0 10px 30px rgba(0,0,0,0.55)'}}>
        {mark ? <span style={{color, fontFamily: FONT.display, fontSize: size * 0.92, lineHeight: 1}}>{mark}</span> : null}
        {children}
      </div>
    </div>
  );
};

type Pt = {x: number; y: number};
/** A leader line from a label to the thing it names. */
export const Leader: React.FC<{from: Pt; to: Pt; a: number; color?: string}> = ({from, to, a, color = C.yellow}) => {
  const k = clamp(a);
  if (k <= 0) return null;
  const x = from.x + (to.x - from.x) * k;
  const y = from.y + (to.y - from.y) * k;
  return (
    <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
      <line x1={from.x} y1={from.y} x2={x} y2={y} stroke="rgba(0,0,0,0.6)" strokeWidth={7} />
      <line x1={from.x} y1={from.y} x2={x} y2={y} stroke={color} strokeWidth={3} />
      <circle cx={x} cy={y} r={7} fill={color} opacity={k > 0.95 ? 1 : 0} />
    </svg>
  );
};

/** A dark card to set text on when the drawing behind is busy. */
export const Panel: React.FC<{x: number; y: number; w: number; h: number; a?: number; accent?: string; children?: React.ReactNode}> = ({x, y, w, h, a = 1, accent, children}) => {
  const k = clamp(a);
  if (k <= 0.001) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y + (1 - k) * 18, width: w, height: h, opacity: k, background: 'rgba(6,10,18,0.9)', border: '1px solid rgba(141,177,230,0.22)', borderLeft: accent ? `10px solid ${accent}` : undefined, boxShadow: '0 24px 60px rgba(0,0,0,0.6)'}}>
      {children}
    </div>
  );
};

/**
 * Someone's exact words, full width. `quote` and `by` come from script.json (os()).
 * `at` is when it lands; it stays until the scene stops drawing it.
 */
export const QuoteCard: React.FC<{t: number; at: number; quote: string; by: string; y?: number; w?: number; size?: number; accent?: string; a?: number; backdrop?: number}> = ({t, at, quote, by, y = 300, w = 1500, size = 76, accent = C.yellow, a = 1, backdrop = 0.82}) => {
  const k = pop(t, at, 2.6, 0.8);
  const vis = clamp(a) * (t >= at ? Math.min(1, k * 2.2) : 0);
  if (vis <= 0.001) return null;
  const byA = fadeIn(t, at + 0.45, 0.4);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: vis}}>
      <div style={{position: 'absolute', inset: 0, background: `rgba(3,5,9,${backdrop})`}} />
      <div style={{position: 'absolute', left: (W - w) / 2, top: y + (1 - Math.min(1, k)) * 26, width: w}}>
        <div style={{display: 'flex', gap: 34}}>
          <div style={{width: 12, background: accent, flex: 'none'}} />
          <div>
            <div style={{fontFamily: FONT.label, fontWeight: 600, fontSize: size, lineHeight: 1.14, color: C.white, letterSpacing: '0.005em'}}>{quote}</div>
            <div style={{marginTop: 34, fontFamily: FONT.mono, fontWeight: 700, fontSize: 30, letterSpacing: '0.16em', color: accent, opacity: byA}}>{by}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * A page of the 1984 paper, with one sentence picked out by a highlighter. All of the words come
 * from script.json. `head` is the title block; `quote` is the sentence; `hiAt` is when the marker runs.
 */
export const PaperCard: React.FC<{t: number; at: number; head: string[]; quote: string; hiAt?: number; x?: number; y?: number; w?: number; size?: number; a?: number; tilt?: number; note?: string}> = ({t, at, head, quote, hiAt, x = 300, y = 150, w = 1320, size = 54, a = 1, tilt = -1.2, note}) => {
  const inK = clamp(spring(t - at, 2.4, 0.75), 0, 1.08);
  const vis = clamp(a) * (t >= at ? 1 : 0);
  if (vis <= 0.001) return null;
  const hi = ramp(t, hiAt ?? at + 0.5, (hiAt ?? at + 0.5) + Math.min(1.6, 0.35 + quote.length / 90), E.inOutQuad);
  const bar = (wd: number, key: number) => <div key={key} style={{height: 15, width: wd, background: '#cfc8b2', borderRadius: 3, marginTop: 20}} />;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, opacity: vis, transform: `translateY(${(1 - inK) * 620}px) rotate(${tilt}deg)`, background: PAPER, boxShadow: '0 44px 100px rgba(0,0,0,0.75)', borderRadius: 4}}>
      <div style={{padding: '34px 56px 14px', borderBottom: `3px solid ${INK}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 30}}>
        <div style={{fontFamily: FONT.mono, fontWeight: 700, fontSize: 40, letterSpacing: '0.06em', color: INK}}>{head[0]}</div>
        <div style={{textAlign: 'right', fontFamily: FONT.mono, fontWeight: 500, fontSize: 19, letterSpacing: '0.08em', color: '#4a4a46', lineHeight: 1.45}}>
          {head.slice(1).map((h, i) => (
            <div key={i}>{h}</div>
          ))}
        </div>
      </div>
      <div style={{padding: '8px 56px 44px'}}>
        {[w * 0.62, w * 0.5].map(bar)}
        {quote ? (
          <div style={{marginTop: 30, fontFamily: FONT.mono, fontWeight: 500, fontSize: size, lineHeight: 1.36, color: INK}}>
            <span style={{backgroundImage: `linear-gradient(${C.yellow}, ${C.yellow})`, backgroundRepeat: 'no-repeat', backgroundSize: `${hi * 100}% 100%`, boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone', padding: '2px 6px'}}>{quote}</span>
          </div>
        ) : (
          [w * 0.66, w * 0.58, w * 0.7, w * 0.36].map((wd, i) => bar(wd, i + 10))
        )}
        {[w * 0.7, w * 0.44].map((wd, i) => bar(wd, i + 5))}
        {note ? <div style={{marginTop: 26, fontFamily: FONT.mono, fontWeight: 700, fontSize: 20, letterSpacing: '0.14em', color: '#8a3a2c'}}>{note}</div> : null}
      </div>
    </div>
  );
};

/** A short list that builds one line at a time. */
export const Bullets: React.FC<{t: number; x: number; y: number; items: {text: string; at: number; color?: string; mark?: string}[]; size?: number; gap?: number; w?: number}> = ({t, x, y, items, size = 52, gap = 22, w = 1100}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w}}>
    {items.map((it, i) => {
      const k = pop(t, it.at);
      const color = it.color ?? C.white;
      return (
        <div key={i} style={{display: 'flex', alignItems: 'baseline', gap: size * 0.4, marginBottom: gap, opacity: t >= it.at ? Math.min(1, k * 2) : 0, transform: `translateX(${(1 - Math.min(1, k)) * -30}px)`}}>
          <span style={{fontFamily: FONT.display, fontSize: size * 0.9, color: it.color ?? C.yellow, width: size * 0.9, flex: 'none'}}>{it.mark ?? '•'}</span>
          <span style={{fontFamily: FONT.label, fontWeight: 700, fontSize: size, letterSpacing: '0.03em', color, lineHeight: 1.1, textShadow: '0 3px 14px rgba(0,0,0,0.85)'}}>{it.text}</span>
        </div>
      );
    })}
  </div>
);

/** The dark graph-paper ground every scene sits on. */
export const Backdrop: React.FC<{tone?: 'night' | 'deep'}> = ({tone = 'night'}) => (
  <div style={{position: 'absolute', inset: 0, background: tone === 'night' ? 'radial-gradient(ellipse 80% 70% at 50% 42%, #0c1626 0%, #05080f 72%)' : '#03050a'}}>
    <div style={{position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(#152136 1px, transparent 1px), linear-gradient(90deg, #152136 1px, transparent 1px)', backgroundSize: '48px 48px', opacity: tone === 'night' ? 0.4 : 0.18}} />
  </div>
);

let grainUrl: string | null = null;
const grain = () => {
  if (grainUrl) return grainUrl;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  const img = g.createImageData(256, 256);
  for (let i = 0; i < 256 * 256; i++) {
    const v = 128 + (rnd(i * 0.731) - 0.5) * 150;
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return (grainUrl = c.toDataURL());
};
/** Vignette and film grain over everything. */
export const Grade16: React.FC<{frame: number}> = ({frame}) => (
  <>
    <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 78% at 50% 46%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)', pointerEvents: 'none'}} />
    <div style={{position: 'absolute', inset: 0, backgroundImage: `url(${grain()})`, backgroundSize: '256px 256px', backgroundPosition: `${Math.floor(rnd(frame) * 256)}px ${Math.floor(rnd(frame + 0.5) * 256)}px`, opacity: 0.07, mixBlendMode: 'overlay', pointerEvents: 'none'}} />
  </>
);
