"""Minimal Yahoo Finance client built on `requests`.

We deliberately do not use `yfinance`: its HTTP layer (curl_cffi with browser
impersonation) fails behind corporate/egress proxies, and we only need three
endpoints. Everything here is plain `requests`, which honours the standard
proxy and CA environment variables.

Endpoints used
--------------
chart          daily OHLC + adjusted close, full history
visualization  earnings calendar with EPS estimate vs actual, back to ~1993
quoteSummary   majorHoldersBreakdown -> institutional ownership percentage
"""

from __future__ import annotations

import json
import logging
import random
import threading
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

import pandas as pd
import requests

log = logging.getLogger(__name__)

_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)

# Fields we ask the earnings "visualization" endpoint for.
_EARNINGS_FIELDS = [
    "ticker",
    "startdatetime",
    "startdatetimetype",
    "epsestimate",
    "epsactual",
    "epssurprisepct",
    "eventname",
]


class YahooError(RuntimeError):
    pass


@dataclass
class _Cache:
    """Tiny on-disk JSON cache so re-runs don't re-hit the network."""

    root: Path
    enabled: bool = True

    def path(self, kind: str, key: str) -> Path:
        safe = key.replace("/", "_").replace("^", "-")
        return self.root / kind / f"{safe}.json"

    def get(self, kind: str, key: str, max_age_days: float | None = None) -> Any | None:
        if not self.enabled:
            return None
        p = self.path(kind, key)
        if not p.exists():
            return None
        if max_age_days is not None:
            age_days = (time.time() - p.stat().st_mtime) / 86400.0
            if age_days > max_age_days:
                return None
        try:
            return json.loads(p.read_text())
        except (json.JSONDecodeError, OSError):
            return None

    def put(self, kind: str, key: str, value: Any) -> None:
        if not self.enabled:
            return
        p = self.path(kind, key)
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(json.dumps(value))


