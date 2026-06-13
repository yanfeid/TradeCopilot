// ===================== i18n =====================
const I18N = {
  zh: {
    "nav.dashboard": "总览", "nav.journal": "交易记录", "nav.review": "复盘",
    "nav.watchlist": "自选股", "nav.calendar": "日历事件", "nav.analyze": "AI 分析", "nav.settings": "设置",
    "btn.refresh": "↻ 刷新", "common.autorefresh": "自动刷新", "common.updated": "更新于",
    "common.delete": "删除", "common.days": "天", "common.held": "持有", "common.today": "今日", "common.conf": "信心",
    "dash.positions": "持仓明细", "dash.positions_sub": "根据交易记录自动计算 · 均价成本法 · 近实时报价", "dash.events30": "未来 30 天事件",
    "m.mv": "总市值", "m.unreal": "浮动盈亏", "m.realized": "已实现盈亏", "m.positions": "持仓数", "m.events30": "30天内事件",
    "th.ticker": "代码", "th.qty": "数量", "th.avgcost": "成本均价", "th.price": "现价", "th.mv": "市值", "th.unreal": "浮动盈亏", "th.today": "今日",
    "empty.positions": "还没有持仓。去「交易记录」记几笔买入,这里会自动算出成本和盈亏。",
    "empty.events": "未来 30 天暂无事件。去「日历事件」添加,或一键生成非农日期。",
    "empty.trades": "还没有交易记录。用上面的表单记下你的第一笔。",
    "empty.watch": "自选股为空。在上面添加,或从下面「热门板块」一键加入。",
    "empty.events_cal": "还没有事件。点上面「Claude 刷新宏观日历」联网拉取,或手动添加。",
    "empty.review": "还没有交易可复盘。先去「交易记录」记几笔。",
    "j.title": "记一笔交易", "j.sub": "手动填写,重点是写下你的「理由」",
    "f.ticker": "代码", "f.action": "方向", "f.quantity": "数量", "f.price": "价格", "f.date": "日期",
    "f.confidence": "信心", "f.emotion": "情绪", "f.emotion_ph": "冷静 / FOMO / 恐慌", "f.tags": "标签", "f.tags_ph": "长线 / 试仓",
    "f.thesis": "理由(为什么做这笔交易?)", "f.thesis_ph": "例:财报超预期,看好下季度指引……",
    "btn.addtrade": "添加交易", "j.csv": "或导入 CSV:", "btn.import": "导入", "j.csvcols": "列名:ticker, action, quantity, price, date", "j.history": "历史交易",
    "r.title": "交易复盘", "r.sub": "对照你当初的理由,和这只股之后的实际走势", "r.aireview": "AI 复盘",
    "r.nothesis": "(当时没写理由)", "r.concl": "结论:", "r.thesisheld": "理由兑现度:",
    "r.right": "✅ 做对的", "r.wrong": "❌ 偏差/失误", "r.emotion": "🧠 情绪评估", "r.lesson": "🎯 教训",
    "r.score": "决策评分", "r.entry": "入场", "r.disclaimer": "复盘评分衡量「决策质量」,和最终盈亏没有必然关系。仅供研究,非投资建议。",
    "w.add": "添加自选", "w.ticker_ph": "代码,如 NVDA", "w.note_ph": "备注(可选)", "btn.add": "添加",
    "w.themes": "热门板块", "btn.themesrefresh": "🔍 用 Claude 更新最热(联网)", "btn.themesreset": "恢复默认榜单",
    "w.added": "✓ 已在自选", "btn.addwatch": "+ 加自选", "btn.intraday": "📈 分时", "btn.analyze": "分析",
    "th.claude": "已用 Claude 更新", "th.default": "精选默认榜单(可点上方按钮联网刷新)", "th.loading": "正在加载各板块行情…",
    "intraday.loading": "加载分时中…", "intraday.none": "暂无分时数据", "intraday.fail": "加载失败",
    "intraday.range": "区间", "intraday.today": "今日分时", "intraday.5d": "近5日", "intraday.cnt": "只",
    "c.source": "事件来源", "btn.resync": "↻ 重新同步(免费)", "btn.macroclaude": "🔍 用 Claude 刷新宏观日历(联网)",
    "c.search_ph": "搜索影响某主题/股票的未来事件,如 NVDA、AI 芯片监管、油价", "btn.search": "用 Claude 搜索",
    "c.note": "自动同步(财报日 + 非农)免费;点「Claude 刷新/搜索」才会用到订阅额度,会联网查官方来源。",
    "c.manual": "手动添加事件", "c.manual_sub": "先点下面的快捷按钮填好标题,再选日期",
    "c.ticker_ph": "代码(可选)", "c.title_ph": "事件标题", "c.all": "所有事件",
    "cal.synced": "宏观日历上次 Claude 刷新:", "cal.notsynced": "宏观日历尚未用 Claude 拉取过",
    "cal.pulling": "正在用 Claude 联网拉取宏观日历……", "cal.refreshed": "已刷新宏观日历", "cal.failed": "宏观拉取失败:",
    "src.auto": "自动", "src.claude": "Claude", "src.search": "Claude搜索",
    "chip.nfp": "非农 NFP", "chip.cpi": "CPI", "chip.fomc": "FOMC", "chip.pce": "PCE", "chip.gdp": "GDP",
    "event.nfp": "非农就业 (NFP)", "event.cpi": "CPI 通胀数据", "event.fomc": "FOMC 美联储议息", "event.pce": "PCE 通胀数据", "event.gdp": "GDP 数据",
    "a.title": "分析一只股票", "a.ticker_ph": "代码,如 TSLA", "btn.desk": "综合分析", "btn.earnings": "财报分析",
    "a.hint": "综合分析:多视角 + 你的持仓给出评级。财报分析:拆解最新财报。都用你的 Claude 订阅(本地 claude 命令行,无需 API key)。仅供研究,非投资建议。",
    "a.process": "分析过程", "a.gathering": "正在拉取数据…", "a.thinking": "Claude 正在思考与推理…",
    "a.reasoning_done": "推理完成,生成结论…", "step.search": "🔎 联网搜索", "step.fetch": "🌐 抓取网页", "step.tool": "🔧 调用工具",
    "an.bull": "🐂 看多", "an.bear": "🐻 看空", "an.risks": "⚠ 主要风险", "an.catalysts": "🗓 即将到来的催化剂",
    "an.mytrades": "💼 对我持仓的点评", "an.model": "模型", "an.disclaimer": "仅供研究,非投资建议。",
    "an.nextearn": "下次财报", "an.lasteps": "上次 EPS", "an.est": "预期", "an.perf1m": "1月", "an.perf3m": "3月", "an.perf6m": "6月",
    "e.title": "财报分析", "e.eps": "📈 EPS 趋势", "e.rev": "💰 营收趋势", "e.margin": "🧮 利润率与质量",
    "e.guide": "🧭 前瞻指引", "e.watch": "👀 下季度关注", "e.fin": "季度财务", "e.hist": "历史财报(EPS 超预期)",
    "e.q": "季度", "e.qrev": "营收", "e.qni": "净利润", "e.qmargin": "净利率", "e.qeps": "EPS",
    "e.surprise": "超预期", "e.actual": "实际 EPS", "e.recorded": "已记录",
    "x.title": "财报日与市场预期", "x.loading": "正在获取财报日与市场预期…", "x.fail": "市场预期获取失败:",
    "x.earndate": "下次财报日", "x.epsnext": "EPS 预期(前瞻)", "x.reco": "分析师评级", "x.target": "目标均价",
    "x.range": "目标区间", "x.upside": "较现价空间", "x.people": "人", "x.recorded_buy": "已记录买入", "x.recorded": "已记录",
    "s.title": "设置", "s.language": "界面与分析语言", "s.language_note": "切换后界面立即生效;AI 分析与日历事件会用所选语言输出。",
    "s.about": "关于", "s.about_note": "TradeCopilot 是只跑在你本机的个人交易副驾。数据存在本地,不上传。AI 功能走你的 Claude 订阅。仅供研究,非投资建议。",
    "alert.imported": "已导入 N 笔交易。", "alert.exists": "已在自选/添加失败", "alert.nfp": "已添加 N 个未来非农日期。",
    "alert.earnings": "已更新 N 只股票的财报日。", "alert.search": "找到 A 条,新增 B 条。", "alert.pickcsv": "先选一个 CSV 文件。", "alert.needticker": "先输入代码",
  },
  en: {
    "nav.dashboard": "Dashboard", "nav.journal": "Journal", "nav.review": "Review",
    "nav.watchlist": "Watchlist", "nav.calendar": "Calendar", "nav.analyze": "Analyze", "nav.settings": "Settings",
    "btn.refresh": "↻ Refresh", "common.autorefresh": "Auto-refresh", "common.updated": "Updated",
    "common.delete": "delete", "common.days": "days", "common.held": "held", "common.today": "today", "common.conf": "conf",
    "dash.positions": "Positions", "dash.positions_sub": "Computed from your trades · average-cost · near real-time quotes", "dash.events30": "Events in the next 30 days",
    "m.mv": "Market value", "m.unreal": "Unrealized P&L", "m.realized": "Realized P&L", "m.positions": "Positions", "m.events30": "Events ≤30d",
    "th.ticker": "Ticker", "th.qty": "Qty", "th.avgcost": "Avg cost", "th.price": "Price", "th.mv": "Mkt value", "th.unreal": "Unrealized", "th.today": "Today",
    "empty.positions": "No positions yet. Log some buys in Journal and your cost & P&L will show here.",
    "empty.events": "No events in the next 30 days. Add some in Calendar, or seed NFP dates.",
    "empty.trades": "No trades yet. Log your first one above.",
    "empty.watch": "Watchlist is empty. Add above, or one-click add from Hot Themes below.",
    "empty.events_cal": "No events yet. Click “Refresh macro via Claude” above, or add manually.",
    "empty.review": "No trades to review yet. Log some in Journal first.",
    "j.title": "Log a trade", "j.sub": "Manual entry — the point is to write down your thesis",
    "f.ticker": "Ticker", "f.action": "Side", "f.quantity": "Quantity", "f.price": "Price", "f.date": "Date",
    "f.confidence": "Confidence", "f.emotion": "Emotion", "f.emotion_ph": "calm / FOMO / fearful", "f.tags": "Tags", "f.tags_ph": "long-term / starter",
    "f.thesis": "Thesis (why this trade?)", "f.thesis_ph": "e.g. earnings beat, like the next-quarter guidance…",
    "btn.addtrade": "Add trade", "j.csv": "Or import CSV:", "btn.import": "Import", "j.csvcols": "columns: ticker, action, quantity, price, date", "j.history": "Trade history",
    "r.title": "Trade review", "r.sub": "Your original thesis vs. what the stock actually did", "r.aireview": "AI review",
    "r.nothesis": "(no thesis recorded)", "r.concl": "Verdict:", "r.thesisheld": "Thesis held:",
    "r.right": "✅ What went right", "r.wrong": "❌ What went wrong", "r.emotion": "🧠 Emotional read", "r.lesson": "🎯 Lesson",
    "r.score": "Decision score", "r.entry": "entry", "r.disclaimer": "The score rates DECISION quality, not P&L. Research only — not financial advice.",
    "w.add": "Add to watchlist", "w.ticker_ph": "Ticker, e.g. NVDA", "w.note_ph": "Note (optional)", "btn.add": "Add",
    "w.themes": "Hot themes", "btn.themesrefresh": "🔍 Refresh hottest via Claude (web)", "btn.themesreset": "Reset to default",
    "w.added": "✓ on watchlist", "btn.addwatch": "+ Watch", "btn.intraday": "📈 Intraday", "btn.analyze": "Analyze",
    "th.claude": "Updated via Claude", "th.default": "Curated default (refresh via button above)", "th.loading": "Loading theme quotes…",
    "intraday.loading": "Loading intraday…", "intraday.none": "No intraday data", "intraday.fail": "Failed to load",
    "intraday.range": "Range", "intraday.today": "today", "intraday.5d": "5 days", "intraday.cnt": "",
    "c.source": "Event sources", "btn.resync": "↻ Re-sync (free)", "btn.macroclaude": "🔍 Refresh macro via Claude (web)",
    "c.search_ph": "Search future events for a topic/ticker, e.g. NVDA, AI chip rules, oil", "btn.search": "Search via Claude",
    "c.note": "Auto-sync (earnings + NFP) is free; the Claude refresh/search uses your subscription and checks official sources online.",
    "c.manual": "Add an event manually", "c.manual_sub": "Click a quick-button to fill the title, then pick a date",
    "c.ticker_ph": "Ticker (optional)", "c.title_ph": "Event title", "c.all": "All events",
    "cal.synced": "Macro calendar last Claude refresh: ", "cal.notsynced": "Macro calendar not yet pulled via Claude",
    "cal.pulling": "Pulling macro calendar via Claude…", "cal.refreshed": "Macro calendar refreshed", "cal.failed": "Macro pull failed: ",
    "src.auto": "auto", "src.claude": "Claude", "src.search": "Claude search",
    "chip.nfp": "NFP", "chip.cpi": "CPI", "chip.fomc": "FOMC", "chip.pce": "PCE", "chip.gdp": "GDP",
    "event.nfp": "Non-farm payrolls (NFP)", "event.cpi": "CPI inflation report", "event.fomc": "FOMC (Fed rate decision)", "event.pce": "PCE inflation report", "event.gdp": "GDP report",
    "a.title": "Analyze a stock", "a.ticker_ph": "Ticker, e.g. TSLA", "btn.desk": "Full analysis", "btn.earnings": "Earnings analysis",
    "a.hint": "Full analysis: multi-perspective rating incl. your positions. Earnings analysis: latest report. Both use your Claude subscription (local claude CLI, no API key). Research only — not financial advice.",
    "a.process": "Analysis process", "a.gathering": "Gathering data…", "a.thinking": "Claude is thinking & reasoning…",
    "a.reasoning_done": "Reasoning done, drafting conclusion…", "step.search": "🔎 Web search", "step.fetch": "🌐 Fetch page", "step.tool": "🔧 Tool call",
    "an.bull": "🐂 Bull case", "an.bear": "🐻 Bear case", "an.risks": "⚠ Key risks", "an.catalysts": "🗓 Upcoming catalysts",
    "an.mytrades": "💼 On my positions", "an.model": "Model", "an.disclaimer": "Research only — not financial advice.",
    "an.nextearn": "next earnings", "an.lasteps": "last EPS", "an.est": "est", "an.perf1m": "1m", "an.perf3m": "3m", "an.perf6m": "6m",
    "e.title": "Earnings analysis", "e.eps": "📈 EPS trend", "e.rev": "💰 Revenue trend", "e.margin": "🧮 Margins & quality",
    "e.guide": "🧭 Guidance", "e.watch": "👀 Watch next quarter", "e.fin": "Quarterly financials", "e.hist": "Earnings history (EPS surprise)",
    "e.q": "Quarter", "e.qrev": "Revenue", "e.qni": "Net income", "e.qmargin": "Net margin", "e.qeps": "EPS",
    "e.surprise": "Surprise", "e.actual": "Actual EPS", "e.recorded": "Recorded",
    "x.title": "Earnings date & market expectations", "x.loading": "Fetching earnings date & expectations…", "x.fail": "Failed to fetch expectations: ",
    "x.earndate": "Next earnings", "x.epsnext": "EPS estimate (fwd)", "x.reco": "Analyst rating", "x.target": "Mean target",
    "x.range": "Target range", "x.upside": "Upside vs price", "x.people": "", "x.recorded_buy": "Logged buy", "x.recorded": "Logged",
    "s.title": "Settings", "s.language": "Interface & analysis language", "s.language_note": "Takes effect immediately; AI analysis and calendar events are produced in the selected language.",
    "s.about": "About", "s.about_note": "TradeCopilot is a personal trading copilot that runs only on your machine. Data stays local. AI features use your Claude subscription. Research only — not financial advice.",
    "alert.imported": "Imported N trades.", "alert.exists": "Already on the list / add failed", "alert.nfp": "Added N upcoming NFP dates.",
    "alert.earnings": "Updated earnings dates for N tickers.", "alert.search": "Found A, added B.", "alert.pickcsv": "Pick a CSV first.", "alert.needticker": "Enter a ticker first",
  },
};
let lang = "zh";
const t = (k) => (I18N[lang] && I18N[lang][k]) || I18N.zh[k] || k;
function applyI18n() {
  document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
}

