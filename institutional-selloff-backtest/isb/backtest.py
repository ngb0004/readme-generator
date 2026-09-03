"""The event study itself: assemble the panel, then test the theory on it.

The theory under test (as stated by its author):

    For companies at least 80% institutionally held, after an earnings report
    where the company *beats* estimates -- but does not crush them -- the stock
    drifts down slightly as institutions sell, then rises on the 5th day as
    institutions buy back in.

That decomposes into two falsifiable claims, tested separately:

    H1 (the dip)  mean abnormal CAR over days 1..4 is negative.
    H2 (the pop)  mean abnormal return *on day 5* is positive.
    H2b (special) day 5 is *larger than its neighbouring days*.

H2b is the one that matters. "Positive on day 5" is a weak claim: stocks drift
up, so almost any day is positive on average. The theory says the stock rises
*on the 5th day* specifically -- a buy-back event -- which means day 5 has to
beat days 2-4 and 6-7, not merely beat zero. The comparison is paired within
each event, so it is immune to whatever baseline drift the cohort has.

Neither is interesting on its own. The theory's mechanism is specifically about
*institutional* selling, so the cohort comparisons matter more than the headline
number: if low-institutional stocks show the same day-5 pop, the mechanism is
wrong even if the pattern is real.
"""

from __future__ import annotations

import concurrent.futures as cf
import logging

import numpy as np
import pandas as pd

from . import stats
from .events import BEAT, CRUSH, MISS, build_events, label_events
from .yahoo import YahooClient, YahooError

log = logging.getLogger(__name__)

BENCHMARK = "SPY"


def collect_events(
    client: YahooClient,
    tickers: list[str],
    horizon: int = 10,
    timing_policy: str = "infer",
    workers: int = 6,
    min_price: float = 5.0,
    progress_every: int = 50,
) -> pd.DataFrame:
    """Download and align earnings events for every ticker."""
    try:
        market = client.price_history(BENCHMARK)
    except YahooError as exc:
        log.warning("no benchmark data (%s); abnormal returns unavailable", exc)
        market = None

    done = 0

    def one(tk: str) -> pd.DataFrame:
        nonlocal done
        try:
            earnings = client.earnings_history(tk)
            if earnings.empty:
                return pd.DataFrame()
            prices = client.price_history(tk)
            return build_events(
                tk,
                earnings,
                prices,
                market,
                horizon=horizon,
                timing_policy=timing_policy,
                min_price=min_price,
            )
        except (YahooError, KeyError, ValueError) as exc:
            log.debug("skipping %s: %s", tk, exc)
            return pd.DataFrame()
        finally:
            done += 1
            if progress_every and done % progress_every == 0:
                log.info("  fetched %d/%d tickers", done, len(tickers))

    with cf.ThreadPoolExecutor(workers) as ex:
        frames = [f for f in ex.map(one, tickers) if not f.empty]

    if not frames:
        return pd.DataFrame()
    out = pd.concat(frames, ignore_index=True)
    return out.sort_values(["day1_date", "ticker"]).reset_index(drop=True)


def daily_profile(
    events: pd.DataFrame, horizon: int, ret_prefix: str = "aret"
) -> pd.DataFrame:
    """Per-day statistics across the event window, with multiple-testing control.

    This table is the honest version of "the stock rises on day 5": it shows
    every day 1..H side by side, so a day-5 result has to stand out against the
    other nine rather than being the one cherry-picked horizon.
    """
    rows = []
    clusters = events["day1_date"].to_numpy() if "day1_date" in events else None
    for k in range(1, horizon + 1):
        col = f"{ret_prefix}_d{k}"
        if col not in events:
            continue
        vals = events[col].to_numpy(dtype=float)
        rec = {"day": k, **stats.describe(vals, clusters)}
        lo, hi = stats.bootstrap_ci(vals, clusters, n_boot=2000)
        rec["ci_lo_bps"], rec["ci_hi_bps"] = lo, hi
        car_col = f"{'acar' if ret_prefix == 'aret' else 'car'}_d{k}"
        if car_col in events:
            cvals = events[car_col].to_numpy(dtype=float)
            rec["car_mean_bps"] = float(np.nanmean(cvals) * 1e4)
            rec["car_p_value"] = stats.describe(cvals, clusters)["p_value"]
        rows.append(rec)

    df = pd.DataFrame(rows)
    if not df.empty:
        adj = stats.adjust_pvalues(df["p_value"].tolist())
        df["p_holm"] = adj["holm"]
        df["p_bh"] = adj["bh"]
    return df


