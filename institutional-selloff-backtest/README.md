# Institutional Sell-Off / Day-5 Buy-Back Backtest

An event study that tests a specific, falsifiable claim about how heavily
institutionally-owned stocks trade after an earnings beat.

## The theory under test

> For companies that are **at least 80% institutionally held**, after an earnings
> report where they **beat** their earnings target — beat, not *crush* — the
> stock price drops slightly as the institutions sell off shares, and then rises
> on **the 5th day** when the institutions buy back in.

That is two separate predictions, and this project tests them separately:

| | Claim | How it's measured |
|---|---|---|
| **H1** | *the dip* — the stock drifts down after the beat | mean cumulative market-adjusted return over days 1–4 is **negative** |
| **H2** | *the pop* — it rises on the 5th day | mean market-adjusted return **on day 5** is **positive** |

Both are tested one-sided, in the direction the theory predicts, so the theory
gets the benefit of the doubt.

## Why the control groups matter more than the headline number

The theory does not merely predict a pattern, it predicts a **mechanism**:
institutions selling and then repurchasing. So the run reports the theory's
cohort next to the cohorts that would falsify the mechanism:

- **Beat + *low* institutional ownership.** If lightly-held stocks show the same
  day-5 pop, the pattern has nothing to do with institutions.
- **Crush + high institutional ownership** and **Miss + high institutional
  ownership.** These calibrate the engine against a documented effect
  (post-earnings-announcement drift), and show whether "beat" is really special.

A finding that survives only in the first row is interesting. A finding that
appears in every row is a market-wide artefact.

## Running it

```bash
pip install -r requirements.txt
python3 -m isb --chart                     # full S&P 500 universe, ~5-10 min first run
python3 -m isb --limit 25 --chart          # quick sanity run
```

Results land in `results/`: `events.csv` (every event with its forward returns),
`daily_profile.csv`, `cohorts.csv`, `beat_band_sweep.csv`, `result.json`, and
`car_profile.png`. Raw API responses are cached under `cache/`, so re-runs with
different parameters are fast and hit the network only for what changed.

### Useful flags

| Flag | Why you'd use it |
|---|---|
| `--min-inst-pct 80` | the ownership threshold (percent) |
| `--beat-max-pct 10` | where a "beat" becomes a "crush" (percent EPS surprise) |
| `--pop-day 5` / `--dip-through 4` | move the predicted pop / dip window |
| `--start 2010-01-01` | restrict the sample period |
| `--require-known-timing` | keep only events with a real release timestamp |
| `--timing-policy next_day` | robustness check on the day-1 definition |
| `--raw-returns` | unadjusted instead of market-adjusted returns |
| `--ownership-csv FILE` | supply point-in-time ownership (see bias #1 below) |

## How the definitions are pinned down

**"Beat but didn't crush."** A beat is `0 < surprise ≤ beat_max_pct`, where
surprise is `(actual EPS − consensus estimate) / |estimate|`. The boundary is
arbitrary, so every run sweeps it across 2.5%–30% (`beat_band_sweep.csv`). A
result that only appears at one cutoff is an artefact, not a finding. Events
where the estimate is smaller than $0.05 are dropped: a $0.00-vs-$0.01 miss is
not a −100% surprise in any economic sense.

**"The 5th day."** Earnings land before the open, after the close, or
mid-session, so the calendar date is not the same thing as the first tradeable
session. Each event is anchored to the **last close before the market could
react**; day 1 is the first session that could trade the news; day 5 is the fifth
such session. Release timestamps are read from the data where Yahoo has them
(`bmo` / `amc` / `intraday`); where it stores only a midnight placeholder — most
of the pre-2010 history — the event is marked `unknown` and defaults to
next-day, because assuming same-day on a release that was actually after the
close would anchor on a price that already contained the news. `--require-known-timing`
re-runs on only the unambiguous events.

**Returns.** Split- and dividend-adjusted closes. The headline numbers are
market-adjusted (stock return minus SPY return) so the cohort's results are not
just the market's.

## The statistics

Two corrections do most of the work here, and both make it *harder* to call the
theory true:

- **Date clustering.** Earnings pile into a few weeks a quarter, so events are
  not independent draws — names reporting the same day share a market shock.
  Significance is computed on the distribution of daily cluster means, and the
  bootstrap resamples whole dates.
- **Multiple testing.** "Day 5" was chosen after the fact. Testing ten horizons
  and reporting the best one manufactures significance, so `daily_profile.csv`
  reports all ten days with Holm and Benjamini-Hochberg adjusted p-values
  alongside the raw ones.

## Known biases — read before believing any of this

1. **Institutional ownership is a *current* snapshot, not point-in-time.** This
   is the big one. Yahoo reports what a company's institutional ownership is
   *today*; the events run back decades. A company that is 85% institutionally
   held now was not necessarily so in 2003. That imports look-ahead and
   selection bias into the screen itself. Use `--ownership-csv` if you have
   real point-in-time 13F-derived ownership; a proper fix means reconstructing
   holdings from SEC 13F filings, which this project does not do.
2. **Survivorship.** The universe is the S&P 500 plus names historically removed
   from it. Including removed names helps, but the ownership screen still
   silently requires a company to exist today with a Yahoo ownership record, so
   the surviving-company tilt is not fully removed.
3. **Consensus estimates are as-reported-now.** Yahoo's stored estimate is not a
   guaranteed point-in-time snapshot of the pre-release consensus.
4. **No costs.** Returns are gross. A strategy trading every event pays spread
   and commission on each leg, which is material for effects measured in a few
   basis points.
5. **Earnings coverage ends around mid-2025** in Yahoo's dataset, even though
   prices are current.

## Layout

```
isb/
  yahoo.py      Yahoo Finance client (prices, earnings, ownership) + disk cache
  universe.py   S&P 500 universe and the institutional-ownership screen
  events.py     earnings -> aligned event panel; beat/crush/miss; day-1 anchoring
  stats.py      clustered t-tests, block bootstrap, Holm/BH corrections
  backtest.py   the study: H1/H2 tests, cohort comparisons, parameter sweep
  plotting.py   the CAR chart
  cli.py        command line
```

`yfinance` is deliberately not used: its HTTP layer fails behind egress proxies,
and only three endpoints are needed.

---

# Results

Run of record: **503 S&P 500 tickers, 45,797 earnings events, 1993–2025**, of
which **14,766 events** across 494 tickers form the theory's cohort (≥80%
institutionally held, EPS surprise between 0% and +10%). Market-adjusted
returns, date-clustered inference.

