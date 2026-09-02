"""Unit tests for the inference layer."""

import sys
from pathlib import Path

import numpy as np
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from isb.stats import adjust_pvalues, bootstrap_ci, cluster_robust_se, describe


def test_clustering_widens_the_error_when_events_share_a_shock():
    rng = np.random.default_rng(7)
    clusters = rng.integers(0, 120, 4000)
    shock = rng.normal(0, 0.012, 120)[clusters]
    x = shock + rng.normal(0.0003, 0.015, 4000)
    d = describe(x, clusters)
    # Ignoring the shared shock makes the naive test far too confident.
    assert d["p_value"] > d["p_value_naive"]
    assert d["n_clusters"] == 120


def test_cluster_se_matches_plain_se_when_every_event_is_its_own_cluster():
    rng = np.random.default_rng(3)
    x = rng.normal(0, 0.02, 500)
    se, g = cluster_robust_se(x, np.arange(500))
    assert g == 500
    assert se == pytest.approx(np.std(x, ddof=1) / np.sqrt(500), rel=0.02)


def test_pvalue_and_bootstrap_interval_agree_about_zero():
    # These target the same estimand, so they must not contradict each other.
    rng = np.random.default_rng(11)
    for seed_shift in range(4):
        clusters = rng.integers(0, 80, 2500)
        x = rng.normal(0.0004 * seed_shift, 0.02, 2500)
        d = describe(x, clusters)
        lo, hi = bootstrap_ci(x, clusters, n_boot=3000)
        crosses_zero = lo <= 0 <= hi
        assert crosses_zero == (d["p_value"] > 0.05) or abs(d["p_value"] - 0.05) < 0.04


def test_adjusted_pvalues_are_never_smaller_than_raw():
    raw = [0.001, 0.02, 0.04, 0.3, 0.9]
    adj = adjust_pvalues(raw)
    assert all(h >= r - 1e-12 for h, r in zip(adj["holm"], raw))
    assert all(b >= r - 1e-12 for b, r in zip(adj["bh"], raw))
    # Holm is the stricter (family-wise) correction.
    assert all(h >= b - 1e-12 for h, b in zip(adj["holm"], adj["bh"]))


def test_nan_values_are_dropped_not_propagated():
    x = np.array([0.01, np.nan, -0.01, 0.02, np.nan])
    d = describe(x, np.array([1, 1, 2, 2, 3]))
    assert d["n"] == 3
