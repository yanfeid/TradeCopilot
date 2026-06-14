"""TradeCopilot — a personal trading journal + earnings/event tracker + analyst.

Run with:  uvicorn app.main:app --reload
Then open: http://127.0.0.1:8000
"""

from __future__ import annotations

import csv
import io
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from . import analysis, market, sectors
from .db import get_conn, get_meta, init_db, now_iso, set_meta

load_dotenv()
init_db()

WEB_DIR = Path(__file__).resolve().parent.parent / "web"

app = FastAPI(title="TradeCopilot")


# ---------- request models ----------
class TradeIn(BaseModel):
    ticker: str
    action: str = "BUY"
    quantity: float
    price: float
    trade_date: str
    thesis: Optional[str] = None
    confidence: Optional[int] = None
    emotion: Optional[str] = None
    tags: Optional[str] = None


class WatchIn(BaseModel):
    ticker: str
    note: Optional[str] = None


class EventIn(BaseModel):
    ticker: Optional[str] = None
    title: str
    event_date: str
    category: str = "custom"
    notes: Optional[str] = None


class SearchIn(BaseModel):
    query: str


class SettingsIn(BaseModel):
    language: str


class ChatIn(BaseModel):
    message: str
    ticker: Optional[str] = None
    context: dict = {}
    history: list = []


def _get_lang() -> str:
    return get_meta("language") or "zh"


# ---------- settings ----------
@app.get("/api/settings")
def get_settings():
    return {"language": _get_lang()}


@app.post("/api/settings")
def save_settings(s: SettingsIn):
    lang = s.language if s.language in ("zh", "en") else "zh"
    set_meta("language", lang)
    return {"language": lang}


def _sse(event: dict) -> str:
    return "data: " + json.dumps(event, ensure_ascii=False) + "\n\n"


# ---------- trades ----------
@app.get("/api/trades")
def list_trades():
    with get_conn() as c:
        rows = c.execute("SELECT * FROM trades ORDER BY trade_date DESC, id DESC").fetchall()
    return [dict(r) for r in rows]


@app.post("/api/trades")
def add_trade(t: TradeIn):
    with get_conn() as c:
        cur = c.execute(
            """INSERT INTO trades
               (ticker, action, quantity, price, trade_date, thesis,
                confidence, emotion, tags, created_at)
               VALUES (?,?,?,?,?,?,?,?,?,?)""",
            (t.ticker.upper(), t.action.upper(), t.quantity, t.price, t.trade_date,
             t.thesis, t.confidence, t.emotion, t.tags, now_iso()),
        )
        return {"id": cur.lastrowid}


@app.delete("/api/trades/{trade_id}")
def delete_trade(trade_id: int):
    with get_conn() as c:
        c.execute("DELETE FROM trades WHERE id = ?", (trade_id,))
    return {"ok": True}


@app.post("/api/trades/import")
async def import_trades(file: UploadFile = File(...)):
    """Import a CSV of trades. Column names are matched case-insensitively;
    accepted aliases: ticker/symbol, action/side, quantity/shares/qty,
    price, date/trade_date."""
    content = (await file.read()).decode("utf-8-sig", errors="replace")
    reader = csv.DictReader(io.StringIO(content))
    if not reader.fieldnames:
        raise HTTPException(400, "CSV has no header row.")
    fmap = {h.lower().strip(): h for h in reader.fieldnames}

    def pick(row, *aliases):
        for a in aliases:
            if a in fmap and row.get(fmap[a]) not in (None, ""):
                return row[fmap[a]]
        return None

    imported = 0
    with get_conn() as c:
        for row in reader:
            ticker = pick(row, "ticker", "symbol", "instrument")
            qty = pick(row, "quantity", "shares", "qty")
            price = pick(row, "price", "average_price", "avg_price")
            date = pick(row, "trade_date", "date", "settle_date")
            if not (ticker and qty and price and date):
                continue
            action = (pick(row, "action", "side", "type") or "BUY").upper()
            try:
                c.execute(
                    """INSERT INTO trades
                       (ticker, action, quantity, price, trade_date, thesis,
                        confidence, emotion, tags, created_at)
                       VALUES (?,?,?,?,?,?,?,?,?,?)""",
                    (ticker.upper(), action, float(qty), float(price), str(date),
                     "(imported)", None, None, "import", now_iso()),
                )
                imported += 1
            except (ValueError, TypeError):
                continue
    return {"imported": imported}