// ===================== helpers =====================
async function api(path, opts = {}) {
  const res = await fetch(path, { headers: { "Content-Type": "application/json" }, ...opts });
  if (!res.ok) { let m = res.statusText; try { m = (await res.json()).detail || m; } catch (_) {} throw new Error(m); }
  return res.status === 204 ? null : res.json();
}
const $ = (s) => document.querySelector(s);
const esc = (s) => (s == null ? "" : String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])));
const money = (v) => (v == null ? "—" : `$${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
const big = (v) => { if (v == null) return "—"; const a = Math.abs(v), s = v < 0 ? "−" : ""; if (a >= 1e9) return `${s}$${(a / 1e9).toFixed(2)}B`; if (a >= 1e6) return `${s}$${(a / 1e6).toFixed(1)}M`; return `${s}$${a.toLocaleString()}`; };
const cls = (v) => (v == null ? "" : v >= 0 ? "pos" : "neg");
const signed = (v) => (v == null ? "—" : `<span class="${cls(v)} num">${v >= 0 ? "+" : "−"}${money(Math.abs(v))}</span>`);
const pct = (v) => (v == null ? "—" : `<span class="${cls(v)} num">${v >= 0 ? "+" : ""}${v}%</span>`);

// ===================== tabs + auto refresh =====================
let currentTab = "dashboard";
const loaders = {
  dashboard: loadDashboard, journal: loadJournal, review: loadReview,
  watchlist: loadWatchlist, calendar: loadCalendar, analyze: () => {}, settings: () => {},
};
document.querySelectorAll("#tabs button").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#tabs button").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab").forEach((s) => s.classList.remove("active"));
    btn.classList.add("active");
    currentTab = btn.dataset.tab;
    $("#" + currentTab).classList.add("active");
    loaders[currentTab]?.();
  });
});
let refreshTimer = null;
$("#autorefresh").addEventListener("change", (e) => {
  clearInterval(refreshTimer);
  if (e.target.checked) refreshTimer = setInterval(() => loaders[currentTab]?.(), 30000);
});
$("#refresh-now").addEventListener("click", () => loaders[currentTab]?.());
function stamp() { $("#refresh-status").textContent = t("common.updated") + " " + new Date().toLocaleTimeString(); }

// ===================== settings =====================
$("#lang-select").addEventListener("change", async (e) => {
  lang = e.target.value;
  try { await api("/api/settings", { method: "POST", body: JSON.stringify({ language: lang }) }); } catch (_) {}
  applyI18n();
  loaders[currentTab]?.();
});

// ===================== dashboard =====================
async function loadDashboard() {
  const [pos, events] = await Promise.all([api("/api/positions"), api("/api/events")]);
  const tot = pos.totals;
  const soon = events.filter((e) => { const d = (new Date(e.event_date) - new Date()) / 86400000; return d >= -1 && d <= 30; });
  $("#dash-cards").innerHTML =
    metric(t("m.mv"), money(tot.market_value)) + metric(t("m.unreal"), signed(tot.unrealized)) +
    metric(t("m.realized"), signed(tot.realized)) + metric(t("m.positions"), pos.positions.length) +
    metric(t("m.events30"), soon.length);
  $("#positions-table").innerHTML = pos.positions.length ? positionsTable(pos.positions) : `<p class="empty">${t("empty.positions")}</p>`;
  $("#dash-events").innerHTML = soon.length ? soon.map(eventItem).join("") : `<p class="empty">${t("empty.events")}</p>`;
  stamp();
}
const metric = (label, value) => `<div class="metric"><div class="label">${label}</div><div class="value">${value}</div></div>`;
function positionsTable(rows) {
  const body = rows.map((p) => `<tr>
    <td><span class="tk">${esc(p.ticker)}</span></td><td class="num">${p.quantity}</td>
    <td class="num">${money(p.avg_cost)}</td><td class="num">${money(p.price)}</td><td class="num">${money(p.market_value)}</td>
    <td>${signed(p.unrealized)} ${p.unrealized_pct != null ? `<span class="${cls(p.unrealized_pct)} small">(${p.unrealized_pct >= 0 ? "+" : ""}${p.unrealized_pct}%)</span>` : ""}</td>
    <td>${pct(p.change_pct)}</td></tr>`).join("");
  return `<table><thead><tr><th>${t("th.ticker")}</th><th>${t("th.qty")}</th><th>${t("th.avgcost")}</th><th>${t("th.price")}</th><th>${t("th.mv")}</th><th>${t("th.unreal")}</th><th>${t("th.today")}</th></tr></thead><tbody>${body}</tbody></table>`;
}

// ===================== journal =====================
async function loadJournal() {
  const trades = await api("/api/trades");
  $("#trades-list").innerHTML = trades.length ? trades.map(tradeItem).join("") : `<p class="empty">${t("empty.trades")}</p>`;
}
function tradeItem(x) {
  const conf = x.confidence ? ` · ${t("common.conf")} ${x.confidence}/5` : "";
  const emo = x.emotion ? ` · ${esc(x.emotion)}` : "";
  return `<div class="item"><div>
      <div class="title"><span class="tk">${esc(x.ticker)}</span> <span class="pill ${x.action === "SELL" ? "sell" : "buy"}">${x.action}</span> <span class="num">${x.quantity} @ ${money(x.price)}</span></div>
      <div class="meta">${esc(x.trade_date)}${conf}${emo}${x.tags ? " · " + esc(x.tags) : ""}</div>
      ${x.thesis ? `<div class="thesis">💭 ${esc(x.thesis)}</div>` : ""}
    </div><button class="del" onclick="delTrade(${x.id})">${t("common.delete")}</button></div>`;
}
window.delTrade = async (id) => { await api(`/api/trades/${id}`, { method: "DELETE" }); loadJournal(); };
$("#trade-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const b = Object.fromEntries(new FormData(e.target).entries());
  const ticker = (b.ticker || "").toUpperCase(); const wasBuy = (b.action || "BUY") === "BUY";
  b.quantity = parseFloat(b.quantity); b.price = parseFloat(b.price); b.confidence = b.confidence ? parseInt(b.confidence) : null;
  await api("/api/trades", { method: "POST", body: JSON.stringify(b) });
  e.target.reset(); loadJournal();
  if (ticker) showExpectations(ticker, wasBuy);
});
$("#csv-btn").addEventListener("click", async () => {
  const file = $("#csv-file").files[0];
  if (!file) return alert(t("alert.pickcsv"));
  const fd = new FormData(); fd.append("file", file);
  const data = await (await fetch("/api/trades/import", { method: "POST", body: fd })).json();
  alert(t("alert.imported").replace("N", data.imported)); loadJournal();
});

const RECO = {
  zh: { strong_buy: "强烈买入", buy: "买入", outperform: "跑赢大盘", hold: "持有", underperform: "跑输大盘", sell: "卖出", strong_sell: "强烈卖出" },
  en: { strong_buy: "Strong buy", buy: "Buy", outperform: "Outperform", hold: "Hold", underperform: "Underperform", sell: "Sell", strong_sell: "Strong sell" },
};
async function showExpectations(ticker, wasBuy) {
  const box = $("#buy-expect");
  box.innerHTML = `<div class="expect"><span class="muted small">${t("x.loading")}</span></div>`;
  try {
    const x = await api("/api/expectations/" + ticker);
    const reco = (RECO[lang][x.recommendation]) || x.recommendation || "—";
    box.innerHTML = `<div class="expect">
      <h4>📌 ${wasBuy ? t("x.recorded_buy") : t("x.recorded")} ${esc(x.name || ticker)} · ${t("x.title")}</h4>
      <div class="grid2">
        <div><div class="k">${t("x.earndate")}</div><div class="v">${x.next_earnings || "—"}</div></div>
        <div><div class="k">${t("x.epsnext")}</div><div class="v">${x.eps_estimate_next ?? "—"}</div></div>
        <div><div class="k">${t("x.reco")}</div><div class="v">${reco}${x.num_analysts ? `(${x.num_analysts}${t("x.people")})` : ""}</div></div>
        <div><div class="k">${t("x.target")}</div><div class="v">${money(x.target_mean)}</div></div>
        <div><div class="k">${t("x.range")}</div><div class="v">${money(x.target_low)} – ${money(x.target_high)}</div></div>
        <div><div class="k">${t("x.upside")}</div><div class="v">${pct(x.upside_pct)}</div></div>
      </div></div>`;
  } catch (err) { box.innerHTML = `<div class="expect"><span class="muted small">${t("x.fail")}${esc(err.message)}</span></div>`; }
}

// ===================== review =====================
async function loadReview() {
  const trades = await api("/api/review");
  $("#review-list").innerHTML = trades.length ? trades.map(reviewRow).join("") : `<p class="empty">${t("empty.review")}</p>`;
}
function reviewRow(x) {
  const ret = x.return_pct;
  return `<div class="item"><div>
      <div class="title"><span class="tk">${esc(x.ticker)}</span> <span class="pill ${x.action === "SELL" ? "sell" : "buy"}">${x.action}</span>
        <span class="num">@ ${money(x.price)}</span> → ${money(x.current_price)} <span class="${cls(ret)}">${ret != null ? (ret >= 0 ? "+" : "") + ret + "%" : "—"}</span></div>
      <div class="meta">${esc(x.trade_date)}${x.days_held != null ? ` · ${t("common.held")} ${x.days_held} ${t("common.days")}` : ""}${x.confidence ? ` · ${t("common.conf")} ${x.confidence}/5` : ""}</div>
      ${x.thesis ? `<div class="thesis">💭 ${esc(x.thesis)}</div>` : `<div class="meta">${t("r.nothesis")}</div>`}
    </div><button class="btn-soft" onclick="reviewTrade(${x.id})">${t("r.aireview")}</button></div>`;
}
window.reviewTrade = async (id) => {
  const box = $("#review-result");
  box.innerHTML = `<div class="panel"><p class="spinner">${t("a.thinking")}</p></div>`;
  try { box.innerHTML = renderReview(await api(`/api/review/${id}`, { method: "POST" })); box.scrollIntoView({ behavior: "smooth", block: "nearest" }); }
  catch (err) { box.innerHTML = `<div class="panel"><p class="neg">⚠ ${esc(err.message)}</p></div>`; }
};
function renderReview(d) {
  const r = d.review, x = d.trade, p = d.performance;
  const stars = "★".repeat(r.score || 0) + "☆".repeat(Math.max(0, 5 - (r.score || 0)));
  const li = (arr) => (arr && arr.length ? arr.map((v) => `<li>${esc(v)}</li>`).join("") : "<li class='muted'>—</li>");
  return `<div class="panel">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <strong style="font-size:16px">${esc(x.ticker)} · ${t("r.title")}</strong>
        <span class="${cls(p.return_pct)}">${t("r.entry")} ${money(p.entry_price)} → ${money(p.current_price)} (${p.return_pct >= 0 ? "+" : ""}${p.return_pct ?? "—"}%)</span>
        <span class="badge rating-Hold">${t("r.score")} ${stars}</span></div>
      <p style="margin-bottom:0"><strong>${t("r.concl")}</strong>${esc(r.verdict)}</p>
      <p class="snapshot"><strong>${t("r.thesisheld")}</strong>${esc(r.thesis_held)}</p></div>
    <div class="analysis-grid">
      <div class="acard"><h4 class="pos">${t("r.right")}</h4><ul>${li(r.what_went_right)}</ul></div>
      <div class="acard"><h4 class="neg">${t("r.wrong")}</h4><ul>${li(r.what_went_wrong)}</ul></div>
      <div class="acard"><h4>${t("r.emotion")}</h4><p>${esc(r.emotional_read)}</p></div>
      <div class="acard"><h4>${t("r.lesson")}</h4><p>${esc(r.lesson)}</p></div>
    </div><p class="muted small">${t("r.disclaimer")}</p>`;
}

// ===================== watchlist =====================
let watchSet = new Set();
let themesLoaded = false;
async function loadWatchlist() {
  const items = await api("/api/watchlist");
  watchSet = new Set(items.map((i) => i.ticker));
  $("#watch-list").innerHTML = items.length ? items.map(watchCard).join("") : `<p class="empty">${t("empty.watch")}</p>`;
  stamp();
  if (!themesLoaded) loadThemes();
}
function watchCard(w) {
  const q = w.quote || {}; const id = w.ticker.replace(/[^A-Za-z0-9]/g, "");
  return `<div class="card"><div class="row1"><span class="tk">${esc(w.ticker)}</span><button class="del" onclick="delWatch('${esc(w.ticker)}')">×</button></div>
    <div class="price">${q.price != null ? money(q.price) : "—"}</div><div>${pct(q.change_pct)} <span class="muted small">${t("common.today")}</span></div>
    ${w.note ? `<div class="meta muted small">${esc(w.note)}</div>` : ""}<div class="chart" id="chart-${id}"></div>
    <div style="margin-top:12px;display:flex;gap:8px">
      <button class="btn-soft" onclick="loadIntraday('${esc(w.ticker)}','${id}')">${t("btn.intraday")}</button>
      <button class="btn-soft" onclick="streamAnalyze('${esc(w.ticker)}','desk')">${t("btn.analyze")}</button></div></div>`;
}
window.delWatch = async (tk) => { await api(`/api/watchlist/${tk}`, { method: "DELETE" }); loadWatchlist(); };
window.loadIntraday = async (tk, id) => {
  const el = document.getElementById("chart-" + id);
  el.innerHTML = `<span class="muted small">${t("intraday.loading")}</span>`;
  try {
    const d = await api("/api/intraday/" + tk);
    if (!d.points || !d.points.length) { el.innerHTML = `<span class="muted small">${t("intraday.none")}</span>`; return; }
    const up = (d.last ?? 0) >= (d.open ?? 0);
    el.innerHTML = sparklineSVG(d.points.map((p) => p.c), up) + `<div class="muted small">${t("intraday.range")} ${money(d.low)} – ${money(d.high)} · ${d.span === "1d" ? t("intraday.today") : t("intraday.5d")}</div>`;
  } catch (e) { el.innerHTML = `<span class="muted small">${t("intraday.fail")}</span>`; }
};
function sparklineSVG(vals, up, w = 248, h = 56) {
  const min = Math.min(...vals), max = Math.max(...vals), range = (max - min) || 1, step = w / (vals.length - 1 || 1);
  const pts = vals.map((v, i) => `${(i * step).toFixed(1)},${(h - ((v - min) / range) * (h - 6) - 3).toFixed(1)}`).join(" ");
  return `<svg width="100%" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="display:block;margin-top:8px"><polyline points="${pts}" fill="none" stroke="${up ? "var(--green)" : "var(--red)"}" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
}
$("#watch-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const b = Object.fromEntries(new FormData(e.target).entries());
  try { await api("/api/watchlist", { method: "POST", body: JSON.stringify(b) }); } catch (err) { alert(err.message); }
  e.target.reset(); loadWatchlist();
});

