"""
app.py — Dashboard Fase 5: Knowledge Discovery in Banking (Lending Club).

Identitas visual "Synthetic Capital" (DESIGN.md) + tata letak "Institutional Grade"
(top-nav + sidebar kiri tetap, panel kaca sudut besar, aksen Neon Lime & Electric Violet).
Kerangka layout mengacu mockup LC AI Core, TAPI seluruh isi = data KDD nyata Fase 1-4.

Menjalankan:  pip install dash plotly pandas ; python app.py  ->  http://127.0.0.1:8050
"""
from __future__ import annotations
import base64
import dash
from dash import dcc, html, Input, Output, State
import plotly.graph_objects as go

import data_loader as dl
from theme import COLORS, VERDICT_COLORS, TIER_COLORS, plotly_layout, FONT_MONO

# ---------------------------------------------------------------------------
# Data (cache di memori)
# ---------------------------------------------------------------------------
ACC = dl.load_anomaly("accepted")
REJ = dl.load_anomaly("rejected")
RULES = {"accepted": dl.load_rules("accepted"),
         "rejected": dl.load_rules("rejected")}
CLUSTERS = dl.load_clusters()
KPI = dl.kpi_summary(ACC, REJ, RULES["accepted"])
DB_META = {"accepted": dl.load_dbscan_meta("accepted"),
           "rejected": dl.load_dbscan_meta("rejected")}
DATASETS = {"accepted": ACC, "rejected": REJ}
YEAR_RANGE = dl.year_bounds(ACC, REJ)   # None bila kolom 'year' belum ada -> filter disembunyikan


def dataset_for(dataset, years=None):
    """Dataframe dataset terpilih, sudah disaring ke rentang tahun."""
    return dl.filter_years(DATASETS[dataset or "accepted"], years)


def rules_for(dataset):
    """Association rules Fase 3 untuk dataset terpilih (accepted/rejected)."""
    return RULES.get(dataset or "accepted", RULES["accepted"])


def year_presets(lo, hi):
    """Tombol preset: lompat cepat tanpa men-drag dua handle."""
    opts = [("Semua", lo, hi)]
    for n in (10, 5, 3):
        if hi - n + 1 > lo:
            opts.append((f"{n}Y terakhir", hi - n + 1, hi))
    return html.Div(className="year-presets", children=[
        html.Button(lbl, id={"type": "yr-preset", "index": f"{a}-{b}"},
                    className="year-preset-btn", n_clicks=0)
        for lbl, a, b in opts
    ])