# ---------- watchlist ----------
@app.get("/api/watchlist")
def list_watchlist():
    with get_conn() as c:
        rows = c.execute("SELECT * FROM watchlist ORDER BY ticker").fetchall()
    out = []
    for r in rows:
        d = dict(r)
        d["quote"] = market.get_quote(r["ticker"])
        out.append(d)
    return out


@app.post("/api/watchlist")
def add_watch(w: WatchIn):
    with get_conn() as c:
        try:
            c.execute(
                "INSERT INTO watchlist (ticker, note, added_at) VALUES (?,?,?)",
                (w.ticker.upper(), w.note, now_iso()),
            )
        except Exception:
            raise HTTPException(409, f"{w.ticker.upper()} is already on the watchlist.")
    return {"ok": True}


@app.delete("/api/watchlist/{ticker}")
def remove_watch(ticker: str):
    with get_conn() as c:
        c.execute("DELETE FROM watchlist WHERE ticker = ?", (ticker.upper(),))
    return {"ok": True}


# ---------- hot stocks by theme ----------
def _load_themes() -> list[dict]:
    raw = get_meta("hot_themes")
    if raw:
        try:
            data = json.loads(raw)
            if data:
                return data
        except json.JSONDecodeError:
            pass
    return sectors.DEFAULT_THEMES


@app.get("/api/themes")
def themes():
    """Hot stocks grouped by theme, enriched with live prices (one batch fetch)."""
    groups = _load_themes()
    all_tickers = [t for g in groups for t in g["tickers"]]
    quotes = market.get_quotes_batch(all_tickers)
    out = []
    for g in groups:
        out.append({
            "key": g["key"], "name": g["name"],
            "stocks": [quotes.get(t, {"ticker": t, "price": None, "change_pct": None}) for t in g["tickers"]],
        })
    source = "claude" if get_meta("hot_themes") else "default"
    return {"themes": out, "source": source, "updated_at": get_meta("hot_themes_at")}


@app.post("/api/themes/refresh")
def themes_refresh():
    """Refresh the hottest stocks per theme using Claude + web search.
    Any theme Claude skips falls back to the curated default so all show."""
    try:
        groups = analysis.fetch_hot_stocks(sectors.DEFAULT_THEMES)
    except analysis.AnalysisError as e:
        raise HTTPException(400, str(e))
    if not groups:
        raise HTTPException(400, "Claude returned no themes.")
    by_key = {g["key"]: g for g in groups}
    by_name = {g["name"]: g for g in groups}
    final = []
    for d in sectors.DEFAULT_THEMES:
        g = by_key.get(d["key"]) or by_name.get(d["name"])
        src = g if (g and g.get("tickers")) else d
        # copy so we never mutate the DEFAULT_THEMES constant
        chosen = {"key": src["key"], "name": src["name"], "tickers": list(src["tickers"])}
        for tk in sectors.PINNED.get(chosen["key"], []):
            if tk not in chosen["tickers"]:
                chosen["tickers"].insert(0, tk)
        final.append(chosen)
    set_meta("hot_themes", json.dumps(final, ensure_ascii=False))
    set_meta("hot_themes_at", now_iso())
    return {"themes": len(final)}


@app.post("/api/themes/reset")
def themes_reset():
    """Drop the Claude override and go back to the curated default lists."""
    with get_conn() as c:
        c.execute("DELETE FROM meta WHERE key IN ('hot_themes','hot_themes_at')")
    return {"ok": True}


# ---------- positions (P&L) ----------
@app.get("/api/positions")
def positions():
    """Net holdings with average cost and unrealized/realized P&L, computed from
    the trade journal (average-cost method) and priced with live quotes."""
    with get_conn() as c:
        rows = [dict(r) for r in c.execute(
            "SELECT ticker, action, quantity, price FROM trades ORDER BY trade_date, id"
        )]
    book: dict[str, dict] = {}
    for t in rows:
        b = book.setdefault(t["ticker"], {"qty": 0.0, "cost": 0.0, "realized": 0.0})
        q, px = t["quantity"], t["price"]
        if t["action"] == "BUY":
            b["qty"] += q
            b["cost"] += q * px
        else:  # SELL — average-cost realized P&L
            if b["qty"] > 1e-9:
                avg = b["cost"] / b["qty"]
                sell_q = min(q, b["qty"])
                b["realized"] += sell_q * (px - avg)
                b["cost"] -= sell_q * avg
                b["qty"] -= sell_q

    out = []
    totals = {"market_value": 0.0, "unrealized": 0.0, "realized": 0.0, "cost": 0.0}
    for tk, b in book.items():
        totals["realized"] += b["realized"]
        if b["qty"] <= 1e-9:
            continue
        avg = b["cost"] / b["qty"]
        quote = market.get_quote(tk)
        price = quote.get("price")
        mv = price * b["qty"] if price else None
        unreal = (price - avg) * b["qty"] if price else None
        out.append({
            "ticker": tk,
            "quantity": round(b["qty"], 4),
            "avg_cost": round(avg, 2),
            "price": price,
            "market_value": round(mv, 2) if mv is not None else None,
            "unrealized": round(unreal, 2) if unreal is not None else None,
            "unrealized_pct": round((price - avg) / avg * 100, 2) if (price and avg) else None,
            "change_pct": quote.get("change_pct"),
        })
        totals["cost"] += b["cost"]
        if mv is not None:
            totals["market_value"] += mv
        if unreal is not None:
            totals["unrealized"] += unreal
    out.sort(key=lambda p: p["market_value"] or 0, reverse=True)
    return {"positions": out, "totals": {k: round(v, 2) for k, v in totals.items()}}


