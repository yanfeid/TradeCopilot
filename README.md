# TradeCopilot

A personal, **local-only** trading copilot: log your trade decisions (with the
*why*), track positions and P&L, watch live prices, keep an earnings & macro
calendar, browse hot stocks by theme, and run **Claude-powered analysis** — all
on your own machine. Inspired by
[TradingAgents](https://github.com/TauricResearch/TradingAgents), but stripped to
what's useful for one person: **record · remind · analyze** (no auto-trading).

> Research tool, **not financial advice**. It never connects to a broker or
> places orders.

---

## Features

| Tab | What it does |
|-----|--------------|
| **Dashboard** | Positions with average cost + unrealized/realized P&L, and events in the next 30 days |
| **Journal** | Log trades with thesis, confidence, emotion. On buy, shows the stock's next earnings date + market expectations. CSV import. |
| **Review** | Return since entry per trade + an AI retrospective comparing your thesis to what actually happened (scores decision quality, flags emotional bias, gives a lesson) |
| **Watchlist** | Live prices, intraday sparkline, and **hot stocks by theme** (curated, or refreshed to the current hottest via Claude web search) |
| **Calendar** | Auto-syncs earnings dates + NFP; pulls real macro events (CPI/NFP/FOMC/PCE/GDP) via Claude web search, each with consensus / forecast / scenario impact; free-text event search |
| **Analyze** | Full multi-perspective analysis and earnings deep-dive, **streaming the reasoning live** as Claude thinks |
| **Settings** | Switch language between 中文 / English (UI **and** AI output) |

Market data is from **Yahoo Finance** (free). The AI features use **your Claude
subscription** by default (details below) — no API key required.

---

## Prerequisites

1. **Python 3.13** (3.11+ should also work) — <https://www.python.org/downloads/>
2. For the AI features (Analyze, Review, Claude calendar/themes refresh): the
   **Claude Code CLI**, logged in with your Claude subscription. See *The Claude
   part* below. (The Journal, Watchlist, prices, earnings dates, and NFP work
   with **no** Claude at all.)

---

## Setup

```bash
git clone https://github.com/yanfeid/TradeCopilot.git
cd TradeCopilot

python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate

pip install -r requirements.txt
```

## Run

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Open <http://127.0.0.1:8000>.

On Windows you can also double-click **`TradeCopilot.bat`** (or the desktop
shortcut) — it starts the server and opens your browser automatically.

---

## The Claude part (how the AI features work)

TradeCopilot does **not** need an Anthropic API key. By default it shells out to
the local **`claude` CLI** in headless mode, which authenticates with your
**Claude Code subscription** login. So the analysis draws from your subscription
usage — no separate per-token billing.

**To enable it:**

1. Install Claude Code: <https://docs.claude.com/en/docs/claude-code/overview>
2. Run `claude` once in a terminal and log in with your Claude account.
3. Verify it works headlessly:
   ```bash
   echo "say hi" | claude -p
   ```
   If that prints a reply, TradeCopilot's AI features will work. (Restart the
   TradeCopilot server after logging in so it picks up the CLI.)

The app looks for `claude` on your PATH (and, on Windows, at
`~/.local/bin/claude.exe`). For analysis it streams the model's reasoning live;
for the calendar/themes refresh it lets Claude use web search to find real,
dated events from official sources.

### Prefer an API key instead?

Copy `.env.example` to `.env` and set:

```
ANALYSIS_PROVIDER=api
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-opus-4-8   # optional
```

With `ANALYSIS_PROVIDER=claude_cli` (the default) the API key is ignored and
your subscription is used.

---

## Language

Go to **Settings** and switch between 中文 / English. It changes the interface
and the language Claude writes its analysis and calendar notes in. The choice is
saved locally.

---

## Data & privacy

Everything is **local**. Your trades, watchlist, events, and saved analyses live
in `data/tradecopilot.db` (SQLite) on your machine — nothing is uploaded. That
file (and `.venv`, `.env`) is git-ignored, so your personal data is never
committed. Back up by copying that one file; start fresh by deleting it.

---

## Cost

The Journal, Watchlist, prices, intraday, positions/P&L, earnings dates, NFP, and
the default theme lists cost **nothing** (Yahoo data only). Only these use your
Claude subscription: full analysis, earnings analysis, trade review, the
calendar "refresh macro via Claude", event search, and the themes "refresh
hottest". Each is a modest request; the web-search ones (macro/themes refresh)
are the heaviest (a short research task). Routine use is light.

---

## Disclaimer

This is a research and journaling tool. AI output can be wrong. It is not
financial advice. Make your own decisions.
