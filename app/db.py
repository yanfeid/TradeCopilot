"""SQLite storage for trades, watchlist, calendar events, and saved analyses.

A new connection is opened per call. SQLite handles this fine for a single-user
local app, and it keeps the code free of connection-lifecycle plumbing.
"""

import sqlite3
from datetime import datetime, timezone
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "tradecopilot.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS trades (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker      TEXT    NOT NULL,
    action      TEXT    NOT NULL,            -- BUY / SELL
    quantity    REAL    NOT NULL,
    price       REAL    NOT NULL,
    trade_date  TEXT    NOT NULL,            -- ISO date
    thesis      TEXT,                        -- why I made this decision
    confidence  INTEGER,                     -- 1..5
    emotion     TEXT,                        -- e.g. calm / FOMO / fearful
    tags        TEXT,
    created_at  TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS watchlist (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker    TEXT    NOT NULL UNIQUE,
    note      TEXT,
    added_at  TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker      TEXT,                         -- null for macro / market-wide
    title       TEXT    NOT NULL,
    event_date  TEXT    NOT NULL,             -- ISO date
    category    TEXT    NOT NULL,             -- earnings / macro / custom
    notes       TEXT,
    source      TEXT    NOT NULL,             -- manual / auto
    created_at  TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS analyses (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker      TEXT    NOT NULL,
    rating      TEXT,
    summary     TEXT,
    raw_json    TEXT,
    created_at  TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS meta (
    key    TEXT PRIMARY KEY,
    value  TEXT
);
"""


def get_conn() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with get_conn() as conn:
        conn.executescript(SCHEMA)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def get_meta(key: str) -> str | None:
    with get_conn() as conn:
        row = conn.execute("SELECT value FROM meta WHERE key = ?", (key,)).fetchone()
    return row["value"] if row else None


def set_meta(key: str, value: str) -> None:
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO meta (key, value) VALUES (?, ?) "
            "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            (key, value),
        )
