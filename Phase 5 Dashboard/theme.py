"""
theme.py — Sistem token desain "Synthetic Capital" (dari DESIGN.md).

Identitas visual: Glassmorphism + Cyber-Futurism untuk fintech berbasis AI.
Kanvas charcoal "Deep Space", panel kaca translusen, aksen Neon Lime untuk aksi
& pertumbuhan, Electric Violet untuk lapisan "kecerdasan"/AI, Cyan untuk data
sekunder. Angka memakai JetBrains Mono agar terasa algoritmik.

Palet fungsional (dipetakan dari DESIGN.md):
  bg        #131318  — latar Deep Space
  lime      #c3f400  — Primary: aksi, pertumbuhan, temuan/highlight
  violet    #d0bcff  — Secondary: branding, wawasan AI
  cyan      #7df4ff  — Tertiary: aliran data sekunder
  error     #ffb4ab  — bahaya / sinyal risiko
  amber     #ffd479  — kesalahan data (turunan hangat untuk kejelasan tipologi)
  text      #e4e1e9  — teks utama
  muted     #c4c9ac  — teks sekunder (on-surface-variant)
"""

COLORS = {
    "bg":        "#131318",
    "bg_deep":   "#0e0e13",
    "surface":   "rgba(255,255,255,0.03)",
    "surface2":  "rgba(255,255,255,0.06)",
    "lime":      "#c3f400",
    "lime_dim":  "#abd600",
    "violet":    "#d0bcff",
    "violet_deep": "#571bc1",
    "cyan":      "#7df4ff",
    "error":     "#ffb4ab",
    "amber":     "#ffd479",
    "text":      "#e4e1e9",
    "muted":     "#c4c9ac",
    "line":      "rgba(255,255,255,0.12)",
}

# Warna per tipologi verdict (konsisten di seluruh dashboard)
VERDICT_COLORS = {
    "Sinyal Risiko":       COLORS["error"],
    "Kesalahan Data":      COLORS["amber"],
    "Kasus Langka (Sah)":  COLORS["cyan"],
}

# Warna per tier keyakinan (redup -> menyala mengikuti kekuatan bukti)
TIER_COLORS = {
    "Kritis (DBSCAN + 3 metode)":     COLORS["error"],
    "Sangat Kuat (DBSCAN + metode)":  COLORS["amber"],
    "Kuat (3 metode)":                COLORS["violet"],
    "Sedang (2 metode)":              COLORS["cyan"],
    "Lemah (1 metode)":               COLORS["muted"],
}

FONT_DISPLAY = "'Space Grotesk', system-ui, sans-serif"
FONT_BODY    = "'Geist', 'Inter', system-ui, sans-serif"
FONT_MONO    = "'JetBrains Mono', 'Courier New', monospace"


def plotly_layout(height=360, title=None):
    """Layout Plotly standar bertema Synthetic Capital, dipakai semua grafik."""
    return dict(
        template="plotly_dark",
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font=dict(family=FONT_BODY, color=COLORS["text"], size=13),
        title=dict(text=title or "", font=dict(family=FONT_DISPLAY, size=16,
                                               color=COLORS["text"]), x=0.01),
        margin=dict(l=52, r=26, t=46 if title else 18, b=46),
        height=height,
        autosize=True,
        xaxis=dict(gridcolor=COLORS["line"], zerolinecolor=COLORS["line"],
                   linecolor=COLORS["line"], tickfont=dict(family=FONT_MONO, size=11)),
        yaxis=dict(gridcolor=COLORS["line"], zerolinecolor=COLORS["line"],
                   linecolor=COLORS["line"], tickfont=dict(family=FONT_MONO, size=11)),
        legend=dict(bgcolor="rgba(0,0,0,0)", font=dict(color=COLORS["muted"],
                    family=FONT_MONO, size=11)),
        hoverlabel=dict(bgcolor=COLORS["bg_deep"], font_family=FONT_MONO,
                        font_color=COLORS["text"], bordercolor=COLORS["violet"]),
        colorway=[COLORS["lime"], COLORS["violet"], COLORS["cyan"],
                  COLORS["amber"], COLORS["error"]],
    )