# ---------- market data ----------
@app.get("/api/market/{ticker}")
def market_detail(ticker: str):
    return market.get_snapshot(ticker)


@app.get("/api/intraday/{ticker}")
def intraday(ticker: str):
    return market.get_intraday(ticker)


@app.get("/api/expectations/{ticker}")
def expectations(ticker: str):
    """Earnings date + market expectations for a ticker (shown when you buy)."""
    return market.get_expectations(ticker)


# ---------- trade review (复盘) ----------
@app.get("/api/review")
def review_list():
    """Every trade with its return since entry — the raw material for review."""
    from datetime import date as _date
    with get_conn() as c:
        trades = [dict(r) for r in c.execute(
            "SELECT * FROM trades ORDER BY trade_date DESC, id DESC"
        )]
    price_cache: dict[str, float] = {}
    out = []
    for t in trades:
        tk = t["ticker"]
        if tk not in price_cache:
            price_cache[tk] = market.get_quote(tk).get("price")
        cur = price_cache[tk]
        entry = t["price"]
        t["current_price"] = cur
        t["return_pct"] = round((cur - entry) / entry * 100, 2) if (cur and entry) else None
        try:
            t["days_held"] = (_date.today() - _date.fromisoformat(t["trade_date"][:10])).days
        except ValueError:
            t["days_held"] = None
        out.append(t)
    return out


@app.post("/api/review/{trade_id}")
def review_trade(trade_id: int):
    with get_conn() as c:
        row = c.execute("SELECT * FROM trades WHERE id = ?", (trade_id,)).fetchone()
    if not row:
        raise HTTPException(404, "Trade not found.")
    t = dict(row)
    cur = market.get_quote(t["ticker"]).get("price")
    perf = {
        "entry_price": t["price"],
        "current_price": cur,
        "return_pct": round((cur - t["price"]) / t["price"] * 100, 2) if (cur and t["price"]) else None,
        "trade_date": t["trade_date"],
    }
    news = market.get_news(t["ticker"], 6)
    try:
        result = analysis.run_trade_review(t, perf, news, lang=_get_lang())
    except analysis.AnalysisError as e:
        raise HTTPException(400, str(e))
    return {"trade": t, "performance": perf, "review": result}


# ---------- events / calendar ----------
@app.get("/api/events")
def list_events():
    with get_conn() as c:
        rows = c.execute("SELECT * FROM events ORDER BY event_date ASC").fetchall()
    return [dict(r) for r in rows]


@app.post("/api/events")
def add_event(e: EventIn):
    with get_conn() as c:
        cur = c.execute(
            """INSERT INTO events (ticker, title, event_date, category, notes, source, created_at)
               VALUES (?,?,?,?,?,?,?)""",
            (e.ticker.upper() if e.ticker else None, e.title, e.event_date,
             e.category, e.notes, "manual", now_iso()),
        )
    return {"id": cur.lastrowid}


@app.delete("/api/events/{event_id}")
def delete_event(event_id: int):
    with get_conn() as c:
        c.execute("DELETE FROM events WHERE id = ?", (event_id,))
    return {"ok": True}