// hot themes
async function loadThemes() {
  $("#themes").innerHTML = `<p class="spinner">${t("th.loading")}</p>`;
  try { const d = await api("/api/themes"); renderThemes(d); themesLoaded = true; }
  catch (e) { $("#themes").innerHTML = `<p class="neg">${esc(e.message)}</p>`; }
}
function renderThemes(d) {
  $("#themes-status").textContent = d.source === "claude" ? t("th.claude") + (d.updated_at ? " · " + new Date(d.updated_at).toLocaleString() : "") : t("th.default");
  $("#themes").innerHTML = d.themes.map(themeBlock).join("");
}
const THEME_NAMES = {
  semis: { zh: "半导体", en: "Semiconductors" },
  ai: { zh: "人工智能", en: "AI" },
  space: { zh: "太空", en: "Space" },
  optical: { zh: "光模块", en: "Optical modules" },
  biopharma: { zh: "医药生物", en: "Biotech & Pharma" },
  crypto: { zh: "加密货币", en: "Crypto" },
  ev: { zh: "新能源车", en: "EV" },
  quantum: { zh: "量子计算", en: "Quantum computing" },
  nuclear: { zh: "核能与铀", en: "Nuclear & Uranium" },
  gold: { zh: "黄金/贵金属", en: "Gold & Precious metals" },
  fintech: { zh: "金融科技/支付", en: "Fintech & Payments" },
};
const themeName = (g) => (THEME_NAMES[g.key] && THEME_NAMES[g.key][lang]) || g.name;
function themeBlock(g) {
  return `<div class="theme-block"><h4>${esc(themeName(g))} <span class="muted small">${g.stocks.length} ${t("intraday.cnt")}</span></h4><div class="stock-grid">${g.stocks.map(stockTile).join("")}</div></div>`;
}
function stockTile(s) {
  const has = watchSet.has(s.ticker);
  return `<div class="stock-tile"><div class="t">${esc(s.ticker)}</div><div class="p">${s.price != null ? money(s.price) : "—"} ${pct(s.change_pct)}</div>
    ${has ? `<div class="added">${t("w.added")}</div>` : `<button class="btn-soft add" onclick="addToWatch('${esc(s.ticker)}',this)">${t("btn.addwatch")}</button>`}</div>`;
}
window.addToWatch = async (tk, btn) => {
  try { await api("/api/watchlist", { method: "POST", body: JSON.stringify({ ticker: tk }) }); } catch (_) {}
  watchSet.add(tk); if (btn) btn.outerHTML = `<div class="added">${t("w.added")}</div>`; loadWatchlist();
};
$("#themes-refresh").addEventListener("click", async (e) => {
  $("#themes-status").textContent = t("cal.pulling"); e.target.disabled = true;
  try { await api("/api/themes/refresh", { method: "POST" }); await loadThemes(); }
  catch (err) { $("#themes-status").textContent = t("cal.failed") + err.message; }
  e.target.disabled = false;
});
$("#themes-reset").addEventListener("click", async () => { await api("/api/themes/reset", { method: "POST" }); await loadThemes(); });

