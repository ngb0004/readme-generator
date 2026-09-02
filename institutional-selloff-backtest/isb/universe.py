"""Building the test universe and applying the institutional-ownership screen."""

from __future__ import annotations

import concurrent.futures as cf
import io
import logging
from pathlib import Path

import pandas as pd
import requests

from .yahoo import YahooClient, YahooError

log = logging.getLogger(__name__)

_WIKI_SP500 = "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies"
_UA = "Mozilla/5.0 (compatible; institutional-selloff-backtest/1.0)"


def sp500_universe(include_removed: bool = True) -> pd.DataFrame:
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
    html = requests.get(_WIKI_SP500, headers={"User-Agent": _UA}, timeout=45).text
    tables = pd.read_html(io.StringIO(html))

    current = tables[0]
    sym_col = "Symbol" if "Symbol" in current.columns else current.columns[0]
    rows = [
        pd.DataFrame(
            {
                "ticker": current[sym_col].astype(str).str.strip(),
                "name": current.get("Security", pd.Series(dtype=str)),
                "sector": current.get("GICS Sector", pd.Series(dtype=str)),
                "in_index_today": True,
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
                "no index-changes table found upstream: universe is CURRENT index "
                "members only, so results carry full survivorship bias"
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
                pd.DataFrame({"ticker": removed.unique(), "in_index_today": False})
            )

    out = pd.concat(rows, ignore_index=True)
    # Wikipedia writes class shares as BRK.B; Yahoo wants BRK-B.
    out["ticker"] = out["ticker"].str.replace(".", "-", regex=False)
    out = out.drop_duplicates(subset="ticker", keep="first")
    return out.reset_index(drop=True)


def load_universe(path: str | Path | None, include_removed: bool = True) -> pd.DataFrame:
    """Universe from a user CSV (needs a `ticker` column) or from the S&P 500."""
    if path is None:
        return sp500_universe(include_removed=include_removed)
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
    df["inst_pct"] = pd.to_numeric(df.get("inst_pct"), errors="coerce")
    return df


def apply_ownership_screen(
    universe: pd.DataFrame,
    ownership: pd.DataFrame,
    min_inst_pct: float,
) -> pd.DataFrame:
    """Attach ownership and flag which names clear the institutional threshold.

    `min_inst_pct` is a fraction (0.80 for the theory's 80%).
    """
    merged = universe.merge(ownership, on="ticker", how="left")
    merged["passes_screen"] = merged["inst_pct"].ge(min_inst_pct)
    return merged
