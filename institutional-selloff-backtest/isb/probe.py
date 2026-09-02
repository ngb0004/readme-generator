"""A pre-registered battery of harder tests for the same theory.

The headline study asked whether the theory holds on average across large caps.
These ask the follow-up questions worth asking after a null result -- whether we
looked in the wrong place, screened on the wrong variable, or simply lacked the
power to see the effect at all.

**Why the battery is pre-registered and corrected as a whole.** Once a result
comes back null, it is very easy to keep slicing until something crosses p<0.05,
and with enough slices something always does. Every test below is declared up
front, run unconditionally, and reported together with p-values corrected across
the entire battery. A slice that survives that is worth a second look; a slice
that only survives on its own raw p-value is what chance looks like.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from scipy import stats as sps

from . import stats
from .events import BEAT

# Two-sided alpha=0.05 at 80% power.
_MDE_MULTIPLIER = 2.802


def _cell(sub: pd.DataFrame, pop_col: str, car_col: str, label: str, extra: dict) -> dict:
    clusters = sub["day1_date"].to_numpy()
    pop = stats.describe(sub[pop_col].to_numpy(dtype=float), clusters)
    dip = stats.describe(sub[car_col].to_numpy(dtype=float), clusters)
    return {
        "bucket": label,
        "n": pop["n"],
        "dip_bps": dip["mean_bps"],
        "dip_p": dip["p_value"],
        "pop_bps": pop["mean_bps"],
        "pop_p": pop["p_value"],
        "pop_win_rate": pop["win_rate"],
        **extra,
    }


def dose_response(
    events: pd.DataFrame,
    column: str,
    edges: list[float],
    labels: list[str],
    pop_day: int = 5,
    dip_through: int = 4,
    ret_prefix: str = "aret",
    beats_only: bool = True,
) -> pd.DataFrame:
    """Split the cohort along `column` and test each bucket.

    A real mechanism should show a *gradient*: if institutional selling drives
    the effect, it must be stronger where institutions dominate the register
    and weaker where they don't. A flat profile across buckets is evidence
    against the mechanism even when individual buckets are noisy.
    """
    pop_col = f"{ret_prefix}_d{pop_day}"
    car_col = f"{'acar' if ret_prefix == 'aret' else 'car'}_d{dip_through}"
    if column not in events or pop_col not in events:
        return pd.DataFrame()

    sub = events[events["bucket"] == BEAT] if beats_only else events
    sub = sub[sub[column].notna()]
    if sub.empty:
        return pd.DataFrame()

    binned = pd.cut(sub[column].astype(float), bins=edges, labels=labels, right=False)
    rows = []
    for label in labels:
        cell = sub[binned == label]
        if len(cell) < 30:
            continue
        rows.append(
            _cell(cell, pop_col, car_col, label,
                  {"median_value": float(cell[column].median())})
        )
    return pd.DataFrame(rows)


def quantile_dose_response(
    events: pd.DataFrame, column: str, q: int = 5, **kw
) -> pd.DataFrame:
    """Same as `dose_response` but with buckets cut at sample quantiles."""
    sub = events[events["bucket"] == BEAT] if kw.get("beats_only", True) else events
    vals = sub[column].dropna().astype(float) if column in sub else pd.Series(dtype=float)
    if vals.empty:
        return pd.DataFrame()
    edges = list(np.unique(np.quantile(vals, np.linspace(0, 1, q + 1))))
    if len(edges) < 3:
        return pd.DataFrame()
    edges[-1] = edges[-1] * 1.0001 + 1e-9  # make the top bin right-inclusive
    labels = [f"Q{i + 1}" for i in range(len(edges) - 1)]
    return dose_response(events, column, edges, labels, **kw)


def volume_signature(
    events: pd.DataFrame, horizon: int = 10, pop_day: int = 5
) -> pd.DataFrame:
    """Test the mechanism directly, independent of price.

    The theory is a claim about *order flow*: institutions sell for several days,
    then buy back on day 5. That has to show up as selling pressure (negative
    close-location value) followed by a burst of buying pressure and volume --
    whether or not the net price moves. This is the strongest available test,
    because it can detect the mechanism even if the price effect is arbitraged
    away.
    """
    rows = []
    clusters = events["day1_date"].to_numpy()
    for k in range(1, horizon + 1):
        rec: dict = {"day": k, "is_predicted_buyback_day": k == pop_day}
        clv_col, vol_col = f"clv_d{k}", f"relvol_d{k}"
        if clv_col in events:
            clv = events[clv_col].to_numpy(dtype=float)
            d = stats.describe(clv, clusters)
            # CLV is already in [-1, 1]; report it natively rather than in bps.
            rec["clv_mean"] = d["mean_bps"] / 1e4
            rec["clv_p"] = d["p_value"]
            rec["n"] = d["n"]
        if vol_col in events:
            vol = events[vol_col].to_numpy(dtype=float)
            vol = vol[np.isfinite(vol)]
            # Volume is heavily right-skewed, so the median is the honest centre.
            rec["rel_volume_median"] = float(np.median(vol)) if vol.size else np.nan
        rows.append(rec)
    return pd.DataFrame(rows)


def ticker_heterogeneity(
    events: pd.DataFrame,
    pop_day: int = 5,
    ret_prefix: str = "aret",
    min_events: int = 20,
) -> dict:
    """Does the effect exist for *some* stocks even if not on average?

    Under the null that no stock has a day-5 effect, per-ticker t-statistics are
    standard normal: their spread is 1 and about 2.5% clear +1.96. A genuine
    effect confined to a subset of names would show up as an over-dispersed
    distribution with a fat right tail -- which is testable without having to
    name the stocks in advance (and without the multiple-testing disaster of
    picking whichever tickers happen to look good).
    """
    pop_col = f"{ret_prefix}_d{pop_day}"
    if pop_col not in events:
        return {}
    tstats = []
    for _, grp in events[events["bucket"] == BEAT].groupby("ticker"):
        x = grp[pop_col].to_numpy(dtype=float)
        x = x[np.isfinite(x)]
        if x.size < min_events:
            continue
        sd = x.std(ddof=1)
        if sd > 0:
            tstats.append(x.mean() / (sd / np.sqrt(x.size)))
    t = np.asarray(tstats)
    if t.size < 20:
        return {"n_tickers": int(t.size)}

    n_pos = int(np.sum(t > 1.96))
    return {
        "n_tickers": int(t.size),
        "sd_of_tstats": float(t.std(ddof=1)),
        "sd_expected_under_null": 1.0,
        # Over-dispersion test: sum of squared t-stats is chi-square(n) if no
        # stock has an effect.
        "p_overdispersion": float(sps.chi2.sf(float(np.sum(t**2)), df=t.size)),
        "frac_significant_positive": float(n_pos / t.size),
        "frac_expected_under_null": 0.025,
        "p_excess_positive": float(
            sps.binomtest(n_pos, t.size, 0.025, alternative="greater").pvalue
        ),
    }


def power_analysis(
    events: pd.DataFrame,
    pop_day: int = 5,
    dip_through: int = 4,
    ret_prefix: str = "aret",
) -> dict:
    """How large an effect could this sample have detected?

    A null result only means something if the study could have seen the effect
    had it been there. This reports the minimum detectable effect at 80% power,
    which converts "we found nothing" into "anything bigger than X is ruled out".
    """
    out: dict = {}
    for name, col in (
        (f"day{pop_day}", f"{ret_prefix}_d{pop_day}"),
        (f"dip_1_{dip_through}", f"{'acar' if ret_prefix == 'aret' else 'car'}_d{dip_through}"),
    ):
        if col not in events:
            continue
        vals = events[col].to_numpy(dtype=float)
        keep = np.isfinite(vals)
        if keep.sum() < 30:
            continue
        se, g = stats.cluster_robust_se(vals[keep], events["day1_date"].to_numpy()[keep])
        out[name] = {
            "n": int(keep.sum()),
            "n_clusters": g,
            "observed_bps": float(vals[keep].mean() * 1e4),
            "se_bps": float(se * 1e4),
            "mde_bps_at_80pct_power": float(_MDE_MULTIPLIER * se * 1e4),
        }
    return out


def run_battery(
    events: pd.DataFrame,
    pop_day: int = 5,
    dip_through: int = 4,
    horizon: int = 10,
    ret_prefix: str = "aret",
) -> dict:
    """Run every pre-registered test and correct across all of them at once."""
    kw = dict(pop_day=pop_day, dip_through=dip_through, ret_prefix=ret_prefix)
    tables: dict[str, pd.DataFrame] = {}

    tables["institutional_pct"] = dose_response(
        events, "inst_pct",
        [0.0, 0.50, 0.60, 0.70, 0.80, 0.90, 1.01],
        ["<50%", "50-60%", "60-70%", "70-80%", "80-90%", ">=90%"], **kw,
    )
    tables["top10_concentration"] = quantile_dose_response(events, "top10_pct", 5, **kw)
    tables["holder_count"] = quantile_dose_response(events, "inst_count", 5, **kw)
    tables["market_cap"] = quantile_dose_response(events, "market_cap", 5, **kw)

    if "index" in events:
        rows = []
        pop_col = f"{ret_prefix}_d{pop_day}"
        car_col = f"{'acar' if ret_prefix == 'aret' else 'car'}_d{dip_through}"
        screened = events[events["passes_screen"] & (events["bucket"] == BEAT)]
        for idx, grp in screened.groupby("index"):
            if len(grp) >= 30:
                rows.append(_cell(grp, pop_col, car_col, str(idx), {}))
        tables["by_index"] = pd.DataFrame(rows)

    cohort = events[events["passes_screen"] & (events["bucket"] == BEAT)]
    tables["volume_signature"] = volume_signature(cohort, horizon, pop_day)

    # Correct the day-5 p-values across every bucket of every slice at once.
    pvals, keys = [], []
    for name, tbl in tables.items():
        if "pop_p" in tbl:
            for i, p in enumerate(tbl["pop_p"].tolist()):
                pvals.append(p)
                keys.append((name, i))
    adj = stats.adjust_pvalues(pvals)
    for (name, i), holm, bh in zip(keys, adj["holm"], adj["bh"]):
        tables[name].loc[tables[name].index[i], "pop_p_holm_battery"] = holm
        tables[name].loc[tables[name].index[i], "pop_p_bh_battery"] = bh

    return {
        "tables": tables,
        "n_tests_in_battery": len(pvals),
        "heterogeneity": ticker_heterogeneity(events, pop_day, ret_prefix),
        "power": power_analysis(cohort, pop_day, dip_through, ret_prefix),
    }
