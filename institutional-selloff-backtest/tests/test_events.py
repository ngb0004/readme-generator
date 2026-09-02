"""Unit tests for the fiddly parts: day-1 anchoring and surprise classification.

Getting the reaction day wrong by one session would silently invalidate every
result in the study, so it is pinned down here on synthetic data.
"""

import sys
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from isb.events import BEAT, CRUSH, MISS, build_events, classify_surprise, label_events

# A clean run of trading days: no US market holiday falls in this range
# (Presidents Day is the 19th, Good Friday is 2024-03-29). The series starts
# well before the tested events because build_events requires `pre_window`
# sessions of history before the anchor.
DAYS = pd.bdate_range("2024-02-20", "2024-03-22")


def _prices(n=len(DAYS), start=100.0, step=1.0):
    vals = start + np.arange(n) * step
    return pd.DataFrame({"close": vals, "adjclose": vals, "volume": 1_000}, index=DAYS[:n])


def _earnings(ts, estimate=1.00, actual=1.05):
    return pd.DataFrame(
        [{
            "ticker": "TEST",
            "timestamp": pd.Timestamp(ts, tz="UTC"),
            "eps_estimate": estimate,
            "eps_actual": actual,
            "surprise_pct_yahoo": None,
            "event_name": None,
        }]
    )


class TestReactionDay:
    def test_before_open_reacts_same_day(self):
        # 2024-03-08 12:00 UTC == 07:00 ET, before the 09:30 open.
        ev = build_events("TEST", _earnings("2024-03-08T12:00:00Z"), _prices(), None, horizon=3)
        assert ev.loc[0, "timing_quality"] == "bmo"
        assert ev.loc[0, "day1_date"] == pd.Timestamp("2024-03-08")
        assert ev.loc[0, "anchor_date"] == pd.Timestamp("2024-03-07")

    def test_after_close_reacts_next_session(self):
        # 2024-03-07 21:30 UTC == 16:30 ET, after the close.
        ev = build_events("TEST", _earnings("2024-03-07T21:30:00Z"), _prices(), None, horizon=3)
        assert ev.loc[0, "timing_quality"] == "amc"
        assert ev.loc[0, "day1_date"] == pd.Timestamp("2024-03-08")
        assert ev.loc[0, "anchor_date"] == pd.Timestamp("2024-03-07")

    def test_after_close_on_friday_skips_the_weekend(self):
        # Fri 2024-03-08 after the close -> first tradeable session is Mon 11th.
        ev = build_events("TEST", _earnings("2024-03-08T21:30:00Z"), _prices(), None, horizon=3)
        assert ev.loc[0, "day1_date"] == pd.Timestamp("2024-03-11")
        assert ev.loc[0, "anchor_date"] == pd.Timestamp("2024-03-08")

    def test_unknown_timestamp_defaults_to_next_day(self):
        # Midnight ET placeholder: must not anchor on a close that could already
        # contain the news.
        ev = build_events("TEST", _earnings("2024-03-08T05:00:00Z"), _prices(), None, horizon=3)
        assert ev.loc[0, "timing_quality"] == "unknown"
        assert ev.loc[0, "day1_date"] == pd.Timestamp("2024-03-11")

    def test_same_day_on_unknown_policy_flips_it(self):
        ev = build_events(
            "TEST", _earnings("2024-03-08T05:00:00Z"), _prices(), None,
            horizon=3, timing_policy="same_day_on_unknown",
        )
        assert ev.loc[0, "day1_date"] == pd.Timestamp("2024-03-08")

    def test_next_day_policy_overrides_before_open(self):
        ev = build_events(
            "TEST", _earnings("2024-03-08T12:00:00Z"), _prices(), None,
            horizon=3, timing_policy="next_day",
        )
        assert ev.loc[0, "timing_quality"] == "bmo"
        assert ev.loc[0, "day1_date"] == pd.Timestamp("2024-03-11")


class TestReturns:
    def test_returns_are_measured_from_the_pre_event_close(self):
        ev = build_events("TEST", _earnings("2024-03-07T21:30:00Z"), _prices(), None, horizon=3)
        px = _prices()["adjclose"]
        anchor = px.loc["2024-03-07"]
        assert ev.loc[0, "car_d1"] == pytest.approx(px.loc["2024-03-08"] / anchor - 1)
        assert ev.loc[0, "car_d3"] == pytest.approx(px.loc["2024-03-12"] / anchor - 1)
        assert ev.loc[0, "ret_d2"] == pytest.approx(
            px.loc["2024-03-11"] / px.loc["2024-03-08"] - 1
        )

    def test_market_adjustment_subtracts_the_benchmark(self):
        market = _prices(step=0.5)
        ev = build_events("TEST", _earnings("2024-03-07T21:30:00Z"), _prices(), market, horizon=3)
        m = market["adjclose"]
        expected = (
            ev.loc[0, "car_d2"] - (m.loc["2024-03-11"] / m.loc["2024-03-07"] - 1)
        )
        assert ev.loc[0, "acar_d2"] == pytest.approx(expected)

    def test_event_dropped_when_window_runs_past_available_data(self):
        ev = build_events("TEST", _earnings("2024-03-21T12:00:00Z"), _prices(), None, horizon=10)
        assert ev.empty

    def test_near_zero_estimate_is_excluded(self):
        # $0.01 vs $0.02 is a "+100% surprise" that means nothing economically.
        ev = build_events(
            "TEST", _earnings("2024-03-08T12:00:00Z", estimate=0.01, actual=0.02),
            _prices(), None, horizon=3,
        )
        assert ev.empty

    def test_surprise_uses_nominal_not_adjusted_price(self):
        prices = _prices()
        prices["close"] = prices["adjclose"] * 4  # a 4:1 split sits between then and now
        ev = build_events("TEST", _earnings("2024-03-07T21:30:00Z"), prices, None, horizon=3)
        assert ev.loc[0, "anchor_price"] == pytest.approx(prices["close"].loc["2024-03-07"])


class TestClassification:
    @pytest.mark.parametrize(
        "surprise,expected",
        [(-5.0, MISS), (0.0, "inline"), (3.0, BEAT), (10.0, BEAT), (10.01, CRUSH), (80.0, CRUSH)],
    )
    def test_buckets(self, surprise, expected):
        assert classify_surprise(surprise, beat_max_pct=10.0) == expected

    def test_label_events_adds_bucket_column(self):
        ev = pd.DataFrame({"surprise_pct": [-2.0, 4.0, 40.0]})
        out = label_events(ev, beat_max_pct=10.0)
        assert out["bucket"].tolist() == [MISS, BEAT, CRUSH]
