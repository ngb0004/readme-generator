"""Sound for 001. Placed on the film's cue sheet (assets/cues.json)."""


def arrange(tr, c, timings, lib):
    end = c["end"]
    n = int(end * lib.SR)
    words = {b["id"]: b["words"] for b in timings["beats"]}

    # ---- the bed: present for the hook, calm while it all looks routine, gone when nobody is watching
    tr.buf[:n] += lib.drone(end, [
        (0, 0.85), (c["h3"], 0.9), (c["h3"] + 0.3, 0.45), (c["ma2"], 0.45), (c["cooked"], 0.75), (c["shut"], 0.75), (c["shut"] + 0.5, 0.15),
        (c["pumped"], 0.2), (c["onPurpose"], 0.55), (c["m1"], 0.4), (c["i1"], 0.3), (c["out"], 0.4), (c["leaking"], 0.75), (c["f1"], 0.5),
        (c["tr"], 0.4), (c["i2"], 0.5), (c["i4"], 0.7), (c["calm"], 0.85), (c["i6"] - 0.05, 1.0), (c["i6"], 0.0),
        (c["i7"] - 0.05, 0.0), (c["i7"], 0.6), (c["stop"], 0.4), (c["br1"], 0.25), (c["i9"], 0.9), (c["lying"], 0.9), (c["lying"] + 0.7, 0.15),
        (c["i11"], 0.45), (c["alarm"], 0.7), (c["i12"], 0.1), (c["af"], 0.3), (c["l2"], 0.5), (c["l3"], 0.5), (c["tribute"], 0.2), (end - 0.25, 0.25), (end, 0.0),
    ]) * 0.4
    tr.buf[:n] += lib.tension(end, [
        (0, 0), (c["i2"], 0), (c["five"] + 1, 0.3), (c["i4"], 0.45), (c["calm"], 0.7), (c["i6"] - 0.02, 1.0), (c["i6"], 0.0),
        (c["i7"], 0.3), (c["stop"], 0.55), (c["br1"], 0.15), (c["i9"], 0.5), (c["lying"], 0.9), (c["lying"] + 0.6, 0.0), (end, 0),
    ])

    # ---- impacts on the moments that matter: (cue, offset, gain, body)
    for name, off, gain, body in (
        ("die", -1.88, 0.9, 0.6), ("die", 0.0, 1.0, 0.9), ("h3", 0.0, 0.6, 0.4), ("breathing", 0.15, 0.7, 0.5),
        ("gasCalled", 0.0, 0.6, 0.4), ("ma2", 0.0, 0.55, 0.5), ("purpose", 0.0, 0.6, 0.4), ("cooked", 0.0, 0.7, 1.2),
        ("gasoline", 0.0, 0.4, 0.3), ("jet", 0.0, 0.4, 0.3), ("shut", 0.0, 0.9, 1.0), ("opened", 0.3, 0.5, 0.3),
        ("cantTouch", 0.0, 0.7, 0.4), ("onPurpose", 0.0, 0.8, 0.5), ("bolted", 0.15, 0.6, 0.4),
        ("m1", 0.0, 0.45, 0.4), ("blackOut", 0.2, 1.0, 1.2), ("noSmell", 0.0, 0.6, 0.35), ("noTaste", 0.0, 0.6, 0.35),
        ("noWarning", 0.0, 0.75, 0.5), ("i1", 0.0, 0.6, 0.6),
        ("leaking", 0.0, 0.8, 0.7), ("lean", 1.0, 0.6, 0.5), ("noSign", 0.0, 0.6, 0.35), ("noBarrier", 0.0, 0.6, 0.35),
        ("na", 0.2, 0.9, 0.7), ("tr", 0.5, 0.4, 0.3), ("never", 0.0, 0.9, 0.6),
        ("five", 0.9, 0.55, 0.5), ("delay", 0.0, 0.8, 0.5), ("around", 0.3, 0.6, 0.6),
        ("i6", 0.0, 1.0, 1.3), ("i7", 0.0, 0.6, 0.6), ("stayOut", 0.0, 1.0, 0.9),
        ("hold", 0.0, 0.6, 0.4), ("fight", 0.0, 0.6, 0.4), ("justBreathe", 0.0, 0.6, 0.4), ("justBreathe", 1.3, 0.9, 1.1),
        ("climbs", 0.0, 0.6, 0.4), ("lying", 0.25, 1.0, 1.4), ("nearZero", 0.0, 0.9, 0.8), ("i12", 0.0, 0.9, 1.3),
        ("wentUp", 0.3, 0.8, 0.7), ("required", 0.15, 0.6, 0.4), ("l2", 0.25, 0.8, 0.7), ("doNot", 0.0, 0.8, 0.5), ("callIt", 0.0, 0.6, 0.4),
    ):
        tr.add(c[name] + off, lib.boom(body=body), gain * 0.5)
    eighty = next(w["start"] for w in words["hook-3"] if w["w"].lower().startswith("eighty"))
    tr.add(eighty - 0.06, lib.boom(body=0.9), 0.5)
    for w in words["signoff"]:
        if w["w"].lower().strip(".") in ("don't", "at", "today"):
            tr.add(w["start"] - 0.03, lib.boom(body=0.5), 0.34)

    # ---- air on the cuts
    for name in ("h2", "h3", "breathing", "standing", "ma2", "ma3", "ma4", "m1", "m2", "i1", "out", "f1", "permit", "tr", "i2", "i3", "wire", "i4", "i5",
                 "i7", "i8", "br1", "i9", "i10", "i11", "af", "l2", "l3", "tribute"):
        tr.add(c[name] - 0.2, lib.whoosh(), 0.08)

    # ---- builds
    tr.add(c["die"] - 1.0, lib.riser(1.0, 220, 1400), 0.13)
    tr.add(c["blackOut"] - 1.1, lib.riser(1.1, 260, 1800), 0.1)
    tr.add(c["i6"] - 1.3, lib.riser(1.3, 300, 2200), 0.14)
    tr.add(c["stayOut"] - 1.0, lib.riser(1.0, 240, 1600), 0.1)

    # ---- two breaths, then nothing
    tr.add(c["one"] - 0.12, lib.breath(0.8), 0.16)
    tr.add(c["two"] - 0.05, lib.breath(0.9), 0.16)

    # ---- the gas, coming out of the hole
    tr.add(c["leaking"] - 0.3, lib.whoosh(2.2, 200, 1500), 0.1)
    tr.add(c["around"] - 0.2, lib.whoosh(2.0, 180, 1200), 0.08)

    # ---- a pulse under the attempts; it stops dead when nobody is watching
    beat = lib.heartbeat()
    at, gap = c["i4"] + 0.1, 0.78
    while at < c["i6"] - 0.35:
        tr.add(at, beat, 0.32)
        gap *= 0.97
        at += max(0.46, gap)
    # the foreman at the edge: slow, steady, then racing down the ladder, then gone
    at, gap = c["i8"] + 0.3, 0.92
    while at < c["lying"] + 0.1:
        tr.add(at, beat, 0.3)
        gap *= 0.985 if at < c["i9"] else 0.9
        at += max(0.36, gap)

    # ---- interface sounds for the graphics
    for name, off in (("inside", 0.1), ("refilled", 0.6), ("pumped", 0.1), ("comeOut", 0.0), ("crew", 0.0), ("wire", 0.15),
                      ("sits", 0.35), ("taught", 0.3), ("under", 0.0), ("feels", 0.0), ("meter", 0.6)):
        tr.add(c[name] + off + 0.02, lib.tick(1500 if name == "comeOut" else 2100), 0.05, pan=0.3)
    # the fresh batch pouring in, the nitrogen coming on
    tr.add(c["refilled"], lib.whoosh(1.1, 900, 5200), 0.07)
    tr.add(c["pumped"], lib.whoosh(1.6, 200, 1800), 0.1)
    tr.add(c["callIt"] + 0.05, lib.radio(), 0.13, pan=0.35)
    # the oxygen meter: it alarms the moment it is in the hole
    for k in range(9):
        tr.add(c["alarm"] + k * 0.24, lib.tick(2900), 0.1, pan=0.15)
        tr.add(c["alarm"] + k * 0.24 + 0.08, lib.tick(2900), 0.1, pan=0.15)

    # ---- tribute
    tr.add(c["tribute"] - 0.1, lib.pad(end - c["tribute"] + 0.1), 1.0)
