#!/usr/bin/env python3
"""Our own estimate of where the dust cloud goes. All of the arithmetic is in this file.

    python specials/five-tons-of-neglect/estimate.py          # recompute and write estimate.json
    (pipeline/verify.py re-runs compute() and fails the build if estimate.json does not match)

Input
    source/nws-gridpoint-dvn-45-33.json: the National Weather Service gridpoint forecast for the
    cell that holds the Iowa Army Ammunition Plant, exactly as downloaded from
    https://api.weather.gov/gridpoints/DVN/45,33

Method
    1. Air that leaves the plant at 9 a.m. Central is moved, an hour at a time, by that hour's
       forecast wind, until 5 p.m. (the window the Army's maps cover).
    2. Two winds are used. The "transport wind" is the average wind through the layer of air that
       mixes with the ground; the Weather Service publishes it for smoke forecasting, and it is
       what carries a cloud. The surface wind (10 m) is slower, so it gives the trailing estimate.
    3. Width: the Briggs open-country curve for neutral air (Pasquill class D, the class for an
       overcast day), sigma_y = 0.08 x / sqrt(1 + 0.0001 x), x in metres. The band drawn is two
       sigma either side. This is a textbook curve stretched well past the distance it was fitted
       for, so the film draws it as a soft edge, not a line.
    4. The forecast gives direction in ten-degree steps. The fan either side of the track shows
       what a ten-degree error in the wind would do.

What this does not estimate
    How much lead is in the air, or how much lands anywhere. That depends on how much the blast
    lifts, and the basis for the Army's own numbers is not public. Nothing here should be read as
    a statement about exposure.
"""
from __future__ import annotations

import hashlib
import json
import math
import re
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
FORECAST = "source/nws-gridpoint-dvn-45-33.json"
PLANT = (-91.262, 40.805)            # lon, lat: the same point the film's maps use
RELEASE = datetime(2026, 11, 25, 15, 0, tzinfo=timezone.utc)   # 9:00 a.m. Central Standard Time
HOURS = 8                            # 9 a.m. to 5 p.m.
KMH_TO_MPH = 0.621371
MILES_PER_DEG_LAT = 69.05
# Where the Army's newest maps point, as reported: past Knox City, toward Macon (CBS News Chicago).
KNOX_CITY = (-92.008, 40.143)
MACON = (-92.472, 39.74)
CENTRAL = timezone(timedelta(hours=-6))


def dest(origin: tuple[float, float], bearing: float, miles: float) -> tuple[float, float]:
    """The point `miles` from `origin` on a compass bearing. Flat-earth step; fine over an hour's travel."""
    b = math.radians(bearing)
    d_lat = miles * math.cos(b) / MILES_PER_DEG_LAT
    d_lon = miles * math.sin(b) / (MILES_PER_DEG_LAT * math.cos(math.radians(origin[1])))
    return (origin[0] + d_lon, origin[1] + d_lat)


def separation(a: tuple[float, float], b: tuple[float, float]) -> tuple[float, float]:
    """(miles, bearing) from a to b."""
    north = (b[1] - a[1]) * MILES_PER_DEG_LAT
    east = (b[0] - a[0]) * MILES_PER_DEG_LAT * math.cos(math.radians((a[1] + b[1]) / 2))
    return math.hypot(north, east), math.degrees(math.atan2(east, north)) % 360


def hourly(series: dict) -> dict[datetime, float]:
    """The forecast stores runs of equal hours as one entry ("…/PT3H"). Spread them out."""
    out: dict[datetime, float] = {}
    for item in series["values"]:
        start, span = item["validTime"].split("/")
        m = re.fullmatch(r"P(?:(\d+)D)?(?:T(?:(\d+)H)?)?", span)
        hours = int(m.group(1) or 0) * 24 + int(m.group(2) or 0)
        t0 = datetime.fromisoformat(start)
        for h in range(hours):
            out[t0 + timedelta(hours=h)] = item["value"]
    return out


def sigma_y(metres: float) -> float:
    """Briggs open-country lateral spread for Pasquill class D."""
    return 0.08 * metres / math.sqrt(1 + 0.0001 * metres)


def track(direction: dict, speed: dict) -> list[dict]:
    """Move one parcel of air from the plant, an hour at a time."""
    at = PLANT
    path = 0.0
    out = [{"hour": RELEASE.astimezone(CENTRAL).strftime("%H:%M"), "lon": round(at[0], 4), "lat": round(at[1], 4), "miles": 0.0,
            "from_deg": direction[RELEASE], "mph": round(speed[RELEASE] * KMH_TO_MPH, 1), "half_width_miles": 0.0}]
    for h in range(HOURS):
        t = RELEASE + timedelta(hours=h)
        step = speed[t] * KMH_TO_MPH                     # miles travelled in this hour
        at = dest(at, (direction[t] + 180) % 360, step)  # wind FROM 50 degrees carries air TOWARD 230
        path += step
        nxt = t + timedelta(hours=1)
        out.append({
            "hour": nxt.astimezone(CENTRAL).strftime("%H:%M"), "lon": round(at[0], 4), "lat": round(at[1], 4), "miles": round(path, 1),
            "from_deg": direction.get(nxt), "mph": round(speed[nxt] * KMH_TO_MPH, 1) if nxt in speed else None,
            "half_width_miles": round(2 * sigma_y(path / KMH_TO_MPH * 1000) / 1000 * KMH_TO_MPH, 1),
        })
    return out