def year_slider(value=None):
    """Slider rentang tahun. None bila data tak punya kolom 'year'."""
    if not YEAR_RANGE:
        return None
    lo, hi = YEAR_RANGE
    if lo >= hi:
        return None
    val = list(value) if value else [lo, hi]
    val = [max(lo, int(val[0])), min(hi, int(val[1]))]

    span = hi - lo
    step_mark = 1 if span <= 8 else (2 if span <= 16 else max(1, span // 8))
    marks = {}
    for y in range(lo, hi + 1):
        if (y - lo) % step_mark == 0 or y in (lo, hi):
            marks[y] = {"label": str(y) if span <= 16 else f"'{str(y)[2:]}"}

    return html.Div(className="year-filter", children=[
        html.Div(className="year-filter-head", children=[
            html.Div(className="year-filter-title", children=[
                html.Span("Rentang tahun", className="year-filter-label"),
                html.Span(id="year-readout", className="year-badge",
                          children=(f"{val[0]}" if val[0] == val[1]
                                    else f"{val[0]}\u2013{val[1]}")),
            ]),
            html.Div(className="year-filter-actions", children=[
                html.Span(id="year-count", className="year-count"),
                year_presets(lo, hi),
            ]),
        ]),
        dcc.RangeSlider(id="year-slider", min=lo, max=hi, step=1,
                        value=val, marks=marks,
                        tooltip={"placement": "bottom", "always_visible": False},
                        allowCross=False, updatemode="mouseup",
                        className="year-slider"),
    ])


# ---------------------------------------------------------------------------
# Ikon SVG -> data-URI img (tanpa dependency tambahan)
# ---------------------------------------------------------------------------
def svg_uri(inner, stroke="currentColor"):
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" '
           f'fill="none" stroke="{stroke}" stroke-width="1.7" '
           f'stroke-linecap="round" stroke-linejoin="round">{inner}</svg>')
    b64 = base64.b64encode(svg.encode()).decode()
    return f"data:image/svg+xml;base64,{b64}"


_ICON_PATHS = {
    "ringkasan": '<line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="14" y2="18"/>',
    "segmentasi": '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
    "rules": '<circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M6 8v3a2 2 0 002 2h8a2 2 0 002-2V8M12 13v3"/>',
    "anomali": '<circle cx="11" cy="11" r="6"/><line x1="15.5" y1="15.5" x2="20" y2="20"/><line x1="11" y1="8.5" x2="11" y2="11.5"/>',
    "brand": '<path d="M4 20V9M9.5 20V4M15 20v-8M20.5 20V7"/>',
}
ICON = {k: svg_uri(v, stroke="#c4c9ac") for k, v in _ICON_PATHS.items()}
ICON_ACTIVE = {k: svg_uri(v, stroke="#c3f400") for k, v in _ICON_PATHS.items()}
ICON_INK = {k: svg_uri(v, stroke="#161e00") for k, v in _ICON_PATHS.items()}

TABS = [("ringkasan", "Ringkasan"), ("segmentasi", "Segmentasi"),
        ("rules", "Association Rules"), ("anomali", "Anomali")]


def hero_metrics(dataset, years=None):
    df = dataset_for(dataset, years)
    tier = dl.tier_counts(df)
    strong = int(tier[tier["tier"].isin([
        "Kritis (DBSCAN + 3 metode)", "Sangat Kuat (DBSCAN + metode)",
        "Kuat (3 metode)"])]["jumlah"].sum())
    total = int(tier["jumlah"].sum()) or 1
    return {
        "strong_pct": round(strong / total * 100, 1),
        "strong": strong, "total": len(df),
        "kritis": int(tier[tier["tier"] == "Kritis (DBSCAN + 3 metode)"]["jumlah"].sum()),
        "dbscan": DB_META[dataset].get("n_noise", 0),
    }


# ---------------------------------------------------------------------------
# CSS "Synthetic Capital" (shell dua kolom)
# ---------------------------------------------------------------------------
INDEX_HTML = """
<!DOCTYPE html>
<html>
<head>
    {%metas%}<title>LC KDD Core — Knowledge Discovery</title>{%favicon%}{%css%}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
      :root{
        --bg:#131318;--bg-deep:#0e0e13;--lime:#c3f400;--lime-dim:#abd600;
        --violet:#d0bcff;--violet-deep:#571bc1;--cyan:#7df4ff;--error:#ffb4ab;
        --amber:#ffd479;--text:#e4e1e9;--muted:#c4c9ac;--line:rgba(255,255,255,.12);
        --glass:rgba(255,255,255,.03);--glass2:rgba(255,255,255,.06);
        --display:'Space Grotesk',system-ui,sans-serif;--body:'Inter',system-ui,sans-serif;
        --mono:'JetBrains Mono','Courier New',monospace;--side:238px;--nav:66px;
      }
      *{box-sizing:border-box}
      html,body{margin:0;padding:0;background:var(--bg);color:var(--text)}
      body{font-family:var(--body);-webkit-font-smoothing:antialiased;
        background-image:
          radial-gradient(48% 40% at 6% 3%, rgba(195,244,0,.07), transparent 60%),
          radial-gradient(44% 40% at 100% 0%, rgba(208,188,255,.10), transparent 60%);
        background-attachment:fixed}
      a{color:inherit;text-decoration:none}
      img{display:block}

      .topnav{position:fixed;top:0;left:0;right:0;height:var(--nav);z-index:40;
        display:flex;align-items:center;gap:20px;padding:0 22px;
        background:rgba(14,14,19,.72);border-bottom:1px solid var(--line);
        backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}
      .topnav-left{display:flex;align-items:center;gap:18px;min-width:0}
      .wordmark{font-family:var(--display);font-weight:700;font-size:16px;color:var(--lime);white-space:nowrap}
      .crumb{display:flex;align-items:center;gap:10px;font-family:var(--mono);font-size:12px;
        white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .crumb-muted{color:var(--muted)}
      .crumb-sep{color:var(--line)}
      .crumb-cur{color:var(--text)}
      .topnav-right{margin-left:auto;display:flex;align-items:center;gap:14px;flex:none}
      .toggle-inline{display:flex;align-items:center;gap:10px}
      .toggle-inline .toggle-label{font-family:var(--mono);font-size:10px;letter-spacing:.12em;
        text-transform:uppercase;color:var(--muted)}
      .live-badge{font-family:var(--mono);font-size:11px;letter-spacing:.09em;color:var(--lime);
        border:1px solid rgba(195,244,0,.4);border-radius:9999px;padding:6px 12px;
        display:flex;align-items:center;gap:7px}
      .live-dot{width:7px;height:7px;border-radius:50%;background:var(--lime);
        box-shadow:0 0 8px var(--lime);animation:pulse 2.4s infinite}
      @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
      .avatar{width:32px;height:32px;border-radius:50%;border:1px solid var(--line);flex:none;
        background:conic-gradient(from 210deg,var(--violet),var(--lime),var(--cyan),var(--violet))}

      .sidebar{position:fixed;top:var(--nav);left:0;bottom:0;width:var(--side);z-index:30;
        padding:24px 18px;display:flex;flex-direction:column;
        background:rgba(14,14,19,.55);border-right:1px solid var(--line);
        backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}
      .brand{display:flex;gap:12px;align-items:center;margin-bottom:28px;padding:0 6px}
      .brand-badge{width:38px;height:38px;border-radius:11px;flex:none;
        background:radial-gradient(circle at 30% 30%,var(--lime),var(--lime-dim));
        display:grid;place-items:center;box-shadow:0 0 18px rgba(195,244,0,.35)}
      .brand-badge img{width:20px;height:20px}
      .brand-name{font-family:var(--display);font-weight:700;font-size:14px;line-height:1.1}
      .brand-sub{font-family:var(--mono);font-size:9px;letter-spacing:.14em;text-transform:uppercase;
        color:var(--muted);margin-top:3px}
      .nav-group-label{font-family:var(--mono);font-size:10px;letter-spacing:.16em;text-transform:uppercase;
        color:var(--muted);padding:0 10px;margin:4px 0 10px}
      .nav-item{display:flex;align-items:center;gap:12px;padding:11px 12px;border-radius:12px;
        font-size:14px;color:var(--muted);cursor:pointer;margin-bottom:4px;background:transparent;
        border:1px solid transparent;width:100%;text-align:left;font-family:var(--body);transition:all .16s}
      .nav-item img{width:18px;height:18px;flex:none}
      .nav-item:hover{color:var(--text);background:var(--glass)}
      .nav-item.active{color:var(--lime);background:var(--glass2);border-color:rgba(195,244,0,.35);font-weight:500}
      .nav-item:focus-visible{outline:2px solid var(--violet);outline-offset:2px}
      .side-cta{margin-top:auto;font-family:var(--mono);font-weight:600;font-size:13px;letter-spacing:.04em;
        color:#161e00;background:var(--lime);border:none;border-radius:9999px;padding:14px;cursor:pointer;
        box-shadow:0 0 22px rgba(195,244,0,.32);transition:transform .12s}
      .side-cta:hover{transform:translateY(-1px)}
      .side-links{margin-top:14px;display:flex;flex-direction:column;gap:2px}
      .side-links a{font-size:13px;color:var(--muted);padding:8px 12px}
      .side-links a:hover{color:var(--text)}

      html,body{overflow-x:hidden;max-width:100%}
      .main{margin-left:var(--side);margin-top:var(--nav);padding:30px 34px 60px;
        width:calc(100% - var(--side));max-width:1520px;min-width:0}
      /* Plotly harus mengikuti lebar kartu, bukan default 700px */
      .dash-graph,.js-plotly-plot,.plot-container,.svg-container{width:100%!important;min-width:0!important}
      .dash-graph .main-svg{width:100%!important}
      .card,.callout{overflow:hidden;min-width:0}
      .page-head{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;
        flex-wrap:wrap;margin-bottom:24px}
      .page-head-text{min-width:0;flex:1 1 340px}
      .eyebrow{font-family:var(--mono);font-size:11.5px;letter-spacing:.16em;text-transform:uppercase;
        color:var(--lime);margin:0 0 10px}
      .page-title{font-family:var(--display);font-weight:700;letter-spacing:-.025em;
        font-size:clamp(28px,3.2vw,44px);line-height:1.03;margin:0}
      .page-sub{color:var(--muted);max-width:58ch;margin:14px 0 0;font-size:14.5px;line-height:1.6}
      .page-sub b{color:var(--lime);font-weight:600}

      .pill-row{display:flex;gap:14px;flex-wrap:wrap;justify-content:flex-end;flex:0 1 auto}
      .pill{background:var(--glass);border:1px solid var(--line);border-radius:20px;padding:15px 20px;
        min-width:120px;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}
      .pill-label{font-family:var(--mono);font-size:10px;letter-spacing:.09em;text-transform:uppercase;
        color:var(--muted);line-height:1.4}
      .pill-value{font-family:var(--mono);font-weight:700;font-size:25px;margin-top:8px;line-height:1}
      .pill.accent .pill-value{color:var(--lime)}
      .pill.ai .pill-value{color:var(--violet)}

      .seg{display:flex;background:var(--bg-deep);border:1px solid var(--line);border-radius:9999px;padding:3px}
      .seg label{font-family:var(--mono);font-size:12px;padding:7px 15px;border-radius:9999px;cursor:pointer;
        color:var(--muted);transition:all .16s;white-space:nowrap}
      .seg input{position:absolute;opacity:0;width:0;height:0}
      .seg input:checked + label{color:#161e00;background:var(--lime);font-weight:600;box-shadow:0 0 14px rgba(195,244,0,.35)}
      .seg label:hover{color:var(--text)}
      .seg input:focus-visible + label{outline:2px solid var(--violet);outline-offset:2px}

      .grid{display:grid;gap:18px;margin-bottom:18px;min-width:0}
      .g-21{grid-template-columns:minmax(0,1.5fr) minmax(0,1fr)}
      .g-11{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}
      .g-3{grid-template-columns:repeat(3,minmax(0,1fr))}
      @media (max-width:1080px){.g-21,.g-11,.g-3{grid-template-columns:minmax(0,1fr)}}
      .card{position:relative;background:var(--glass);border:1px solid var(--line);border-radius:26px;
        padding:24px 26px;min-width:0;overflow:hidden;
        backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px)}
      .card .js-plotly-plot,.card .plot-container{max-width:100%!important}
      .card::before{content:"";position:absolute;top:0;left:0;right:0;height:1px;
        background:linear-gradient(90deg,rgba(255,255,255,.26),transparent 60%);border-radius:26px 26px 0 0}
      .card-head{display:flex;justify-content:space-between;align-items:center;gap:14px;margin-bottom:4px}
      .card h3{font-family:var(--display);font-weight:600;font-size:18px;margin:0;letter-spacing:-.01em}
      .badge{font-family:var(--mono);font-size:10.5px;letter-spacing:.05em;color:var(--muted);
        border:1px solid var(--line);border-radius:9999px;padding:5px 11px;white-space:nowrap}
      .hint{color:var(--muted);font-size:13px;line-height:1.5;margin:6px 0 14px}

      .gauge-card{display:flex;flex-direction:column;align-items:center;text-align:center}
      .gauge-note{color:var(--muted);font-size:12.5px;line-height:1.55;margin-top:2px;max-width:32ch}
      .mini-row{display:flex;gap:12px;width:100%;margin-top:18px}
      .mini{flex:1;background:var(--glass);border:1px solid var(--line);border-radius:16px;padding:12px 14px;text-align:left}
      .mini-l{font-family:var(--mono);font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
      .mini-v{font-family:var(--mono);font-weight:700;font-size:18px;margin-top:6px}
      .mini.danger .mini-v{color:var(--error)}
      .mini.cyan .mini-v{color:var(--cyan)}

      .callout{position:relative;background:linear-gradient(135deg,rgba(87,27,193,.26),rgba(19,19,24,.4));
        border:1px solid rgba(208,188,255,.32);border-radius:26px;padding:26px 30px;overflow:hidden;
        margin-bottom:18px;backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px)}
      .callout::after{content:"";position:absolute;right:-40px;top:-40px;width:200px;height:200px;
        border-radius:50%;background:radial-gradient(circle,rgba(195,244,0,.2),transparent 70%)}
      .callout .q{font-family:var(--mono);font-size:12px;letter-spacing:.06em;text-transform:uppercase;
        color:var(--violet);margin:0 0 12px}
      .callout .a{font-family:var(--display);font-weight:500;font-size:clamp(17px,2.1vw,23px);line-height:1.45;
        margin:0;max-width:70ch;position:relative;z-index:1}
      .callout .a b{color:var(--lime);font-weight:600}

      .case{background:var(--glass);border:1px solid var(--line);border-radius:20px;padding:18px 20px;
        position:relative;overflow:hidden}
      .case-tag{font-family:var(--mono);font-size:11px;color:var(--muted);letter-spacing:.05em;margin-bottom:10px}
      .case-title{font-family:var(--display);font-weight:600;font-size:16px;margin-bottom:10px}
      .case-body{font-size:13.5px;line-height:1.6}
      .case-body b{font-family:var(--mono);font-size:12.5px}
      .case::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px}
      .case.risk{border-color:rgba(255,180,171,.4)}.case.risk .case-title{color:var(--error)}.case.risk::before{background:var(--error)}
      .case.rare{border-color:rgba(125,244,255,.4)}.case.rare .case-title{color:var(--cyan)}.case.rare::before{background:var(--cyan)}
      .case.err{border-color:rgba(255,212,121,.45)}.case.err .case-title{color:var(--amber)}.case.err::before{background:var(--amber)}

      /* Glosarium / legenda tab Anomali */
      .glossary{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:22px 30px;margin-top:6px}
      @media (max-width:820px){.glossary{grid-template-columns:minmax(0,1fr)}}
      .gloss-group-label{font-family:var(--mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;
        color:var(--muted);margin:0 0 12px;padding-bottom:8px;border-bottom:1px solid var(--line)}
      .gloss-item{display:flex;gap:12px;align-items:flex-start;margin-bottom:13px}
      .gloss-sw{flex:none;width:16px;height:16px;margin-top:2px;display:grid;place-items:center}
      .sw{width:13px;height:13px;box-sizing:border-box}
      .sw.dot{border-radius:50%;background:var(--violet)}
      .sw.dot-hi{border-radius:50%;background:var(--lime);box-shadow:0 0 7px rgba(195,244,0,.5)}
      .sw.ring{border-radius:50%;background:transparent;border:1.8px solid var(--cyan)}
      .sw.sq-open{background:transparent;border:1.8px solid var(--violet)}
      .sw.dia-open{width:11px;height:11px;background:transparent;border:1.8px solid var(--amber);transform:rotate(45deg)}
      .sw.chip{width:14px;height:14px;border-radius:4px}
      .gloss-text{min-width:0}
      .gloss-term{font-family:var(--body);font-weight:600;font-size:13.5px;line-height:1.3}
      .gloss-desc{color:var(--muted);font-size:12.5px;line-height:1.5;margin-top:2px}
      .gloss-desc b{color:var(--text);font-family:var(--mono);font-size:11.5px;font-weight:500}
      .gloss-note{color:var(--muted);font-size:12px;line-height:1.5;margin:6px 0 0;font-style:italic}

      /* Kartu narasi Association Rules */
      .rule-card{background:var(--glass);border:1px solid var(--line);border-radius:18px;
        padding:16px 20px;margin-bottom:12px;position:relative;overflow:hidden}
      .rule-card::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--lime)}
      .rule-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:8px}
      .rule-no{font-family:var(--mono);font-size:11px;letter-spacing:.06em;color:var(--muted)}
      .rule-lift{font-family:var(--mono);font-weight:700;font-size:13px;color:#161e00;background:var(--lime);
        border-radius:9999px;padding:4px 12px;box-shadow:0 0 12px rgba(195,244,0,.3)}
      .rule-narr{font-family:var(--body);font-size:15px;line-height:1.55;margin:0 0 12px;color:var(--text)}
      .rule-meter{height:6px;border-radius:9999px;background:var(--glass2);overflow:hidden;margin-bottom:8px}
      .rule-meter-fill{height:100%;border-radius:9999px;
        background:linear-gradient(90deg,var(--violet),var(--lime))}
      .rule-meta{font-family:var(--mono);font-size:11px;letter-spacing:.03em;color:var(--muted)}

      .rc-slider-track{background:var(--lime)!important}
      .rc-slider-handle{border-color:var(--lime)!important;background:var(--bg-deep)!important;
        box-shadow:0 0 10px rgba(195,244,0,.5)!important;opacity:1!important}
      .rc-slider-rail{background:var(--line)!important}

      .foot{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-top:30px;padding-top:18px;
        border-top:1px solid var(--line);font-family:var(--mono);font-size:11px;color:var(--muted);letter-spacing:.04em}

      .mtabs{display:none}

      /* Tablet: sidebar menyempit jadi rail ikon (TETAP terlihat) */
      @media (max-width:1080px){
        :root{--side:68px}
        .brand-name,.brand-sub,.nav-group-label,.nav-item span,
        .side-cta,.side-links{display:none}
        .brand{justify-content:center;padding:0}
        .nav-item{justify-content:center;padding:12px}
        .sidebar{padding:20px 10px;align-items:center}
        .crumb{display:none}
      }
      @media (max-width:720px){
        .topnav{gap:12px;padding:0 14px}
        .toggle-inline .toggle-label{display:none}
        .main{padding:22px 14px 48px}
      }
      @media (max-width:560px){
        .live-badge{display:none}
      }
      @media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
    </style>
</head>
<body>{%app_entry%}<footer>{%config%}{%scripts%}{%renderer%}</footer></body>
</html>
"""

app = dash.Dash(__name__, suppress_callback_exceptions=True,
                title="LC KDD Core — Knowledge Discovery")
app.index_string = INDEX_HTML
server = app.server


# ---------------------------------------------------------------------------
# Shell: top-nav + sidebar
# ---------------------------------------------------------------------------
TAB_LABEL = {k: lbl for k, lbl in TABS}


def topnav():
    """Statis, dirender sekali. Navigasi tab ada di sidebar; top-nav hanya konteks,
    kontrol global (dataset toggle), dan status."""
    return html.Div(className="topnav", children=[
        html.Div(className="topnav-left", children=[
            html.Div("LC KDD CORE", className="wordmark"),
            html.Div(id="crumb-slot", className="crumb"),
        ]),
        html.Div(className="topnav-right", children=[
            html.Div(className="toggle-inline", children=[
                html.Span("Dataset", className="toggle-label"),
                html.Div(className="seg", children=[
                    dcc.RadioItems(
                        id="dataset-toggle",
                        options=[{"label": "Accepted", "value": "accepted"},
                                 {"label": "Rejected", "value": "rejected"}],
                        value="accepted"),
                ]),
            ]),
            html.Div(className="live-badge", children=[
                html.Span(className="live-dot"), "LIVE"]),
            html.Div(className="avatar"),
        ]),
    ])


def mobile_tabs(active):
    return html.Div(className="mtabs", children=[
        html.Button(lbl, id={"type": "mtab", "index": key}, n_clicks=0,
                    className="mtab active" if key == active else "mtab")
        for key, lbl in TABS
    ])


def breadcrumb(active):
    return [html.Span("Fase Analisis", className="crumb-muted"),
            html.Span("›", className="crumb-sep"),
            html.Span(TAB_LABEL.get(active, ""), className="crumb-cur")]


def sidebar(active):
    items = []
    for key, lbl in TABS:
        is_on = key == active
        items.append(html.Button(
            id={"type": "side", "index": key}, n_clicks=0,
            className="nav-item active" if is_on else "nav-item",
            children=[
                html.Img(src=(ICON_ACTIVE if is_on else ICON)[key]),
                html.Span(lbl),
            ]))
    return html.Div(className="sidebar", children=[
        html.Div(className="brand", children=[
            html.Div(className="brand-badge", children=html.Img(src=ICON_INK["brand"])),
            html.Div([
                html.Div("LC KDD Core", className="brand-name"),
                html.Div("Data Mining · KDD", className="brand-sub"),
            ]),
        ]),
        html.Div("Fase Analisis", className="nav-group-label"),
        *items,
        html.Button("Jalankan Ulang", id="rerun-cta", n_clicks=0, className="side-cta"),
        html.Div(className="side-links", children=[
            html.A("Panduan", href="#"),
            html.A("Sumber Data", href="#"),
        ]),
    ])


# ---------------------------------------------------------------------------
# Page head (judul + KPI pill + toggle) — berubah per tab
# ---------------------------------------------------------------------------
PAGE_META = {
    "ringkasan": ("Ikhtisar Temuan",
                  "Sintesis lima fase KDD pada portofolio Lending Club — "
                  "menjawab satu pertanyaan: apa yang kami temukan yang tidak obvious?"),
    "segmentasi": ("Segmentasi Nasabah",
                   "Fase 2 — K-Means (K=3) memisahkan nasabah ke tiga profil risiko yang "
                   "tervalidasi tingkat gagal bayar, meski Silhouette rendah."),
    "rules": ("Association Rules",
              "Fase 3 — Apriori menambang pola co-occurrence non-trivial dengan "
              "Support, Confidence, dan Lift yang dipilih data-driven."),
    "anomali": ("Anomaly Detection",
                "Fase 4 — IQR, Z-score, dan Isolation Forest dikonvergensikan dengan "
                "noise DBSCAN Fase 2 menjadi tingkat keyakinan berjenjang."),
}


def page_head(active, dataset, years=None):
    title, sub = PAGE_META[active]
    m = hero_metrics(dataset, years)
    if active == "rules":
        r = rules_for(dataset)
        max_lift = float(r["lift"].max()) if len(r) else 0.0
        pills = [("Rules", f"{len(r)}", "ai"),
                 ("Lift tertinggi", f"{max_lift:.2f}", "accent")]
    elif active == "segmentasi":
        n = CLUSTERS["n_anggota"].sum()
        pills = [("Klaster", "3", "ai"),
                 ("Nasabah", f"{n/1e6:.2f}M", "accent")]
    else:
        pills = [("Anomali", f"{m['total']:,}", ""),
                 ("Tier Kritis", f"{m['kritis']}", "accent")]
    return html.Div(className="page-head", children=[
        html.Div(className="page-head-text", children=[
            html.P("Knowledge Discovery in Databases", className="eyebrow"),
            html.H1(title, className="page-title"),
            html.P(sub, className="page-sub"),
        ]),
        html.Div(className="pill-row", children=[
            html.Div(className=f"pill {cls}", children=[
                html.Div(lbl, className="pill-label"),
                html.Div(val, className="pill-value"),
            ]) for lbl, val, cls in pills
        ]),
    ])


# ---------------------------------------------------------------------------
# Grafik
# ---------------------------------------------------------------------------
def fig_gauge(dataset):
    m = hero_metrics(dataset)
    val = m["strong_pct"]
    fig = go.Figure(go.Indicator(
        mode="gauge+number",
        value=val,
        number={"suffix": "%", "font": {"family": FONT_MONO, "size": 40,
                "color": COLORS["text"]}},
        gauge={
            "axis": {"range": [0, 100], "tickwidth": 0,
                     "tickfont": {"family": FONT_MONO, "size": 9, "color": COLORS["muted"]}},
            "bar": {"color": COLORS["lime"], "thickness": 0.28},
            "bgcolor": "rgba(0,0,0,0)", "borderwidth": 0,
            "steps": [
                {"range": [0, 40], "color": "rgba(255,255,255,.04)"},
                {"range": [40, 100], "color": "rgba(195,244,0,.06)"}],
        },
    ))
    lay = plotly_layout(height=260)
    lay["margin"] = dict(l=20, r=20, t=10, b=6)
    fig.update_layout(**lay)
    return fig


def fig_tier(df):
    tc = dl.tier_counts(df); tc = tc[tc["jumlah"] > 0]
    fig = go.Figure(go.Bar(
        x=tc["jumlah"], y=tc["tier"], orientation="h",
        marker=dict(color=[TIER_COLORS.get(t, COLORS["muted"]) for t in tc["tier"]]),
        text=tc["jumlah"], textposition="outside",
        textfont=dict(family=FONT_MONO, color=COLORS["text"]),
        hovertemplate="%{y}<br>%{x:,} record<extra></extra>"))
    lay = plotly_layout(height=320)
    lay["yaxis"]["autorange"] = "reversed"
    lay["xaxis"]["title"] = "jumlah record (skala log)"; lay["xaxis"]["type"] = "log"
    fig.update_layout(**lay)
    return fig


def fig_verdict(df):
    vc = dl.verdict_counts(df)
    if len(vc) == 0:
        fig = go.Figure(); fig.update_layout(**plotly_layout(height=320))
        fig.add_annotation(text="Tipologi hanya tersedia untuk Accepted", showarrow=False,
                           font=dict(color=COLORS["muted"], family=FONT_MONO))
        return fig
    fig = go.Figure(go.Pie(
        labels=vc["verdict"], values=vc["jumlah"], hole=.62, sort=False,
        marker=dict(colors=[VERDICT_COLORS.get(v, COLORS["muted"]) for v in vc["verdict"]],
                    line=dict(color=COLORS["bg_deep"], width=3)),
        textinfo="percent", textfont=dict(family=FONT_MONO, size=12, color=COLORS["bg_deep"]),
        hovertemplate="%{label}<br>%{value:,} (%{percent})<extra></extra>"))
    lay = plotly_layout(height=320)
    lay["legend"] = dict(orientation="h", y=-0.06, x=0.5, xanchor="center",
                         font=dict(family=FONT_MONO, size=11, color=COLORS["muted"]))
    fig.update_layout(**lay, showlegend=True)
    return fig


def fig_scatter(df):
    x, y = "int_rate", "fico_range_low"
    if x not in df.columns or y not in df.columns:
        cols = [c for c in df.columns if df[c].dtype.kind in "fc"][:2]; x, y = (cols + [x, y])[:2]
    d = dl.scatter_frame(df, x, y)
    fig = go.Figure()
    fig.add_trace(go.Scattergl(
        x=d[x], y=d[y], mode="markers",
        marker=dict(size=6, color=d["iso_score"],
                    colorscale=[[0, COLORS["violet_deep"]], [0.5, COLORS["violet"]], [1, COLORS["lime"]]],
                    showscale=True, colorbar=dict(title="iso<br>score", thickness=10,
                    tickfont=dict(family=FONT_MONO, size=10)),
                    opacity=.72, line=dict(width=0)),
        text=d.get("anomaly_tier"),
        hovertemplate=f"{x}=%{{x:.2f}}<br>{y}=%{{y:.2f}}<br>%{{text}}<extra></extra>", name="anomali"))
    # Overlay jenis anomali (Fase 4): kolektif = anomali berkelompok (relatif klaster),
    # kontekstual = ekstrem pada konteksnya. Simbol terbuka agar awan dasar tetap tembus;
    # bisa di-toggle lewat legenda. Hanya untuk Accepted (kolom ini tak ada di Rejected).
    if "is_collective_outlier" in d.columns:
        cl = d[d["is_collective_outlier"]]
        if len(cl):
            fig.add_trace(go.Scattergl(
                x=cl[x], y=cl[y], mode="markers", name="Kolektif",
                marker=dict(size=7, symbol="square-open", opacity=.5,
                            color=COLORS["violet"], line=dict(width=1.1, color=COLORS["violet"])),
                hovertemplate=f"Kolektif<br>{x}=%{{x:.2f}}<br>{y}=%{{y:.2f}}<extra></extra>"))
    if "is_contextual_outlier" in d.columns:
        cx = d[d["is_contextual_outlier"]]
        if len(cx):
            fig.add_trace(go.Scattergl(
                x=cx[x], y=cx[y], mode="markers", name="Kontekstual",
                marker=dict(size=9, symbol="diamond-open", opacity=.9,
                            color=COLORS["amber"], line=dict(width=1.4, color=COLORS["amber"])),
                hovertemplate=f"Kontekstual<br>{x}=%{{x:.2f}}<br>{y}=%{{y:.2f}}<extra></extra>"))
    if "anomaly_tier" in d.columns:
        hi = d[d["anomaly_tier"].isin(dl.TIER_ORDER[:2])]
        if len(hi):
            fig.add_trace(go.Scattergl(
                x=hi[x], y=hi[y], mode="markers", name="Tier tinggi (Kritis / Sangat Kuat)",
                marker=dict(size=12, color=COLORS["lime"], opacity=.95,
                            line=dict(color=COLORS["bg_deep"], width=1.2)),
                text=hi["anomaly_tier"],
                hovertemplate=f"{x}=%{{x:.2f}}<br>{y}=%{{y:.2f}}<br>%{{text}}<extra></extra>"))
    if "is_dbscan_noise" in d.columns:
        db = d[d["is_dbscan_noise"]]
        fig.add_trace(go.Scattergl(x=db[x], y=db[y], mode="markers", name="Noise DBSCAN (Fase 2)",
            marker=dict(size=14, color="rgba(0,0,0,0)", line=dict(color=COLORS["cyan"], width=1.8)),
            hovertemplate="Noise DBSCAN<extra></extra>"))
    lay = plotly_layout(height=470)
    lay["xaxis"]["title"] = "bunga (z-score)"; lay["yaxis"]["title"] = "skor kredit FICO (z-score)"
    lay["legend"] = dict(orientation="h", y=1.03, x=0, font=dict(family=FONT_MONO, size=11, color=COLORS["muted"]))
    fig.update_layout(**lay)
    return fig


# ---------------------------------------------------------------------------
# Association Rules -> narasi bisnis (agar mudah dipahami awam)
# ---------------------------------------------------------------------------
import re as _re

# (prefix, kategori, kata-benda). Urut terpanjang dulu: 'sub_grade_' menang atas 'grade_'.
_RULE_PREFIX = [
    ("Amount Requested_bin_", "size",  "jumlah diminta"),
    ("Debt-To-Income Ratio_bin_", "level", "DTI"),
    ("Employment Length_bin_", "emp", "masa kerja"),
    ("int_rate_bin_", "level", "bunga"),
    ("loan_amnt_bin_", "size",  "jumlah pinjaman"),
    ("income_bin_",   "level", "pendapatan"),
    ("dti_bin_",      "level", "DTI"),
    ("sub_grade_",    "plain", "sub-grade"),
    ("home_ownership_", "home", ""),
    ("loan_status_",  "status", ""),
    ("grade_",        "plain", "grade"),
    ("term_",         "term",  ""),
]
_LEVEL = {"Very Low": "sangat rendah", "Low": "rendah", "Lower-Mid": "menengah-bawah",
          "Mid": "menengah", "Medium": "sedang", "High": "tinggi", "Very High": "sangat tinggi"}
_SIZE  = {"Small": "kecil", "Medium": "menengah", "Large": "besar", "Very Small": "sangat kecil",
          "Very Large": "sangat besar"}
_HOME  = {"MORTGAGE": "berstatus KPR (mortgage)", "RENT": "berstatus sewa", "OWN": "milik sendiri"}
_STATUS = {"Fully Paid": "lunas penuh", "Charged Off": "gagal bayar (charged off)",
           "Default": "menunggak (default)"}


def humanize_item(token: str) -> str:
    """Terjemahkan satu item rule berkode jadi frasa bisnis Indonesia."""
    t = str(token).strip()
    for prefix, kind, noun in _RULE_PREFIX:
        if t.startswith(prefix):
            val = t[len(prefix):].strip()
            m = _re.match(r"^(.*?)(\s*\([^)]*\))?$", val)
            level, rng = (m.group(1).strip(), (m.group(2) or "").strip()) if m else (val, "")
            if kind == "level":
                return " ".join(x for x in [noun, _LEVEL.get(level, level.lower()), rng] if x)
            if kind == "size":
                return " ".join(x for x in [noun, _SIZE.get(level, level.lower()), rng] if x)
            if kind == "emp":
                return " ".join(x for x in [noun, level.lower(), rng] if x)
            if kind == "home":
                return _HOME.get(val, f"kepemilikan rumah {val.lower()}")
            if kind == "status":
                return _STATUS.get(val, val.lower())
            if kind == "term":
                return f"tenor {val} bulan"
            return f"{noun} {val}".strip()          # plain: grade A / sub-grade B1
    return t.replace("_", " ")                       # fallback aman: tak pernah kosong


def _join_id(parts) -> str:
    """Gabung frasa gaya Indonesia: 'a', 'a dan b', 'a, b, dan c'."""
    parts = [p for p in parts if p]
    if len(parts) <= 1:
        return parts[0] if parts else ""
    if len(parts) == 2:
        return f"{parts[0]} dan {parts[1]}"
    return ", ".join(parts[:-1]) + ", dan " + parts[-1]


def _humanize_side(itemset: str) -> str:
    return _join_id([humanize_item(p) for p in str(itemset).split(" + ") if p.strip()])


def rule_narrative(antecedent, consequent) -> str:
    ant = _humanize_side(antecedent)
    cons = _humanize_side(consequent)
    return f"Bila pinjaman {ant}, maka {cons}."


def rule_cards(dataset, min_lift=1.0, top_n=10):
    """Daftar kartu narasi: {top_n} rule teratas per lift, sudah difilter min_lift."""
    r = rules_for(dataset)
    d = r[r["lift"] >= (min_lift or 1.0)].sort_values("lift", ascending=False).head(top_n)
    if len(d) == 0:
        return html.P("Tidak ada rule dengan lift di atas ambang ini. Turunkan slider lift.",
                      className="hint")
    def _num(v):
        try:
            f = float(v); return f if f == f else 0.0   # NaN != NaN
        except (TypeError, ValueError):
            return 0.0
    cards = []
    for i, (_, row) in enumerate(d.iterrows(), start=1):
        conf = _num(row["confidence"]); sup = _num(row["support"]); lift = _num(row["lift"])
        cards.append(html.Div(className="rule-card", children=[
            html.Div(className="rule-head", children=[
                html.Span(f"Rule #{i}", className="rule-no"),
                html.Span(f"{lift:.1f}× lift", className="rule-lift"),
            ]),
            html.P(rule_narrative(row.get("antecedent", ""), row.get("consequent", "")),
                   className="rule-narr"),
            html.Div(className="rule-meter", children=html.Div(
                className="rule-meter-fill", style={"width": f"{max(2, conf * 100):.0f}%"})),
            html.Div(f"confidence {conf:.0%} · muncul di {sup:.1%} data · "
                     f"{lift:.1f}× lebih sering dari kebetulan", className="rule-meta"),
        ]))
    return cards


def fig_cluster(df):
    fig = go.Figure(go.Scatter(
        x=df["avg_int_rate"], y=df["avg_fico"], mode="markers+text",
        marker=dict(size=df["n_anggota"] / df["n_anggota"].max() * 72 + 26,
                    color=df["default_rate"],
                    colorscale=[[0, COLORS["cyan"]], [0.5, COLORS["violet"]], [1, COLORS["error"]]],
                    showscale=True, colorbar=dict(title="default<br>rate", thickness=10,
                    tickformat=".0%", tickfont=dict(family=FONT_MONO, size=10)),
                    line=dict(color=COLORS["bg_deep"], width=2)),
        text=df["nama_profil"], textposition="top center",
        textfont=dict(family=FONT_MONO, size=12, color=COLORS["text"]),
        customdata=df[["n_anggota", "default_rate"]].values,
        hovertemplate="%{text}<br>anggota=%{customdata[0]:,}<br>default=%{customdata[1]:.1%}<extra></extra>"))
    lay = plotly_layout(height=470)
    lay["xaxis"]["title"] = "rata-rata bunga (%)"; lay["yaxis"]["title"] = "rata-rata FICO"
    fig.update_layout(**lay)
    return fig


# ---------------------------------------------------------------------------
# Panel per tab
# ---------------------------------------------------------------------------
def gauge_card(dataset, years=None):
    m = hero_metrics(dataset, years)
    return html.Div(className="card gauge-card", children=[
        html.Div(className="card-head", style={"width": "100%"}, children=[
            html.H3("Sinyal Keyakinan"),
            html.Span("tier Kuat+", className="badge"),
        ]),
        dcc.Graph(id="g-gauge", figure=fig_gauge(dataset), style={"height":"260px"}, config={"displayModeBar": False, "responsive": True}),
        html.P("Porsi anomali yang disepakati ≥3 metode / DBSCAN — makin tinggi, "
               "makin banyak temuan berbukti kuat, bukan noise tunggal.",
               className="gauge-note"),
        html.Div(className="mini-row", children=[
            html.Div(className="mini danger", children=[
                html.Div("Tier Kritis", className="mini-l"),
                html.Div(f"{m['kritis']}", className="mini-v")]),
            html.Div(className="mini cyan", children=[
                html.Div("Noise DBSCAN", className="mini-l"),
                html.Div(f"{m['dbscan']}", className="mini-v")]),
        ]),
    ])


def tab_ringkasan(dataset, years=None):
    _df = dataset_for(dataset, years)
    return html.Div([
        html.Div(className="callout", children=[
            html.P("Pertanyaan sentral KDD — apa yang tidak obvious dari data mentah?", className="q"),
            html.P(["Anomali paling penting bukan nilai tunggal yang ekstrem, melainkan ",
                    html.B("record yang disepakati banyak metode sekaligus"),
                    " dan terisolasi dari seluruh klaster — titik tempat bukti statistik dan "
                    "struktural bertemu, dan tempat sinyal risiko sejati berada."], className="a"),
        ]),
        html.Div(className="grid g-21", children=[
            html.Div(className="card", children=[
                html.Div(className="card-head", children=[
                    html.H3("Anomali per tingkat keyakinan"),
                    html.Span("skala log", className="badge")]),
                html.P("Makin ke bawah, makin banyak bukti yang disepakati.", className="hint"),
                dcc.Graph(id="g-tier", figure=fig_tier(_df), style={"height":"320px"}, config={"displayModeBar": False, "responsive": True}),
            ]),
            gauge_card(dataset, years),
        ]),
        html.Div(className="grid g-11", children=[
            html.Div(className="card", children=[
                html.Div(className="card-head", children=[
                    html.H3("Komposisi tipologi anomali"),
                    html.Span("auto-verdict", className="badge")]),
                html.P("Klasifikasi tiap anomali ke tiga tipologi bisnis.", className="hint"),
                dcc.Graph(id="g-verdict", figure=fig_verdict(_df), style={"height":"320px"}, config={"displayModeBar": False, "responsive": True}),
            ]),
            html.Div(className="card", children=[
                html.Div(className="card-head", children=[
                    html.H3("Segmen risiko nasabah"),
                    html.Span("Fase 2 · K=3", className="badge")]),
                html.P("Default rate naik monoton dari Prime ke Highest-Risk.", className="hint"),
                dcc.Graph(figure=fig_cluster(CLUSTERS), style={"height":"320px"}, config={"displayModeBar": False, "responsive": True}),
            ]),
        ]),
    ])


def tab_segmentasi(dataset, years=None):
    return html.Div(className="card", children=[
        html.Div(className="card-head", children=[
            html.H3("Peta segmen nasabah"),
            html.Span("Fase 2 · K-Means (K=3)", className="badge")]),
        html.P("Ukuran gelembung = jumlah anggota klaster; warna = tingkat gagal bayar. "
               "Segmen berbunga tinggi & FICO rendah beririsan dengan gagal bayar tinggi — "
               "validasi eksternal padahal label tak dipakai sebagai input.", className="hint"),
        dcc.Graph(figure=fig_cluster(CLUSTERS), style={"height":"470px"}, config={"displayModeBar": False, "responsive": True}),
    ])


def tab_rules(dataset, years=None):
    r = rules_for(dataset)
    ds_label = "Accepted" if (dataset or "accepted") == "accepted" else "Rejected"
    smax = max(float(r["lift"].max()) if len(r) else 1.1, 1.1)
    return html.Div(className="card", children=[
        html.Div(className="card-head", children=[
            html.H3("Association rules berperingkat"),
            html.Span(f"Fase 3 · Apriori · {ds_label}", className="badge")]),
        html.P(f"Dari {len(r):,} rule dataset {ds_label}, ditampilkan 10 teratas per lift dalam "
               "bahasa bisnis. Geser slider untuk menaikkan ambang lift minimum.",
               className="hint"),
        html.Div(style={"padding": "4px 6px 20px"}, children=[
            dcc.Slider(id="lift-slider", min=1.0, max=smax, step=0.1,
                       value=1.0, marks=None, tooltip={"placement": "bottom", "always_visible": True}),
        ]),
        html.Div(id="rules-list", children=rule_cards(dataset, 1.0)),
    ])


def _gloss_item(sw_class, term, desc_children):
    """Satu baris glosarium: swatch (mirip penanda scatter) + istilah + karakteristik."""
    return html.Div(className="gloss-item", children=[
        html.Div(className="gloss-sw", children=html.Span(className=f"sw {sw_class}")),
        html.Div(className="gloss-text", children=[
            html.Div(term, className="gloss-term"),
            html.Div(desc_children, className="gloss-desc"),
        ]),
    ])


def anomaly_glossary(dataset):
    """Panduan membaca peta anomali. Definisi selaras sumber Fase 4 (notebook).
    Dataset-aware: kolektif/kontekstual & tipologi bisnis hanya untuk Accepted."""
    is_acc = (dataset or "accepted") == "accepted"

    # --- Kelompok 1: sinyal pada peta (cocok dengan trace fig_scatter) ---
    peta = [
        _gloss_item("dot", "Anomali", [
            "Tiap titik = satu record anomali. Warna = skor ", html.B("Isolation Forest"),
            " (makin lime, makin terisolasi dari populasi)."]),
    ]
    if is_acc:
        peta.append(_gloss_item("sq-open", "Kolektif", [
            "Anggota klaster ", html.B("Highest-Risk"), " (Fase 2). Individu belum tentu ekstrem, "
            "tapi kelompoknya menyimpang bersama (FICO rendah, bunga tinggi, gagal bayar tinggi)."]))
        peta.append(_gloss_item("dia-open", "Kontekstual", [
            "Bunga ekstrem ", html.B("relatif kelompok skor FICO-nya"), " (|z| > 3 dalam bucket), "
            "meski terlihat normal secara global."]))
    peta.append(_gloss_item("dot-hi", "Tier tinggi", [
        "Keyakinan tertinggi: ", html.B("Kritis"), " (DBSCAN + 3 metode) atau ", html.B("Sangat Kuat"),
        " (DBSCAN + metode). Bukti statistik & struktural bertemu."]))
    peta.append(_gloss_item("ring", "Noise DBSCAN", [
        "Ditandai noise oleh DBSCAN Fase 2: tak masuk klaster kepadatan mana pun → ",
        "terisolasi secara struktural."]))

    groups = [html.Div(className="gloss-group", children=[
        html.Div("Sinyal pada peta", className="gloss-group-label"), *peta])]

    # --- Kelompok 2: tipologi bisnis (auto-verdict) — hanya Accepted ---
    if is_acc:
        tipologi = [
            _gloss_item("chip", "Sinyal Risiko", [
                "Pola risiko kredit nyata: FICO rendah + bunga tinggi, atau buka sangat banyak akun "
                "(loan-stacking), atau gagal bayar + multi-metode. → ", html.B("eskalasi ke tim risiko"), "."]),
            _gloss_item("chip", "Kasus Langka (Sah)", [
                "Ekstrem lintas fitur tapi konsisten, tanpa pola risiko/error. Nasabah tak biasa namun sah → ",
                html.B("tanpa tindakan"), "."]),
            _gloss_item("chip", "Kesalahan Data", [
                "Nilai tak wajar (|z| > 8) → indikasi kesalahan input. → ", html.B("verifikasi ke sumber"), "."]),
        ]
        # Warnai chip sesuai tipologi (konsisten dgn kartu kasus & pie tipologi).
        for it, col in zip(tipologi, [COLORS["error"], COLORS["cyan"], COLORS["amber"]]):
            it.children[0].children.style = {"background": col, "borderRadius": "4px"}
        groups.append(html.Div(className="gloss-group", children=[
            html.Div("Tipologi bisnis (auto-verdict)", className="gloss-group-label"),
            *tipologi,
            html.P("Prioritas berjenjang: Kesalahan Data mengunci, lalu Sinyal Risiko, "
                   "lalu Kasus Langka (Sah).", className="gloss-note"),
        ]))

    card_children = [
        html.Div(className="card-head", children=[
            html.H3("Panduan membaca peta anomali"),
            html.Span("glosarium", className="badge")]),
        html.P("Arti tiap warna, bentuk, dan istilah pada tab ini — agar temuan mudah dibaca "
               "tanpa latar teknis.", className="hint"),
        html.Div(className="glossary", children=groups),
    ]
    if not is_acc:
        card_children.append(html.P(
            "Catatan: anomali Kolektif/Kontekstual dan tipologi bisnis (auto-verdict) hanya "
            "dihitung untuk dataset Accepted.", className="gloss-note"))
    return html.Div(className="card", children=card_children)


def tab_anomali(dataset, years=None):
    _df = dataset_for(dataset, years)
    yr = years or YEAR_RANGE
    yr_label = (f"{yr[0]}–{yr[1]}" if yr and yr[0] != yr[1]
                else (f"{yr[0]}" if yr else "semua tahun"))
    return html.Div([
        html.Div(className="card", children=[
            html.Div(className="card-head", children=[
                html.H3("Peta anomali — bunga vs skor kredit"),
                html.Span(f"{len(_df):,} record · {yr_label}", className="badge")]),
            html.P("Warna = skor Isolation Forest (makin lime makin terisolasi). "
                   "Titik lime besar = tier tinggi (Kritis / Sangat Kuat). "
                   "Lingkaran cyan = noise DBSCAN Fase 2. "
                   "Belah ketupat amber = anomali kontekstual; kotak violet = anomali kolektif. "
                   "Klik label di legenda untuk menyembunyikan/menampilkan tiap jenis.", className="hint"),
            dcc.Graph(id="g-scatter", figure=fig_scatter(_df), style={"height":"470px"}, config={"displayModeBar": True, "displaylogo": False, "responsive": True}),
        ]),
        html.Div(style={"height": "18px"}),
        anomaly_glossary(dataset),
        html.Div(style={"height": "18px"}),
        html.Div(className="grid g-3", children=[
            html.Div(className="case risk", children=[
                html.Div("Kasus 1 · idx 526595", className="case-tag"),
                html.Div("Sinyal Risiko", className="case-title"),
                html.Div(className="case-body", children=[
                    "Membuka banyak akun kredit baru (", html.B("num_tl_op z +5,5"),
                    ") + FICO rendah + bunga tinggi. Profil credit-hungry — eskalasi ke tim risiko."]),
            ]),
            html.Div(className="case rare", children=[
                html.Div("Kasus 2 · idx 1067675", className="case-tag"),
                html.Div("Kasus Langka (Sah)", className="case-title"),
                html.Div(className="case-body", children=[
                    "Skor kredit sangat baik (", html.B("FICO z +2,8"),
                    ") + cicilan besar, bunga normal. Nasabah premium — aman, tanpa tindakan."]),
            ]),
            html.Div(className="case err", children=[
                html.Div("Kasus 3 · idx 536084", className="case-tag"),
                html.Div("Kesalahan Data", className="case-title"),
                html.Div(className="case-body", children=[
                    "Nilai mustahil (", html.B("num_tl_op z +9,9"),
                    "). Kemungkinan kesalahan input — verifikasi ke sumber data."]),
            ]),
        ]),
    ])


TAB_FN = {"ringkasan": tab_ringkasan, "segmentasi": tab_segmentasi,
          "rules": tab_rules, "anomali": tab_anomali}


# ---------------------------------------------------------------------------
# Layout
# ---------------------------------------------------------------------------
app.layout = html.Div([
    dcc.Store(id="active-tab", data="ringkasan"),
    dcc.Store(id="dataset-store", data="accepted"),
    dcc.Store(id="year-store", data=list(YEAR_RANGE) if YEAR_RANGE else None),
    topnav(),
    html.Div(id="sidebar-slot"),
    html.Div(className="main", children=[
        html.Div(id="mtabs-slot"),
        html.Div(id="page-head-slot"),
        html.Div(id="year-slot", children=year_slider()),
        html.Div(id="tab-content"),
        html.Div(className="foot", children=[
            html.Span("Data Mining Project · KDD 5 Fase · Lending Club"),
            html.Span("Fase 5 — Visualization & Knowledge Presentation"),
        ]),
    ]),
])


# ---------------------------------------------------------------------------
# Callbacks
# ---------------------------------------------------------------------------
@app.callback(
    Output("active-tab", "data"),
    [Input({"type": "side", "index": k}, "n_clicks") for k in TAB_FN]
    + [Input({"type": "mtab", "index": k}, "n_clicks") for k in TAB_FN],
    prevent_initial_call=True,
)
def switch_tab(*_):
    trig = dash.callback_context.triggered_id
    # Hanya terima trigger dari tombol navigasi (side/mtab). Tombol pattern-matching
    # lain (mis. yr-preset) juga ber-ID dict, jadi tipe WAJIB diperiksa.
    if isinstance(trig, dict) and trig.get("type") in ("side", "mtab"):
        idx = trig.get("index")
        if idx in TAB_FN:
            return idx
    return dash.no_update


@app.callback(Output("dataset-store", "data"),
              Input("dataset-toggle", "value"), prevent_initial_call=True)
def sync_dataset(v):
    return v or "accepted"


@app.callback(
    Output("crumb-slot", "children"),
    Output("sidebar-slot", "children"),
    Output("mtabs-slot", "children"),
    Output("page-head-slot", "children"),
    Output("tab-content", "children"),
    Output("year-slot", "style"),
    Input("active-tab", "data"),
    Input("dataset-store", "data"),
    Input("year-store", "data"),
)
def render(active, dataset, years):
    active = active or "ringkasan"; dataset = dataset or "accepted"
    yr = tuple(years) if years else None
    return (breadcrumb(active), sidebar(active), mobile_tabs(active),
            page_head(active, dataset, yr), TAB_FN[active](dataset, yr),
            {"display": "none"} if active == "rules" else {})


# Preset menulis ke NILAI slider (bukan langsung ke store). Dengan begitu slider
# adalah satu-satunya sumber kebenaran: handle-nya selalu mencerminkan rentang aktif,
# dan geseran berikutnya tidak lagi membuang preset.
@app.callback(
    Output("year-slider", "value"),
    Input({"type": "yr-preset", "index": dash.ALL}, "n_clicks"),
    prevent_initial_call=True,
)
def apply_preset(clicks):
    trig = dash.callback_context.triggered_id
    if not (isinstance(trig, dict) and trig.get("type") == "yr-preset"):
        return dash.no_update
    # Abaikan trigger dari komponen yang baru di-mount (n_clicks 0/None).
    if not any(c for c in (clicks or []) if c):
        return dash.no_update
    try:
        a, b = trig["index"].split("-")
        return [int(a), int(b)]
    except (ValueError, KeyError):
        return dash.no_update


@app.callback(
    Output("year-store", "data"),
    Input("year-slider", "value"),
    prevent_initial_call=True,
)
def sync_years(v):
    if not v:
        return dash.no_update
    return [int(v[0]), int(v[1])]


@app.callback(
    Output("year-readout", "children"),
    Output("year-count", "children"),
    Input("year-store", "data"),
    Input("dataset-store", "data"),
)
def year_feedback(years, dataset):
    yr = tuple(years) if years else None
    lo, hi = yr if yr else (YEAR_RANGE or (0, 0))
    label = f"{lo}" if lo == hi else f"{lo}\u2013{hi}"
    n = len(dataset_for(dataset, yr))
    total = len(DATASETS[dataset or "accepted"])
    pct = (n / total * 100) if total else 0
    return label, f"{n:,} dari {total:,} record ({pct:.0f}%)"


@app.callback(Output("rules-list", "children"), Input("lift-slider", "value"),
              State("dataset-store", "data"))
def upd_rules(min_lift, dataset):
    return rule_cards(dataset, min_lift or 1.0)


if __name__ == "__main__":
    app.run(debug=False, port=8050)
