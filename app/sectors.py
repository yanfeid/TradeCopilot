"""Curated 'hot stocks by theme' lists shown in the Watchlist tab.

These are popular, liquid names per theme — a sensible default that loads
instantly and for free. The user can refresh them to the current hottest via
Claude (web search); that override is stored in the meta table and, when
present, replaces this default.
"""

DEFAULT_THEMES = [
    {"key": "semis", "name": "半导体",
     "tickers": ["NVDA", "AMD", "TSM", "AVGO", "ASML", "MU", "QCOM", "ARM", "INTC", "SMCI"]},
    {"key": "ai", "name": "人工智能",
     "tickers": ["NVDA", "MSFT", "GOOGL", "META", "PLTR", "AMD", "AVGO", "SMCI", "ARM", "AI"]},
    {"key": "space", "name": "太空",
     "tickers": ["RKLB", "ASTS", "LUNR", "RDW", "PL", "BKSY", "DXYZ", "SPCE", "LMT", "NOC", "BA"]},
    {"key": "optical", "name": "光模块",
     "tickers": ["AVGO", "MRVL", "NOK", "COHR", "LITE", "CIEN", "FN", "AAOI", "CRDO", "MTSI"]},
    {"key": "biopharma", "name": "医药生物",
     "tickers": ["LLY", "NVO", "JNJ", "MRK", "ABBV", "PFE", "AMGN", "VRTX", "GILD", "MRNA"]},
    {"key": "crypto", "name": "加密货币",
     "tickers": ["BTC-USD", "ETH-USD", "SOL-USD", "COIN", "MSTR", "MARA", "RIOT", "CLSK", "HUT", "WULF"]},
    {"key": "ev", "name": "新能源车",
     "tickers": ["TSLA", "RIVN", "LCID", "NIO", "LI", "XPEV", "BYDDY", "GM", "F", "PSNY"]},
    {"key": "quantum", "name": "量子计算",
     "tickers": ["IONQ", "RGTI", "QBTS", "QUBT", "ARQQ", "IBM", "GOOGL", "HON", "NVDA", "MSFT"]},
    {"key": "nuclear", "name": "核能与铀",
     "tickers": ["CCJ", "OKLO", "SMR", "LEU", "NNE", "UEC", "UUUU", "DNN", "VST", "CEG"]},
    {"key": "gold", "name": "黄金/贵金属",
     "tickers": ["GLD", "NEM", "AEM", "GOLD", "WPM", "FNV", "KGC", "AU", "PAAS", "SLV"]},
    {"key": "fintech", "name": "金融科技/支付",
     "tickers": ["HOOD", "COIN", "PYPL", "SOFI", "AFRM", "NU", "MELI", "FOUR", "TOST", "UPST"]},
]

# Tickers that must stay in a theme even after a Claude "hottest" refresh
# (the user asked for these specifically).
PINNED = {
    "space": ["DXYZ"],            # SpaceX exposure proxy (SpaceX itself is private)
    "optical": ["AVGO", "MRVL", "NOK"],
}

