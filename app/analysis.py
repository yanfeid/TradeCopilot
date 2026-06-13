"""Claude-powered analysis — defaults to your Claude *subscription* via the CLI.

Providers (non-web-search calls):
  - "claude_cli" (default): shells out to the local `claude` CLI (headless).
    Uses your Claude Code subscription login — no API key, no per-token billing.
  - "api": uses the Anthropic SDK + ANTHROPIC_API_KEY.

Web-search features (macro calendar, event search, hot stocks) always use the CLI.
Analysis can stream the model's reasoning live (stream-json). Output language
(zh/en) follows the app setting. Research, not financial advice.
"""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
from datetime import date
from typing import Any, Iterator

PROVIDER = os.getenv("ANALYSIS_PROVIDER", "claude_cli")
CLI_MODEL = os.getenv("CLAUDE_MODEL")
API_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-opus-4-8")


class AnalysisError(Exception):
    pass


def _lang_directive(lang: str) -> str:
    if lang == "en":
        return " Write all JSON field VALUES in English. Keep keys and enum tokens (Buy/Hold/Sell etc.) in English."
    return " 所有 JSON 字段的值用简体中文书写;键名(key)与评级枚举词(如 Buy/Hold/Sell)保持英文。"


SENTINEL = "===RESULT==="


def _stream_suffix(lang: str) -> str:
    """Ask the model to first write readable reasoning (which we stream live),
    then a sentinel line, then ONLY the JSON object."""
    if lang == "en":
        return (f"\n\nIMPORTANT: First write your reasoning in English as a few short "
                f"labeled parts the reader can follow (e.g. Bull view, Bear view, Key risks). "
                f"Then output a line containing exactly {SENTINEL} and after it output ONLY "
                f"the JSON object described above — no code fences, nothing else.")
    return (f"\n\n重要:请先用简体中文写出你的分析推理过程,分几个简短小节(如 看多观点、"
            f"看空观点、主要风险),让用户能边读边跟。然后另起一行输出恰好 {SENTINEL} ,"
            f"其后只输出上面要求的那个 JSON 对象——不要代码块标记,不要任何其他内容。")


# ===================== systems & schemas (language-neutral) =====================
DESK_SYSTEM = (
    "You are a multi-perspective equity research desk (bull researcher, bear "
    "researcher, risk manager, portfolio manager) modeled on TradingAgents. "
    "Ground every claim in the data provided; do not invent figures. Comment on "
    "the user's own trades and theses. Research, not financial advice. "
    "Respond with ONLY a single valid JSON object."
)
DESK_SCHEMA = """Return JSON exactly (rating token stays English):
{
  "rating": "Buy"|"Overweight"|"Hold"|"Underweight"|"Sell",
  "summary": "2-3 sentence synthesis",
  "bull_case": ["point", ...],
  "bear_case": ["point", ...],
  "key_risks": ["point", ...],
  "upcoming_catalysts": ["dated/near-term events", ...],
  "notes_on_my_trades": "comment on the user's positions/theses, or null"
}"""

EARNINGS_SYSTEM = (
    "You are an earnings analyst. Analyze a company's reported earnings: "
    "beats/misses, EPS and revenue trends, margin quality, and guidance. Ground "
    "claims in the data provided; do not invent figures. Research, not advice. "
    "Respond with ONLY a single valid JSON object."
)
EARNINGS_SCHEMA = """Return JSON exactly (verdict token stays English):
{
  "verdict": "Strong beat"|"Beat"|"In line"|"Miss"|"Weak",
  "summary": "2-3 sentence read on the latest quarter",
  "eps_trend": "how EPS and surprises have trended",
  "revenue_trend": "revenue growth trajectory",
  "margins_and_quality": "margins / quality of earnings",
  "guidance_notes": "forward guidance signal, or null",
  "what_to_watch_next": ["point", ...]
}"""

