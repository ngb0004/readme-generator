"""Unit tests for the trailing-stop trade."""

import sys
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from isb.strategy import summarize_trades, trailing_stop_trade


def _series(values):
    return pd.Series(values, index=pd.bdate_range("2024-01-01", periods=len(values)))


def test_stop_fires_when_price_falls_off_the_peak():
    # Rises to 110, then drops below the 3% trail (110 * 0.97 = 106.7).
    s = _series([100, 105, 110, 106, 120])
    t = trailing_stop_trade(s, 0, stop_pct=3.0)
    assert t["stopped_out"] is True
    assert t["held"] == 3
    assert t["ret"] == pytest.approx(0.06)
    assert t["peak_ret"] == pytest.approx(0.10)


def test_stop_trails_up_and_never_loosens():
    # A steady climb never triggers; the trade is still open at the end.
    s = _series([100, 102, 104, 106, 108])
    t = trailing_stop_trade(s, 0, stop_pct=3.0)
    assert t["stopped_out"] is False
    assert t["ret"] == pytest.approx(0.08)


def test_immediate_decline_stops_out_near_the_stop_distance():
    s = _series([100, 96, 90, 85])
    t = trailing_stop_trade(s, 0, stop_pct=3.0)
    assert t["stopped_out"] is True
    assert t["held"] == 1
    assert t["ret"] == pytest.approx(-0.04)


def test_max_hold_closes_the_trade():
    s = _series(list(range(100, 140)))
    t = trailing_stop_trade(s, 0, stop_pct=3.0, max_hold=5)
    assert t["stopped_out"] is False
    assert t["held"] == 5


def test_summary_reports_the_asymmetry_a_trailing_stop_creates():
    trades = [
        {"ret": -0.03, "held": 2}, {"ret": -0.028, "held": 3},
        {"ret": -0.031, "held": 4}, {"ret": 0.25, "held": 20},
    ]
    s = summarize_trades(trades, success_pct=3.0)
    assert s["n"] == 4
    assert s["median_pct"] < 0 < s["mean_pct"]  # the signature shape
    assert s["hit_rate"] == pytest.approx(0.25)