@app.post("/api/events/seed-nfp")
def seed_nonfarm_payrolls():
    """Auto-add the next 12 monthly Non-farm Payroll releases (first Friday of
    each month — deterministic and accurate). CPI and FOMC dates have no formula,
    so add those manually with the quick-add buttons."""
    import calendar
    from datetime import date

    def first_friday(year: int, month: int) -> date:
        for d in calendar.Calendar().itermonthdates(year, month):
            if d.month == month and d.weekday() == 4:  # Friday
                return d
        raise ValueError

    today = date.today()
    added = 0
    with get_conn() as c:
        existing = {
            r["event_date"]
            for r in c.execute(
                "SELECT event_date FROM events WHERE category='macro' AND title LIKE 'Non-farm%'"
            )
        }
        for i in range(12):
            month = (today.month - 1 + i) % 12 + 1
            year = today.year + (today.month - 1 + i) // 12
            ff = first_friday(year, month)
            iso = ff.isoformat()
            if ff < today or iso in existing:
                continue
            c.execute(
                """INSERT INTO events (ticker, title, event_date, category, notes, source, created_at)
                   VALUES (?,?,?,?,?,?,?)""",
                (None, "Non-farm payrolls (NFP)", iso, "macro",
                 "Auto: first Friday of the month", "auto", now_iso()),
            )
            added += 1
    return {"added": added}


def _macro_stale() -> bool:
    ts = get_meta("macro_synced_at")
    if not ts:
        return True
    try:
        age = datetime.now(timezone.utc) - datetime.fromisoformat(ts)
        return age.total_seconds() > 24 * 3600
    except ValueError:
        return True


def _insert_events(rows, source: str) -> int:
    added = 0
    with get_conn() as c:
        existing = {
            (r["title"], r["event_date"])
            for r in c.execute("SELECT title, event_date FROM events")
        }
        for e in rows:
            key = (e["title"], e["date"])
            if key in existing:
                continue
            c.execute(
                """INSERT INTO events (ticker, title, event_date, category, notes, source, created_at)
                   VALUES (?,?,?,?,?,?,?)""",
                (e.get("ticker"), e["title"], e["date"], e.get("category", "macro"),
                 e.get("notes"), source, now_iso()),
            )
            existing.add(key)
            added += 1
    return added


@app.post("/api/events/sync")
def sync_events():
    """Free auto-sync run on every Calendar open: pull watchlist earnings dates +
    seed non-farm payrolls. Reports whether the Claude macro pull is stale."""
    earnings = refresh_earnings_events()
    nfp = seed_nonfarm_payrolls()
    return {
        "earnings_updated": earnings["updated"],
        "nfp_added": nfp["added"],
        "macro_stale": _macro_stale(),
        "macro_synced_at": get_meta("macro_synced_at"),
    }


@app.post("/api/events/macro-claude")
def macro_via_claude():
    """Use Claude (with web search) to pull the upcoming US macro calendar
    (CPI, PPI, PCE, NFP, FOMC, GDP, …) grounded in official sources."""
    try:
        events = analysis.fetch_macro_events(lang=_get_lang())
    except analysis.AnalysisError as e:
        raise HTTPException(400, str(e))
    # replace the previous Claude-fetched macro set, then insert fresh
    with get_conn() as c:
        c.execute("DELETE FROM events WHERE source = 'claude-macro'")
    added = _insert_events(events, source="claude-macro")
    set_meta("macro_synced_at", now_iso())
    return {"added": added}


@app.post("/api/events/search")
def search_events_endpoint(s: SearchIn):
    """Use Claude (web search) to find upcoming events affecting a topic/ticker."""
    if not s.query.strip():
        raise HTTPException(400, "Empty query.")
    try:
        events = analysis.search_events(s.query.strip(), lang=_get_lang())
    except analysis.AnalysisError as e:
        raise HTTPException(400, str(e))
    added = _insert_events(events, source="claude-search")
    return {"added": added, "found": len(events)}


@app.post("/api/events/refresh")
def refresh_earnings_events():
    """Pull the next earnings date for each watchlist ticker into the calendar.
    Replaces previously auto-added earnings events so dates stay current."""
    added = 0
    with get_conn() as c:
        tickers = [r["ticker"] for r in c.execute("SELECT ticker FROM watchlist")]
        for tk in tickers:
            date = market.get_next_earnings_date(tk)
            if not date:
                continue
            c.execute(
                "DELETE FROM events WHERE ticker = ? AND category = 'earnings' AND source = 'auto'",
                (tk,),
            )
            c.execute(
                """INSERT INTO events (ticker, title, event_date, category, notes, source, created_at)
                   VALUES (?,?,?,?,?,?,?)""",
                (tk, f"{tk} earnings", str(date), "earnings", None, "auto", now_iso()),
            )
            added += 1
    return {"updated": added}