REVIEW_SYSTEM = (
    "You are a trade-review coach. Using the user's recorded thesis, confidence "
    "and emotion, plus the stock's actual performance since entry, objectively "
    "assess the DECISION QUALITY (independent of final P&L). Note where the thesis "
    "held vs missed, flag emotional bias (FOMO/panic), give one actionable lesson. "
    "Research, not advice. Respond with ONLY a single valid JSON object."
)
REVIEW_SCHEMA = """Return JSON (score is an integer 1-5):
{
  "verdict": "one-line conclusion on whether the original thesis held",
  "score": 3,
  "thesis_held": "how much of the thesis actually played out",
  "what_went_right": ["point", ...],
  "what_went_wrong": ["point", ...],
  "emotional_read": "assessment of emotional bias",
  "lesson": "one actionable lesson"
}"""

CALENDAR_SYSTEM = (
    "You are a financial-calendar assistant. Use web search to find REAL, "
    "scheduled future dates from authoritative sources (BLS, Federal Reserve, "
    "BEA, company IR). Never guess a date — omit anything you cannot confirm. "
    "Respond with ONLY a single valid JSON object."
)


# ===================== prompt builders =====================
def build_desk(ticker, snapshot, trades, events) -> tuple[str, str]:
    payload = {"ticker": ticker.upper(), "market_data": snapshot,
               "my_trades_on_this_ticker": trades, "tracked_events": events}
    prompt = (f"Analyze {ticker.upper()} as a research desk.\n\n"
              f"Context JSON:\n```json\n{_dump(payload)}\n```\n\n{DESK_SCHEMA}")
    return DESK_SYSTEM, prompt


def build_earnings(ticker, earnings, overview, news, financials) -> tuple[str, str]:
    payload = {"ticker": ticker.upper(), "earnings": earnings,
               "financials": financials, "fundamentals": overview, "recent_news": news}
    prompt = (f"Analyze the earnings of {ticker.upper()}.\n\n"
              f"Context JSON:\n```json\n{_dump(payload)}\n```\n\n{EARNINGS_SCHEMA}")
    return EARNINGS_SYSTEM, prompt


def build_review(trade, performance, news) -> tuple[str, str]:
    payload = {"my_trade": trade, "performance_since_entry": performance, "recent_news": news}
    prompt = (f"Review this trade.\n\nContext JSON:\n```json\n{_dump(payload)}\n```\n\n{REVIEW_SCHEMA}")
    return REVIEW_SYSTEM, prompt


# ===================== non-streaming public API =====================
def run_analysis(ticker, snapshot, trades, events, lang="zh") -> dict[str, Any]:
    system, prompt = build_desk(ticker, snapshot, trades, events)
    return _generate(prompt, system, lang)


def run_earnings_analysis(ticker, earnings, overview, news, financials=None, lang="zh") -> dict[str, Any]:
    system, prompt = build_earnings(ticker, earnings, overview, news, financials)
    return _generate(prompt, system, lang)


def run_trade_review(trade, performance, news, lang="zh") -> dict[str, Any]:
    system, prompt = build_review(trade, performance, news)
    return _generate(prompt, system, lang)


# ===================== streaming public API =====================
def stream_desk(ticker, snapshot, trades, events, lang="zh") -> Iterator[dict]:
    system, prompt = build_desk(ticker, snapshot, trades, events)
    yield from _stream(prompt + _stream_suffix(lang), system, lang)


def stream_earnings(ticker, earnings, overview, news, financials, lang="zh") -> Iterator[dict]:
    system, prompt = build_earnings(ticker, earnings, overview, news, financials)
    yield from _stream(prompt + _stream_suffix(lang), system, lang)


def stream_review(trade, performance, news, lang="zh") -> Iterator[dict]:
    system, prompt = build_review(trade, performance, news)
    yield from _stream(prompt + _stream_suffix(lang), system, lang)


