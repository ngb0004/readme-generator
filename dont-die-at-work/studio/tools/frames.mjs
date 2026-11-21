// Render frame ranges to numbered JPEGs. Re-run with just the ranges you changed.
//   node tools/frames.mjs <CompId> <outDir> <ranges e.g. "0-299,700-760" | "all">
import {bundle} from '@remotion/bundler';
import {renderFrames, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';

const [comp, outDir, rangesArg = 'all'] = process.argv.slice(2);
fs.mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
// No GPU in the cloud container: software GL. Set DDAWT_GL=angle on a machine with a GPU.
const chromiumOptions = {gl: process.env.DDAWT_GL ?? 'swangle'};
const browserExecutable = process.env.DDAWT_CHROME ?? '/opt/pw-browsers/chromium_headless_shell';
const composition = await selectComposition({serveUrl, id: comp, browserExecutable, chromiumOptions});
const last = composition.durationInFrames - 1;
const ranges = rangesArg === 'all' ? [[0, last]] : rangesArg.split(',').map((r) => r.split('-').map(Number)).map(([a, b]) => [a, Math.min(b ?? a, last)]);
const total = ranges.reduce((n, [a, b]) => n + b - a + 1, 0);
let done = 0;
const t0 = Date.now();
for (const [a, b] of ranges) {
  const tmp = fs.mkdtempSync(path.join(outDir, '.part-'));
  await renderFrames({
    composition, serveUrl, outputDir: tmp, inputProps: {}, imageFormat: 'jpeg', jpegQuality: 95,
    frameRange: [a, b], concurrency: Number(process.env.DDAWT_CONCURRENCY ?? 2), browserExecutable, chromiumOptions,
    onStart: () => {},
    onFrameUpdate: (n) => {
      if ((done + n) % 60 === 0) {
        const rate = (Date.now() - t0) / 1000 / (done + n);
        console.log(`${done + n}/${total} frames, ${rate.toFixed(2)}s/frame, ~${Math.round(((total - done - n) * rate) / 60)} min left`);
      }
    },
  });
  // renderFrames numbers files by absolute frame; normalise to f00000.jpg
  for (const f of fs.readdirSync(tmp)) {
    const m = f.match(/(\d+)\.jpe?g$/);
    if (m) fs.renameSync(path.join(tmp, f), path.join(outDir, `f${String(Number(m[1])).padStart(5, '0')}.jpg`));
  }
  fs.rmSync(tmp, {recursive: true, force: true});
  done += b - a + 1;
}
console.log(`rendered ${total} frame(s) in ${((Date.now() - t0) / 60000).toFixed(1)} min -> ${outDir}`);
