// Token warna "Synthetic Capital" (dari theme.py) — dipakai di semua chart ECharts.

export const COLORS = {
  bg: "#131318",
  bgDeep: "#0e0e13",
  lime: "#c3f400",
  limeDim: "#abd600",
  violet: "#d0bcff",
  violetDeep: "#571bc1",
  cyan: "#7df4ff",
  error: "#ffb4ab",
  amber: "#ffd479",
  text: "#e4e1e9",
  muted: "#c4c9ac",
  line: "rgba(255,255,255,0.12)",
} as const;

export const FONT_MONO = "'JetBrains Mono', 'Courier New', monospace";
export const FONT_DISPLAY = "'Space Grotesk', system-ui, sans-serif";
export const FONT_BODY = "'Inter', system-ui, sans-serif";

export const TIER_ORDER = [
  "Kritis (DBSCAN + 3 metode)",
  "Sangat Kuat (DBSCAN + metode)",
  "Kuat (3 metode)",
  "Sedang (2 metode)",
  "Lemah (1 metode)",
];

export const TIER_COLORS: Record<string, string> = {
  "Kritis (DBSCAN + 3 metode)": COLORS.error,
  "Sangat Kuat (DBSCAN + metode)": COLORS.amber,
  "Kuat (3 metode)": COLORS.violet,
  "Sedang (2 metode)": COLORS.cyan,
  "Lemah (1 metode)": COLORS.muted,
};

export const VERDICT_COLORS: Record<string, string> = {
  "Sinyal Risiko": COLORS.error,
  "Kesalahan Data": COLORS.amber,
  "Kasus Langka (Sah)": COLORS.cyan,
};

// Colorscale iso_score: violet_deep -> violet -> lime (untuk visualMap)
export const ISO_SCALE = [COLORS.violetDeep, COLORS.violet, COLORS.lime];
// Colorscale default_rate: cyan -> violet -> error
export const RISK_SCALE = [COLORS.cyan, COLORS.violet, COLORS.error];

// Tooltip standar (kaca gelap, aksen violet)
export const tooltipStyle = {
  backgroundColor: COLORS.bgDeep,
  borderColor: COLORS.violet,
  borderWidth: 1,
  textStyle: { color: COLORS.text, fontFamily: FONT_MONO, fontSize: 12 },
  extraCssText: "border-radius:10px;backdrop-filter:blur(8px);",
};
