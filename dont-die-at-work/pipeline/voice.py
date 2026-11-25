#!/usr/bin/env python3
"""Narration + word timings.

Synthesises each beat of script.json with Kokoro (runs locally, no API key),
lays the beats end to end with the script's gaps, then aligns every word with
faster-whisper so captions and animation cues can lock to the voice.

Whisper doubles as a pronunciation check: it has never seen the script, so if
it cannot hear a word the narrator probably did not say it clearly.

Outputs, in videos/<id>/assets/:
  voice.wav      48 kHz mono narration
  timings.json   beat and word times in seconds
"""
from __future__ import annotations

import argparse
import difflib
import hashlib
import json
import re
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

ROOT = Path(__file__).resolve().parent.parent
MODELS = ROOT / "models"
SR_OUT = 48_000
LEAD_IN = 0.10          # silence before the first word: the hook lands almost immediately
DEFAULT_GAP = 0.20


# Words that sound the same. A beat may respell a word for the voice ("say"): the metal is
# written "led" so it is not read as the verb, and the recogniser may write either.
SAME = {"led": "lead", "fuse": "fuze", "azine": "azide"}   # the recogniser does not know "azide"


def key(word: str) -> str:
    k = re.sub(r"[^a-z0-9]", "", word.lower())
    return SAME.get(k, k)


def trim(audio: np.ndarray, sr: int, floor_db: float = -55.0, pad: float = 0.12) -> np.ndarray:
    """Cut the silence off both ends, gently. A harder trim (-42 dB, 25 ms) clipped soft final
    consonants: the recogniser heard "corn" as "core" and "azide" as "aza" until this was eased."""
    win = int(sr * 0.01)
    env = np.sqrt(np.convolve(audio**2, np.ones(win) / win, mode="same"))
    loud = np.where(env > 10 ** (floor_db / 20))[0]
    if len(loud) == 0:
        return audio
    a = max(0, loud[0] - int(pad * sr))
    b = min(len(audio), loud[-1] + int(pad * sr))
    out = audio[a:b].copy()
    fade = int(sr * 0.008)
    out[:fade] *= np.linspace(0, 1, fade)
    out[-fade:] *= np.linspace(1, 0, fade)
    return out


