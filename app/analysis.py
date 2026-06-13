"""Claude-powered analysis — defaults to your Claude *subscription* via the CLI.

Providers (for the non-web-search calls):
  - "claude_cli" (default): shells out to the local `claude` CLI (headless print
    mode). Uses your Claude Code subscription login — no API key, no per-token
    API billing.
  - "api": uses the Anthropic SDK + ANTHROPIC_API_KEY.

The web-search features (macro calendar, event search) always use the CLI,
because they rely on Claude's built-in web search grounded in real sources.

All of this is decision support, not financial advice.
"""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
from datetime import date
from typing import Any

PROVIDER = os.getenv("ANALYSIS_PROVIDER", "claude_cli")
CLI_MODEL = os.getenv("CLAUDE_MODEL")
API_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-opus-4-8")


class AnalysisError(Exception):
    pass


# ===================== prompts =====================
# All JSON *values* must be Simplified Chinese; keys and enum tokens stay English
# (the frontend maps them to CSS classes / labels).
ZH = ("所有 JSON 字段的值都用简体中文书写;但键名(key)和评级枚举词"
      "(如 Buy/Hold/Sell、Strong beat/Beat 等)保持英文原样。")

DESK_SYSTEM = (
    "You are a multi-perspective equity research desk (bull researcher, bear "
    "researcher, risk manager, portfolio manager) modeled on TradingAgents. "
    "Ground every claim in the data provided; do not invent figures. Comment on "
    "the user's own trades and theses. Research, not financial advice. "
    "Respond with ONLY a single valid JSON object. " + ZH
)
DESK_SCHEMA = """Return JSON exactly (values in Chinese, rating token stays English):
{
  "rating": "Buy"|"Overweight"|"Hold"|"Underweight"|"Sell",
  "summary": "2-3 句综合判断(中文)",
  "bull_case": ["看多要点(中文)", ...],
  "bear_case": ["看空要点(中文)", ...],
  "key_risks": ["主要风险(中文)", ...],
  "upcoming_catalysts": ["近期催化剂/事件(中文)", ...],
  "notes_on_my_trades": "对用户持仓/理由的点评(中文),没有则 null"
}"""

EARNINGS_SYSTEM = (
    "You are an earnings analyst. Analyze a company's reported earnings: "
    "beats/misses, EPS and revenue trends, margin quality, and guidance. Ground "
    "claims in the data provided; do not invent figures. Research, not advice. "
    "Respond with ONLY a single valid JSON object. " + ZH
)
EARNINGS_SCHEMA = """Return JSON exactly (values in Chinese, verdict token stays English):
{
  "verdict": "Strong beat"|"Beat"|"In line"|"Miss"|"Weak",
  "summary": "对最新一季的 2-3 句解读(中文)",
  "eps_trend": "EPS 与超预期的趋势(中文)",
  "revenue_trend": "营收增长轨迹(中文)",
  "margins_and_quality": "利润率/盈利质量(中文)",
  "guidance_notes": "前瞻指引信号(中文),未知则 null",
  "what_to_watch_next": ["下季度关注点(中文)", ...]
}"""

REVIEW_SYSTEM = (
    "你是一名交易复盘教练。基于用户当时记录的交易理由(thesis)、信心、情绪,"
    "以及该股之后的实际表现,客观评估这笔交易的决策质量(与最终盈亏没有必然关系)。"
    "指出判断中兑现与偏差之处,识别 FOMO/恐慌等情绪化迹象,给出一条可执行的教训。"
    "仅供研究,非投资建议。只输出一个 JSON 对象。" + ZH
)
REVIEW_SCHEMA = """返回 JSON(值用中文,score 为整数):
{
  "verdict": "当初论点是否成立的一句话结论",
  "score": 1到5的整数(决策质量),
  "thesis_held": "当初理由兑现了多少",
  "what_went_right": ["做对的点", ...],
  "what_went_wrong": ["偏差或失误", ...],
  "emotional_read": "情绪化迹象评估",
  "lesson": "一条可执行的教训"
}"""

CALENDAR_SYSTEM = (
    "You are a financial-calendar assistant. Use web search to find REAL, "
    "scheduled future dates from authoritative sources (BLS, Federal Reserve, "
    "BEA, company IR). Never guess a date — omit anything you cannot confirm. "
    "Respond with ONLY a single valid JSON object. " + ZH
)


# ===================== public API =====================
def run_analysis(ticker, snapshot, user_trades, events) -> dict[str, Any]:
    payload = {"ticker": ticker.upper(), "market_data": snapshot,
               "my_trades_on_this_ticker": user_trades, "tracked_events": events}
    prompt = (f"Analyze {ticker.upper()} as a research desk.\n\n"
              f"Context JSON:\n```json\n{_dump(payload)}\n```\n\n{DESK_SCHEMA}")
    data = _generate(prompt, DESK_SYSTEM)
    return data