# ---------- analysis ----------
@app.post("/api/analyze/{ticker}")
def analyze(ticker: str):
    tk = ticker.upper()
    snapshot = market.get_snapshot(tk)
    with get_conn() as c:
        trades = [dict(r) for r in c.execute(
            "SELECT action, quantity, price, trade_date, thesis, confidence FROM trades WHERE ticker = ? ORDER BY trade_date",
            (tk,),
        )]
        events = [dict(r) for r in c.execute(
            "SELECT title, event_date, category FROM events WHERE ticker = ? ORDER BY event_date",
            (tk,),
        )]
    try:
        result = analysis.run_analysis(tk, snapshot, trades, events, lang=_get_lang())
    except analysis.AnalysisError as e:
        raise HTTPException(400, str(e))

    with get_conn() as c:
        c.execute(
            "INSERT INTO analyses (ticker, rating, summary, raw_json, created_at) VALUES (?,?,?,?,?)",
            (tk, result.get("rating"), result.get("summary"),
             json.dumps(result, ensure_ascii=False), now_iso()),
        )
    return {"ticker": tk, "snapshot": snapshot, "analysis": result}


@app.post("/api/earnings-analysis/{ticker}")
def earnings_analysis(ticker: str):
    tk = ticker.upper()
    earnings = market.get_earnings(tk)
    overview = market.get_overview(tk)
    financials = market.get_financials(tk)
    news = market.get_news(tk, 8)
    try:
        result = analysis.run_earnings_analysis(tk, earnings, overview, news, financials, lang=_get_lang())
    except analysis.AnalysisError as e:
        raise HTTPException(400, str(e))
    return {"ticker": tk, "earnings": earnings, "overview": overview,
            "financials": financials, "analysis": result}


@app.get("/api/analyze-stream/{ticker}")
def analyze_stream(ticker: str, kind: str = "desk"):
    """Stream the analysis with live reasoning. kind = desk | earnings."""
    tk = ticker.upper()
    lang = _get_lang()

    def gen():
        yield _sse({"type": "status", "text": "gathering"})
        try:
            if kind == "earnings":
                earnings = market.get_earnings(tk)
                overview = market.get_overview(tk)
                financials = market.get_financials(tk)
                news = market.get_news(tk, 8)
                yield _sse({"type": "data", "kind": "earnings", "ticker": tk,
                            "earnings": earnings, "overview": overview, "financials": financials})
                stream = analysis.stream_earnings(tk, earnings, overview, news, financials, lang)
            else:
                snapshot = market.get_snapshot(tk)
                with get_conn() as c:
                    trades = [dict(r) for r in c.execute(
                        "SELECT action, quantity, price, trade_date, thesis, confidence FROM trades WHERE ticker = ? ORDER BY trade_date", (tk,))]
                    evs = [dict(r) for r in c.execute(
                        "SELECT title, event_date, category FROM events WHERE ticker = ? ORDER BY event_date", (tk,))]
                yield _sse({"type": "data", "kind": "desk", "ticker": tk, "snapshot": snapshot})
                stream = analysis.stream_desk(tk, snapshot, trades, evs, lang)

            result_data = None
            for ev in stream:
                if ev.get("type") == "result":
                    result_data = ev["data"]
                yield _sse(ev)

            if kind != "earnings" and result_data:
                try:
                    with get_conn() as c:
                        c.execute(
                            "INSERT INTO analyses (ticker, rating, summary, raw_json, created_at) VALUES (?,?,?,?,?)",
                            (tk, result_data.get("rating"), result_data.get("summary"),
                             json.dumps(result_data, ensure_ascii=False), now_iso()))
                except Exception:
                    pass
        except Exception as e:  # noqa: BLE001 — surface any failure to the stream
            yield _sse({"type": "error", "text": str(e)})
        yield _sse({"type": "done"})

    return StreamingResponse(gen(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@app.post("/api/chat-stream")
def chat_stream(c: ChatIn):
    """Follow-up Q&A about an analysis result, streamed and grounded in context."""
    lang = _get_lang()

    def gen():
        try:
            for ev in analysis.stream_chat(c.context, c.history, c.message, lang):
                yield _sse(ev)
        except Exception as e:  # noqa: BLE001
            yield _sse({"type": "error", "text": str(e)})
        yield _sse({"type": "done"})

    return StreamingResponse(gen(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@app.get("/api/analyses/{ticker}")
def past_analyses(ticker: str):
    with get_conn() as c:
        rows = c.execute(
            "SELECT id, rating, summary, created_at FROM analyses WHERE ticker = ? ORDER BY id DESC LIMIT 10",
            (ticker.upper(),),
        ).fetchall()
    return [dict(r) for r in rows]


# ---------- static frontend ----------
app.mount("/static", StaticFiles(directory=WEB_DIR), name="static")


@app.get("/")
def index():
    return FileResponse(WEB_DIR / "index.html")