# ===================== web-search features =====================
def fetch_macro_events(days: int = 75, lang: str = "zh") -> list[dict[str, Any]]:
    today = date.today().isoformat()
    if lang == "en":
        notes_spec = ("For EACH event also write an English 'notes' field with three labeled lines:\n"
                      "Consensus: (the market's expected number)\n"
                      "My forecast: (your lean and why)\n"
                      "Scenarios: (if above expectations -> ...; if below -> ... impact on the S&P/tech growth/rates/USD)\n")
        title_hint, notes_hint = "English title", "Consensus: ...\\nMy forecast: ...\\nScenarios: ..."
    else:
        notes_spec = ("For EACH event also write a Chinese 'notes' field with three labeled lines:\n"
                      "市场预期:(共识预测值)\n我的预测:(你的倾向判断与理由)\n"
                      "情景影响:(若高于预期→…;若低于预期→… 对美股大盘/科技成长股/利率/美元的影响)\n")
        title_hint, notes_hint = "中文标题", "市场预期:…\\n我的预测:…\\n情景影响:…"
    prompt = (
        f"Today is {today}. Use web search to find upcoming US market-moving macro "
        f"releases in the next {days} days: CPI, PPI, PCE, Non-farm payrolls (NFP), "
        f"FOMC meeting / rate decision, GDP, retail sales, ISM PMI. Confirm exact "
        f"dates from BLS / Federal Reserve / BEA.\n{notes_spec}"
        f'Return JSON: {{"events":[{{"title":"{title_hint}","date":"YYYY-MM-DD",'
        f'"category":"macro","notes":"{notes_hint}"}}]}}. Only confirmed future dates.'
    )
    obj = _claude_cli_json(prompt, CALENDAR_SYSTEM, allowed_tools=["WebSearch", "WebFetch"], timeout=420)
    return _clean_events(obj.get("events", []), "macro")


def search_events(query: str, days: int = 120, lang: str = "zh") -> list[dict[str, Any]]:
    today = date.today().isoformat()
    note_lang = "English" if lang == "en" else "Chinese"
    prompt = (
        f"Today is {today}. The user wants upcoming events that could affect: "
        f"\"{query}\". Use web search to find scheduled, dated future events in the "
        f"next {days} days (earnings, product launches, regulatory/court decisions, "
        f"conferences, economic releases, index rebalances) relevant to that query. "
        f"For each event write a short {note_lang} 'notes' explaining its likely "
        f"impact on the relevant stock(s). "
        f'Return JSON: {{"events":[{{"title":"...","date":"YYYY-MM-DD",'
        f'"ticker":"optional","category":"news","notes":"..."}}]}}. Only confirmed future dates.'
    )
    obj = _claude_cli_json(prompt, CALENDAR_SYSTEM, allowed_tools=["WebSearch", "WebFetch"], timeout=420)
    return _clean_events(obj.get("events", []), "news")


def fetch_hot_stocks(themes: list[dict[str, Any]]) -> list[dict[str, Any]]:
    today = date.today().isoformat()
    lines = "\n".join(f"- key={t['key']}, name={t['name']}" for t in themes)
    prompt = (
        f"今天是 {today}。请用网络搜索,为下列每个主题板块各列出约 10 个当下讨论度/"
        f"热度最高、且流动性好的美股代码(或美股 ADR;加密货币用 Yahoo 形式如 "
        f"BTC-USD)。代码必须是 Yahoo Finance 可识别的。\n板块(请沿用给定的 key 和 "
        f"name):\n{lines}\n"
        f'返回 JSON:{{"themes":[{{"key":"semis","name":"半导体","tickers":["NVDA"]}}]}}。'
    )
    obj = _claude_cli_json(prompt, CALENDAR_SYSTEM, allowed_tools=["WebSearch", "WebFetch"], timeout=600)
    out = []
    for t in obj.get("themes", []):
        tickers = [str(x).upper().strip() for x in (t.get("tickers") or [])
                   if x and re.match(r"^[A-Z0-9.\-]{1,12}$", str(x).upper().strip())]
        if t.get("name") and tickers:
            out.append({"key": str(t.get("key") or t["name"])[:24],
                        "name": str(t["name"])[:24], "tickers": tickers[:12]})
    return out