// ===================== calendar =====================
async function loadCalendar() {
  let stale = false;
  try {
    const s = await api("/api/events/sync", { method: "POST" });
    stale = s.macro_stale;
    $("#cal-status").textContent = s.macro_synced_at ? t("cal.synced") + new Date(s.macro_synced_at).toLocaleString() : t("cal.notsynced");
  } catch (_) {}
  await renderEvents();
  if (stale) runMacroClaude(true);
}
async function renderEvents() {
  const events = await api("/api/events");
  $("#events-list").innerHTML = events.length ? events.map(eventItem).join("") : `<p class="empty">${t("empty.events_cal")}</p>`;
}
async function runMacroClaude(auto) {
  $("#cal-status").textContent = t("cal.pulling");
  try { const r = await api("/api/events/macro-claude", { method: "POST" }); $("#cal-status").textContent = `${t("cal.refreshed")} (+${r.added}) · ${new Date().toLocaleString()}`; await renderEvents(); }
  catch (err) { $("#cal-status").textContent = t("cal.failed") + err.message; if (!auto) alert(err.message); }
}
const SRC = () => ({ auto: t("src.auto"), "claude-macro": t("src.claude"), "claude-search": t("src.search"), manual: "" });
function eventItem(e) {
  const tag = e.category === "earnings" ? "📊" : e.category === "macro" ? "🌐" : e.category === "news" ? "📰" : "📌";
  const src = SRC()[e.source] != null ? SRC()[e.source] : e.source;
  return `<div class="item"><div>
      <div class="title">${tag} ${esc(e.title)} ${e.ticker ? `<span class="muted small">${esc(e.ticker)}</span>` : ""}</div>
      <div class="meta">${esc(e.event_date)} · ${esc(e.category)}${src ? " · " + src : ""}</div>
      ${e.notes ? `<div class="thesis">${esc(e.notes)}</div>` : ""}
    </div><button class="del" onclick="delEvent(${e.id})">${t("common.delete")}</button></div>`;
}
window.delEvent = async (id) => { await api(`/api/events/${id}`, { method: "DELETE" }); renderEvents(); };
$("#event-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const b = Object.fromEntries(new FormData(e.target).entries());
  if (!b.ticker) delete b.ticker;
  await api("/api/events", { method: "POST", body: JSON.stringify(b) });
  e.target.reset(); $("#event-form").category.value = "custom"; renderEvents();
});
$("#sync-now").addEventListener("click", loadCalendar);
$("#macro-claude").addEventListener("click", () => runMacroClaude(false));
$("#search-btn").addEventListener("click", async () => {
  const q = $("#event-search").value.trim(); if (!q) return;
  const btn = $("#search-btn"); const orig = btn.textContent; btn.textContent = "…"; btn.disabled = true;
  try { const r = await api("/api/events/search", { method: "POST", body: JSON.stringify({ query: q }) }); alert(t("alert.search").replace("A", r.found).replace("B", r.added)); await renderEvents(); }
  catch (err) { alert(err.message); }
  btn.textContent = orig; btn.disabled = false;
});
document.querySelectorAll("#macro-quick .chip").forEach((b) => {
  b.addEventListener("click", () => { const f = $("#event-form"); f.title.value = t(b.dataset.titleKey); f.category.value = "macro"; f.event_date.focus(); });
});

