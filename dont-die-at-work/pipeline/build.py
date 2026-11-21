#!/usr/bin/env python3
"""Build one video, start to finish. Stops at the first gate that fails.

    python pipeline/build.py videos/<id>                 # everything
    python pipeline/build.py videos/<id> --from sound    # reuse the voice, redo sound + picture
    python pipeline/build.py videos/<id> --frames 600-760,1500-1620   # re-render only these frames
    python pipeline/build.py videos/<id> --only mux      # just re-encode and re-gate

Steps, in order:
  verify   script.json against the source report (fails the build on any unsourced claim)
  voice    narration + word timings                       -> assets/voice.wav, timings.json
  cues     the film's cue sheet, from the word timings    -> assets/cues.json
  sound    score, effects and the final mix               -> assets/score.wav, mix.wav
  frames   render the picture (slow: ~2 s/frame without a GPU) -> render/frames/
  mux      encode, add audio, normalise loudness          -> render/final.mp4
  thumb    render the thumbnail composition               -> render/thumbnail.jpg
  gate     runtime and format check on the final file (fails the build if over the limit)
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STUDIO = ROOT / "studio"
PY = sys.executable
STEPS = ["verify", "voice", "cues", "sound", "frames", "mux", "thumb", "gate"]
FPS = 30


def run(cmd: list[str], cwd: Path = ROOT) -> None:
    print(f"\n$ {' '.join(str(c) for c in cmd)}")
    subprocess.run([str(c) for c in cmd], cwd=cwd, check=True)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("video", type=Path)
    ap.add_argument("--from", dest="start", choices=STEPS, default="verify")
    ap.add_argument("--only", choices=STEPS)
    ap.add_argument("--frames", default="all", help='frame ranges to (re)render, e.g. "0-299,700-760"')
    ap.add_argument("--comp", default=None, help="Remotion composition id (default: from script.json)")
    args = ap.parse_args()

    video = args.video.resolve()
    script = json.loads((video / "script.json").read_text())
    comp = args.comp or script.get("composition", "V001")
    steps = [args.only] if args.only else STEPS[STEPS.index(args.start):]
    render = video / "render"
    frames = render / "frames"
    render.mkdir(exist_ok=True)

    for step in steps:
        if step == "verify":
            run([PY, "pipeline/verify.py", video])
        elif step == "voice":
            run([PY, "pipeline/voice.py", video])
        elif step == "cues":
            run(["node", "tools/cues.mjs", video / "assets" / "cues.json"], cwd=STUDIO)
        elif step == "sound":
            run([PY, "pipeline/sound.py", video])
        elif step == "frames":
            if args.frames == "all" and frames.exists():
                shutil.rmtree(frames)
            run(["node", "tools/frames.mjs", comp, frames, args.frames], cwd=STUDIO)
        elif step == "mux":
            cues = json.loads((video / "assets" / "cues.json").read_text())
            expected = int(-(-cues["end"] * FPS // 1))
            have = len(list(frames.glob("f*.jpg")))
            if have != expected:
                print(f"BUILD FAILED: {have} frames rendered, the film needs {expected}")
                return 1
            run([
                "ffmpeg", "-v", "error", "-y",
                "-framerate", str(FPS), "-i", frames / "f%05d.jpg",
                "-i", video / "assets" / "mix.wav",
                # YouTube plays back at about -14 LUFS; deliver there so it is not turned down or up
                "-af", "loudnorm=I=-14:TP=-1.5:LRA=9",
                "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p",
                "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
                "-c:a", "aac", "-b:a", "256k", "-ar", "48000",
                "-movflags", "+faststart", "-shortest", render / "final.mp4",
            ])
        elif step == "thumb":
            tmp = render / ".thumb"
            run(["node", "tools/stills.mjs", f"{comp}Thumb", tmp, "1", "0"], cwd=STUDIO)
            shutil.move(next(tmp.glob("*.jpg")), render / "thumbnail.jpg")
            shutil.rmtree(tmp)
        elif step == "gate":
            run([PY, "pipeline/verify.py", video, "--final"])

    print(f"\nBUILD OK: {', '.join(steps)}")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except subprocess.CalledProcessError as e:
        print(f"\nBUILD FAILED at: {' '.join(str(c) for c in e.cmd)}")
        sys.exit(1)