def align(words: list[str], heard: list[tuple[str, float, float]], dur: float):
    """Give every script word a start/end. Words whisper missed are interpolated."""
    a = [key(w) for w in words]
    b = [key(h[0]) for h in heard]
    times: list[tuple[float, float] | None] = [None] * len(words)
    differs: list[tuple[str, str]] = []
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
        if tag == "equal":
            for k in range(i2 - i1):
                times[i1 + k] = (heard[j1 + k][1], heard[j1 + k][2])
        elif tag == "replace" and j2 > j1:
            # numbers spoken as words come back as digits ("twenty-five" -> "25"): not a mispronunciation
            if "".join(a[i1:i2]) != "".join(b[j1:j2]) and not any(ch.isdigit() for ch in "".join(a[i1:i2]) + "".join(b[j1:j2])):
                differs.append((" ".join(words[i1:i2]), " ".join(h[0].strip() for h in heard[j1:j2])))
            # Same stretch of audio, different spelling ("2005" vs "two thousand five"):
            # spread the script words across it by length.
            t0, t1 = heard[j1][1], heard[j2 - 1][2]
            lens = np.array([max(1, len(x)) for x in a[i1:i2]], dtype=float)
            edges = t0 + (t1 - t0) * np.concatenate([[0], np.cumsum(lens) / lens.sum()])
            for k in range(i2 - i1):
                times[i1 + k] = (float(edges[k]), float(edges[k + 1]))
    missed = sum(t is None for t in times) + sum(len(d[0].split()) for d in differs)
    # Fill anything still unknown from its neighbours.
    for i, t in enumerate(times):
        if t is not None:
            continue
        j = i
        while j < len(times) and times[j] is None:
            j += 1
        left = times[i - 1][1] if i > 0 else 0.0
        right = times[j][0] if j < len(times) else dur
        n = j - i
        for k in range(n):
            times[i + k] = (left + (right - left) * k / n, left + (right - left) * (k + 1) / n)
    out = []
    for w, (s, e) in zip(words, times):
        out.append({"w": w, "start": max(0.0, s), "end": min(dur, max(e, s + 0.04))})
    for i in range(1, len(out)):   # keep word starts strictly ordered
        out[i]["start"] = max(out[i]["start"], out[i - 1]["start"] + 0.02)
        out[i]["end"] = max(out[i]["end"], out[i]["start"] + 0.04)
    return out, missed, differs


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("video", type=Path)
    ap.add_argument("--voice", help="override the voice in script.json (for auditions)")
    ap.add_argument("--speed", type=float)
    args = ap.parse_args()

    script = json.loads((args.video / "script.json").read_text())
    cfg = script.get("voice", {})
    voice = args.voice or cfg.get("voice", "am_michael")
    speed = args.speed or cfg.get("speed", 1.0)

    from kokoro_onnx import Kokoro
    from faster_whisper import WhisperModel

    tts = Kokoro(str(MODELS / "kokoro-v1.0.onnx"), str(MODELS / "voices-v1.0.bin"))
    asr = WhisperModel(str(MODELS / "faster-whisper-small.en"), device="cpu", compute_type="int8")

    track: list[np.ndarray] = [np.zeros(int(LEAD_IN * SR_OUT), dtype=np.float32)]
    cursor = LEAD_IN
    beats_out = []
    total_missed = total_words = 0

    # A long script changes a line at a time. Keep each beat's audio and what the recogniser
    # heard, keyed by exactly what was spoken, so a re-run only redoes the beats that changed.
    cache = args.video / "assets" / ".voice-cache"
    cache.mkdir(parents=True, exist_ok=True)
    for beat in script["beats"]:
        text = beat.get("say", beat["narration"])    # "say" lets a beat respell a word for the voice
        stamp = hashlib.sha1(json.dumps([text, voice, speed, cfg.get("lang", "en-us"), "trim -55dB 120ms"]).encode()).hexdigest()[:20]
        kept = cache / f"{stamp}.npz"
        if kept.exists():
            z = np.load(kept, allow_pickle=False)
            audio, sr = z["audio"], int(z["sr"])
            heard = [(str(w), float(a), float(b)) for w, a, b in zip(z["words"], z["starts"], z["ends"])]
        else:
            raw, sr = tts.create(text, voice=voice, speed=speed, lang=cfg.get("lang", "en-us"))
            audio = trim(raw.astype(np.float32), sr)
            segments, _ = asr.transcribe(audio_16k(audio, sr), language="en", word_timestamps=True,
                                         beam_size=5, condition_on_previous_text=False)
            heard = [(w.word, w.start, w.end) for seg in segments for w in seg.words]
            np.savez(kept, audio=audio, sr=sr, words=np.array([h[0] for h in heard], dtype=str),
                     starts=np.array([h[1] for h in heard]), ends=np.array([h[2] for h in heard]))
        dur = len(audio) / sr
        words, missed, differs = align(beat["narration"].split(), heard, dur)
        total_missed += missed
        total_words += len(words)
        heard_text = " ".join(h[0].strip() for h in heard)
        flag = "" if missed == 0 else f"   <-- CHECK: {missed} word(s) not heard as written {differs}"
        print(f"{beat['id']:10s} {cursor:6.2f}s +{dur:5.2f}s  heard: {heard_text}{flag}")

        beats_out.append({
            "id": beat["id"], "section": beat["section"],
            "start": round(cursor, 3), "end": round(cursor + dur, 3),
            "words": [{"w": w["w"], "start": round(cursor + w["start"], 3), "end": round(cursor + w["end"], 3)}
                      for w in words],
        })
        track.append(resample_poly(audio, SR_OUT, sr).astype(np.float32))
        gap = float(beat.get("gap_after", DEFAULT_GAP))
        track.append(np.zeros(int(gap * SR_OUT), dtype=np.float32))
        cursor += dur + gap

    voice_track = np.concatenate(track)
    assets = args.video / "assets"
    assets.mkdir(exist_ok=True)
    sf.write(assets / "voice.wav", voice_track, SR_OUT, subtype="PCM_16")
    speech_end = beats_out[-1]["end"]
    (assets / "timings.json").write_text(json.dumps({
        "voice": voice, "speed": speed, "speech_end": round(speech_end, 3), "beats": beats_out,
    }, indent=1) + "\n")

    wpm = total_words / (speech_end / 60)
    print(f"\nvoice={voice} speed={speed}  speech ends at {speech_end:.2f}s  {total_words} words  {wpm:.0f} wpm")
    print(f"pronunciation check: {total_words - total_missed}/{total_words} words heard as written")
    return 0


def audio_16k(audio: np.ndarray, sr: int) -> np.ndarray:
    return resample_poly(audio, 16_000, sr).astype(np.float32)


if __name__ == "__main__":
    sys.exit(main())
