"""Significance testing for the event study.

Two corrections do most of the work here, and both make it *harder* to declare
the theory true -- which is the point of running the test at all:

* **Date clustering.** Earnings cluster into a few weeks per quarter, so events
  are not independent draws; on any given day every name shares the same market
  shock. We therefore test the distribution of *daily cluster means*, not of
  individual events, which is the standard fix in event-study work.

* **Multiple testing.** "Day 5" was chosen after the fact. Testing ten horizons
  and reporting the best one manufactures significance, so every horizon is
  reported together with Holm and Benjamini-Hochberg adjusted p-values.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from scipy import stats


def _clean(x: np.ndarray) -> np.ndarray:
    x = np.asarray(x, dtype=float)
    return x[np.isfinite(x)]


def cluster_robust_se(x: np.ndarray, clusters: np.ndarray) -> tuple[float, int]:
    """Cluster-robust standard error of the sample mean, and the cluster count.

    The textbook sandwich estimator: sum the within-cluster deviations, square
    the cluster totals. This targets the *pooled* mean -- the same quantity the
    cluster bootstrap resamples -- so the t-statistic and the bootstrap interval
    cannot disagree about whether zero is inside the interval.
    """
    n = x.size
    mean = x.mean()
    u = x - mean
    totals = pd.Series(u).groupby(pd.Series(clusters)).sum().to_numpy()
    g = totals.size
    if g < 2 or n < 2:
        return float("nan"), g
    correction = (g / (g - 1)) * ((n - 1) / max(n - 1, 1))
    var = correction * np.sum(totals**2) / (n**2)
    return float(np.sqrt(var)), int(g)


def describe(values: np.ndarray, clusters: np.ndarray | None = None) -> dict:
    """Summary statistics for one return series, with date-clustered inference."""
    vals = np.asarray(values, dtype=float)
    keep = np.isfinite(vals)
    x = vals[keep]
    n = x.size
    out = {
        "n": int(n),
        "mean_bps": float(np.mean(x) * 1e4) if n else np.nan,
        "median_bps": float(np.median(x) * 1e4) if n else np.nan,
        "std_bps": float(np.std(x, ddof=1) * 1e4) if n > 1 else np.nan,
        "win_rate": float(np.mean(x > 0)) if n else np.nan,
    }
    if n < 3:
        out.update(t_stat=np.nan, p_value=np.nan, n_clusters=0, p_binomial=np.nan)
        return out

    # Naive (unclustered) test, kept only to show what clustering costs.
    t_naive, p_naive = stats.ttest_1samp(x, 0.0)
    out["t_stat_naive"] = float(t_naive)
    out["p_value_naive"] = float(p_naive)

    # A two-sided sign test on the win rate: is the direction itself reliable?
    wins = int(np.sum(x > 0))
    out["p_binomial"] = float(stats.binomtest(wins, n, 0.5).pvalue)

    if clusters is not None:
        cl = np.asarray(clusters)[keep]
        se, g = cluster_robust_se(x, cl)
        out["n_clusters"] = g
        if np.isfinite(se) and se > 0 and g > 1:
            t = float(x.mean() / se)
            out["t_stat"] = t
            out["p_value"] = float(2 * stats.t.sf(abs(t), df=g - 1))
            out["se_bps"] = float(se * 1e4)
        else:
            out["t_stat"] = out["p_value"] = np.nan
    else:
        out["n_clusters"] = int(n)
        out["t_stat"] = float(t_naive)
        out["p_value"] = float(p_naive)
    return out


def bootstrap_ci(
    values: np.ndarray,
    clusters: np.ndarray | None = None,
    n_boot: int = 5000,
    alpha: float = 0.05,
    seed: int = 12345,
) -> tuple[float, float]:
    """Percentile CI for the mean, resampling whole date-clusters when given."""
    x = _clean(values)
    if x.size < 3:
        return (np.nan, np.nan)
    rng = np.random.default_rng(seed)

    if clusters is None:
        draws = rng.choice(x, size=(n_boot, x.size), replace=True).mean(axis=1)
    else:
        cl = np.asarray(clusters)[np.isfinite(np.asarray(values, dtype=float))]
        groups = [g.to_numpy() for _, g in pd.Series(x).groupby(pd.Series(cl))]
        k = len(groups)
        if k < 3:
            return (np.nan, np.nan)
        idx = rng.integers(0, k, size=(n_boot, k))
        draws = np.array(
            [np.concatenate([groups[j] for j in row]).mean() for row in idx]
        )
    lo, hi = np.percentile(draws, [100 * alpha / 2, 100 * (1 - alpha / 2)])
    return float(lo * 1e4), float(hi * 1e4)


def compare_means(a: np.ndarray, b: np.ndarray) -> dict:
    """Welch's t-test: does cohort A differ from cohort B?"""
    xa, xb = _clean(a), _clean(b)
    if xa.size < 3 or xb.size < 3:
        return {"diff_bps": np.nan, "t_stat": np.nan, "p_value": np.nan}
    t, p = stats.ttest_ind(xa, xb, equal_var=False)
    return {
        "diff_bps": float((xa.mean() - xb.mean()) * 1e4),
        "t_stat": float(t),
        "p_value": float(p),
    }


def adjust_pvalues(pvals: list[float]) -> dict[str, list[float]]:
    """Holm (family-wise) and Benjamini-Hochberg (FDR) adjusted p-values."""
    p = np.asarray(pvals, dtype=float)
    ok = np.isfinite(p)
    holm = np.full(p.shape, np.nan)
    bh = np.full(p.shape, np.nan)
    if not ok.any():
        return {"holm": holm.tolist(), "bh": bh.tolist()}

    vals = p[ok]
    m = vals.size
    order = np.argsort(vals)

    # Holm: scale by remaining tests, enforce monotonicity, clip to 1.
    h = np.maximum.accumulate((m - np.arange(m)) * vals[order])
    holm_sorted = np.clip(h, 0, 1)

    b = (vals[order] * m) / (np.arange(m) + 1)
    bh_sorted = np.clip(np.minimum.accumulate(b[::-1])[::-1], 0, 1)

    holm_vals = np.empty(m)
    bh_vals = np.empty(m)
    holm_vals[order] = holm_sorted
    bh_vals[order] = bh_sorted
    holm[ok] = holm_vals
    bh[ok] = bh_vals
    return {"holm": holm.tolist(), "bh": bh.tolist()}
