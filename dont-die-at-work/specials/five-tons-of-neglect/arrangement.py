"""Sound for the long-form special. Placed on the film's cue sheet (assets/cues.json):
every beat by id, every section as "sec:<id>", plus "speechEnd" and "end"."""
import numpy as np

# How present the bed is in each section, start to finish. Long-form needs room to breathe:
# the bed sits low under explanation and comes up for the open, the failure and the close.
BED = {
    "cold": (0.8, 0.55), "what": (0.35, 0.4), "surplus": (0.4, 0.45), "storage": (0.45, 0.55), "timeline": (0.4, 0.75),
    "failure": (0.7, 0.9), "decision": (0.55, 0.6), "zone": (0.55, 0.65), "evac": (0.5, 0.55), "lead": (0.5, 0.45),
    "farms": (0.4, 0.45), "ending": (0.6, 0.25),
}
# The bed's bottom note, by cue: D1 is the channel's home note; C1 for the past, F1 while
# the routine holds, B-flat for the barrels going bad.
D1, C1, F1, BB0 = 36.71, 32.70, 43.65, 29.14
ROOTS = [("sec:cold", D1), ("sec:surplus", C1), ("sec:timeline", F1), ("tl-8", D1), ("sec:failure", BB0), ("sec:decision", C1),
         ("sec:zone", D1), ("sec:lead", F1), ("sec:farms", C1), ("sec:ending", D1)]
XFADE = 1.4  # seconds over which one note gives way to the next
# (beat, offset in seconds, gain, body): the moments that land.
HITS = [
    ("cold-1", 0.0, 0.9, 0.9), ("cold-3", 2.2, 0.9, 0.7), ("cold-4", 1.6, 1.0, 1.4), ("cold-5", 0.0, 0.5, 0.5), ("cold-6", 0.0, 0.5, 0.5),
    ("cold-8", 3.9, 1.0, 0.9), ("cold-title", 0.0, 1.0, 1.3), ("what-2", 2.6, 0.6, 0.5), ("what-5", 1.8, 0.7, 0.6), ("what-6", 0.0, 0.6, 0.5),
    ("sur-1", 0.0, 0.5, 0.5), ("sur-5", 1.2, 0.6, 0.5), ("sur-6", 2.2, 0.7, 0.6), ("sur-8", 0.0, 0.9, 1.0),
    ("sto-3", 0.0, 0.5, 0.4), ("sto-4", 0.0, 0.5, 0.4), ("sto-5", 0.0, 0.5, 0.4), ("sto-6", 0.0, 0.6, 0.5), ("sto-7", 0.0, 0.7, 0.8),
    ("tl-8", 0.0, 0.8, 0.7), ("tl-10", 0.0, 0.7, 0.6), ("tl-11", 2.2, 0.8, 0.7), ("tl-12", 5.0, 0.7, 0.6), ("tl-17", 0.0, 0.7, 0.6),
    ("tl-21", 0.0, 0.6, 0.6), ("tl-22", 2.4, 0.8, 0.7), ("tl-23", 2.2, 1.0, 1.3),
    ("fail-1", 0.0, 0.6, 0.6), ("fail-3", 2.6, 0.9, 0.9), ("fail-5", 0.0, 0.7, 0.5), ("fail-6", 0.0, 0.7, 0.5), ("fail-7", 0.0, 0.7, 0.5), ("fail-8", 0.0, 0.5, 0.5),
    ("dec-1", 0.0, 0.6, 0.6), ("dec-6", 1.6, 0.9, 0.8), ("dec-8", 0.0, 0.5, 0.6), ("dec-9", 0.0, 0.7, 0.8), ("dec-10", 0.0, 0.6, 0.5), ("dec-12", 0.0, 0.6, 0.5),
    ("dec-13", 0.0, 0.6, 0.5), ("dec-17", 0.0, 0.9, 1.2),
    ("zone-2", 0.0, 0.6, 0.6), ("zone-6", 0.0, 0.7, 0.6), ("zone-8", 0.0, 0.8, 0.9), ("evac-1", 0.0, 0.5, 0.5), ("evac-4", 0.0, 0.6, 0.5), ("evac-9", 0.0, 0.7, 0.8),
    ("lead-1", 2.6, 0.6, 0.5), ("lead-2", 0.0, 0.8, 0.8), ("lead-4", 0.0, 0.5, 0.5), ("lead-7", 0.0, 0.4, 0.5), ("lead-9", 0.0, 0.6, 0.7),
    ("farm-1", 0.0, 0.5, 0.5), ("farm-4", 0.0, 0.5, 0.5), ("farm-5", 0.0, 0.7, 0.7), ("farm-8", 0.0, 0.5, 0.6),
    ("end-1", 0.0, 0.8, 1.0), ("end-4", 0.0, 0.6, 0.7), ("end-5", 0.0, 0.8, 0.9), ("end-8", 0.0, 0.7, 0.8), ("end-9", 0.0, 0.8, 0.9), ("end-10", 0.0, 1.0, 1.4),
]
# (beat, offset, length): a build into the moment that follows.
RISES = [("cold-4", 0.6, 1.0), ("cold-8", 2.7, 1.2), ("cold-title", -1.2, 1.2), ("sur-8", -1.0, 1.0), ("tl-23", 1.0, 1.2), ("fail-3", 1.4, 1.2), ("dec-17", -1.1, 1.1), ("end-10", -1.2, 1.2)]
TICKS = ["tl-2", "tl-3", "tl-4", "tl-5", "tl-7", "tl-8", "tl-9", "tl-10", "tl-12", "tl-14", "tl-16", "tl-17", "tl-18", "tl-19"]