def compute(video: Path = HERE) -> dict:
    raw = (video / FORECAST).read_bytes()
    grid = json.loads(raw)["properties"]
    transport = track(hourly(grid["transportWindDirection"]), hourly(grid["transportWindSpeed"]))
    surface = track(hourly(grid["windDirection"]), hourly(grid["windSpeed"]))
    reach, bearing = separation(PLANT, (transport[-1]["lon"], transport[-1]["lat"]))
    reach_s, bearing_s = separation(PLANT, (surface[-1]["lon"], surface[-1]["lat"]))
    _, army = separation(PLANT, MACON)
    knox_miles, knox_bearing = separation(PLANT, KNOX_CITY)
    at_noon = next(p for p in transport if p["hour"] == "12:00")
    mph = [p["mph"] for p in transport[:-1]]
    sky = hourly(grid["skyCover"])
    issued = datetime.fromisoformat(grid["updateTime"]).astimezone(CENTRAL)
    # when the transport track has covered the distance to Knox City
    passed = next(i for i, p in enumerate(transport) if p["miles"] >= knox_miles)
    a, b = transport[passed - 1], transport[passed]
    knox_hour = 9 + (passed - 1) + (knox_miles - a["miles"]) / (b["miles"] - a["miles"])
    return {
        "what": "Where air leaving the plant at 9 a.m. CST on 2026-11-25 is carried by the forecast wind. Not an estimate of lead in the air or on the ground.",
        "inputs": [{"file": FORECAST, "sha256": hashlib.sha256(raw).hexdigest(), "url": "https://api.weather.gov/gridpoints/DVN/45,33",
                    "issued": grid["updateTime"], "issued_central": issued.strftime("%A %-I:%M %p CST, %b. %-d")}],
        "method": {"release": "09:00 CST", "hours": HOURS, "stability_class": "D (overcast: sky cover %d to %d percent)" % (
                       min(sky[RELEASE + timedelta(hours=h)] for h in range(HOURS)), max(sky[RELEASE + timedelta(hours=h)] for h in range(HOURS))),
                   "spread": "Briggs open-country sigma_y = 0.08 x / sqrt(1 + 0.0001 x); the band is two sigma either side",
                   "direction_error_deg": 10},
        "transport": transport,
        "surface": surface,
        "summary": {
            "transport_bearing_deg": round(bearing, 1), "transport_reach_miles": round(reach, 1),
            "surface_bearing_deg": round(bearing_s, 1), "surface_reach_miles": round(reach_s, 1),
            "army_bearing_deg": round(army, 1), "bearing_difference_deg": round(abs(bearing - army), 1),
            "knox_city_miles": round(knox_miles, 1), "knox_city_bearing_deg": round(knox_bearing, 1), "knox_city_reached_hour": round(knox_hour, 2),
            "mph_at_9am": mph[0], "mph_min": min(mph), "mph_max": max(mph),
            "miles_by_noon": at_noon["miles"], "miles_by_5pm": transport[-1]["miles"],
        },
        # The only numbers an "estimate" line of the script may say or show, each with where it comes from.
        "figures": [
            {"value": 9, "from": "the release hour, 9 a.m., from the Army's announcement"},
            {"value": 5, "from": "the last hour computed, 5 p.m., the end of the window the Army's maps cover"},
            {"value": 2, "from": "the two tracks computed: one from the transport wind, one from the surface wind"},
            {"value": round(mph[0]), "from": "transport wind at 9 a.m.: %.1f mph" % mph[0]},
            {"value": round(max(mph)), "from": "strongest transport wind, 9 a.m. to 5 p.m.: %.1f mph" % max(mph)},
            {"value": int(round(at_noon["miles"], -1)), "from": "distance travelled by noon: %.1f miles, to the nearest ten" % at_noon["miles"]},
            {"value": int(round(transport[-1]["miles"], -1)), "from": "distance travelled by 5 p.m.: %.1f miles, to the nearest ten" % transport[-1]["miles"]},
        ],
    }


if __name__ == "__main__":
    result = compute()
    (HERE / "estimate.json").write_text(json.dumps(result, indent=2) + "\n")
    s = result["summary"]
    print(json.dumps(s, indent=1))
    for p in result["transport"]:
        print(p)
    print([f["value"] for f in result["figures"]])
    sys.exit(0)