// ===================== analyze (streaming) =====================
$("#analyze-form").addEventListener("submit", (e) => { e.preventDefault(); streamAnalyze(new FormData(e.target).get("ticker"), "desk"); });
$("#earnings-btn").addEventListener("click", () => { const tk = $("#analyze-form").ticker.value.trim(); if (!tk) return alert(t("alert.needticker")); streamAnalyze(tk, "earnings"); });

window.streamAnalyze = async (ticker, kind) => {
  ticker = (ticker || "").toUpperCase().trim(); if (!ticker) return;
  document.querySelector('#tabs button[data-tab="analyze"]').click();
  const box = $("#analyze-result");
  box.innerHTML = `<div class="panel">
      <div class="panel-head"><h3>${t("a.process")} — ${esc(ticker)}</h3><span id="stream-status" class="muted small">${t("a.gathering")}</span></div>
      <div id="stream-steps" class="steps"></div>
      <pre id="stream-reasoning" class="reasoning"></pre>
    </div><div id="final-result"></div>`;
  const reasoning = $("#stream-reasoning"), steps = $("#stream-steps"), status = $("#stream-status");
  let store = {};
  try {
    const resp = await fetch(`/api/analyze-stream/${ticker}?kind=${kind}`);
    const reader = resp.body.getReader(); const dec = new TextDecoder(); let buf = "";
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf("\n\n")) >= 0) {
        const chunk = buf.slice(0, i); buf = buf.slice(i + 2);
        if (!chunk.startsWith("data:")) continue;
        let ev; try { ev = JSON.parse(chunk.slice(5).trim()); } catch (_) { continue; }
        if (ev.type === "status") { status.textContent = t("a.gathering"); }
        else if (ev.type === "data") { store = ev; status.textContent = t("a.thinking"); }
        else if (ev.type === "reasoning") { reasoning.textContent += ev.text; reasoning.scrollTop = reasoning.scrollHeight; }
        else if (ev.type === "step") {
          const nm = ev.text === "WebSearch" ? t("step.search") : ev.text === "WebFetch" ? t("step.fetch") : t("step.tool") + " " + ev.text;
          steps.insertAdjacentHTML("beforeend", `<div class="step">${esc(nm)}</div>`);
        } else if (ev.type === "result") {
          status.textContent = t("a.reasoning_done");
          const data = kind === "earnings"
            ? { ticker, earnings: store.earnings, overview: store.overview, financials: store.financials, analysis: ev.data }
            : { ticker, snapshot: store.snapshot, analysis: ev.data };
          $("#final-result").innerHTML = kind === "earnings" ? renderEarnings(data) : renderAnalysis(data);
          $("#final-result").scrollIntoView({ behavior: "smooth", block: "nearest" });
        } else if (ev.type === "error") { status.textContent = "⚠ " + ev.text; }
      }
    }
  } catch (err) { $("#final-result").innerHTML = `<div class="panel"><p class="neg">⚠ ${esc(err.message)}</p></div>`; }
};

