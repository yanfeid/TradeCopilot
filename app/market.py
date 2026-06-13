"""Free market data via Yahoo Finance (yfinance).

Everything here is best-effort: Yahoo's shapes shift between yfinance versions
and tickers, so each accessor swallows failures and returns partial data rather
than throwing. The UI degrades gracefully when a field is missing.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import yfinance as yf


def _safe(fn, default=None):
    try:
        return fn()
    except Exception:
        return default


def get_quote(ticker: str) -> dict[str, Any]:
    """Fast price + day change. Uses fast_info to stay snappy for lists."""
    t = yf.Ticker(ticker)
    fi = _safe(lambda: t.fast_info, {}) or {}

    def fival(*keys):
        for k in keys:
            v = _safe(lambda: fi[k])
            if v is not None:
                return v
        return None

    price = fival("last_price", "lastPrice")
    prev = fival("previous_close", "previousClose")
    change_pct = None
    if price is not None and prev:
        change_pct = round((price - prev) / prev * 100, 2)
    return {
        "ticker": ticker.upper(),
        "price": price,
        "previous_close": prev,
        "change_pct": change_pct,
        "currency": fival("currency"),
    }


def get_overview(ticker: str) -> dict[str, Any]:
    """Company identity + key fundamentals. Uses the heavier .info call."""
    t = yf.Ticker(ticker)
    info = _safe(lambda: t.info, {}) or {}

    def g(*keys):
        for k in keys:
            if info.get(k) is not None:
                return info.get(k)
        return None

    return {
        "name": g("shortName", "longName") or ticker.upper(),
        "sector": g("sector"),
        "industry": g("industry"),
        "market_cap": g("marketCap"),
        "trailing_pe": g("trailingPE"),
        "forward_pe": g("forwardPE"),
        "profit_margin": g("profitMargins"),
        "revenue": g("totalRevenue"),
        "revenue_growth": g("revenueGrowth"),
        "dividend_yield": g("dividendYield"),
        "summary": g("longBusinessSummary"),
    }


def get_performance(ticker: str) -> dict[str, Any]:
    """Trailing % returns over 1m / 3m / 6m from daily closes."""
    t = yf.Ticker(ticker)
    hist = _safe(lambda: t.history(period="6mo"))
    out = {"perf_1m": None, "perf_3m": None, "perf_6m": None}
    if hist is None or hist.empty or "Close" not in hist:
        return out
    closes = hist["Close"].dropna()
    if closes.empty:
        return out
    last = float(closes.iloc[-1])

    def pct_back(days):
        if len(closes) <= days:
            return None
        ref = float(closes.iloc[-days])
        return round((last - ref) / ref * 100, 2) if ref else None

    out["perf_1m"] = pct_back(21)
    out["perf_3m"] = pct_back(63)
    out["perf_6m"] = pct_back(min(126, len(closes) - 1))
    return out


def get_earnings(ticker: str) -> dict[str, Any]:
    """Latest reported earnings + next scheduled date, from get_earnings_dates."""
    t = yf.Ticker(ticker)
    df = _safe(lambda: t.get_earnings_dates(limit=16))
    result = {"last": None, "next_date": None, "history": []}
    if df is None or df.empty:
        # Fall back to the calendar for at least a future date.
        cal = _safe(lambda: t.calendar)
        if isinstance(cal, dict):
            ed = cal.get("Earnings Date")
            if isinstance(ed, (list, tuple)) and ed:
                result["next_date"] = str(ed[0])
        return result

    now = datetime.now(tz=timezone.utc)
    rows = []
    for idx, row in df.iterrows():
        when = idx.to_pydatetime() if hasattr(idx, "to_pydatetime") else idx
        when_utc = when.astimezone(timezone.utc) if when.tzinfo else when.replace(tzinfo=timezone.utc)
        rows.append({
            "date": when_utc.date().isoformat(),
            "is_future": when_utc > now,
            "eps_estimate": _num(row.get("EPS Estimate")),
            "reported_eps": _num(row.get("Reported EPS")),
            "surprise_pct": _num(row.get("Surprise(%)")),
        })

    result["history"] = rows
    past = [r for r in rows if not r["is_future"] and r["reported_eps"] is not None]
    future = [r for r in rows if r["is_future"]]
    if past:
        result["last"] = sorted(past, key=lambda r: r["date"])[-1]
    if future:
        result["next_date"] = sorted(future, key=lambda r: r["date"])[0]["date"]
    return result


def get_next_earnings_date(ticker: str) -> str | None:
    return get_earnings(ticker).get("next_date")


def get_news(ticker: str, limit: int = 8) -> list[dict[str, Any]]:
    """Recent headlines. Handles both old and new yfinance news shapes."""
    t = yf.Ticker(ticker)
    raw = _safe(lambda: t.news, []) or []
    out = []
    for item in raw[:limit]:
        out.append(_norm_news(item))
    return [n for n in out if n.get("title")]


def _norm_news(item: dict) -> dict[str, Any]:
    content = item.get("content")
    if isinstance(content, dict):  # new schema
        return {
            "title": content.get("title"),
            "publisher": (content.get("provider") or {}).get("displayName"),
            "link": (content.get("canonicalUrl") or {}).get("url")
            or (content.get("clickThroughUrl") or {}).get("url"),
            "published": content.get("pubDate") or content.get("displayTime"),
        }
    ts = item.get("providerPublishTime")  # old schema
    published = (
        datetime.fromtimestamp(ts, tz=timezone.utc).isoformat() if ts else None
    )
    return {
        "title": item.get("title"),
        "publisher": item.get("publisher"),
        "link": item.get("link"),
        "published": published,
    }


def get_expectations(ticker: str) -> dict[str, Any]:
    """What the market expects for a stock: next earnings date, next-quarter EPS
    estimate, analyst consensus rating, and price targets. Shown when you buy."""
    t = yf.Ticker(ticker)
    info = _safe(lambda: t.info, {}) or {}
    earn = get_earnings(ticker)
    quote = get_quote(ticker)
    price = quote.get("price")

    def g(*keys):
        for k in keys:
            if info.get(k) is not None:
                return info.get(k)
        return None

    future = [r for r in earn.get("history", []) if r.get("is_future")]
    next_eps = sorted(future, key=lambda r: r["date"])[0]["eps_estimate"] if future else None

    target = g("targetMeanPrice")
    upside = round((target - price) / price * 100, 2) if (target and price) else None
    return {
        "ticker": ticker.upper(),
        "name": g("shortName", "longName") or ticker.upper(),
        "current_price": price,
        "next_earnings": earn.get("next_date"),
        "eps_estimate_next": next_eps if next_eps is not None else g("forwardEps"),
        "recommendation": g("recommendationKey"),
        "num_analysts": g("numberOfAnalystOpinions"),
        "target_mean": target,
        "target_high": g("targetHighPrice"),
        "target_low": g("targetLowPrice"),
        "upside_pct": upside,
        "forward_pe": g("forwardPE"),
    }


def get_financials(ticker: str) -> dict[str, Any]:
    """Quarterly + annual revenue / net income / EPS / margins from the income
    statement. Reliable even when get_earnings_dates() comes back empty."""
    t = yf.Ticker(ticker)

    def parse(df, n):
        rows = []
        if df is None or getattr(df, "empty", True):
            return rows
        def pick(*names):
            for nm in names:
                if nm in df.index:
                    return df.loc[nm]
            return None
        rev, ni = pick("Total Revenue"), pick("Net Income")
        eps = pick("Diluted EPS", "Basic EPS")
        op = pick("Operating Income", "Operating Income Or Loss")
        for col in list(df.columns)[:n]:
            def val(s):
                if s is None:
                    return None
                try:
                    v = float(s[col])
                    return None if v != v else v
                except (KeyError, TypeError, ValueError):
                    return None
            r, net = val(rev), val(ni)
            rows.append({
                "period": str(col.date()) if hasattr(col, "date") else str(col),
                "revenue": r, "net_income": net, "eps": val(eps),
                "operating_income": val(op),
                "net_margin": round(net / r * 100, 2) if (r and net is not None) else None,
            })
        return rows

    return {
        "quarterly": parse(_safe(lambda: t.quarterly_income_stmt), 6),
        "annual": parse(_safe(lambda: t.income_stmt), 4),
    }


def get_quotes_batch(tickers: list[str]) -> dict[str, dict]:
    """Last price + day change for many tickers in a single batched download.
    Much faster than calling get_quote per ticker for the theme grids."""
    out = {t: {"ticker": t, "price": None, "change_pct": None} for t in tickers}
    uniq = list(dict.fromkeys(tickers))
    if not uniq:
        return out
    data = _safe(lambda: __import__("yfinance").download(
        uniq, period="3d", interval="1d", group_by="ticker",
        threads=True, progress=False, auto_adjust=True))
    if data is None or getattr(data, "empty", True):
        return out
    multi = len(uniq) > 1
    for t in uniq:
        try:
            df = data[t] if multi else data
            closes = df["Close"].dropna()
            if closes.empty:
                continue
            last = float(closes.iloc[-1])
            prev = float(closes.iloc[-2]) if len(closes) >= 2 else None
            out[t] = {
                "ticker": t,
                "price": round(last, 2),
                "change_pct": round((last - prev) / prev * 100, 2) if prev else None,
            }
        except (KeyError, IndexError, TypeError, ValueError):
            continue
    return out


def get_intraday(ticker: str) -> dict[str, Any]:
    """Today's price path (5-min bars). Falls back to 5 days of 30-min bars
    when the market is closed so there's always a curve to draw."""
    t = yf.Ticker(ticker)
    hist = _safe(lambda: t.history(period="1d", interval="5m"))
    span = "1d"
    if hist is None or hist.empty:
        hist = _safe(lambda: t.history(period="5d", interval="30m"))
        span = "5d"
    points = []
    if hist is not None and not hist.empty and "Close" in hist:
        for idx, row in hist.iterrows():
            c = row.get("Close")
            if c is not None and c == c:  # skip NaN
                points.append({"t": idx.isoformat(), "c": round(float(c), 2)})
    closes = [p["c"] for p in points]
    return {
        "ticker": ticker.upper(),
        "span": span,
        "points": points,
        "low": min(closes) if closes else None,
        "high": max(closes) if closes else None,
        "open": closes[0] if closes else None,
        "last": closes[-1] if closes else None,
    }


def get_snapshot(ticker: str) -> dict[str, Any]:
    """Everything the detail view and the analysis need, in one object."""
    return {
        "quote": get_quote(ticker),
        "overview": get_overview(ticker),
        "performance": get_performance(ticker),
        "earnings": get_earnings(ticker),
        "news": get_news(ticker),
    }


def _num(v):
    try:
        if v is None:
            return None
        f = float(v)
        return None if f != f else round(f, 4)  # drop NaN
    except (TypeError, ValueError):
        return None
