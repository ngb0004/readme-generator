"""Turning raw earnings + price data into an aligned event panel.

Two definitional choices matter more than anything else in this study, so they
are explicit and configurable rather than buried:

1. **What counts as "beat but didn't crush".** A surprise band on EPS, e.g.
   0 < surprise <= 10%. The upper edge is arbitrary, so the CLI sweeps it.

2. **Which calendar day is "day 1".** Earnings land before the open, after the
   close, or mid-session. We anchor on the last close the market had *before* it
   could react, then count trading days forward. "The 5th day" is therefore the
   5th trading session in which the news could be traded.
"""

from __future__ import annotations

import logging

import numpy as np
import pandas as pd

log = logging.getLogger(__name__)

MARKET_TZ = "America/New_York"

# Event buckets.
MISS = "miss"
INLINE = "inline"
BEAT = "beat"
CRUSH = "crush"


def classify_surprise(
    surprise_pct: float,
    beat_max_pct: float,
    inline_tol_pct: float = 0.0,
) -> str:
    """Bucket an EPS surprise. `beat_max_pct` is the beat/crush boundary."""
    if not np.isfinite(surprise_pct):
        return "unknown"
    if surprise_pct < -inline_tol_pct:
        return MISS
    if surprise_pct <= inline_tol_pct:
        return INLINE
    if surprise_pct <= beat_max_pct:
        return BEAT
    return CRUSH


def _reaction_position(
    trading_days: pd.DatetimeIndex,
    release_local: pd.Timestamp,
    policy: str,
) -> tuple[int | None, str]:
    """Index of the first session that can trade on the news, plus its quality.

    Returns (position of day 1 in `trading_days`, timing_quality).
    """
    # Trading-day index is tz-naive exchange dates; match that.
    release_date = release_local.normalize().tz_localize(None)
    minutes = release_local.hour * 60 + release_local.minute

    if minutes == 0:
        # Yahoo stores a midnight placeholder when it has no release time, which
        # is most of the pre-2010 history. We cannot tell before-open from
        # after-close. Defaulting such events to next-day is the safe choice: if
        # the release was really after the close, anchoring on that same close
        # would anchor on a price that already contains the news.
        quality = "unknown"
        same_day = policy == "same_day_on_unknown"
    elif minutes < 9 * 60 + 30:
        quality, same_day = "bmo", True
    elif minutes >= 16 * 60:
        quality, same_day = "amc", False
    else:
        quality, same_day = "intraday", True

    if policy == "next_day":
        same_day = False

    # First session on or after the release date.
    pos = int(trading_days.searchsorted(release_date, side="left"))
    # For an after-close release the first tradeable session is strictly later.
    if not same_day and pos < len(trading_days) and trading_days[pos] == release_date:
        pos += 1
    if pos >= len(trading_days):
        return None, quality
    return pos, quality


def build_events(
    ticker: str,
    earnings: pd.DataFrame,
    prices: pd.DataFrame,
    market: pd.DataFrame | None,
    horizon: int = 10,
    pre_window: int = 5,
    min_abs_estimate: float = 0.05,
    min_price: float = 5.0,
    timing_policy: str = "infer",
) -> pd.DataFrame:
    """Build one row per earnings event with forward returns already aligned.

    Emits, for k in 1..horizon: `ret_d{k}` (return earned on day k),
    `car_d{k}` (cumulative from the pre-event close), and the market-adjusted
    equivalents `aret_d{k}` / `acar_d{k}`.
    """
    if earnings.empty or prices.empty:
        return pd.DataFrame()

    px = prices["adjclose"].astype(float)
    # Returns use the adjusted series; anything compared against a dollar
    # figure (EPS, a penny-stock filter) must use the nominal close.
    raw_close = prices["close"].astype(float)
    days = px.index
    mkt = market["adjclose"].astype(float).reindex(days).ffill() if market is not None else None

    records: list[dict] = []
    for row in earnings.itertuples(index=False):
        est, act = row.eps_estimate, row.eps_actual
        if not (pd.notna(est) and pd.notna(act)):
            continue
        # A percentage surprise off a near-zero estimate is meaningless noise
        # (a $0.00 vs $0.01 miss is not a -100% event in any economic sense).
        if abs(est) < min_abs_estimate:
            continue

        release_local = row.timestamp.tz_convert(MARKET_TZ)
        pos, quality = _reaction_position(days, release_local, timing_policy)
        if pos is None:
            continue
        anchor = pos - 1  # last close before the news could be traded
        if anchor - pre_window < 0 or pos + horizon - 1 >= len(days):
            continue

        p0 = px.iloc[anchor]
        p0_nominal = raw_close.iloc[anchor]
        if not np.isfinite(p0) or not np.isfinite(p0_nominal) or p0_nominal < min_price:
            continue

        rec = {
            "ticker": ticker,
            "release_utc": row.timestamp,
            "release_local": release_local,
            "timing_quality": quality,
            "anchor_date": days[anchor],
            "day1_date": days[pos],
            "eps_estimate": est,
            "eps_actual": act,
            "surprise_pct": float((act - est) / abs(est) * 100.0),
            "surprise_pct_yahoo": row.surprise_pct_yahoo,
            # Surprise scaled by price is unit-free across price levels and is a
            # standard robustness alternative to percentage surprise.
            "surprise_bps_of_price": float((act - est) / p0_nominal * 10000.0),
            "anchor_price": float(p0_nominal),
            "pre_ret_pre": float(px.iloc[anchor] / px.iloc[anchor - pre_window] - 1.0),
        }

        window = px.iloc[anchor : pos + horizon].to_numpy(dtype=float)
        mwin = (
            mkt.iloc[anchor : pos + horizon].to_numpy(dtype=float)
            if mkt is not None
            else None
        )
        if not np.all(np.isfinite(window)):
            continue

        for k in range(1, horizon + 1):
            rec[f"ret_d{k}"] = window[k] / window[k - 1] - 1.0
            rec[f"car_d{k}"] = window[k] / window[0] - 1.0
            if mwin is not None and np.all(np.isfinite(mwin)):
                m_ret = mwin[k] / mwin[k - 1] - 1.0
                rec[f"aret_d{k}"] = rec[f"ret_d{k}"] - m_ret
                rec[f"acar_d{k}"] = rec[f"car_d{k}"] - (mwin[k] / mwin[0] - 1.0)
        records.append(rec)

    return pd.DataFrame(records)


def label_events(
    events: pd.DataFrame,
    beat_max_pct: float,
    inline_tol_pct: float = 0.0,
    surprise_col: str = "surprise_pct",
) -> pd.DataFrame:
    """Add the beat/crush/miss `bucket` column."""
    if events.empty:
        return events
    out = events.copy()
    out["bucket"] = [
        classify_surprise(s, beat_max_pct, inline_tol_pct)
        for s in out[surprise_col].to_numpy(dtype=float)
    ]
    return out