function renderAnalysis(data) {
  const a = data.analysis, s = data.snapshot || {};
  const ov = s.overview || {}, q = s.quote || {}, p = s.performance || {}, ea = s.earnings || {};
  const li = (arr) => (arr && arr.length ? arr.map((x) => `<li>${esc(x)}</li>`).join("") : "<li class='muted'>—</li>");
  const last = ea.last;
  return `<div class="panel">
      <div style="display:flex;align-items:center;flex-wrap:wrap"><strong style="font-size:17px">${esc(ov.name || data.ticker)}</strong><span class="badge rating-${esc(a.rating)}">${esc(a.rating || "?")}</span></div>
      <div class="snapshot">${money(q.price)} · ${pct(q.change_pct)} ${t("common.today")} · ${t("an.perf1m")} ${pct(p.perf_1m)} · ${t("an.perf3m")} ${pct(p.perf_3m)} · ${t("an.perf6m")} ${pct(p.perf_6m)}<br/>
        ${ov.sector ? esc(ov.sector) + " · " : ""}P/E ${ov.trailing_pe ? Number(ov.trailing_pe).toFixed(1) : "—"} · ${t("an.nextearn")} ${ea.next_date || "—"}${last ? ` · ${t("an.lasteps")} ${last.reported_eps ?? "—"}(${t("an.est")} ${last.eps_estimate ?? "—"})` : ""}</div>
      <p style="margin-bottom:0">${esc(a.summary)}</p></div>
    <div class="analysis-grid">
      <div class="acard"><h4 class="pos">${t("an.bull")}</h4><ul>${li(a.bull_case)}</ul></div>
      <div class="acard"><h4 class="neg">${t("an.bear")}</h4><ul>${li(a.bear_case)}</ul></div>
      <div class="acard"><h4>${t("an.risks")}</h4><ul>${li(a.key_risks)}</ul></div>
      <div class="acard"><h4>${t("an.catalysts")}</h4><ul>${li(a.upcoming_catalysts)}</ul></div>
      ${a.notes_on_my_trades ? `<div class="acard full"><h4>${t("an.mytrades")}</h4><p>${esc(a.notes_on_my_trades)}</p></div>` : ""}
    </div><p class="muted small">${t("an.model")}: ${esc(a._model || "")}。${t("an.disclaimer")}</p>`;
}
function verdictClass(v) { if (["Strong beat", "Beat"].includes(v)) return "rating-Buy"; if (["Miss", "Weak"].includes(v)) return "rating-Sell"; return "rating-Hold"; }
function renderEarnings(d) {
  const a = d.analysis, e = d.earnings || {}, ov = d.overview || {}, fin = d.financials || {};
  const last = e.last, q = (fin.quarterly || []).slice(0, 6);
  const hist = (e.history || []).filter((h) => h.reported_eps != null).slice(-6);
  const li = (arr) => (arr && arr.length ? arr.map((x) => `<li>${esc(x)}</li>`).join("") : "<li class='muted'>—</li>");
  const finRows = q.map((r) => `<tr><td>${esc(r.period)}</td><td class="num">${big(r.revenue)}</td><td class="num">${big(r.net_income)}</td><td class="num">${r.net_margin != null ? r.net_margin + "%" : "—"}</td><td class="num">${r.eps ?? "—"}</td></tr>`).join("");
  const histRows = hist.map((h) => `<tr><td>${esc(h.date)}</td><td class="num">${h.reported_eps ?? "—"}</td><td class="num">${h.eps_estimate ?? "—"}</td><td>${h.surprise_pct != null ? pct(h.surprise_pct) : "—"}</td></tr>`).join("");
  return `<div class="panel">
      <div style="display:flex;align-items:center;flex-wrap:wrap"><strong style="font-size:17px">${esc(ov.name || d.ticker)} · ${t("e.title")}</strong><span class="badge ${verdictClass(a.verdict)}">${esc(a.verdict || "?")}</span></div>
      <p style="margin-bottom:0">${esc(a.summary)}</p>
      <div class="snapshot">${t("an.nextearn")} ${e.next_date || "—"}${last ? ` · ${esc(last.date)}: EPS ${last.reported_eps ?? "—"}(${t("an.est")} ${last.eps_estimate ?? "—"}${last.surprise_pct != null ? `, ${t("e.surprise")} ${last.surprise_pct >= 0 ? "+" : ""}${last.surprise_pct}%` : ""})` : ""}</div></div>
    <div class="analysis-grid">
      <div class="acard"><h4>${t("e.eps")}</h4><p>${esc(a.eps_trend)}</p></div>
      <div class="acard"><h4>${t("e.rev")}</h4><p>${esc(a.revenue_trend)}</p></div>
      <div class="acard"><h4>${t("e.margin")}</h4><p>${esc(a.margins_and_quality)}</p></div>
      <div class="acard"><h4>${t("e.guide")}</h4><p>${esc(a.guidance_notes || "—")}</p></div>
      <div class="acard full"><h4>${t("e.watch")}</h4><ul>${li(a.what_to_watch_next)}</ul></div>
      ${finRows ? `<div class="acard full"><h4>${t("e.fin")}</h4><table><thead><tr><th>${t("e.q")}</th><th>${t("e.qrev")}</th><th>${t("e.qni")}</th><th>${t("e.qmargin")}</th><th>${t("e.qeps")}</th></tr></thead><tbody>${finRows}</tbody></table></div>` : ""}
      ${hist.length ? `<div class="acard full"><h4>${t("e.hist")}</h4><table><thead><tr><th>${t("f.date")}</th><th>${t("e.actual")}</th><th>${t("an.est")}</th><th>${t("e.surprise")}</th></tr></thead><tbody>${histRows}</tbody></table></div>` : ""}
    </div><p class="muted small">${t("an.model")}: ${esc(a._model || "")}。${t("an.disclaimer")}</p>`;
}

// ===================== boot =====================
(async function init() {
  try { const s = await api("/api/settings"); lang = s.language || "zh"; } catch (_) {}
  $("#lang-select").value = lang;
  applyI18n();
  loadDashboard();
})();
