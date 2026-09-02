"""Chart of the average event-window path.

One figure, two panels:
  top     cumulative market-adjusted return by cohort -- shows whether the
          "dip then day-5 pop" shape exists at all, and whether it is specific
          to institutionally-held names.
  bottom  the theory cohort's per-day mean with 95% bootstrap intervals -- shows
          whether day 5 stands out from its nine neighbours.
"""

from __future__ import annotations

import logging
from pathlib import Path

import numpy as np
import pandas as pd

from . import stats
from .events import BEAT, CRUSH, MISS

log = logging.getLogger(__name__)

# Categorical slots 1-4 of the validated reference palette, in fixed order.
SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100"]
INK = "#0b0b0b"
INK_2 = "#52514e"
INK_MUTED = "#8a8880"
SURFACE = "#fcfcfb"
GRID = "#e6e5e0"


def _cohorts(events: pd.DataFrame) -> list[tuple[str, pd.DataFrame]]:
    hi = events[events["passes_screen"]] if "passes_screen" in events else events
    lo = events[~events["passes_screen"]] if "passes_screen" in events else events.iloc[0:0]
    return [
        ("Beat, high inst. (theory)", hi[hi["bucket"] == BEAT]),
        ("Beat, low inst. (control)", lo[lo["bucket"] == BEAT]),
        ("Crush, high inst.", hi[hi["bucket"] == CRUSH]),
        ("Miss, high inst.", hi[hi["bucket"] == MISS]),
    ]


def plot_car(
    events: pd.DataFrame,
    horizon: int,
    pop_day: int,
    ret_prefix: str,
    out_dir: str | Path,
) -> Path | None:
    try:
        import matplotlib

        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
    except ImportError:
        log.warning("matplotlib not installed; skipping chart")
        return None

    car_prefix = "acar" if ret_prefix == "aret" else "car"
    days = list(range(1, horizon + 1))
    adjusted = ret_prefix == "aret"

    fig, (ax1, ax2) = plt.subplots(
        2, 1, figsize=(10.5, 9.6), dpi=160, height_ratios=[1.25, 1]
    )
    fig.patch.set_facecolor(SURFACE)

    # ---------------------------------------------------- panel 1: CAR paths
    for (label, sub), color in zip(_cohorts(events), SERIES):
        if sub.empty:
            continue
        path = [0.0] + [
            float(np.nanmean(sub[f"{car_prefix}_d{k}"].to_numpy(dtype=float)) * 1e4)
            for k in days
        ]
        ax1.plot(
            [0] + days, path, color=color, lw=1.8, marker="o", markersize=4.5,
            markeredgecolor=SURFACE, markeredgewidth=1.2,
            label=f"{label}  (n={len(sub):,})", zorder=3,
        )
        # Direct end labels: the relief the palette validator requires for the
        # two low-contrast slots, and identity without relying on colour alone.
        ax1.plot([horizon + 0.22], [path[-1]], marker="s", markersize=5,
                 color=color, clip_on=False, zorder=4)
        ax1.annotate(
            label, xy=(horizon + 0.45, path[-1]), va="center", ha="left",
            fontsize=8.5, color=INK_2, annotation_clip=False,
        )

    ax1.set_title(
        "Cumulative "
        + ("market-adjusted " if adjusted else "")
        + "return after an earnings report",
        fontsize=13, color=INK, loc="left", pad=10,
    )
    ax1.set_ylabel("Cumulative return (bps)", fontsize=9.5, color=INK_2)
    leg = ax1.legend(
        frameon=False, fontsize=8.5, loc="center left",
        bbox_to_anchor=(0.01, 0.30), labelcolor=INK_2,
    )
    for t in leg.get_texts():
        t.set_color(INK_2)

    # ------------------------------------------- panel 2: per-day, theory cohort
    theory = _cohorts(events)[0][1]
    day1_mean = float(np.nanmean(theory[f"{ret_prefix}_d1"].to_numpy(dtype=float)) * 1e4)
    panel_days = [k for k in days if k != 1]
    means, los, his = [], [], []
    for k in panel_days:
        vals = theory[f"{ret_prefix}_d{k}"].to_numpy(dtype=float)
        clusters = theory["day1_date"].to_numpy()
        means.append(float(np.nanmean(vals) * 1e4))
        lo, hi = stats.bootstrap_ci(vals, clusters, n_boot=2000)
        los.append(lo)
        his.append(hi)

    means_a = np.array(means)
    err = np.vstack([means_a - np.array(los), np.array(his) - means_a])
    # Day 5 is the theory's claim; every other day is its own control.
    colors = [SERIES[0] if k == pop_day else INK_MUTED for k in panel_days]
    ax2.bar(panel_days, means_a, color=colors, width=0.62, zorder=3)
    ax2.errorbar(
        panel_days, means_a, yerr=err, fmt="none", ecolor=INK_2, elinewidth=1.1,
        capsize=3, zorder=4,
    )
    top = float(np.nanmax(his))
    ax2.annotate(
        f"day {pop_day}: the theory's\npredicted buy-back pop",
        xy=(pop_day, float(np.nanmax([his[panel_days.index(pop_day)], 0])) + top * 0.06),
        xytext=(pop_day, top * 1.30),
        ha="center", fontsize=8.5, color=INK_2,
        arrowprops=dict(arrowstyle="-", color=INK_MUTED, lw=1, shrinkA=2, shrinkB=2),
    )
    ax2.set_ylim(top=top * 1.62)
    ax2.set_title(
        f"Theory cohort, day by day (95% date-clustered bootstrap interval)\n"
        f"Day 1 omitted: at {day1_mean:,.0f} bps it is the announcement reaction "
        f"itself, and it compresses everything after it.",
        fontsize=12, color=INK, loc="left", pad=10,
    )
    ax2.set_ylabel("Mean daily return (bps)", fontsize=9.5, color=INK_2)
    ax2.set_xlabel("Trading days after the report (day 1 = first tradeable session)",
                   fontsize=9.5, color=INK_2)

    for ax in (ax1, ax2):
        ax.set_facecolor(SURFACE)
        ax.axhline(0, color=INK_MUTED, lw=1, zorder=2)
        ax.grid(axis="y", color=GRID, lw=0.8, zorder=0)
        ax.set_axisbelow(True)
        ax.set_xticks(days if ax is ax1 else panel_days)
        ax.tick_params(colors=INK_2, labelsize=8.5, length=0)
        for side in ("top", "right", "left"):
            ax.spines[side].set_visible(False)
        ax.spines["bottom"].set_color(GRID)
    ax1.set_xlim(-0.3, horizon + 0.3)
    ax2.set_xlim(1.4, horizon + 0.6)

    n = len(theory)
    span = ""
    if not theory.empty:
        span = f"  {theory['day1_date'].min().date()} to {theory['day1_date'].max().date()}"
    fig.text(
        0.008, 0.012,
        f"Theory cohort: n={n:,} earnings events.{span}  "
        "Source: Yahoo Finance. Ownership screen uses a current snapshot (see README).",
        fontsize=7.5, color=INK_MUTED,
    )
    fig.tight_layout(rect=[0, 0.022, 0.795, 1])

    out = Path(out_dir) / "car_profile.png"
    fig.savefig(out, facecolor=SURFACE)
    plt.close(fig)
    return out
