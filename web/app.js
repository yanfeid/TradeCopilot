// ---------- helpers ----------
async function api(path, opts = {}) {
  const res = await fetch(path, { headers: { "Content-Type": "application/json" }, ...opts });
  if (!res.ok) {
    let msg = res.statusText;
    try { msg = (await res.json()).detail || msg; } catch (_) {}
    throw new Error(msg);
  }
  return res.status === 204 ? null : res.json();
}
const $ = (s) => document.querySelector(s);
const esc = (s) => (s == null ? "" : String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])));
const money = (v) => (v == null ? "—" : `$${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
const big = (v) => {
  if (v == null) return "—";
  const a = Math.abs(v), s = v < 0 ? "−" : "";
  if (a >= 1e9) return `${s}$${(a / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `${s}$${(a / 1e6).toFixed(1)}M`;
  return `${s}$${a.toLocaleString()}`;
};
const cls = (v) => (v == null ? "" : v >= 0 ? "pos" : "neg");
const signed = (v) => (v == null ? "—" : `<span class="${cls(v)} num">${v >= 0 ? "+" : "−"}${money(Math.abs(v))}</span>`);
const pct = (v) => (v == null ? "—" : `<span class="${cls(v)} num">${v >= 0 ? "+" : ""}${v}%</span>`);

// ---------- tabs + auto refresh ----------
let currentTab = "dashboard";
const loaders = {
  dashboard: loadDashboard, journal: loadJournal, review: loadReview,
  watchlist: loadWatchlist, calendar: loadCalendar, analyze: () => {},
};
document.querySelectorAll("#tabs button").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#tabs button").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
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
function stamp() {
  $("#refresh-status").textContent = "更新于 " + new Date().toLocaleTimeString();
}

// ---------- dashboard ----------
async function loadDashboard() {
  const [pos, events] = await Promise.all([api("/api/positions"), api("/api/events")]);
  const t = pos.totals;
  const soon = events.filter((e) => {
    const d = (new Date(e.event_date) - new Date()) / 86400000;
    return d >= -1 && d <= 30;
  });
  $("#dash-cards").innerHTML = `
    ${metric("总市值", money(t.market_value))}
    ${metric("浮动盈亏", signed(t.unrealized))}
    ${metric("已实现盈亏", signed(t.realized))}
    ${metric("持仓数", pos.positions.length)}
    ${metric("30天内事件", soon.length)}`;

  $("#positions-table").innerHTML = pos.positions.length ? positionsTable(pos.positions) :
    `<p class="empty">还没有持仓。去「交易记录」记几笔买入,这里会自动算出成本和盈亏。</p>`;

  $("#dash-events").innerHTML = soon.length ? soon.map(eventItem).join("") :
    `<p class="empty">未来 30 天暂无事件。去「日历事件」添加,或一键生成非农日期。</p>`;
  stamp();
}
const metric = (label, value) => `<div class="metric"><div class="label">${label}</div><div class="value">${value}</div></div>`;

function positionsTable(rows) {
  const body = rows.map((p) => `<tr>
    <td><span class="tk">${esc(p.ticker)}</span></td>
    <td class="num">${p.quantity}</td>
    <td class="num">${money(p.avg_cost)}</td>
    <td class="num">${money(p.price)}</td>
    <td class="num">${money(p.market_value)}</td>
    <td>${signed(p.unrealized)} ${p.unrealized_pct != null ? `<span class="${cls(p.unrealized_pct)} small">(${p.unrealized_pct >= 0 ? "+" : ""}${p.unrealized_pct}%)</span>` : ""}</td>
    <td>${pct(p.change_pct)}</td>
  </tr>`).join("");
  return `<table><thead><tr>
    <th>代码</th><th>数量</th><th>成本均价</th><th>现价</th><th>市值</th><th>浮动盈亏</th><th>今日</th>
    </tr></thead><tbody>${body}</tbody></table>`;
}

// ---------- journal ----------
async function loadJournal() {
  const trades = await api("/api/trades");
  $("#trades-list").innerHTML = trades.length ? trades.map(tradeItem).join("") :
    `<p class="empty">还没有交易记录。用上面的表单记下你的第一笔。</p>`;
}
function tradeItem(t) {
  const conf = t.confidence ? ` · 信心 ${t.confidence}/5` : "";
  const emo = t.emotion ? ` · ${esc(t.emotion)}` : "";
  return `<div class="item">
    <div>
      <div class="title"><span class="tk">${esc(t.ticker)}</span>
        <span class="pill ${t.action === "SELL" ? "sell" : "buy"}">${t.action}</span>
        <span class="num">${t.quantity} @ ${money(t.price)}</span></div>
      <div class="meta">${esc(t.trade_date)}${conf}${emo}${t.tags ? " · " + esc(t.tags) : ""}</div>
      ${t.thesis ? `<div class="thesis">💭 ${esc(t.thesis)}</div>` : ""}
    </div>
    <button class="del" onclick="delTrade(${t.id})">删除</button>
  </div>`;
}
window.delTrade = async (id) => { await api(`/api/trades/${id}`, { method: "DELETE" }); loadJournal(); };

$("#trade-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const b = Object.fromEntries(new FormData(e.target).entries());
  const ticker = (b.ticker || "").toUpperCase();
  const wasBuy = (b.action || "BUY") === "BUY";
  b.quantity = parseFloat(b.quantity); b.price = parseFloat(b.price);
  b.confidence = b.confidence ? parseInt(b.confidence) : null;
  await api("/api/trades", { method: "POST", body: JSON.stringify(b) });
  e.target.reset();
  loadJournal();
  if (ticker) showExpectations(ticker, wasBuy);
});

const RECO = { strong_buy: "强烈买入", buy: "买入", outperform: "跑赢大盘", hold: "持有", underperform: "跑输大盘", sell: "卖出", strong_sell: "强烈卖出" };
async function showExpectations(ticker, wasBuy) {
  const box = $("#buy-expect");
  box.innerHTML = `<div class="expect"><span class="muted small">正在获取 ${esc(ticker)} 的财报日与市场预期…</span></div>`;
  try {
    const x = await api("/api/expectations/" + ticker);
    const reco = RECO[x.recommendation] || x.recommendation || "—";
    box.innerHTML = `<div class="expect">
      <h4>📌 ${wasBuy ? "已记录买入" : "已记录"} ${esc(x.name || ticker)} · 财报日与市场预期</h4>
      <div class="grid2">
        <div><div class="k">下次财报日</div><div class="v">${x.next_earnings || "—"}</div></div>
        <div><div class="k">EPS 预期(前瞻)</div><div class="v">${x.eps_estimate_next ?? "—"}</div></div>
        <div><div class="k">分析师评级</div><div class="v">${reco}${x.num_analysts ? `(${x.num_analysts}人)` : ""}</div></div>
        <div><div class="k">目标均价</div><div class="v">${money(x.target_mean)}</div></div>
        <div><div class="k">目标区间</div><div class="v">${money(x.target_low)} – ${money(x.target_high)}</div></div>
        <div><div class="k">较现价空间</div><div class="v">${pct(x.upside_pct)}</div></div>
      </div>
    </div>`;
  } catch (err) {
    box.innerHTML = `<div class="expect"><span class="muted small">市场预期获取失败:${esc(err.message)}</span></div>`;
  }
}

$("#csv-btn").addEventListener("click", async () => {
  const file = $("#csv-file").files[0];
  if (!file) return alert("先选一个 CSV 文件。");
  const fd = new FormData(); fd.append("file", file);
  const data = await (await fetch("/api/trades/import", { method: "POST", body: fd })).json();
  alert(`已导入 ${data.imported} 笔交易。`);
  loadJournal();
});

// ---------- review (复盘) ----------
async function loadReview() {
  const trades = await api("/api/review");
  $("#review-list").innerHTML = trades.length ? trades.map(reviewRow).join("") :
    `<p class="empty">还没有交易可复盘。先去「交易记录」记几笔。</p>`;
}
function reviewRow(t) {
  const ret = t.return_pct;
  const dir = t.action === "SELL" ? "卖出" : "买入";
  return `<div class="item">
    <div>
      <div class="title"><span class="tk">${esc(t.ticker)}</span>
        <span class="pill ${t.action === "SELL" ? "sell" : "buy"}">${dir}</span>
        <span class="num">@ ${money(t.price)}</span> → 现价 ${money(t.current_price)}
        <span class="${cls(ret)}">${ret != null ? (ret >= 0 ? "+" : "") + ret + "%" : "—"}</span></div>
      <div class="meta">${esc(t.trade_date)}${t.days_held != null ? ` · 持有 ${t.days_held} 天` : ""}${t.confidence ? ` · 信心 ${t.confidence}/5` : ""}${t.emotion ? " · " + esc(t.emotion) : ""}</div>
      ${t.thesis ? `<div class="thesis">💭 ${esc(t.thesis)}</div>` : `<div class="meta">(当时没写理由)</div>`}
    </div>
    <button class="btn-soft" onclick="reviewTrade(${t.id})">AI 复盘</button>
  </div>`;
}
window.reviewTrade = async (id) => {
  const box = $("#review-result");
  box.innerHTML = `<div class="panel"><p class="spinner">正在复盘这笔交易……(走你的 Claude 订阅)</p></div>`;
  try {
    const d = await api(`/api/review/${id}`, { method: "POST" });
    box.innerHTML = renderReview(d);
    box.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } catch (err) {
    box.innerHTML = `<div class="panel"><p class="neg">⚠ ${esc(err.message)}</p></div>`;
  }
};
function renderReview(d) {
  const r = d.review, t = d.trade, p = d.performance;
  const stars = "★".repeat(r.score || 0) + "☆".repeat(Math.max(0, 5 - (r.score || 0)));
  const list = (arr) => (arr && arr.length ? arr.map((x) => `<li>${esc(x)}</li>`).join("") : "<li class='muted'>—</li>");
  return `
    <div class="panel">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <strong style="font-size:16px">${esc(t.ticker)} 复盘</strong>
        <span class="${cls(p.return_pct)}">入场 ${money(p.entry_price)} → ${money(p.current_price)} (${p.return_pct >= 0 ? "+" : ""}${p.return_pct ?? "—"}%)</span>
        <span class="badge rating-Hold">决策评分 ${stars}</span>
      </div>
      <p style="margin-bottom:0"><strong>结论:</strong>${esc(r.verdict)}</p>
      <p class="snapshot"><strong>理由兑现度:</strong>${esc(r.thesis_held)}</p>
    </div>
    <div class="analysis-grid">
      <div class="acard"><h4 class="pos">✅ 做对的</h4><ul>${list(r.what_went_right)}</ul></div>
      <div class="acard"><h4 class="neg">❌ 偏差/失误</h4><ul>${list(r.what_went_wrong)}</ul></div>
      <div class="acard"><h4>🧠 情绪评估</h4><p>${esc(r.emotional_read)}</p></div>
      <div class="acard"><h4>🎯 教训</h4><p>${esc(r.lesson)}</p></div>
    </div>
    <p class="muted small">复盘评分衡量的是「决策质量」,和最终盈亏没有必然关系。仅供研究,非投资建议。</p>`;
}

// ---------- watchlist ----------
let watchSet = new Set();
let themesLoaded = false;
async function loadWatchlist() {
  const items = await api("/api/watchlist");
  watchSet = new Set(items.map((i) => i.ticker));
  $("#watch-list").innerHTML = items.length ? items.map(watchCard).join("") :
    `<p class="empty">自选股为空。在上面添加,或从下面「热门板块」一键加入。</p>`;
  stamp();
  if (!themesLoaded) loadThemes(); // load the theme grids once per session
}
function watchCard(w) {
  const q = w.quote || {};
  const id = w.ticker.replace(/[^A-Za-z0-9]/g, "");
  return `<div class="card">
    <div class="row1"><span class="tk">${esc(w.ticker)}</span><button class="del" onclick="delWatch('${esc(w.ticker)}')">×</button></div>
    <div class="price">${q.price != null ? money(q.price) : "—"}</div>
    <div>${pct(q.change_pct)} <span class="muted small">今日</span></div>
    ${w.note ? `<div class="meta muted small">${esc(w.note)}</div>` : ""}
    <div class="chart" id="chart-${id}"></div>
    <div style="margin-top:12px;display:flex;gap:8px">
      <button class="btn-soft" onclick="loadIntraday('${esc(w.ticker)}','${id}')">📈 分时</button>
      <button class="btn-soft" onclick="analyzeTicker('${esc(w.ticker)}')">分析</button>
    </div>
  </div>`;
}
window.delWatch = async (tk) => { await api(`/api/watchlist/${tk}`, { method: "DELETE" }); loadWatchlist(); };

window.loadIntraday = async (tk, id) => {
  const el = document.getElementById("chart-" + id);
  el.innerHTML = `<span class="muted small">加载分时中…</span>`;
  try {
    const d = await api("/api/intraday/" + tk);
    if (!d.points || !d.points.length) { el.innerHTML = `<span class="muted small">暂无分时数据</span>`; return; }
    const up = (d.last ?? 0) >= (d.open ?? 0);
    el.innerHTML = sparklineSVG(d.points.map((p) => p.c), up) +
      `<div class="muted small">区间 ${money(d.low)} – ${money(d.high)} · ${d.span === "1d" ? "今日分时" : "近5日"}</div>`;
  } catch (e) { el.innerHTML = `<span class="muted small">加载失败</span>`; }
};
function sparklineSVG(vals, up, w = 248, h = 56) {
  const min = Math.min(...vals), max = Math.max(...vals), range = (max - min) || 1;
  const step = w / (vals.length - 1 || 1);
  const pts = vals.map((v, i) => `${(i * step).toFixed(1)},${(h - ((v - min) / range) * (h - 6) - 3).toFixed(1)}`).join(" ");
  const color = up ? "var(--green)" : "var(--red)";
  return `<svg width="100%" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="display:block;margin-top:8px">
    <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
}

// ---------- hot themes ----------
async function loadThemes() {
  $("#themes").innerHTML = `<p class="spinner">正在加载各板块行情…</p>`;
  try {
    const d = await api("/api/themes");
    renderThemes(d);
    themesLoaded = true;
  } catch (e) {
    $("#themes").innerHTML = `<p class="neg">加载失败:${esc(e.message)}</p>`;
  }
}
function renderThemes(d) {
  $("#themes-status").textContent = d.source === "claude"
    ? "已用 Claude 更新" + (d.updated_at ? " · " + new Date(d.updated_at).toLocaleString() : "")
    : "精选默认榜单(可点上方按钮联网刷新)";
  $("#themes").innerHTML = d.themes.map(themeBlock).join("");
}
function themeBlock(g) {
  return `<div class="theme-block">
    <h4>${esc(g.name)} <span class="muted small">${g.stocks.length} 只</span></h4>
    <div class="stock-grid">${g.stocks.map(stockTile).join("")}</div>
  </div>`;
}
function stockTile(s) {
  const has = watchSet.has(s.ticker);
  return `<div class="stock-tile">
    <div class="t">${esc(s.ticker)}</div>
    <div class="p">${s.price != null ? money(s.price) : "—"} ${pct(s.change_pct)}</div>
    ${has ? `<div class="added">✓ 已在自选</div>`
          : `<button class="btn-soft add" onclick="addToWatch('${esc(s.ticker)}',this)">+ 加自选</button>`}
  </div>`;
}
window.addToWatch = async (tk, btn) => {
  try { await api("/api/watchlist", { method: "POST", body: JSON.stringify({ ticker: tk }) }); }
  catch (_) { /* already on the list — fine */ }
  watchSet.add(tk);
  if (btn) btn.outerHTML = `<div class="added">✓ 已在自选</div>`;
  loadWatchlist(); // refresh the cards above; themes are not re-fetched
};
$("#themes-refresh").addEventListener("click", async (e) => {
  $("#themes-status").textContent = "正在用 Claude 联网更新各板块最热…(约 1–2 分钟)";
  e.target.disabled = true;
  try { await api("/api/themes/refresh", { method: "POST" }); await loadThemes(); }
  catch (err) { $("#themes-status").textContent = "更新失败:" + err.message; }
  e.target.disabled = false;
});
$("#themes-reset").addEventListener("click", async () => {
  await api("/api/themes/reset", { method: "POST" });
  await loadThemes();
});

$("#watch-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const b = Object.fromEntries(new FormData(e.target).entries());
  try { await api("/api/watchlist", { method: "POST", body: JSON.stringify(b) }); }
  catch (err) { alert(err.message); }
  e.target.reset();
  loadWatchlist();
});

// ---------- calendar ----------
async function loadCalendar() {
  let stale = false;
  try {
    const s = await api("/api/events/sync", { method: "POST" });
    stale = s.macro_stale;
    $("#cal-status").textContent = s.macro_synced_at
      ? "宏观日历上次 Claude 刷新:" + new Date(s.macro_synced_at).toLocaleString()
      : "宏观日历尚未用 Claude 拉取过";
  } catch (_) {}
  await renderEvents();
  if (stale) runMacroClaude(true); // auto-pull once if >24h stale
}
async function renderEvents() {
  const events = await api("/api/events");
  $("#events-list").innerHTML = events.length ? events.map(eventItem).join("") :
    `<p class="empty">还没有事件。点上面「Claude 刷新宏观日历」联网拉取,或手动添加。</p>`;
}
async function runMacroClaude(auto) {
  $("#cal-status").textContent = "正在用 Claude 联网拉取宏观日历……";
  try {
    const r = await api("/api/events/macro-claude", { method: "POST" });
    $("#cal-status").textContent = `已刷新宏观日历(新增 ${r.added} 条) · ${new Date().toLocaleString()}`;
    await renderEvents();
  } catch (err) {
    $("#cal-status").textContent = "宏观拉取失败:" + err.message;
    if (!auto) alert(err.message);
  }
}
const SRC = { auto: "自动", "claude-macro": "Claude", "claude-search": "Claude搜索", manual: "" };
function eventItem(e) {
  const tag = e.category === "earnings" ? "📊" : e.category === "macro" ? "🌐" : e.category === "news" ? "📰" : "📌";
  const src = SRC[e.source] != null ? SRC[e.source] : e.source;
  return `<div class="item">
    <div>
      <div class="title">${tag} ${esc(e.title)} ${e.ticker ? `<span class="muted small">${esc(e.ticker)}</span>` : ""}</div>
      <div class="meta">${esc(e.event_date)} · ${esc(e.category)}${src ? " · " + src : ""}</div>
      ${e.notes ? `<div class="thesis">${esc(e.notes)}</div>` : ""}
    </div>
    <button class="del" onclick="delEvent(${e.id})">删除</button>
  </div>`;
}
window.delEvent = async (id) => { await api(`/api/events/${id}`, { method: "DELETE" }); renderEvents(); };

$("#event-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const b = Object.fromEntries(new FormData(e.target).entries());
  if (!b.ticker) delete b.ticker;
  await api("/api/events", { method: "POST", body: JSON.stringify(b) });
  e.target.reset(); $("#event-form").category.value = "custom";
  renderEvents();
});
$("#sync-now").addEventListener("click", loadCalendar);
$("#macro-claude").addEventListener("click", () => runMacroClaude(false));
$("#search-btn").addEventListener("click", async () => {
  const q = $("#event-search").value.trim();
  if (!q) return;
  const btn = $("#search-btn"); btn.textContent = "搜索中…"; btn.disabled = true;
  try {
    const r = await api("/api/events/search", { method: "POST", body: JSON.stringify({ query: q }) });
    alert(`找到 ${r.found} 条,新增 ${r.added} 条。`);
    await renderEvents();
  } catch (err) { alert(err.message); }
  btn.textContent = "用 Claude 搜索"; btn.disabled = false;
});
document.querySelectorAll("#macro-quick .chip").forEach((b) => {
  b.addEventListener("click", () => {
    const f = $("#event-form");
    f.title.value = b.dataset.title; f.category.value = "macro"; f.event_date.focus();
  });
});

// ---------- analyze ----------
$("#analyze-form").addEventListener("submit", (e) => {
  e.preventDefault();
  analyzeTicker(new FormData(e.target).get("ticker"));
});
window.analyzeTicker = async (ticker) => {
  document.querySelector('#tabs button[data-tab="analyze"]').click();
  $("#analyze-result").innerHTML = `<div class="panel"><p class="spinner">正在拉取数据并分析 ${esc(ticker)}……(约 10–30 秒,走你的 Claude 订阅)</p></div>`;
  try {
    const data = await api(`/api/analyze/${ticker}`, { method: "POST" });
    $("#analyze-result").innerHTML = renderAnalysis(data);
  } catch (err) {
    $("#analyze-result").innerHTML = `<div class="panel"><p class="neg">⚠ ${esc(err.message)}</p></div>`;
  }
};
$("#earnings-btn").addEventListener("click", () => {
  const tk = $("#analyze-form").ticker.value.trim();
  if (!tk) return alert("先输入代码");
  earningsAnalyze(tk);
});
async function earningsAnalyze(ticker) {
  document.querySelector('#tabs button[data-tab="analyze"]').click();
  $("#analyze-result").innerHTML = `<div class="panel"><p class="spinner">正在分析 ${esc(ticker)} 的财报……(约 10–30 秒,走你的 Claude 订阅)</p></div>`;
  try {
    const d = await api(`/api/earnings-analysis/${ticker}`, { method: "POST" });
    $("#analyze-result").innerHTML = renderEarnings(d);
  } catch (err) {
    $("#analyze-result").innerHTML = `<div class="panel"><p class="neg">⚠ ${esc(err.message)}</p></div>`;
  }
}
function verdictClass(v) {
  if (["Strong beat", "Beat"].includes(v)) return "rating-Buy";
  if (["Miss", "Weak"].includes(v)) return "rating-Sell";
  return "rating-Hold";
}
function renderEarnings(d) {
  const a = d.analysis, e = d.earnings || {}, ov = d.overview || {};
  const last = e.last;
  const fin = d.financials || {};
  const q = (fin.quarterly || []).slice(0, 6);
  const hist = (e.history || []).filter((h) => h.reported_eps != null).slice(-6);
  const list = (arr) => (arr && arr.length ? arr.map((x) => `<li>${esc(x)}</li>`).join("") : "<li class='muted'>—</li>");
  const histRows = hist.map((h) => `<tr><td>${esc(h.date)}</td><td class="num">${h.reported_eps ?? "—"}</td><td class="num">${h.eps_estimate ?? "—"}</td><td>${h.surprise_pct != null ? pct(h.surprise_pct) : "—"}</td></tr>`).join("");
  const finRows = q.map((r) => `<tr><td>${esc(r.period)}</td><td class="num">${big(r.revenue)}</td><td class="num">${big(r.net_income)}</td><td class="num">${r.net_margin != null ? r.net_margin + "%" : "—"}</td><td class="num">${r.eps ?? "—"}</td></tr>`).join("");
  return `
    <div class="panel">
      <div style="display:flex;align-items:center;flex-wrap:wrap">
        <strong style="font-size:17px">${esc(ov.name || d.ticker)} · 财报分析</strong>
        <span class="badge ${verdictClass(a.verdict)}">${esc(a.verdict || "?")}</span>
      </div>
      <p style="margin-bottom:0">${esc(a.summary)}</p>
      <div class="snapshot">下次财报 ${e.next_date || "—"}${last ? ` · 上次 ${esc(last.date)}:EPS ${last.reported_eps ?? "—"}(预期 ${last.eps_estimate ?? "—"}${last.surprise_pct != null ? `,超预期 ${last.surprise_pct >= 0 ? "+" : ""}${last.surprise_pct}%` : ""})` : ""}</div>
    </div>
    <div class="analysis-grid">
      <div class="acard"><h4>📈 EPS 趋势</h4><p>${esc(a.eps_trend)}</p></div>
      <div class="acard"><h4>💰 营收趋势</h4><p>${esc(a.revenue_trend)}</p></div>
      <div class="acard"><h4>🧮 利润率与质量</h4><p>${esc(a.margins_and_quality)}</p></div>
      <div class="acard"><h4>🧭 前瞻指引</h4><p>${esc(a.guidance_notes || "—")}</p></div>
      <div class="acard full"><h4>👀 下季度关注</h4><ul>${list(a.what_to_watch_next)}</ul></div>
      ${finRows ? `<div class="acard full"><h4>季度财务</h4><table><thead><tr><th>季度</th><th>营收</th><th>净利润</th><th>净利率</th><th>EPS</th></tr></thead><tbody>${finRows}</tbody></table></div>` : ""}
      ${hist.length ? `<div class="acard full"><h4>历史财报(EPS 超预期)</h4><table><thead><tr><th>日期</th><th>实际 EPS</th><th>预期</th><th>超预期</th></tr></thead><tbody>${histRows}</tbody></table></div>` : ""}
    </div>
    <p class="muted small">模型:${esc(a._model || "")}。仅供研究,非投资建议。</p>`;
}
function renderAnalysis(data) {
  const a = data.analysis, s = data.snapshot || {};
  const ov = s.overview || {}, q = s.quote || {}, p = s.performance || {}, ea = s.earnings || {};
  const list = (arr) => (arr && arr.length ? arr.map((x) => `<li>${esc(x)}</li>`).join("") : "<li class='muted'>—</li>");
  const last = ea.last;
  return `
    <div class="panel">
      <div style="display:flex;align-items:center;flex-wrap:wrap">
        <strong style="font-size:17px">${esc(ov.name || data.ticker)}</strong>
        <span class="badge rating-${esc(a.rating)}">${esc(a.rating || "?")}</span>
      </div>
      <div class="snapshot">
        ${money(q.price)} · ${pct(q.change_pct)} 今日 · 1月 ${pct(p.perf_1m)} · 3月 ${pct(p.perf_3m)} · 6月 ${pct(p.perf_6m)}<br/>
        ${ov.sector ? esc(ov.sector) + " · " : ""}P/E ${ov.trailing_pe ? Number(ov.trailing_pe).toFixed(1) : "—"} ·
        下次财报 ${ea.next_date || "—"}${last ? ` · 上次 EPS ${last.reported_eps ?? "—"}(预期 ${last.eps_estimate ?? "—"})` : ""}
      </div>
      <p style="margin-bottom:0">${esc(a.summary)}</p>
    </div>
    <div class="analysis-grid">
      <div class="acard"><h4 class="pos">🐂 看多</h4><ul>${list(a.bull_case)}</ul></div>
      <div class="acard"><h4 class="neg">🐻 看空</h4><ul>${list(a.bear_case)}</ul></div>
      <div class="acard"><h4>⚠ 主要风险</h4><ul>${list(a.key_risks)}</ul></div>
      <div class="acard"><h4>🗓 即将到来的催化剂</h4><ul>${list(a.upcoming_catalysts)}</ul></div>
      ${a.notes_on_my_trades ? `<div class="acard full"><h4>💼 对我持仓的点评</h4><p>${esc(a.notes_on_my_trades)}</p></div>` : ""}
    </div>
    <p class="muted small">模型:${esc(a._model || "")}。仅供研究,非投资建议。</p>`;
}

loadDashboard();
