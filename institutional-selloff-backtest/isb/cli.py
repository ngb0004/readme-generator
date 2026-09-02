"""Command-line entry point for the backtest."""

from __future__ import annotations

import argparse
import json
import logging
import sys
from pathlib import Path

import numpy as np
import pandas as pd

from . import backtest as bt
from .events import BEAT, label_events
from .universe import apply_ownership_screen, fetch_ownership, load_universe
from .yahoo import YahooClient

log = logging.getLogger("isb")


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="python -m isb",
        description="Backtest the institutional post-earnings sell-off / day-5 buyback theory.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    g = p.add_argument_group("universe")
    g.add_argument("--universe-file", help="CSV with a 'ticker' column; default is the S&P 500")
    g.add_argument("--limit", type=int, help="cap the number of tickers (for quick runs)")
    g.add_argument(
        "--no-removed",
        action="store_true",
        help="exclude names historically removed from the index (increases survivorship bias)",
    )
    g.add_argument(
        "--min-inst-pct",
        type=float,
        default=80.0,
        help="institutional ownership threshold, in percent",
    )
    g.add_argument(
        "--ownership-csv",
        help="point-in-time ownership override: columns ticker,inst_pct (percent)",
    )

    g = p.add_argument_group("event definition")
    g.add_argument("--beat-max-pct", type=float, default=10.0,
                   help="upper edge of 'beat but didn't crush', in percent surprise")
    g.add_argument("--pop-day", type=int, default=5, help="the day the theory predicts a rise")
    g.add_argument("--dip-through", type=int, default=4,
                   help="the dip is measured cumulatively from day 1 through this day")
    g.add_argument("--horizon", type=int, default=10, help="trading days tracked after the event")
    g.add_argument("--start", help="drop events before this date (YYYY-MM-DD)")
    g.add_argument("--end", help="drop events after this date (YYYY-MM-DD)")
    g.add_argument(
        "--timing-policy",
        choices=["infer", "next_day", "same_day_on_unknown"],
        default="infer",
        help="how to map a release timestamp onto the first tradeable session",
    )
    g.add_argument(
        "--require-known-timing",
        action="store_true",
        help="keep only events with a real release time (drops most pre-2010 history)",
    )
    g.add_argument("--raw-returns", action="store_true",
                   help="use raw instead of market-adjusted returns")

    g = p.add_argument_group("run")
    g.add_argument("--cache-dir", default="cache")
    g.add_argument("--out-dir", default="results")
    g.add_argument("--no-cache", action="store_true")
    g.add_argument("--workers", type=int, default=6)
    g.add_argument("--chart", action="store_true", help="write a CAR chart to the output dir")
    g.add_argument("-v", "--verbose", action="store_true")
    return p


def _fmt(v, nd=1) -> str:
    if v is None or (isinstance(v, float) and not np.isfinite(v)):
        return "n/a"
    return f"{v:,.{nd}f}"


