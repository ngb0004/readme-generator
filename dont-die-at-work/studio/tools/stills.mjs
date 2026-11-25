// Render a batch of frames from one bundle, for look development and QA.
//   node tools/stills.mjs <CompId> <outDir> <scale> <frame> [frame ...]
// Frames may be given as seconds with an "s" suffix (e.g. 12.5s).
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition, openBrowser} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';

const [comp, outDir, scaleArg, ...frames] = process.argv.slice(2);
const scale = Number(scaleArg);
fs.mkdirSync(outDir, {recursive: true});
const t0 = Date.now();
// DDAWT_ENTRY points at a development entry that registers one scene on its own (see src/lead/dev/).
const serveUrl = await bundle({entryPoint: path.resolve(process.env.DDAWT_ENTRY ?? 'src/index.ts'), webpackOverride: (c) => c});
const chromiumOptions = {gl: 'swangle'};
const browserExecutable = process.env.DDAWT_CHROME ?? '/opt/pw-browsers/chromium_headless_shell';
const browser = await openBrowser('chrome', {browserExecutable, chromiumOptions});
const composition = await selectComposition({serveUrl, id: comp, puppeteerInstance: browser});
console.log(`bundled in ${((Date.now() - t0) / 1000).toFixed(1)}s; ${composition.durationInFrames} frames @ ${composition.fps}fps`);
for (const f of frames) {
  const frame = f.endsWith('s') ? Math.round(parseFloat(f) * composition.fps) : Number(f);
  const t1 = Date.now();
  const output = path.join(outDir, `${comp}-${String(frame).padStart(5, '0')}.jpg`);
  await renderStill({composition, serveUrl, output, frame: Math.min(frame, composition.durationInFrames - 1), scale, imageFormat: 'jpeg', jpegQuality: 90, puppeteerInstance: browser, chromiumOptions});
  console.log(`frame ${frame} -> ${output} (${((Date.now() - t1) / 1000).toFixed(1)}s)`);
}
await browser.close({silent: true});