def test_theory(
    events: pd.DataFrame,
    horizon: int = 10,
    pop_day: int = 5,
    dip_through: int = 4,
    ret_prefix: str = "aret",
) -> dict:
    """Evaluate H1 (dip) and H2 (pop) on one cohort of events."""
    if events.empty:
        return {"n_events": 0}

    clusters = events["day1_date"].to_numpy()
    car_col = f"{'acar' if ret_prefix == 'aret' else 'car'}_d{dip_through}"
    pop_col = f"{ret_prefix}_d{pop_day}"

    result: dict = {
        "n_events": int(len(events)),
        "n_tickers": int(events["ticker"].nunique()),
        "date_min": str(events["day1_date"].min().date()),
        "date_max": str(events["day1_date"].max().date()),
    }

    if car_col in events:
        dip = stats.describe(events[car_col].to_numpy(dtype=float), clusters)
        lo, hi = stats.bootstrap_ci(events[car_col].to_numpy(dtype=float), clusters)
        result["h1_dip"] = {
            **dip,
            "ci_lo_bps": lo,
            "ci_hi_bps": hi,
            # H1 is directional: a *negative* mean is what the theory predicts,
            # so a one-sided p-value in that direction is the fair test.
            "p_one_sided_negative": _one_sided(dip, negative=True),
            "supported": bool(
                np.isfinite(dip["mean_bps"])
                and dip["mean_bps"] < 0
                and _one_sided(dip, negative=True) < 0.05
            ),
        }

    if pop_col in events:
        pop = stats.describe(events[pop_col].to_numpy(dtype=float), clusters)
        lo, hi = stats.bootstrap_ci(events[pop_col].to_numpy(dtype=float), clusters)
        result["h2_pop"] = {
            **pop,
            "ci_lo_bps": lo,
            "ci_hi_bps": hi,
            "p_one_sided_positive": _one_sided(pop, negative=False),
            "supported": bool(
                np.isfinite(pop["mean_bps"])
                and pop["mean_bps"] > 0
                and _one_sided(pop, negative=False) < 0.05
            ),
        }

    special = day_specialness(events, pop_day=pop_day, ret_prefix=ret_prefix)
    if special:
        result["h2b_special"] = special

    result["profile"] = daily_profile(events, horizon, ret_prefix).to_dict("records")
    return result


def day_specialness(
    events: pd.DataFrame,
    pop_day: int = 5,
    neighbours: tuple[int, ...] = (2, 3, 4, 6, 7),
    ret_prefix: str = "aret",
) -> dict:
    """Is `pop_day` bigger than its neighbouring days, event by event?

    Day 1 is deliberately excluded from the neighbour set: it carries the
    announcement reaction itself and would swamp the comparison.
    """
    pop_col = f"{ret_prefix}_d{pop_day}"
    nb_cols = [f"{ret_prefix}_d{d}" for d in neighbours if f"{ret_prefix}_d{d}" in events]
    if pop_col not in events or not nb_cols:
        return {}
    diff = (
        events[pop_col].to_numpy(dtype=float)
        - events[nb_cols].mean(axis=1).to_numpy(dtype=float)
    )
    desc = stats.describe(diff, events["day1_date"].to_numpy())
    lo, hi = stats.bootstrap_ci(diff, events["day1_date"].to_numpy())
    return {
        **desc,
        "ci_lo_bps": lo,
        "ci_hi_bps": hi,
        "neighbour_days": list(neighbours),
        "p_one_sided_positive": _one_sided(desc, negative=False),
        "supported": bool(
            np.isfinite(desc["mean_bps"])
            and desc["mean_bps"] > 0
            and _one_sided(desc, negative=False) < 0.05
        ),
    }


def mechanism_test(
    events: pd.DataFrame, pop_day: int = 5, ret_prefix: str = "aret"
) -> dict:
    """Does the day-5 effect actually depend on institutional ownership?

    If beats in lightly-held names pop just as hard on day 5, then whatever is
    happening is not institutions buying back in.
    """
    pop_col = f"{ret_prefix}_d{pop_day}"
    if "passes_screen" not in events or pop_col not in events:
        return {}
    beats = events[events["bucket"] == BEAT]
    hi_df, lo_df = _split_by_screen(beats)
    hi = hi_df[pop_col].to_numpy(dtype=float)
    lo = lo_df[pop_col].to_numpy(dtype=float)
    return {
        "n_high_inst": int(np.isfinite(hi).sum()),
        "n_low_inst": int(np.isfinite(lo).sum()),
        **stats.compare_means(hi, lo),
    }


def _one_sided(desc: dict, negative: bool) -> float:
    """Convert a two-sided t-test to the one-sided p-value in the stated direction."""
    t, p = desc.get("t_stat"), desc.get("p_value")
    if t is None or p is None or not np.isfinite(t) or not np.isfinite(p):
        return float("nan")
    in_direction = (t < 0) if negative else (t > 0)
    return float(p / 2 if in_direction else 1 - p / 2)