class YahooClient:
    """Thread-safe Yahoo Finance reader with retry, backoff and caching."""

    def __init__(
        self,
        cache_dir: str | Path = "cache",
        use_cache: bool = True,
        max_retries: int = 4,
        timeout: int = 30,
        min_interval: float = 0.05,
    ):
        self.cache = _Cache(Path(cache_dir), enabled=use_cache)
        self.max_retries = max_retries
        self.timeout = timeout
        self.min_interval = min_interval

        self._session = requests.Session()
        self._session.headers.update({"User-Agent": _UA, "Accept": "*/*"})
        self._crumb: str | None = None
        self._lock = threading.Lock()
        self._last_call = 0.0

    # ---------------------------------------------------------------- auth

    def _ensure_crumb(self) -> str:
        """Yahoo gates its JSON APIs behind a cookie + 'crumb' token pair."""
        with self._lock:
            if self._crumb:
                return self._crumb
            # The 404 from fc.yahoo.com is expected; we only want its Set-Cookie.
            try:
                self._session.get("https://fc.yahoo.com/", timeout=self.timeout)
            except requests.RequestException:
                pass
            if not self._session.cookies:
                self._session.get(
                    "https://finance.yahoo.com/quote/AAPL", timeout=self.timeout
                )
            r = self._session.get(
                "https://query1.finance.yahoo.com/v1/test/getcrumb", timeout=self.timeout
            )
            crumb = r.text.strip()
            if r.status_code != 200 or not crumb or len(crumb) > 32:
                raise YahooError(f"could not obtain crumb (HTTP {r.status_code})")
            self._crumb = crumb
            return crumb

    # ------------------------------------------------------------ requests

    def _throttle(self) -> None:
        with self._lock:
            wait = self.min_interval - (time.time() - self._last_call)
            if wait > 0:
                time.sleep(wait)
            self._last_call = time.time()

    def _request(self, method: str, url: str, **kw) -> requests.Response:
        last_exc: Exception | None = None
        for attempt in range(self.max_retries):
            self._throttle()
            try:
                r = self._session.request(method, url, timeout=self.timeout, **kw)
            except requests.RequestException as exc:
                last_exc = exc
            else:
                if r.status_code == 200:
                    return r
                # 404 means "no such symbol" -- retrying will not help.
                if r.status_code == 404:
                    raise YahooError(f"404 for {url.split('?')[0]}")
                # A stale crumb shows up as 401/403; refresh it and retry.
                if r.status_code in (401, 403):
                    with self._lock:
                        self._crumb = None
                last_exc = YahooError(f"HTTP {r.status_code} for {url.split('?')[0]}")
            time.sleep((2**attempt) * 0.5 + random.random() * 0.3)
        raise YahooError(f"request failed after {self.max_retries} attempts: {last_exc}")

    # -------------------------------------------------------------- prices

    def price_history(self, ticker: str, max_age_days: float = 1.0) -> pd.DataFrame:
        """Daily bars with split/dividend-adjusted close, full available history.

        Returns a frame indexed by naive date with columns close/adjclose/volume.
        """
        cached = self.cache.get("prices", ticker, max_age_days)
        if cached is None:
            url = (
                f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}"
                "?period1=0&period2=9999999999&interval=1d"
                "&events=div%2Csplit&includeAdjustedClose=true"
            )
            cached = self._request("GET", url).json()
            self.cache.put("prices", ticker, cached)

        result = (cached.get("chart") or {}).get("result")
        if not result:
            raise YahooError(f"no price data for {ticker}")
        res = result[0]
        stamps = res.get("timestamp") or []
        if not stamps:
            raise YahooError(f"empty price series for {ticker}")

        quote = res["indicators"]["quote"][0]
        adj = res["indicators"].get("adjclose", [{}])[0].get("adjclose")
        df = pd.DataFrame(
            {
                "close": quote.get("close"),
                "volume": quote.get("volume"),
                "adjclose": adj if adj is not None else quote.get("close"),
            },
            index=pd.to_datetime(pd.Series(stamps), unit="s", utc=True),
        )
        # Yahoo stamps daily bars at market open in exchange-local time; we only
        # ever need calendar dates, so normalise to the exchange's date.
        tz = (res.get("meta") or {}).get("exchangeTimezoneName") or "America/New_York"
        df.index = df.index.tz_convert(tz).normalize().tz_localize(None)
        df.index.name = "date"
        df = df[~df.index.duplicated(keep="last")].sort_index()
        return df.dropna(subset=["adjclose"])

    # ------------------------------------------------------------ earnings

    def earnings_history(self, ticker: str, max_age_days: float = 7.0) -> pd.DataFrame:
        """Historical earnings events with consensus estimate and actual EPS.

        Columns: ticker, timestamp (UTC), eps_estimate, eps_actual,
        surprise_pct_yahoo, event_name.
        """
        cached = self.cache.get("earnings", ticker, max_age_days)
        if cached is None:
            crumb = self._ensure_crumb()
            body = {
                "size": 250,
                "query": {
                    "operator": "and",
                    "operands": [{"operator": "eq", "operands": ["ticker", ticker]}],
                },
                "sortField": "startdatetime",
                "sortType": "DESC",
                "entityIdType": "earnings",
                "includeFields": _EARNINGS_FIELDS,
            }
            url = f"https://query1.finance.yahoo.com/v1/finance/visualization?crumb={crumb}"
            cached = self._request(
                "POST", url, json=body, headers={"Content-Type": "application/json"}
            ).json()
            self.cache.put("earnings", ticker, cached)

        docs = (((cached.get("finance") or {}).get("result") or [{}])[0]).get("documents")
        if not docs:
            return pd.DataFrame(columns=_EARNINGS_FIELDS)
        doc = docs[0]
        cols = [c["id"] for c in doc["columns"]]
        df = pd.DataFrame(doc.get("rows") or [], columns=cols)
        if df.empty:
            return df

        out = pd.DataFrame(
            {
                "ticker": ticker,
                "timestamp": pd.to_datetime(df["startdatetime"], utc=True, errors="coerce"),
                "eps_estimate": pd.to_numeric(df.get("epsestimate"), errors="coerce"),
                "eps_actual": pd.to_numeric(df.get("epsactual"), errors="coerce"),
                "surprise_pct_yahoo": pd.to_numeric(
                    df.get("epssurprisepct"), errors="coerce"
                ),
                "event_name": df.get("eventname"),
            }
        )
        # Rows with an eventname are shareholder meetings etc., not EPS releases.
        out = out[out["event_name"].isna() | (out["event_name"].astype(str).str.strip() == "")]
        out = out.dropna(subset=["timestamp"]).sort_values("timestamp")
        return out.reset_index(drop=True)

    # ----------------------------------------------------------- ownership

    def institutional_ownership(self, ticker: str, max_age_days: float = 30.0) -> dict:
        """Current institutional ownership snapshot.

        NOTE: this is a *today* snapshot, not point-in-time history. See the
        README's bias section -- this is the study's main methodological
        weakness, not an implementation detail we can fix from this source.
        """
        cached = self.cache.get("ownership", ticker, max_age_days)
        if cached is None:
            crumb = self._ensure_crumb()
            url = (
                f"https://query1.finance.yahoo.com/v10/finance/quoteSummary/{ticker}"
                f"?modules=majorHoldersBreakdown&crumb={crumb}"
            )
            cached = self._request("GET", url).json()
            self.cache.put("ownership", ticker, cached)

        result = ((cached.get("quoteSummary") or {}).get("result") or [None])[0]
        if not result:
            return {"ticker": ticker, "inst_pct": None, "inst_count": None}
        mhb = result.get("majorHoldersBreakdown") or {}

        def raw(key: str):
            v = mhb.get(key)
            return v.get("raw") if isinstance(v, dict) else v

        return {
            "ticker": ticker,
            "inst_pct": raw("institutionsPercentHeld"),
            "inst_float_pct": raw("institutionsFloatPercentHeld"),
            "insider_pct": raw("insidersPercentHeld"),
            "inst_count": raw("institutionsCount"),
        }
