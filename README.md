# TradeCopilot

A personal trading **copilot**: log your Robinhood trade decisions (with the
*why*), track your watchlist's latest earnings, keep a calendar of upcoming
events, and run a multi-perspective Claude analysis on any stock — grounded in
your own trade history.

Inspired by [TradingAgents](https://github.com/TauricResearch/TradingAgents),
but stripped down to what's actually useful for an individual: **record + remind
+ analyze**, no auto-trading.

## What it does

| Tab | What it's for |
|-----|---------------|
| **总览 Dashboard** | Positions with avg cost + unrealized/realized P&L, plus events in the next 30 days |
| **交易记录 Journal** | Log every trade with your thesis, confidence (1–5), emotion. On buy, it shows the stock's next earnings date + market expectations (analyst rating, target, EPS estimate). CSV import. |
| **复盘 Review** | For each trade: return since entry, and an AI retrospective (Chinese) comparing your original thesis to what actually happened — scores decision quality, flags emotional bias, gives a lesson |
| **自选股 Watchlist** | Live prices + intraday (分时) sparkline + one-click analyze |
| **日历事件 Calendar** | Auto-syncs earnings dates + NFP on open; pulls real US macro events (CPI/NFP/FOMC/PCE/GDP) via Claude web search, each with 市场预期 / 我的预测 / 情景影响 (Chinese); free-text event search |
| **AI 分析 Analyze** | 综合分析 (bull/bear/risk/rating) and 财报分析 (earnings deep-dive), grounded in live data + your trades. Output in Chinese. |

Market data comes from **Yahoo Finance (free)**. The LLM analysis uses **your
Claude Code subscription** by default (via the local `claude` CLI) — no API key
and no per-token API billing. Everything else works with no Claude at all.

## Setup

```powershell
cd D:\TradeCopilot
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env      # optional: add ANTHROPIC_API_KEY for the Analyze tab
```

## Run

```powershell
uvicorn app.main:app --reload
```

Then open http://127.0.0.1:8000

## About Robinhood

There is **no safe official Robinhood API for trading**, so this app does not
connect to your account or place orders. Two supported ways to get your trades in:

1. **Manual entry** — the Journal form (recommended; captures your *thesis*,
   which is the whole point of a journal).
2. **CSV import** — Journal → Import CSV. Accepts columns named (case-insensitive):
   `ticker`/`symbol`, `action`/`side`, `quantity`/`shares`, `price`, `date`.
   Export a statement from Robinhood (or any broker), map the columns, import.

## How the analysis uses your subscription (no API key)

The **Analyze** tab shells out to your local `claude` CLI in headless mode
(`claude -p --output-format json`), which authenticates with your Claude Code
**subscription** login. That means analysis draws from your subscription quota,
not a metered API key. Requirements: `claude` is installed and you've run it once
to log in. Prefer an API key instead? Set `ANALYSIS_PROVIDER=api` and
`ANTHROPIC_API_KEY` in `.env`.

## Cost

The journal, earnings, and calendar features are 100% free (Yahoo data only).
The Analyze tab uses your Claude subscription by default — no extra dollar cost
beyond your existing subscription.

## Not financial advice

This is a research and journaling tool. The analysis is LLM-generated and can be
wrong. Make your own decisions.
