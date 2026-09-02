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
    g.add_argument(
        "--index", default="sp500",
        help="comma-separated indices to pull: sp500, sp400 (mid), sp600 (small). "
             "Mid and small caps are where institutional selling can plausibly "
             "move a price at all.",
    )
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
    g.add_argument(
        "--screen-by", default="inst_pct",
        choices=["inst_pct", "top10_pct", "inst_float_pct"],
        help="what the threshold applies to. top10_pct screens on how "
             "concentrated the holding is rather than how institutional it is.",
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
    g.add_argument(
        "--probe", action="store_true",
        help="run the pre-registered battery: ownership/concentration/size "
             "gradients, the direct volume-and-pressure test of the mechanism, "
             "per-stock heterogeneity, and a power analysis",
    )
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
    indexes = tuple(i.strip() for i in args.index.split(",") if i.strip())
    universe = load_universe(
        args.universe_file, include_removed=not args.no_removed, indexes=indexes
    )
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
    screened = apply_ownership_screen(
        universe, ownership, args.min_inst_pct / 100.0, screen_col=args.screen_by
    )
    n_pass = int(screened["passes_screen"].sum())
    log.info(
        "  %d/%d have ownership data; %d clear %s >= %.0f%%",
        int(screened[args.screen_by].notna().sum()), len(screened), n_pass,
        args.screen_by, args.min_inst_pct,
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

    carry = [
        c for c in ("ticker", "inst_pct", "top10_pct", "inst_count", "market_cap",
                    "index", "passes_screen")
        if c in screened.columns
    ]
    events = events.merge(screened[carry], on="ticker", how="left")
    # Distinguish "screened out" from "we have no ownership record at all".
    events["has_ownership"] = events[args.screen_by].notna()
    events["passes_screen"] = events["passes_screen"].fillna(False).astype(bool)

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

    if args.probe:
        from . import probe as pr

        battery = pr.run_battery(
            events, args.pop_day, args.dip_through, args.horizon, ret_prefix
        )
        print("\n" + "=" * 78)
        print(f"PRE-REGISTERED BATTERY  --  {battery['n_tests_in_battery']} tests, "
              f"corrected together")
        print("=" * 78)
        titles = {
            "institutional_pct": "By institutional ownership (the theory's own variable)",
            "top10_concentration": "By top-10 holder concentration (can a few funds move it?)",
            "holder_count": "By number of institutional holders (fewer = more coordinated)",
            "market_cap": "By company size (small caps are easier to push around)",
            "by_index": "By index slice",
        }
        for key, title in titles.items():
            tbl = battery["tables"].get(key)
            if tbl is None or tbl.empty:
                continue
            print(f"\n{title}:")
            print(tbl.to_string(index=False, float_format=lambda v: f"{v:,.3f}"))
            tbl.to_csv(out_dir / f"probe_{key}.csv", index=False)

        vs = battery["tables"].get("volume_signature")
        if vs is not None and not vs.empty:
            print("\nDirect test of the mechanism -- order flow, not price:")
            print("  clv_mean is close-location value: negative = sold into the close,")
            print("  positive = bought up into it. Theory needs days 1-4 negative and "
                  f"day {args.pop_day} positive with elevated volume.")
            print(vs.to_string(index=False, float_format=lambda v: f"{v:,.4f}"))
            vs.to_csv(out_dir / "probe_volume_signature.csv", index=False)

        het = battery.get("heterogeneity") or {}
        if het.get("n_tickers", 0) >= 20:
            print(f"\nPer-stock heterogeneity -- does it work for *some* names? "
                  f"({het['n_tickers']} tickers with >=20 events)")
            print(f"  spread of per-stock t-stats: {het['sd_of_tstats']:.3f} "
                  f"(1.000 expected if no stock has an effect), "
                  f"over-dispersion p={het['p_overdispersion']:.3f}")
            print(f"  share of stocks significantly positive: "
                  f"{het['frac_significant_positive']:.1%} "
                  f"(2.5% expected by chance), p={het['p_excess_positive']:.3f}")

        power = battery.get("power") or {}
        if power:
            print("\nPower -- what this sample could have detected:")
            for name, pw in power.items():
                print(f"  {name}: observed {pw['observed_bps']:+.1f} bps, "
                      f"se {pw['se_bps']:.1f} bps -> could detect "
                      f"{pw['mde_bps_at_80pct_power']:.1f} bps at 80% power "
                      f"(n={pw['n']:,})")
        (out_dir / "probe.json").write_text(
            json.dumps(
                {k: v for k, v in battery.items() if k != "tables"}, indent=2, default=str
            )
        )

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
        from .plotting import plot_car, plot_mechanism

        for path in (
            plot_car(events, args.horizon, args.pop_day, ret_prefix, out_dir),
            plot_mechanism(events, args.horizon, args.pop_day, out_dir),
        ):
            if path:
                print(f"Wrote {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
