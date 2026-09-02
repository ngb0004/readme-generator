"""Building the test universe and applying the institutional-ownership screen."""

from __future__ import annotations

import concurrent.futures as cf
import io
import logging
from typing import Iterable
from pathlib import Path

import pandas as pd
import requests

from .yahoo import YahooClient, YahooError

log = logging.getLogger(__name__)

_WIKI = {
    "sp500": "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies",
    "sp400": "https://en.wikipedia.org/wiki/List_of_S%26P_400_companies",
    "sp600": "https://en.wikipedia.org/wiki/List_of_S%26P_600_companies",
}
INDEXES = tuple(_WIKI)
_UA = "Mozilla/5.0 (compatible; institutional-selloff-backtest/1.0)"


def index_universe(index: str = "sp500", include_removed: bool = True) -> pd.DataFrame:
    """Current S&P 500 members, optionally plus names historically removed.

    Including removed names is a partial defence against survivorship bias: a
    universe of *today's* index members over-represents companies that did well.
    Yahoo retains price and earnings history for many delisted/acquired tickers,
    so they can still contribute events.

    As of this writing Wikipedia no longer publishes the index-changes table, so
    this degrades to current members only and logs a warning. It was only ever a
    partial defence in any case: the ownership screen needs a *current* Yahoo
    ownership record, which delisted names do not have. See the README.
    """
    if index not in _WIKI:
        raise ValueError(f"unknown index {index!r}; choose from {', '.join(_WIKI)}")
    html = requests.get(_WIKI[index], headers={"User-Agent": _UA}, timeout=45).text
    tables = pd.read_html(io.StringIO(html))

    # The constituents table is the one with a plain Symbol/Ticker column; the
    # index pages do not agree on its position.
    current = next(
        (
            t
            for t in tables
            if any(str(c) in ("Symbol", "Ticker") for c in t.columns)
        ),
        tables[0],
    )
    sym_col = next(
        (c for c in current.columns if str(c) in ("Symbol", "Ticker")), current.columns[0]
    )
    rows = [
        pd.DataFrame(
            {
                "ticker": current[sym_col].astype(str).str.strip(),
                "name": current.get("Security", pd.Series(dtype=str)),
                "sector": current.get("GICS Sector", pd.Series(dtype=str)),
                "in_index_today": True,
                "index": index,
            }
        )
    ]

    if include_removed:
        changes = next(
            (
                t
                for t in tables[1:]
                if any(isinstance(c, tuple) and c[0] == "Removed" for c in t.columns)
            ),
            None,
        )
        if changes is None:
            # Wikipedia dropped its "Selected changes to the list" table, so
            # there is currently no free source of historically-removed names
            # here. Say so rather than silently returning a survivors-only
            # universe that looks like it includes them.
            log.warning(
                "%s: no index-changes table found upstream, so this slice is "
                "CURRENT members only and carries full survivorship bias",
                index,
            )
        # The changes table has a two-level header: ("Removed", "Ticker").
        removed_col = next(
            (
                c
                for c in (changes.columns if changes is not None else [])
                if isinstance(c, tuple) and c[0] == "Removed" and "Ticker" in str(c[1])
            ),
            None,
        )
        if removed_col is not None:
            removed = changes[removed_col].dropna().astype(str).str.strip()
            removed = removed[removed.str.fullmatch(r"[A-Z][A-Z.\-]{0,6}")]
            rows.append(
                pd.DataFrame(
                    {
                        "ticker": removed.unique(),
                        "in_index_today": False,
                        "index": index,
                    }
                )
            )
            log.info(
                "%s: %d current members + %d historically removed",
                index, len(current), removed.nunique(),
            )

    out = pd.concat(rows, ignore_index=True)
    # Wikipedia writes class shares as BRK.B; Yahoo wants BRK-B.
    out["ticker"] = out["ticker"].str.replace(".", "-", regex=False)
    out = out.drop_duplicates(subset="ticker", keep="first")
    return out.reset_index(drop=True)


def sp500_universe(include_removed: bool = True) -> pd.DataFrame:
    """Backwards-compatible alias for the large-cap slice."""
    return index_universe("sp500", include_removed=include_removed)


def load_universe(
    path: str | Path | None,
    include_removed: bool = True,
    indexes: Iterable[str] = ("sp500",),
) -> pd.DataFrame:
    """Universe from a user CSV (needs a `ticker` column) or from S&P indices."""
    if path is None:
        frames = [index_universe(i, include_removed=include_removed) for i in indexes]
        out = pd.concat(frames, ignore_index=True)
        # A ticker can appear in two slices after an index promotion; keep one.
        return out.drop_duplicates(subset="ticker", keep="first").reset_index(drop=True)
    df = pd.read_csv(path)
    if "ticker" not in df.columns:
        raise ValueError(f"{path} must contain a 'ticker' column")
    df["ticker"] = df["ticker"].astype(str).str.strip().str.replace(".", "-", regex=False)
    return df.drop_duplicates(subset="ticker").reset_index(drop=True)


def fetch_ownership(
    client: YahooClient, tickers: list[str], workers: int = 6
) -> pd.DataFrame:
    """Institutional ownership for each ticker (current snapshot)."""

    def one(tk: str) -> dict:
        try:
            return client.institutional_ownership(tk)
        except (YahooError, KeyError, ValueError) as exc:
            log.debug("ownership failed for %s: %s", tk, exc)
            return {"ticker": tk, "inst_pct": None}

    with cf.ThreadPoolExecutor(workers) as ex:
        records = list(ex.map(one, tickers))

    df = pd.DataFrame(records)
    for col in ("inst_pct", "top10_pct", "inst_count", "market_cap", "float_shares"):
        if col in df:
            df[col] = pd.to_numeric(df[col], errors="coerce")
    return df


def apply_ownership_screen(
    universe: pd.DataFrame,
    ownership: pd.DataFrame,
    threshold: float,
    screen_col: str = "inst_pct",
) -> pd.DataFrame:
    """Attach ownership and flag which names clear the screen.

    `threshold` is a fraction (0.80 for the theory's 80%). `screen_col` selects
    what is being screened on: `inst_pct` is the theory as literally stated,
    `top10_pct` screens on how *concentrated* the holding is, which is the
    better proxy for whether institutional trading can actually move the price.
    """
    merged = universe.merge(ownership, on="ticker", how="left")
    if screen_col not in merged.columns:
        raise ValueError(f"no {screen_col!r} column available to screen on")
    merged["screen_col"] = screen_col
    merged["passes_screen"] = merged[screen_col].ge(threshold)
    return merged