def run_earnings_analysis(ticker, earnings, overview, news, financials=None) -> dict[str, Any]:
    payload = {"ticker": ticker.upper(), "earnings": earnings,
               "financials": financials, "fundamentals": overview, "recent_news": news}
    prompt = (f"Analyze the earnings of {ticker.upper()}.\n\n"
              f"Context JSON:\n```json\n{_dump(payload)}\n```\n\n{EARNINGS_SCHEMA}")
    data = _generate(prompt, EARNINGS_SYSTEM)
    return data


def run_trade_review(trade, performance, news) -> dict[str, Any]:
    payload = {"my_trade": trade, "performance_since_entry": performance, "recent_news": news}
    prompt = (f"复盘下面这笔交易。\n\n上下文 JSON:\n```json\n{_dump(payload)}\n```\n\n{REVIEW_SCHEMA}")
    return _generate(prompt, REVIEW_SYSTEM)


def fetch_macro_events(days: int = 75) -> list[dict[str, Any]]:
    today = date.today().isoformat()
    prompt = (
        f"Today is {today}. Use web search to find upcoming US market-moving "
        f"macro releases in the next {days} days: CPI, PPI, PCE, Non-farm "
        f"payrolls (NFP), FOMC meeting / rate decision, GDP, retail sales, ISM "
        f"PMI. Confirm exact dates from BLS / Federal Reserve / BEA. "
        f"For EACH event, also write a Chinese analysis in the 'notes' field with "
        f"THREE labeled lines:\n"
        f"市场预期:(共识预测值,如有具体数字就给)\n"
        f"我的预测:(你的倾向判断与理由)\n"
        f"情景影响:(若高于预期→…;若低于预期→… 分别说明对美股大盘/科技成长股/"
        f"利率/美元的影响)\n"
        f'Return JSON: {{"events":[{{"title":"中文标题","date":"YYYY-MM-DD",'
        f'"category":"macro","notes":"市场预期:…\\n我的预测:…\\n情景影响:…"}}]}}. '
        f"Only include confirmed future dates."
    )
    obj = _claude_cli_json(prompt, CALENDAR_SYSTEM, allowed_tools=["WebSearch", "WebFetch"], timeout=420)
    return _clean_events(obj.get("events", []), default_cat="macro")


def fetch_hot_stocks(themes: list[dict[str, Any]]) -> list[dict[str, Any]]:
    today = date.today().isoformat()
    lines = "\n".join(f"- key={t['key']}, name={t['name']}" for t in themes)
    prompt = (
        f"今天是 {today}。请用网络搜索,为下列每个主题板块各列出约 10 个当下讨论度/"
        f"热度最高、且流动性好的美股代码(或美股 ADR;加密货币用 Yahoo 形式如 "
        f"BTC-USD)。代码必须是 Yahoo Finance 可识别的。\n板块(请沿用给定的 "
        f"key 和 name):\n{lines}\n"
        f'返回 JSON:{{"themes":[{{"key":"semis","name":"半导体",'
        f'"tickers":["NVDA","AMD"]}}]}},每个板块一项。'
    )
    obj = _claude_cli_json(prompt, CALENDAR_SYSTEM, allowed_tools=["WebSearch", "WebFetch"], timeout=600)
    themes = []
    for t in obj.get("themes", []):
        tickers = [str(x).upper().strip() for x in (t.get("tickers") or [])
                   if x and re.match(r"^[A-Z0-9.\-]{1,12}$", str(x).upper().strip())]
        if t.get("name") and tickers:
            themes.append({
                "key": str(t.get("key") or t["name"])[:24],
                "name": str(t["name"])[:24],
                "tickers": tickers[:12],
            })
    return themes


def search_events(query: str, days: int = 120) -> list[dict[str, Any]]:
    today = date.today().isoformat()
    prompt = (
        f"Today is {today}. The user wants upcoming events that could affect: "
        f"\"{query}\". Use web search to find scheduled, dated future events in "
        f"the next {days} days (earnings, product launches, regulatory/court "
        f"decisions, conferences, economic releases, index rebalances) relevant "
        f"to that query. For each event write a short Chinese 'notes' explaining "
        f"its likely impact on the relevant stock(s). "
        f'Return JSON: {{"events":[{{"title":"中文标题","date":"YYYY-MM-DD",'
        f'"ticker":"可选","category":"news","notes":"中文影响说明"}}]}}. '
        f"Only confirmed future dates."
    )
    obj = _claude_cli_json(prompt, CALENDAR_SYSTEM, allowed_tools=["WebSearch", "WebFetch"], timeout=420)
    return _clean_events(obj.get("events", []), default_cat="news")


# ===================== providers =====================
def _generate(prompt: str, system: str) -> dict[str, Any]:
    if PROVIDER == "api":
        data = _run_api(prompt, system)
    else:
        data = _run_claude_cli(prompt, system)
    return data


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


def _claude_cli_json(prompt, system, allowed_tools=None, timeout=300) -> dict[str, Any]:
    exe = _find_claude()
    cmd = [exe, "-p", "--output-format", "json", "--system-prompt", system]
    if CLI_MODEL:
        cmd += ["--model", CLI_MODEL]
    if allowed_tools:
        cmd += ["--allowed-tools", *allowed_tools]
    if exe.lower().endswith((".cmd", ".bat")):
        cmd = ["cmd", "/c", *cmd]
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