def _split_by_screen(events: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Split into pass / fail cohorts, keeping unknown-ownership names out of both.

    A delisted or thinly-covered ticker has no ownership record at all. Letting
    it fall through into the "low institutional" bucket would quietly fill the
    control group with names whose ownership we simply do not know.
    """
    if "passes_screen" not in events:
        return events, events.iloc[0:0]
    known = (
        events["has_ownership"]
        if "has_ownership" in events
        else events["passes_screen"].notna()
    )
    return events[events["passes_screen"]], events[~events["passes_screen"] & known]


def cohort_comparisons(
    events: pd.DataFrame, pop_day: int = 5, dip_through: int = 4, ret_prefix: str = "aret"
) -> pd.DataFrame:
    """Contrast the theory's cohort against the controls that test its mechanism."""
    pop_col = f"{ret_prefix}_d{pop_day}"
    car_col = f"{'acar' if ret_prefix == 'aret' else 'car'}_d{dip_through}"
    rows = []

    def add(label: str, sub: pd.DataFrame) -> None:
        if sub.empty:
            return
        clusters = sub["day1_date"].to_numpy()
        pop = stats.describe(sub[pop_col].to_numpy(dtype=float), clusters)
        dip = stats.describe(sub[car_col].to_numpy(dtype=float), clusters)
        rows.append(
            {
                "cohort": label,
                "n": pop["n"],
                f"car_d1_{dip_through}_bps": dip["mean_bps"],
                "car_p": dip["p_value"],
                f"day{pop_day}_bps": pop["mean_bps"],
                f"day{pop_day}_p": pop["p_value"],
                f"day{pop_day}_win_rate": pop["win_rate"],
            }
        )

    hi, lo = _split_by_screen(events)

    add("BEAT + high inst. (the theory)", hi[hi["bucket"] == BEAT])
    add("BEAT + low inst. (control)", lo[lo["bucket"] == BEAT])
    add("CRUSH + high inst.", hi[hi["bucket"] == CRUSH])
    add("MISS + high inst.", hi[hi["bucket"] == MISS])
    add("All events + high inst.", hi)
    add("All events (universe)", events)
    return pd.DataFrame(rows)


def sweep_beat_grid(
    events: pd.DataFrame,
    mins: list[float],
    maxes: list[float],
    pop_day: int = 5,
    dip_through: int = 4,
    ret_prefix: str = "aret",
) -> pd.DataFrame:
    """Test every plausible pair of (beat floor, crush ceiling).

    "Beat" has a precise meaning -- actual EPS above consensus -- but there is no
    standard number at which a beat becomes a "crush". Rather than argue about
    the boundary, this sweeps a grid of both edges at once, so whatever pair of
    values someone has in mind, the answer for it is already in the table.
    """
    pop_col = f"{ret_prefix}_d{pop_day}"
    car_col = f"{'acar' if ret_prefix == 'aret' else 'car'}_d{dip_through}"
    rows = []
    for lo in mins:
        for hi in maxes:
            if hi <= lo:
                continue
            labelled = label_events(events, beat_max_pct=hi, inline_tol_pct=lo)
            sub = labelled[labelled["bucket"] == BEAT]
            if "passes_screen" in sub:
                sub = sub[sub["passes_screen"]]
            if len(sub) < 100:
                continue
            clusters = sub["day1_date"].to_numpy()
            pop = stats.describe(sub[pop_col].to_numpy(dtype=float), clusters)
            dip = stats.describe(sub[car_col].to_numpy(dtype=float), clusters)
            rows.append({
                "beat_min_pct": lo, "beat_max_pct": hi, "n": pop["n"],
                "dip_bps": dip["mean_bps"], "dip_p": dip["p_value"],
                "pop_bps": pop["mean_bps"], "pop_p": pop["p_value"],
                "pop_win_rate": pop["win_rate"],
            })
    out = pd.DataFrame(rows)
    if not out.empty:
        adj = stats.adjust_pvalues(out["pop_p"].tolist())
        out["pop_p_bh"] = adj["bh"]
    return out


def sweep_beat_band(
    events: pd.DataFrame,
    bands: list[float],
    pop_day: int = 5,
    dip_through: int = 4,
    ret_prefix: str = "aret",
) -> pd.DataFrame:
    """Re-run the test across definitions of "beat but didn't crush".

    The theory does not define where a beat becomes a crush, so a result that
    only appears at one arbitrary cutoff is an artefact, not a finding.
    """
    pop_col = f"{ret_prefix}_d{pop_day}"
    car_col = f"{'acar' if ret_prefix == 'aret' else 'car'}_d{dip_through}"
    rows = []
    for band in bands:
        labelled = label_events(events, beat_max_pct=band)
        sub = labelled[labelled["bucket"] == BEAT]
        if "passes_screen" in sub:
            sub = sub[sub["passes_screen"]]
        if sub.empty:
            continue
        clusters = sub["day1_date"].to_numpy()
        pop = stats.describe(sub[pop_col].to_numpy(dtype=float), clusters)
        dip = stats.describe(sub[car_col].to_numpy(dtype=float), clusters)
        rows.append(
            {
                "beat_max_pct": band,
                "n": pop["n"],
                f"car_d1_{dip_through}_bps": dip["mean_bps"],
                "car_p": dip["p_value"],
                f"day{pop_day}_bps": pop["mean_bps"],
                f"day{pop_day}_p": pop["p_value"],
                f"day{pop_day}_win_rate": pop["win_rate"],
            }
        )
    return pd.DataFrame(rows)