# ===================== providers =====================
def _generate(prompt: str, system: str, lang: str) -> dict[str, Any]:
    full = system + _lang_directive(lang)
    if PROVIDER == "api":
        return _run_api(prompt, full)
    return _run_claude_cli(prompt, full)


def _stream(prompt: str, system: str, lang: str, allowed_tools=None) -> Iterator[dict]:
    full = system + _lang_directive(lang)
    if PROVIDER == "api":
        try:
            yield {"type": "result", "data": _run_api(prompt, full)}
        except AnalysisError as e:
            yield {"type": "error", "text": str(e)}
        return
    yield from _stream_cli(prompt, full, allowed_tools)


def _find_claude() -> str:
    for c in (os.path.expanduser(r"~\.local\bin\claude.exe"),
              os.path.expanduser("~/.local/bin/claude.exe"),
              os.path.expanduser("~/.local/bin/claude")):
        if os.path.isfile(c):
            return c
    found = shutil.which("claude")
    if found:
        return found
    raise AnalysisError(
        "Could not find the 'claude' CLI. Install Claude Code, run `claude` once "
        "to log in, then restart the server. (Or set ANALYSIS_PROVIDER=api.)"
    )


def _cli_cmd(system, stream, allowed_tools):
    exe = _find_claude()
    fmt = "stream-json" if stream else "json"
    cmd = [exe, "-p", "--output-format", fmt, "--system-prompt", system]
    if stream:
        cmd += ["--include-partial-messages", "--verbose"]
    if CLI_MODEL:
        cmd += ["--model", CLI_MODEL]
    if allowed_tools:
        cmd += ["--allowed-tools", *allowed_tools]
    if exe.lower().endswith((".cmd", ".bat")):
        cmd = ["cmd", "/c", *cmd]
    return cmd


def _claude_cli_json(prompt, system, allowed_tools=None, timeout=300) -> dict[str, Any]:
    cmd = _cli_cmd(system, stream=False, allowed_tools=allowed_tools)
    try:
        proc = subprocess.run(cmd, input=prompt, capture_output=True, text=True,
                              encoding="utf-8", errors="replace", timeout=timeout)
    except FileNotFoundError as e:
        raise AnalysisError("Could not run the 'claude' CLI.") from e
    except subprocess.TimeoutExpired as e:
        raise AnalysisError("Claude CLI timed out.") from e
    if proc.returncode != 0:
        raise AnalysisError(f"Claude CLI failed (exit {proc.returncode}): "
                            f"{(proc.stderr or proc.stdout or '').strip()[:400]}")
    envelope = _extract_json(proc.stdout)
    if not envelope:
        raise AnalysisError("Unexpected output from Claude CLI.")
    if envelope.get("is_error"):
        raise AnalysisError(f"Claude CLI error: {envelope.get('result')}")
    data = _extract_json(envelope.get("result", ""))
    if data is None:
        raise AnalysisError("Could not parse JSON from the model output.")
    return data


def _run_claude_cli(prompt, system) -> dict[str, Any]:
    data = _claude_cli_json(prompt, system)
    data["_model"] = "Claude subscription (CLI)"
    return data


