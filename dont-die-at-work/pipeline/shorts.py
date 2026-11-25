#!/usr/bin/env python3
"""Cut the Shorts listed in a film's script.json ("shorts") out of the finished film.

    python pipeline/shorts.py specials/five-tons-of-neglect            # all of them
    python pipeline/shorts.py specials/five-tons-of-neglect open       # just one

Each Short is rendered by the studio (composition LeadShort-<id>: the film's own scene in a band,
headline above, captions below) and gets the film's own sound for that stretch.
Output: <video>/render/shorts/<id>.mp4 (1080x1920). Build the film first: the mix must exist.
"""
from __future__ import annotations

import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FPS = 30


def main() -> int:
    video = Path(sys.argv[1]).resolve()
    only = set(sys.argv[2:])
    script = json.loads((video / "script.json").read_text())
    beats = {b["id"]: b for b in json.loads((video / "assets" / "timings.json").read_text())["beats"]}
    out = video / "render" / "shorts"
    out.mkdir(parents=True, exist_ok=True)
    for cut in script.get("shorts", []):
        if only and cut["id"] not in only:
            continue
        # the same arithmetic as studio/src/lead/Short.tsx (shortRange)
        start = max(0.0, beats[cut["from"]]["start"] - 0.3)
        length = beats[cut["to"]]["end"] + 0.9 - start
        frames = out / f".frames-{cut['id']}"
        if frames.exists():
            shutil.rmtree(frames)
        subprocess.run(["node", "tools/frames.mjs", f"LeadShort-{cut['id']}", str(frames), "all"], cwd=ROOT / "studio", check=True)
        target = out / f"{cut['id']}.mp4"
        subprocess.run([
            "ffmpeg", "-v", "error", "-y", "-framerate", str(FPS), "-i", str(frames / "f%05d.jpg"),
            "-ss", f"{start:.3f}", "-t", f"{length:.3f}", "-i", str(video / "assets" / "mix.wav"),
            "-af", f"afade=t=out:st={length - 0.5:.3f}:d=0.5,loudnorm=I=-14:TP=-1.5:LRA=9",
            "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p",
            "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
            "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-movflags", "+faststart", "-shortest", str(target),
        ], check=True)
        shutil.rmtree(frames)
        print(f"{cut['id']}: {length:.1f} s -> {target}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
