#!/usr/bin/env python3
"""Score and sound effects, synthesised from nothing but maths.

No samples, no licensed music: every sound is generated here, so there is
nothing to clear and nothing that can trigger a copyright claim. Everything is
placed on the film's cue sheet (assets/cues.json), which comes from the same
word timings that drive the picture.

The instruments live here; each video places them itself in
videos/<id>/arrangement.py.

Outputs, in videos/<id>/assets/:
  score.wav   stereo music + effects
  mix.wav     narration + score, ducked under the voice
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt, sosfiltfilt

SR = 48_000
rng = np.random.default_rng(7)


def t_axis(dur: float) -> np.ndarray:
    return np.arange(int(dur * SR)) / SR


def lp(x, hz, order=2):
    return sosfilt(butter(order, hz, "low", fs=SR, output="sos"), x)


def hp(x, hz, order=2):
    return sosfilt(butter(order, hz, "high", fs=SR, output="sos"), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), x)


class Track:
    def __init__(self, dur: float) -> None:
        self.buf = np.zeros((int(dur * SR) + SR, 2))

    def add(self, at: float, sig: np.ndarray, gain: float = 1.0, pan: float = 0.0) -> None:
        """pan: -1 left .. +1 right. `sig` may be mono or stereo."""
        i = max(0, int(at * SR))
        if sig.ndim == 1:
            l = np.cos((pan + 1) * np.pi / 4)
            r = np.sin((pan + 1) * np.pi / 4)
            sig = np.stack([sig * l, sig * r], axis=1) * np.sqrt(2) * 0.7071
        n = min(len(sig), len(self.buf) - i)
        if n > 0:
            self.buf[i:i + n] += sig[:n] * gain


# ---------------------------------------------------------------- instruments
def boom(dur=1.6, f0=92.0, f1=36.0, body=0.5):
    """Sub impact: a pitch-dropping sine with a soft thump on the front."""
    t = t_axis(dur)
    f = f1 + (f0 - f1) * np.exp(-t / 0.07)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / body)
    click = lp(rng.standard_normal(len(t)), 900) * np.exp(-t / 0.018) * 0.9
    growl = lp(sum(np.sign(np.sin(2 * np.pi * 55 * d * t)) for d in (1.0, 1.007, 0.5)) / 3, 260) * np.exp(-t / (body * 0.8)) * 0.35
    out = sub + click + growl
    out[: int(0.002 * SR)] *= np.linspace(0, 1, int(0.002 * SR))
    return np.tanh(out * 1.4) * 0.8


def whoosh(dur=0.42, lo=300, hi=3200, rev=False):
    t = t_axis(dur)
    n = rng.standard_normal(len(t))
    k = t / dur
    # sweep a band-pass by cross-fading three fixed bands
    bands = [bp(n, lo, lo * 2.2), bp(n, (lo * hi) ** 0.5 * 0.7, (lo * hi) ** 0.5 * 1.5), bp(n, hi * 0.6, hi)]
    w = [np.clip(1 - k * 2, 0, 1), 1 - np.abs(k * 2 - 1), np.clip(k * 2 - 1, 0, 1)]
    sig = sum(b * ww for b, ww in zip(bands, w)) * np.sin(np.pi * k) ** 2
    if rev:
        sig = sig[::-1]
    l = sig * np.cos(k * np.pi / 2)
    r = sig * np.sin(k * np.pi / 2)
    return np.stack([l, r], axis=1)


def riser(dur=1.4, f0=180, f1=1500):
    t = t_axis(dur)
    k = t / dur
    f = f0 * (f1 / f0) ** (k ** 1.6)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.5 * np.sin(2 * np.pi * np.cumsum(f * 1.498) / SR)
    air = hp(rng.standard_normal(len(t)), 2500) * 0.5
    return (tone * 0.5 + air) * k ** 2.6


def thump(f=58.0, dur=0.16):
    t = t_axis(dur)
    return np.sin(2 * np.pi * f * t * (1 + 0.5 * np.exp(-t / 0.02))) * np.exp(-t / 0.045)


def heartbeat():
    return np.concatenate([thump(60), np.zeros(int(0.12 * SR)), thump(52) * 0.7])


def tick(f=1900.0):
    t = t_axis(0.05)
    return np.sin(2 * np.pi * f * t) * np.exp(-t / 0.008)


def curve(t: np.ndarray, points: list[tuple[float, float]]) -> np.ndarray:
    pts = sorted(points)
    return np.interp(t, [p[0] for p in pts], [p[1] for p in pts])


def drone(dur: float, points: list[tuple[float, float]]) -> np.ndarray:
    """Low bed under everything. `points` is its level over time: (seconds, 0..1)."""
    t = t_axis(dur)
    out = np.zeros((len(t), 2))
    for ch, det in ((0, 1.0), (1, 1.004)):
        s = np.zeros(len(t))
        for f, a, lf in ((36.71, 1.0, 0.07), (55.0, 0.55, 0.11), (73.42, 0.5, 0.05), (110.0, 0.16, 0.09), (146.83, 0.07, 0.13)):
            s += a * np.sin(2 * np.pi * f * det * t + ch) * (0.72 + 0.28 * np.sin(2 * np.pi * lf * t + f))
        rumble = lp(rng.standard_normal(len(t)), 90, 3) * 2.2
        out[:, ch] = s * 0.22 + rumble * 0.25
    return out * curve(t, points)[:, None]


def tension(dur: float, points: list[tuple[float, float]]) -> np.ndarray:
    """A thin, beating high tone: unease you feel more than hear."""
    t = t_axis(dur)
    tone = np.sin(2 * np.pi * 1480 * t) + np.sin(2 * np.pi * 1487 * t) + 0.5 * np.sin(2 * np.pi * 2217 * t)
    e = curve(t, points)
    return np.stack([tone * e, np.roll(tone, 40) * e], axis=1) * 0.012


def breath(dur=0.9) -> np.ndarray:
    """One slow inhale: air through a narrowing band."""
    t = t_axis(dur)
    k = t / dur
    n = bp(rng.standard_normal(len(t)), 500, 2600)
    return n * np.sin(np.pi * k) ** 1.5 * (0.6 + 0.4 * k)


def pad(dur: float) -> np.ndarray:
    """The tribute: an open D chord, no third, so it is neither happy nor sad."""
    t = t_axis(dur)
    out = np.zeros((len(t), 2))
    for f, a in ((146.83, 1.0), (220.0, 0.8), (293.66, 0.7), (329.63, 0.45), (440.0, 0.3), (587.33, 0.14)):
        for ch, det in ((0, 0.9975), (1, 1.0025)):
            out[:, ch] += a * np.sin(2 * np.pi * f * det * t + f) * (0.8 + 0.2 * np.sin(2 * np.pi * 0.21 * t + f))
    env = np.minimum(1, t / 1.6) * np.minimum(1, (dur - t) / 0.5)
    return lp(out.T, 1800).T * env[:, None] * 0.06


def radio() -> np.ndarray:
    t = t_axis(0.5)
    static = bp(rng.standard_normal(len(t)), 900, 3200) * (np.exp(-t / 0.2) * 0.5 + 0.12)
    beeps = np.zeros(len(t))
    for at in (0.0, 0.11):
        i = int(at * SR)
        b = np.sin(2 * np.pi * 1850 * t_axis(0.07)) * np.hanning(int(0.07 * SR))
        beeps[i:i + len(b)] += b
    return static * 0.6 + beeps * 0.5


# ---------------------------------------------------------------- arrangement
def score(video: Path, cues: dict, timings: dict) -> np.ndarray:
    """Each video arranges the instruments itself, in videos/<id>/arrangement.py."""
    import importlib.util
    spec = importlib.util.spec_from_file_location("arrangement", video / "arrangement.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    end = cues["end"]
    tr = Track(end)
    mod.arrange(tr, cues, timings, sys.modules[__name__])
    return tr.buf[: int(end * SR)]


def envelope(x: np.ndarray, attack=0.012, release=0.28) -> np.ndarray:
    level = np.sqrt(sosfiltfilt(butter(1, 18, "low", fs=SR, output="sos"), x ** 2).clip(0))
    out = np.zeros_like(level)
    a = np.exp(-1 / (attack * SR))
    r = np.exp(-1 / (release * SR))
    y = 0.0
    for i, v in enumerate(level):
        y = a * y + (1 - a) * v if v > y else r * y + (1 - r) * v
        out[i] = y
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("video", type=Path)
    args = ap.parse_args()
    assets = args.video / "assets"
    cues = json.loads((assets / "cues.json").read_text())
    end = cues["end"]
    n = int(end * SR)

    voice, sr = sf.read(assets / "voice.wav")
    assert sr == SR
    voice = np.pad(voice, (0, max(0, n - len(voice))))[:n]
    voice = hp(voice, 72)                                    # clear the rumble out from under the voice
    env = envelope(voice)
    # gentle levelling: bring quiet words up, hold loud ones
    target = 0.11
    gain = np.clip(target / np.maximum(env, 0.02), 0.6, 2.4)
    gain = sosfiltfilt(butter(1, 3, "low", fs=SR, output="sos"), gain)
    voice = np.tanh(voice * gain * 1.5) / 1.5

    music = score(args.video, cues, json.loads((assets / "timings.json").read_text()))
    sf.write(assets / "score.wav", music * 0.9, SR, subtype="PCM_16")

    # the score steps back whenever he is talking
    talking = np.clip(envelope(voice) / 0.05, 0, 1)
    duck = 1 - 0.55 * talking
    mix = music * duck[:, None] * 0.7 + voice[:, None] * 1.15
    peak = np.abs(mix).max()
    if peak > 0.97:
        mix *= 0.97 / peak
    fade = int(0.25 * SR)
    mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
    sf.write(assets / "mix.wav", mix, SR, subtype="PCM_16")
    print(f"score + mix written: {end:.2f}s, peak {np.abs(mix).max():.2f}, voice rms {np.sqrt((voice**2).mean()):.3f}, music rms {np.sqrt((music**2).mean()):.3f}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
