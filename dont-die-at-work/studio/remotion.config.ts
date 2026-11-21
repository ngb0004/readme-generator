import {Config} from '@remotion/cli/config';

// The cloud container has no GPU: render WebGL through SwiftShader (ANGLE software backend).
// On a machine with a GPU, pass --gl=angle on the CLI for a large speed-up.
Config.setChromiumOpenGlRenderer('swangle');
Config.setBrowserExecutable(process.env.DDAWT_CHROME ?? null);
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setConcurrency(2);
Config.setOverwriteOutput(true);
