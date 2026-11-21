// Steady-state render cost: node tools/bench.mjs <CompId> <from> <to> [scale] [concurrency] [props-json]
import {bundle} from '@remotion/bundler';
import {renderFrames, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';
const [comp, from, to, scale = '1', conc = '1', props = '{}'] = process.argv.slice(2);
const inputProps = JSON.parse(props);
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const chromiumOptions = {gl: 'swangle'};
const browserExecutable = process.env.DDAWT_CHROME ?? '/opt/pw-browsers/chromium_headless_shell';
const composition = await selectComposition({serveUrl, id: comp, browserExecutable, chromiumOptions, inputProps});
const out = fs.mkdtempSync('/tmp/bench-');
const t0 = Date.now();
let first = 0;
await renderFrames({
  composition, serveUrl, outputDir: out, inputProps, imageFormat: 'jpeg', jpegQuality: 90,
  frameRange: [Number(from), Number(to)], scale: Number(scale), concurrency: Number(conc),
  browserExecutable, chromiumOptions,
  onStart: () => {}, onFrameUpdate: (n) => { if (n === 1) first = Date.now(); },
});
const n = Number(to) - Number(from) + 1;
console.log(`${comp} props=${props} scale=${scale} conc=${conc}: first frame ${((first - t0) / 1000).toFixed(1)}s, then ${(((Date.now() - first) / 1000) / (n - 1)).toFixed(2)}s/frame`);
fs.rmSync(out, {recursive: true, force: true});
