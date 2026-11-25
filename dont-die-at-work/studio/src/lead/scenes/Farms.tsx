import React from 'react';
import {C, FONT} from '../../engine/theme';
import {E, clamp, lerp, ramp, track} from '../../engine/time';
import {Bullets, Chip, H, Panel, QuoteCard, Txt, W, fadeIn, pop, span} from '../kit';
import {label, os} from '../script';
import {StageOptions} from '../Stage';
import {S, at, word} from '../timeline';
import {BARN, Bale, BarnBody, BarnDoors, Clipboard, Corn, Cow, FOLDER, Fence, FolderBack, FolderFront, NoSign, Notice, Pond, Sacks, Silo, Slip, Tank, Tarp, Tree, Windmill} from './parts/FarmsPictos';

// THE FARMS. A farm in flat cross-section acts out what farmers were told to do; then the
// paperwork they were told to keep; then who says who pays. Schematic throughout.
const c = {
  start: S.farms.start,
  animals: word('farm-1', 'animals') - 0.15,
  notice: word('farm-1', 'evacuation') - 0.2,
  b2: at('farm-2'),
  feed: word('farm-2', 'move') - 0.15,
  tarp: word('farm-2', 'cover') - 0.2,
  keep: word('farm-2', 'Keep') - 0.15,
  b3: at('farm-3'),
  pasture: word('farm-3', 'pull') - 0.1,
  ponds: word('farm-3', 'ponds') - 0.35,
  watch: word('farm-3', 'watch') - 0.2,
  sudden: word('farm-3', 'Sudden') - 0.12,
  weight: word('farm-3', 'weight') - 0.12,
  seeing: word('farm-3', 'seeing') - 0.4,
  breeding: word('farm-3', 'breeding') - 0.4,
  b4: at('farm-4'),
  samples: word('farm-4', 'Take') - 0.12,
  expense: word('farm-4', 'Write') - 0.12,
  b5: at('farm-5'),
  build: word('farm-5', 'build') - 0.15,
  claim: word('farm-5', 'claim') - 0.2,
  b6: at('farm-6'),
  pay: word('farm-6', 'pay') - 0.3,
  state: word('farm-6', "Iowa's") - 0.2,
  b7: at('farm-7'),
  said7: word('farm-7', 'scientist') - 0.2,
  b8: at('farm-8'),
  said8: word('farm-8', 'said') - 0.3,
  end: S.farms.end,
};

const GY = 690; // the ground line, in frame pixels
// the farm, in its own pixels, left to right
const X = {pond0: 60, pond1: 330, tree: 420, fence0: 440, fence1: 1190, cows: [560, 770, 985], barn: 1240, silo: 1652, bales: [1800, 1892], sacks: 1975, tank: 2030, mill: 2140};
const DOOR = X.barn + (BARN.doorX0 + BARN.doorX1) / 2;

export const options: StageOptions = {};

