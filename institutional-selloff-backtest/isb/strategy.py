"""The rule as an actual trade: enter after the post-earnings drop, ride a trailing stop.

Everything earlier in this project measured a *single day's* return. That is the
wrong shape for the strategy as its author actually runs it, which is a swing
trade: buy once the stock has fallen for a week, then hold until a trailing stop
fires. That changes the economics completely -- a trailing stop cuts losers at a
fixed distance and lets winners run, so it produces a negative median and a
positive mean, which is exactly the "lots of small losses, occasional big win"
shape a discretionary trader remembers as working.

Which is also why it needs a control that none of the earlier tests needed. A
trailing stop on a stock in a strong uptrend makes money *whenever* you enter.
So the question is not "does this rule make money" -- it may well -- but "does
entering after the earnings drop beat entering on a random day in the same stock
over the same period". `random_entry_control` is that comparison, and it is the
only thing that can separate the signal from the risk management.
"""

from __future__ import annotations

import logging

import numpy as np
import pandas as pd

log = logging.getLogger(__name__)


def trailing_stop_trade(
    prices: pd.Series,
    entry_idx: int,
    stop_pct: float = 3.0,
    max_hold: int = 120,
) -> dict:
    """Buy at `entry_idx`'s close; sell when the close falls `stop_pct` off the peak.

    The stop trails the highest close seen since entry, so it ratchets up and
    never loosens. Exits are evaluated on closes only: a real intraday stop would
    fire earlier and slightly worse, which makes these results a mild
    over-estimate of what the rule would actually have returned.
    """
    entry = float(prices.iloc[entry_idx])
    peak = entry
    end = min(entry_idx + max_hold, len(prices) - 1)
    for j in range(entry_idx + 1, end + 1):
        close = float(prices.iloc[j])
        peak = max(peak, close)
        if close <= peak * (1 - stop_pct / 100.0):
            return {
                "ret": close / entry - 1.0,
                "held": j - entry_idx,
                "peak_ret": peak / entry - 1.0,
                "stopped_out": True,
            }
    close = float(prices.iloc[end])
    return {
        "ret": close / entry - 1.0,
        "held": end - entry_idx,
        "peak_ret": peak / entry - 1.0,
        "stopped_out": False,
    }


def random_entry_control(
    prices: pd.Series,
    n_draws: int = 25,
    stop_pct: float = 3.0,
    max_hold: int = 120,
    first_idx: int = 6,
    seed: int = 42,
) -> list[dict]:
    """The same trade entered on random days in the same stock and period.

    This is the benchmark the strategy has to beat. If throwing a dart at the
    calendar does as well, the earnings setup contributes nothing and the returns
    belong entirely to the trailing stop and the stock's own trend.
    """
    rng = np.random.default_rng(seed)
    last = len(prices) - max_hold - 1
    if last <= first_idx + 10:
        return []
    return [
        trailing_stop_trade(prices, int(i), stop_pct, max_hold)
        for i in rng.integers(first_idx, last, size=n_draws)
    ]


def summarize_trades(trades: list[dict] | pd.DataFrame, success_pct: float = 3.0) -> dict:
    """Trade statistics in the terms a discretionary trader actually judges by."""
    df = pd.DataFrame(trades) if not isinstance(trades, pd.DataFrame) else trades
    if df.empty:
        return {"n": 0}
    r = df["ret"].to_numpy(dtype=float) * 100.0
    return {
        "n": int(r.size),
        "mean_pct": float(r.mean()),
        # The median matters here: a trailing stop is *supposed* to produce a
        # negative one. Most trades are small losses; the mean is carried by a
        # few large winners.
        "median_pct": float(np.median(r)),
        "hit_rate": float((r >= success_pct).mean()),
        "any_gain_rate": float((r > 0).mean()),
        "median_hold_days": float(df["held"].median()),
        "worst_pct": float(r.min()),
        "best_pct": float(r.max()),
    }