def _verdict(hyp: dict | None, name: str, direction: str) -> str:
    if not hyp:
        return f"{name}: no data"
    mean, p = hyp.get("mean_bps"), hyp.get("p_value")
    got = "down" if (np.isfinite(mean) and mean < 0) else "up"
    want = "down" if direction == "negative" else "up"
    verdict = "SUPPORTED" if hyp.get("supported") else "NOT SUPPORTED"
    return (
        f"{name}: {verdict}  (mean {_fmt(mean)} bps, went {got}, theory predicts {want}; "
        f"clustered p={_fmt(p, 3)}, n={hyp.get('n')})"
    )


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(message)s",
        stream=sys.stdout,
    )
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    client = YahooClient(cache_dir=args.cache_dir, use_cache=not args.no_cache)

    # ---------------------------------------------------------- universe
    log.info("Building universe...")
    universe = load_universe(args.universe_file, include_removed=not args.no_removed)
    if args.limit:
        universe = universe.head(args.limit)
    tickers = universe["ticker"].tolist()
    log.info("  %d tickers", len(tickers))

    log.info("Fetching institutional ownership...")
    if args.ownership_csv:
        ownership = pd.read_csv(args.ownership_csv)
        ownership["inst_pct"] = pd.to_numeric(ownership["inst_pct"], errors="coerce") / 100.0
    else:
        ownership = fetch_ownership(client, tickers, workers=args.workers)
    screened = apply_ownership_screen(universe, ownership, args.min_inst_pct / 100.0)
    n_pass = int(screened["passes_screen"].sum())
    log.info(
        "  %d/%d have ownership data; %d are >= %.0f%% institutionally held",
        int(screened["inst_pct"].notna().sum()), len(screened), n_pass, args.min_inst_pct,
    )
    if n_pass == 0:
        log.error("No tickers clear the ownership screen; nothing to test.")
        return 1

    # ------------------------------------------------------------ events
    log.info("Fetching earnings and price history (this is the slow part)...")
    events = bt.collect_events(
        client, tickers, horizon=args.horizon,
        timing_policy=args.timing_policy, workers=args.workers,
    )
    if events.empty:
        log.error("No events could be built.")
        return 1

    events = events.merge(
        screened[["ticker", "inst_pct", "passes_screen"]], on="ticker", how="left"
    )
    events["passes_screen"] = events["passes_screen"].fillna(False)

    if args.require_known_timing:
        events = events[events["timing_quality"] != "unknown"]
    if args.start:
        events = events[events["day1_date"] >= pd.Timestamp(args.start)]
    if args.end:
        events = events[events["day1_date"] <= pd.Timestamp(args.end)]
    events = label_events(events, beat_max_pct=args.beat_max_pct)
    log.info(
        "  %d events, %d tickers, %s to %s",
        len(events), events["ticker"].nunique(),
        events["day1_date"].min().date(), events["day1_date"].max().date(),
    )

    ret_prefix = "ret" if args.raw_returns else "aret"
    cohort = events[events["passes_screen"] & (events["bucket"] == BEAT)]
    log.info(
        "  theory cohort (>= %.0f%% institutional AND 0 < surprise <= %.0f%%): %d events",
        args.min_inst_pct, args.beat_max_pct, len(cohort),
    )
    if len(cohort) < 30:
        log.warning("  cohort is very small; results will not be meaningful.")

    # ------------------------------------------------------------- tests
    result = bt.test_theory(
        cohort, horizon=args.horizon, pop_day=args.pop_day,
        dip_through=args.dip_through, ret_prefix=ret_prefix,
    )
    cohorts = bt.cohort_comparisons(events, args.pop_day, args.dip_through, ret_prefix)
    sweep = bt.sweep_beat_band(
        events, [2.5, 5.0, 7.5, 10.0, 15.0, 20.0, 30.0],
        args.pop_day, args.dip_through, ret_prefix,
    )
    profile = pd.DataFrame(result.get("profile", []))

    # ------------------------------------------------------------ output
    ret_label = "raw" if args.raw_returns else "market-adjusted"
    print("\n" + "=" * 78)
    print(f"THEORY TEST  --  {ret_label} returns, {result.get('n_events', 0)} events "
          f"({result.get('date_min')} to {result.get('date_max')})")
    print("=" * 78)
    print(_verdict(result.get("h1_dip"),
                   f"H1  dip, days 1-{args.dip_through}", "negative"))
    print(_verdict(result.get("h2_pop"), f"H2  pop on day {args.pop_day}", "positive"))
    h2b = result.get("h2b_special")
    if h2b:
        nb = ",".join(str(d) for d in h2b["neighbour_days"])
        print(
            _verdict(h2b, f"H2b day {args.pop_day} beats its neighbours (days {nb})",
                     "positive")
        )
        print(f"     ^ this is the real test of \"rises ON the 5th day\": paired within "
              f"each event, so cohort drift cancels out.")

    mech = bt.mechanism_test(events, args.pop_day, ret_prefix)
    if mech:
        print(
            f"\nMechanism check -- day {args.pop_day} for beats, high vs low institutional "
            f"ownership:\n"
            f"  difference {_fmt(mech['diff_bps'])} bps "
            f"(n={mech['n_high_inst']:,} vs {mech['n_low_inst']:,}, p={_fmt(mech['p_value'], 3)}). "
            f"The theory needs this to be positive and significant."
        )

    if not profile.empty:
        print(f"\nDay-by-day ({ret_label}, bps). p_holm/p_bh correct for testing all "
              f"{args.horizon} days:")
        cols = ["day", "n", "mean_bps", "ci_lo_bps", "ci_hi_bps", "win_rate",
                "p_value", "p_holm", "p_bh", "car_mean_bps"]
        print(profile[[c for c in cols if c in profile]].to_string(
            index=False, float_format=lambda v: f"{v:,.3f}"))

    if not cohorts.empty:
        print("\nCohort comparison -- does the institutional story hold up?")
        print(cohorts.to_string(index=False, float_format=lambda v: f"{v:,.3f}"))

    if not sweep.empty:
        print(f"\nSensitivity to the beat/crush boundary (day {args.pop_day}):")
        print(sweep.to_string(index=False, float_format=lambda v: f"{v:,.3f}"))

    events.to_csv(out_dir / "events.csv", index=False)
    profile.to_csv(out_dir / "daily_profile.csv", index=False)
    cohorts.to_csv(out_dir / "cohorts.csv", index=False)
    sweep.to_csv(out_dir / "beat_band_sweep.csv", index=False)
    (out_dir / "result.json").write_text(
        json.dumps({"config": vars(args), "result": result}, indent=2, default=str)
    )
    print(f"\nWrote events.csv, daily_profile.csv, cohorts.csv, beat_band_sweep.csv, "
          f"result.json to {out_dir}/")

    if args.chart:
        from .plotting import plot_car
        path = plot_car(events, args.horizon, args.pop_day, ret_prefix, out_dir)
        if path:
            print(f"Wrote {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
