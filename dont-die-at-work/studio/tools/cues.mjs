// Dumps the film's cue sheet (every cut and sync point, in seconds) so the
// sound design uses exactly the same timings as the picture.
//   node tools/cues.mjs <out.json>
import {build} from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const out = path.join(os.tmpdir(), `cues-${process.pid}.cjs`);
await build({entryPoints: ['src/v001/timeline.ts'], bundle: true, format: 'cjs', platform: 'node', outfile: out, logLevel: 'error'});
const m = await import(out);
const T = m.T ?? m.default.T;
fs.writeFileSync(process.argv[2], JSON.stringify(T, null, 1) + '\n');
fs.rmSync(out);
console.log(`cues -> ${process.argv[2]} (${Object.keys(T).length} cues, end ${T.end.toFixed(2)}s)`);
