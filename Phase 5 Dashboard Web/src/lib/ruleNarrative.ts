// ruleNarrative.ts — terjemahkan itemset Apriori Fase 3 jadi kalimat bisnis Indonesia.
// Port 1:1 dari fungsi humanize_item/rule_narrative di "Phase 5 Dashboard/app.py".
// Untuk rule dummy (belum ada prefix ter-kode seperti "int_rate_bin_") setiap item
// jatuh ke fallback (dikembalikan apa adanya) -- kalimat tetap terbaca karena label
// dummy sudah bergaya manusia. Saat CSV Fase 3 asli tersedia, prefix map ini otomatis
// aktif tanpa perubahan lain.

type Kind = "level" | "size" | "emp" | "home" | "status" | "term" | "plain";

const RULE_PREFIX: [string, Kind, string][] = [
  ["Amount Requested_bin_", "size", "jumlah diminta"],
  ["Debt-To-Income Ratio_bin_", "level", "DTI"],
  ["Employment Length_bin_", "emp", "masa kerja"],
  ["int_rate_bin_", "level", "bunga"],
  ["loan_amnt_bin_", "size", "jumlah pinjaman"],
  ["income_bin_", "level", "pendapatan"],
  ["dti_bin_", "level", "DTI"],
  ["sub_grade_", "plain", "sub-grade"],
  ["home_ownership_", "home", ""],
  ["loan_status_", "status", ""],
  ["grade_", "plain", "grade"],
  ["term_", "term", ""],
];

const LEVEL: Record<string, string> = {
  "Very Low": "sangat rendah",
  Low: "rendah",
  "Lower-Mid": "menengah-bawah",
  Mid: "menengah",
  Medium: "sedang",
  High: "tinggi",
  "Very High": "sangat tinggi",
};
const SIZE: Record<string, string> = {
  Small: "kecil",
  Medium: "menengah",
  Large: "besar",
  "Very Small": "sangat kecil",
  "Very Large": "sangat besar",
};
const HOME: Record<string, string> = {
  MORTGAGE: "berstatus KPR (mortgage)",
  RENT: "berstatus sewa",
  OWN: "milik sendiri",
};
const STATUS: Record<string, string> = {
  "Fully Paid": "lunas penuh",
  "Charged Off": "gagal bayar (charged off)",
  Default: "menunggak (default)",
};

/** Terjemahkan satu item rule berkode jadi frasa bisnis Indonesia. */
export function humanizeItem(token: string): string {
  const t = String(token).trim();
  for (const [prefix, kind, noun] of RULE_PREFIX) {
    if (!t.startsWith(prefix)) continue;
    const val = t.slice(prefix.length).trim();
    const m = val.match(/^(.*?)(\s*\([^)]*\))?$/);
    const level = (m?.[1] ?? val).trim();
    const rng = (m?.[2] ?? "").trim();
    switch (kind) {
      case "level":
        return [noun, LEVEL[level] ?? level.toLowerCase(), rng].filter(Boolean).join(" ");
      case "size":
        return [noun, SIZE[level] ?? level.toLowerCase(), rng].filter(Boolean).join(" ");
      case "emp":
        return [noun, level.toLowerCase(), rng].filter(Boolean).join(" ");
      case "home":
        return HOME[val] ?? `kepemilikan rumah ${val.toLowerCase()}`;
      case "status":
        return STATUS[val] ?? val.toLowerCase();
      case "term":
        return `tenor ${val} bulan`;
      default:
        return `${noun} ${val}`.trim();
    }
  }
  return t.replace(/_/g, " "); // fallback aman: tak pernah kosong
}

/** Gabung frasa gaya Indonesia: "a", "a dan b", "a, b, dan c". */
function joinId(parts: string[]): string {
  const p = parts.filter(Boolean);
  if (p.length <= 1) return p[0] ?? "";
  if (p.length === 2) return `${p[0]} dan ${p[1]}`;
  return p.slice(0, -1).join(", ") + ", dan " + p[p.length - 1];
}

function humanizeSide(itemset: string): string {
  return joinId(
    String(itemset)
      .split(" + ")
      .map((p) => p.trim())
      .filter(Boolean)
      .map(humanizeItem)
  );
}

/** "Bila pinjaman {antecedent}, maka {consequent}." dalam bahasa bisnis. */
export function ruleNarrative(antecedent: string, consequent: string): string {
  return `Bila pinjaman ${humanizeSide(antecedent)}, maka ${humanizeSide(consequent)}.`;
}