def arrange(tr, c, timings, lib):
    end = c["end"]
    n = int(end * lib.SR)
    sections = [k[4:] for k in c if k.startswith("sec:")]
    sections.sort(key=lambda s: c["sec:" + s])

    # ---- the bed
    points = []
    for i, s in enumerate(sections):
        start = c["sec:" + s]
        stop = c["sec:" + sections[i + 1]] if i + 1 < len(sections) else c["speechEnd"]
        a, b = BED.get(s, (0.5, 0.5))
        points += [(start + 0.01, a), (stop - 0.4, b), (stop - 0.05, min(a, b) * 0.4)]
    points += [(c["speechEnd"] + 0.6, 0.3), (end - 0.4, 0.2), (end, 0.0)]
    # One note held for thirteen minutes wears thin, so the bottom note moves at these cues.
    # Open fifths throughout (the drone has no third), and it comes home to D for the close.
    changes = [(c[name], hz) for name, hz in ROOTS if name in c]
    level = lib.curve(lib.t_axis(end), [(0, points[0][1])] + points)
    for i, (start, hz) in enumerate(changes):
        stop = changes[i + 1][0] if i + 1 < len(changes) else end
        a = max(0.0, start - XFADE / 2)
        b = min(end, stop + XFADE / 2)
        seg = lib.drone(b - a, [(0, 1.0), (b - a, 1.0)], root=hz)
        m = len(seg)
        k = int(XFADE * lib.SR)
        if i > 0:
            seg[:k] *= np.sin(np.linspace(0, np.pi / 2, k))[:, None]
        if i + 1 < len(changes):
            seg[-k:] *= np.cos(np.linspace(0, np.pi / 2, k))[:, None]
        i0 = int(a * lib.SR)
        m = min(m, n - i0)
        tr.buf[i0:i0 + m] += seg[:m] * level[i0:i0 + m, None] * 0.36
    # unease under the cold open and while the barrels go bad
    tr.buf[:n] += lib.tension(end, [
        (0, 0.0), (c["cold-2"], 0.3), (c["cold-4"], 0.7), (c["cold-5"], 0.2), (c["cold-6"], 0.0),
        (c["sec:failure"], 0.0), (c["fail-2"], 0.35), (c["fail-5"], 0.6), (c["fail-7"], 0.9), (c["fail-8"], 0.15), (c["sec:decision"], 0.0),
        (c["end-2"], 0.0), (c["end-3"], 0.3), (c["end-5"], 0.5), (c["end-6"], 0.0), (end, 0.0),
    ])

    # ---- impacts and builds
    for beat, off, gain, body in HITS:
        if beat in c:
            tr.add(c[beat] + off, lib.boom(body=body), gain * 0.42)
    for beat, off, length in RISES:
        if beat in c:
            tr.add(c[beat] + off, lib.riser(length, 220, 1500), 0.1)

    # ---- air on the cuts between sections
    for s in sections[1:]:
        tr.add(c["sec:" + s] - 0.15, lib.whoosh(0.6, 250, 2800), 0.09)
    # ---- a tick as each date lands on the timeline
    for beat in TICKS:
        if beat in c:
            tr.add(c[beat] + 0.02, lib.tick(1700), 0.06, pan=-0.2)
            tr.add(c[beat] + 0.12, lib.tick(2300), 0.04, pan=0.2)

    # ---- a pulse while nobody can open the barrels
    if "fail-4" in c and "fail-8" in c:
        beat = lib.heartbeat()
        at, gap = c["fail-4"] + 0.2, 0.95
        while at < c["fail-8"] - 0.4:
            tr.add(at, beat, 0.24)
            gap = max(0.56, gap * 0.985)
            at += gap

    # ---- the close
    if "end-8" in c:
        tr.add(c["end-8"] - 0.2, lib.pad(end - c["end-8"] + 0.2), 0.9)