export const Farms: React.FC<{t: number}> = ({t}) => {
  // the view: all of it, then the yard, then the pasture
  const k = track(t, [[c.start, 0.8], [c.b2, 0.84, E.lin], [c.feed + 0.6, 0.98, E.inOutQuad], [c.b3, 0.98], [c.pasture + 0.7, 0.92, E.inOutQuad], [c.b4, 0.9, E.lin]]);
  const wx = track(t, [[c.start, 1105], [c.b2, 1115, E.lin], [c.feed + 0.6, 1560, E.inOutQuad], [c.b3, 1570, E.lin], [c.pasture + 0.7, 700, E.inOutQuad], [c.b4, 690, E.lin]]);
  const farmA = 1 - 0.78 * ramp(t, c.b4 - 0.1, c.b4 + 0.4);
  const gone = 1 - ramp(t, c.b7 - 0.2, c.b7 + 0.2);

  // farm-2: cover the feed, bring the animals in
  const drop = t >= c.tarp ? clamp(1 - Math.exp(-(t - c.tarp) * 5) * Math.cos((t - c.tarp) * 7), 0, 1.05) : 0;
  const walk = (i: number) => ramp(t, c.keep + i * 0.35, c.keep + 2.6 + i * 0.5, E.inOutQuad);
  const shut = ramp(t, c.keep + 3.9, c.keep + 4.6, E.inOutQuad);
  // farm-3: off the pasture, away from the pond
  const noCattle = t >= c.pasture ? Math.min(1.08, pop(t, c.pasture + 0.2)) : 0;
  const noWater = t >= c.ponds ? Math.min(1.08, pop(t, c.ponds)) : 0;
  const listA = span(t, c.watch, c.b4, 0.35, 0.25);

  // farm-4 and farm-5: the homework becomes a file
  const boardOut = ramp(t, c.b5 + 0.2, c.b5 + 0.9, E.inOutQuad);
  const folderA = span(t, c.b5 + 0.5, c.b6 + 0.1, 0.4, 0.3);
  const slips: {kind: 'receipt' | 'lab' | 'photo' | 'list'; x: number; y: number; rot: number; at: number}[] = [
    {kind: 'list', x: -150, y: -70, rot: -7, at: c.b5 + 0.9},
    {kind: 'lab', x: -20, y: -92, rot: 4, at: c.build},
    {kind: 'receipt', x: 110, y: -84, rot: 9, at: c.build + 0.45},
    {kind: 'photo', x: 170, y: -60, rot: -5, at: c.build + 0.9},
  ];
  const band = ramp(t, c.claim, c.claim + 0.6, E.out);
  const sixA = span(t, c.b6 + 0.1, c.b7, 0.35, 0.25);

  return (
    <>
      {gone > 0.01 ? (
        <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, opacity: farmA * gone}}>
          <rect x={0} y={GY} width={W} height={H - GY} fill="#0c120d" />
          <g transform={`translate(${W / 2 - wx * k} ${GY}) scale(${k})`}>
            <line x1={-400} y1={0} x2={2800} y2={0} stroke="#3c5a3a" strokeWidth={4} />
            <Windmill x={X.mill} time={t} />
            <Tree x={X.tree} />
            <Pond x0={X.pond0} x1={X.pond1} time={t} ring={noWater > 0 ? 0.9 : 0} />
            <Silo x={X.silo} />
            <BarnBody x={X.barn} lit={0.5 + 0.4 * shut} />
            {/* the herd: grazing, then walked into the barn */}
            {X.cows.map((x, i) => {
              const w = walk(i);
              const cx = lerp(x, DOOR, w);
              return <Cow key={i} x={cx} flip={i === 0 && w < 0.02} graze={1 - clamp(w * 6)} step={w > 0 && w < 1 ? (cx - x) / 62 : 0} time={t} seed={i} a={1 - clamp((w - 0.9) / 0.1)} />;
            })}
            <BarnDoors x={X.barn} shut={shut} />
            <Fence x0={X.fence0} x1={X.fence1} />
            {/* the notice nobody on the pasture can read */}
            <Notice x={X.fence0 + 270} y={-150} time={t} a={span(t, c.notice, c.b2 + 0.4, 0.3, 0.4)} />
            {/* feed, hay and the stock tank */}
            <Bale x={X.bales[0]} />
            <Bale x={X.bales[1]} />
            <Sacks x={X.sacks} />
            <Tank x={X.tank} />
            <Tarp x0={X.bales[0] - 54} x1={X.tank + 150} peaks={[[X.bales[0], 96], [X.bales[1], 96], [X.sacks, 74], [X.tank + 70, 70]]} drop={drop} />
            <NoSign x={X.fence0 + 230} show={noCattle} kind="cattle" />
            <NoSign x={X.pond1 + 46} show={noWater} kind="water" h={190} />
          </g>
        </svg>
      ) : null}
      <Txt x={W - 72} y={GY + 60} size={20} font="mono" weight={700} align="right" spacing="0.18em" color={C.mute} a={span(t, c.start + 0.8, c.b4, 0.4, 0.3)}>{label('schematic')}</Txt>

      {/* farm-2: what the state told farmers */}
      {t >= c.b2 && t < c.b3 + 0.3 ? (
        <div style={{opacity: span(t, c.b2, c.b3 + 0.2, 0.2, 0.25)}}>
          <Bullets t={t} x={72} y={136} size={50} gap={18} w={1300} items={[{text: os('farm-2', 0), at: c.feed}, {text: os('farm-2', 1), at: c.tarp}, {text: os('farm-2', 2), at: c.keep}]} />
        </div>
      ) : null}

      {/* farm-3: what to watch for */}
      <Panel x={1010} y={128} w={838} h={470} a={listA} accent={C.red}>
        <div style={{position: 'absolute', left: 44, top: 30, fontFamily: FONT.mono, fontWeight: 700, fontSize: 24, letterSpacing: '0.16em', color: C.yellow}}>{os('farm-3', 4)}</div>
      </Panel>
      {listA > 0.01 ? (
        <div style={{opacity: listA}}>
          <Bullets t={t} x={1060} y={214} size={60} gap={26} w={760} items={[
            {text: os('farm-3', 0), at: c.sudden, color: C.white, mark: '!'},
            {text: os('farm-3', 1), at: c.weight, color: C.white, mark: '!'},
            {text: os('farm-3', 2), at: c.seeing, color: C.white, mark: '!'},
            {text: os('farm-3', 3), at: c.breeding, color: C.white, mark: '!'},
          ]} />
        </div>
      ) : null}

      {/* farm-4: the homework */}
      <Clipboard t={t} at={c.b4 + 0.25} x={W / 2 - 520} y={118} w={1040} h={690} a={1 - boardOut} dx={-boardOut * 260} rows={[{text: os('farm-4', 0), at: c.samples, hiAt: c.samples + 0.3}, {text: os('farm-4', 1), at: c.expense, hiAt: c.expense + 0.4}]} />

      {/* farm-5: it becomes an evidence file */}
      {folderA > 0.01 ? (
        <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, opacity: folderA}}>
          <g transform={`translate(${W / 2} ${470}) scale(${1.62 + 0.05 * ramp(t, c.b5, c.b6)})`}>
            <FolderBack />
            {slips.map((sl, i) => {
              const fall = clamp(1 - Math.exp(-(t - sl.at) * 6));
              return t >= sl.at ? <Slip key={i} kind={sl.kind} x={sl.x} y={sl.y - (1 - fall) * 300} rot={sl.rot * (0.4 + 0.6 * fall)} a={Math.min(1, fall * 3)} /> : null;
            })}
            <FolderFront band={band} />
          </g>
        </svg>
      ) : null}

      {/* farm-6: who says who pays */}
      <Chip x={72} y={250} size={60} a={sixA * fadeIn(t, c.pay, 0.4)}>{os('farm-6', 0)}</Chip>
      <Chip x={W - 72} y={430} size={60} align="right" color={C.white} a={sixA * fadeIn(t, c.state, 0.4)}>{os('farm-6', 1)}</Chip>

      {/* farm-7: the fairness beat, over next year's crop */}
      {t >= c.b7 - 0.1 && t < c.said8 + 0.5 ? (
        <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, opacity: span(t, c.b7, c.said8 + 0.4, 0.4, 0.4)}}>
          <rect x={0} y={GY + 40} width={W} height={H - GY} fill="#0c120d" />
          <g transform={`translate(0 ${GY + 40})`}>
            {Array.from({length: 13}, (_, i) => (
              <g key={i} transform={`scale(1 ${ramp(t, c.b7 + i * 0.05, c.b7 + 1.4 + i * 0.05, E.out)})`}>
                <Corn x={90 + i * 146} h={250 + (i % 3) * 22} time={t} seed={i} />
              </g>
            ))}
          </g>
        </svg>
      ) : null}
      <QuoteCard t={t} at={c.said7} quote={os('farm-7', 0)} by={os('farm-7', 1)} y={150} size={66} backdrop={0.45} a={1 - ramp(t, c.b8 - 0.05, c.b8 + 0.3)} />
      <QuoteCard t={t} at={c.said8} quote={os('farm-8', 0)} by={os('farm-8', 1)} y={250} size={70} a={1 - ramp(t, c.end - 0.3, c.end)} />
    </>
  );
};