![Average event-window path](results/car_profile.png)

## Verdict: the theory is not supported. Both halves fail.

| | Prediction | Result | |
|---|---|---|---|
| **H1** | dip over days 1–4 | **+42.3 bps**, p < 0.001 | wrong direction, and significantly so |
| **H2** | day 5 is positive | +1.9 bps, p = 0.22 | not distinguishable from zero |
| **H2b** | day 5 beats its neighbours | −1.5 bps, p = 0.39 | day 5 is, if anything, *below* average |

**H1 is backwards.** After a modest beat, these stocks do not drift down — they
go *up*, by about 42 bps over days 1–4, and that is one of the most statistically
solid numbers in the whole study. There is no institutional sell-off to be seen.

**H2 is a coin flip.** Day 5 averages +1.9 bps — roughly two hundredths of one
percent — with a 95% interval of [−1.1, +4.8] bps that comfortably contains zero.
The win rate is 50.1%.

**H2b is the one that really settles it.** Day 5's mean is *lower* than the
average of days 2, 3, 4, 6 and 7. Whatever small positive number day 5 shows is
the ordinary drift every day in the window has; nothing happens on day 5 in
particular. And in the day-by-day table, once you correct for having looked at
all ten days, the only day that survives besides the announcement itself is
day 7 — which nobody predicted, and which is exactly what testing ten horizons
will hand you by chance.

**The mechanism fails its own test.** Beats in *lightly*-held stocks behave
almost identically: the day-5 gap between high- and low-institutional names is
2.7 bps with p = 0.33. In the chart's top panel the theory cohort (blue) and its
low-institutional control (orange) trace nearly the same path. If institutions
were driving this, those two lines would have to diverge. They don't.

**It isn't an artefact of where we drew the beat/crush line.** Sweeping the
boundary from 2.5% to 30% never produces a significant day 5 (best case p = 0.11),
and never produces the predicted dip except in the narrowest 2.5% band.

## Robustness

Every variant tells the same story:

| Variant | n | H1 (days 1–4) | H2 (day 5) | H2b (vs neighbours) |
|---|---|---|---|---|
| Headline | 14,766 | +42.3, p<0.001 | +1.9, p=0.22 | −1.5, p=0.39 |
| Only events with a real release timestamp (2011–2025) | 7,226 | +36.2, p<0.001 | +1.5, p=0.49 | −0.7, p=0.76 |
| Force all events to next-day reaction | 14,766 | +31.2, p<0.001 | +1.8, p=0.24 | −1.5, p=0.37 |
| Raw (unadjusted) returns | 14,774 | +58.5, p<0.001 | +8.4, **p=0.002** | +0.6, p=0.85 |

That last row is worth dwelling on, because it is how this theory could look true
to someone testing it casually. On raw returns, day 5 *is* significantly positive.
But so is nearly every other day — it's just the market's general upward drift,
and it disappears the moment you subtract the benchmark or compare day 5 against
its own neighbours.

## Is the engine actually detecting anything?

Yes — it independently reproduces post-earnings-announcement drift, one of the
most-replicated effects in the literature, which is a good sign the null results
above are real rather than a broken pipeline:

| Cohort | Cumulative market-adjusted return, days 1–4 | |
|---|---|---|
| Crush (surprise > 10%) | **+163.6 bps**, p < 0.001 | prices keep rising after a big beat |
| Miss | **−140.0 bps**, p < 0.001 | and keep falling after a miss |
| Small beat (the theory's cohort) | +42.3 bps, p < 0.001 | in between, as you'd expect |

The signal the theory is looking for isn't there; a well-documented signal in the
same data is, loudly.

## What the friend may have been seeing

The drift *is* real, so a small beat is genuinely followed by a small upward
grind. On any given event you'll find plenty of examples where the stock dipped
for a few days and then jumped on the fifth — with ~15,000 events, thousands of
them do exactly that. What the data rejects is that it happens *more often than
chance*, or more often for institutionally-held names.

One caveat in the theory's favour: the ownership screen uses a current snapshot
rather than point-in-time holdings (bias #1 above). If ownership is measured
wrong, the high/low split is noisier than it should be, which would blunt a real
institutional effect. Re-running with `--ownership-csv` and real 13F-derived
history is the honest way to close that gap — but note that H1 and H2b fail on
their own terms regardless of how the cohort is split.