def _stream_cli(prompt, system, allowed_tools=None) -> Iterator[dict]:
    cmd = _cli_cmd(system, stream=True, allowed_tools=allowed_tools)
    try:
        proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                stderr=subprocess.DEVNULL, text=True,
                                encoding="utf-8", errors="replace", bufsize=1)
    except FileNotFoundError:
        yield {"type": "error", "text": "Could not run the 'claude' CLI."}
        return
    try:
        proc.stdin.write(prompt)
        proc.stdin.close()
    except (BrokenPipeError, OSError):
        pass

    buf, emitted, got = [], 0, False

    def parse_final():
        full = "".join(buf)
        jtext = full.split(SENTINEL, 1)[1] if SENTINEL in full else full
        return _extract_json(jtext)

    for line in proc.stdout:
        line = line.strip()
        if not line:
            continue
        try:
            obj = json.loads(line)
        except json.JSONDecodeError:
            continue
        typ = obj.get("type")
        if typ == "stream_event":
            ev = obj.get("event", {}) or {}
            et = ev.get("type")
            if et == "content_block_start":
                cb = ev.get("content_block", {}) or {}
                if cb.get("type") in ("tool_use", "server_tool_use"):
                    yield {"type": "step", "text": cb.get("name", "tool")}
            elif et == "content_block_delta":
                d = ev.get("delta", {}) or {}
                dt = d.get("type")
                if dt == "thinking_delta" and d.get("thinking"):
                    yield {"type": "reasoning", "text": d["thinking"]}
                elif dt == "text_delta":
                    buf.append(d.get("text", ""))
                    full = "".join(buf)
                    # stream the readable part before the sentinel; hold back a
                    # tail the length of the sentinel so a partial one never leaks
                    target = len(full.split(SENTINEL, 1)[0]) if SENTINEL in full \
                        else max(0, len(full) - len(SENTINEL))
                    if target > emitted:
                        yield {"type": "reasoning", "text": full[emitted:target]}
                        emitted = target
        elif typ == "result":
            got = True
            if not "".join(buf):
                buf.append(obj.get("result") or "")
            data = parse_final()
            if data is None:
                yield {"type": "error", "text": "Could not parse the analysis result."}
            else:
                data["_model"] = "Claude subscription (CLI)"
                yield {"type": "result", "data": data}
    proc.wait()
    if not got:
        data = parse_final()
        if data is not None:
            data["_model"] = "Claude subscription (CLI)"
            yield {"type": "result", "data": data}
        else:
            yield {"type": "error", "text": "No result from the model."}


def _run_api(prompt, system) -> dict[str, Any]:
    if not os.getenv("ANTHROPIC_API_KEY"):
        raise AnalysisError("ANALYSIS_PROVIDER=api but no ANTHROPIC_API_KEY is set.")
    try:
        import anthropic
    except ImportError as e:
        raise AnalysisError("The 'anthropic' package is not installed.") from e
    client = anthropic.Anthropic()
    base = dict(model=API_MODEL, max_tokens=8000, system=system,
                messages=[{"role": "user", "content": prompt}])
    try:
        resp = client.messages.create(**base, thinking={"type": "adaptive"},
                                      output_config={"effort": "medium"})
    except anthropic.BadRequestError:
        resp = client.messages.create(**base)
    except anthropic.APIStatusError as e:
        raise AnalysisError(f"Claude API error: {e.message}") from e
    text = "".join(b.text for b in resp.content if b.type == "text")
    data = _extract_json(text)
    if data is None:
        raise AnalysisError("Could not parse a JSON analysis from the model.")
    data["_model"] = resp.model
    return data


# ===================== helpers =====================
def _dump(obj) -> str:
    return json.dumps(obj, ensure_ascii=False, indent=2, default=str)


def _clean_events(events, default_cat) -> list[dict[str, Any]]:
    out = []
    for e in events or []:
        title, d = e.get("title"), e.get("date")
        if not (title and d and re.match(r"^\d{4}-\d{2}-\d{2}$", str(d))):
            continue
        notes = e.get("notes")
        out.append({
            "title": str(title)[:120],
            "date": str(d),
            "ticker": (e.get("ticker") or None),
            "category": e.get("category") or default_cat,
            "notes": str(notes)[:1200] if notes else None,
        })
    return out


def _extract_json(text: str) -> dict | None:
    if not text:
        return None
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            return None
    return None
