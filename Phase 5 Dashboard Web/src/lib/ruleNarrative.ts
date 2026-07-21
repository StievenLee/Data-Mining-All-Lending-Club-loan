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

/** Pecah satu sisi itemset jadi token. Dukung 2 format:
 *  - CSV Fase 3 asli: item dipisah koma  -> "grade_A, term_36"
 *  - fallback dummy  : item dipisah " + " -> "dti Low + bunga Very Low"
 *  (item individual tak pernah mengandung koma, jadi split ini aman.) */
function splitItemset(itemset: string): string[] {
  return String(itemset)
    .split(/\s*[+,]\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Daftar frasa bisnis per item -- dipakai untuk chip "JIKA/MAKA" di kartu. */
export function humanizeItems(itemset: string): string[] {
  return splitItemset(itemset).map(humanizeItem);
}

function humanizeSide(itemset: string): string {
  return joinId(humanizeItems(itemset));
}

/** Kalimat narasi utuh yang mudah dipahami awam. */
export function ruleNarrative(antecedent: string, consequent: string): string {
  return `Ketika sebuah pinjaman ${humanizeSide(antecedent)}, umumnya diikuti ${humanizeSide(
    consequent
  )}.`;
}

// ---------------------------------------------------------------------------
// Fitur (untuk filter): petakan token ber-kode -> fitur asalnya (grade, loan_amnt, dst)
// ---------------------------------------------------------------------------
export interface FeatureMeta {
  key: string;
  label: string;
}

// [prefix token, key fitur, label tampil]. Urutan: prefix lebih spesifik dulu.
const FEATURE_PREFIX: [string, string, string][] = [
  ["Amount Requested_bin_", "amount_requested", "Jumlah diminta"],
  ["Debt-To-Income Ratio_bin_", "dti", "DTI"],
  ["Employment Length_bin_", "employment_length", "Masa kerja"],
  ["int_rate_bin_", "int_rate", "Suku bunga"],
  ["loan_amnt_bin_", "loan_amnt", "Jumlah pinjaman"],
  ["income_bin_", "income", "Pendapatan"],
  ["dti_bin_", "dti", "DTI"],
  ["sub_grade_", "sub_grade", "Sub-grade"],
  ["home_ownership_", "home_ownership", "Kepemilikan rumah"],
  ["loan_status_", "loan_status", "Status pinjaman"],
  ["grade_", "grade", "Grade"],
  ["term_", "term", "Tenor"],
];

/** Fitur asal satu token, atau null bila tak dikenali. */
export function itemFeature(token: string): FeatureMeta | null {
  const t = String(token).trim();
  for (const [prefix, key, label] of FEATURE_PREFIX) {
    if (t.startsWith(prefix)) return { key, label };
  }
  return null;
}

/** Semua fitur unik yang muncul di satu rule (antecedent + consequent). */
export function ruleFeatures(antecedent: string, consequent: string): FeatureMeta[] {
  const seen = new Map<string, FeatureMeta>();
  for (const side of [antecedent, consequent]) {
    for (const tok of splitItemset(side)) {
      const f = itemFeature(tok);
      if (f && !seen.has(f.key)) seen.set(f.key, f);
    }
  }
  return [...seen.values()];
}

// ---------------------------------------------------------------------------
// Call to action: dari ciri rule -> rekomendasi tindakan untuk bank
// ---------------------------------------------------------------------------
export interface RuleAction {
  label: string; // ringkas, mis. "Rawat & kembangkan"
  text: string; // narasi rekomendasi untuk bank
  color: string; // aksen warna (hex) sesuai nada rekomendasi
}

/** Turunkan rekomendasi bisnis dari isi rule. Deterministik & mudah dipahami. */
export function ruleAction(antecedent: string, consequent: string, dataset: string): RuleAction {
  const toks = [...splitItemset(antecedent), ...splitItemset(consequent)];
  const has = (re: RegExp) => toks.some((t) => re.test(t));

  const fullyPaid = has(/Fully Paid/i);
  const badStatus = has(/Charged Off|Default/i);
  const goodGrade = has(/^grade_[AB]\b/) || has(/^sub_grade_[AB]/);
  const badGrade = has(/^grade_[DEFG]\b/) || has(/^sub_grade_[DEFG]/);
  const lowRate = has(/int_rate_bin_(Very Low|Low)/);
  const highRate = has(/int_rate_bin_(High|Very High)/);
  const highDti = has(/(Debt-To-Income Ratio|dti)_bin_(High|Very High)/i);
  const lowDti = has(/(Debt-To-Income Ratio|dti)_bin_(Very Low|Low)/i);
  const junior = has(/Employment Length_bin_Junior/);
  const bigAmount = has(/(Amount Requested|loan_amnt)_bin_(Large|Very Large)/i);
  const smallAmount = has(/(Amount Requested|loan_amnt)_bin_(Micro|Small)/i);

  if (dataset === "Rejected") {
    if (highDti || (junior && bigAmount)) {
      return {
        label: "Perketat kebijakan",
        color: "#ffb4ab",
        text: "Karena pola ini menandai pemohon dengan beban utang tinggi, yang sering digabung masa kerja pendek atau permintaan pinjaman besar, bank sebaiknya menjadikannya kriteria tinjau atau tolak otomatis. Alih-alih menolak mentah, tawarkan limit lebih kecil atau edukasi keuangan lebih dulu.",
      };
    }
    if (lowDti && smallAmount) {
      return {
        label: "Peluang tersembunyi",
        color: "#c3f400",
        text: "Pemohon di pola ini justru konservatif, dengan utang rendah dan pinjaman kecil. Bank bisa meninjau ulang alasan penolakannya dan menawarkan jalur persetujuan cepat atau produk mikro, karena risikonya cenderung rendah.",
      };
    }
    return {
      label: "Pertajam penyaringan",
      color: "#d0bcff",
      text: "Gunakan pola ini untuk mempertajam kriteria penyaringan awal, sehingga keputusan penolakan menjadi lebih konsisten, transparan, dan mudah dijelaskan kepada pemohon.",
    };
  }

  // Accepted
  if (badStatus || (badGrade && highRate)) {
    return {
      label: "Kelola risiko",
      color: "#ffb4ab",
      text: "Karena kombinasi ini cenderung berujung gagal bayar, bank sebaiknya memperketat pemantauan, menyesuaikan bunga agar sepadan dengan risikonya, atau meninjau ulang batas kredit sebelum menyetujui pinjaman serupa.",
    };
  }
  if (fullyPaid) {
    return {
      label: "Rawat & kembangkan",
      color: "#c3f400",
      text: "Karena kelompok ini cenderung melunasi pinjaman sampai selesai, bank sebaiknya mempertahankan mereka dengan limit lebih tinggi, bunga kompetitif, atau penawaran produk lanjutan, supaya mereka tidak berpindah ke pesaing.",
    };
  }
  if (goodGrade || lowRate) {
    return {
      label: "Pertahankan nasabah prima",
      color: "#7df4ff",
      text: "Pola ini mencerminkan nasabah berkualitas baik, dengan grade tinggi atau bunga rendah. Bank sebaiknya memberi mereka penawaran terbaik untuk menjaga loyalitas, sambil memastikan penetapan bunga tetap selaras dengan grade.",
    };
  }
  if (highRate || badGrade) {
    return {
      label: "Waspadai risiko",
      color: "#ffd479",
      text: "Pola ini condong ke profil berisiko lebih tinggi. Bank sebaiknya memastikan bunga yang dikenakan sepadan dengan risikonya dan menyiapkan pemantauan yang lebih ketat.",
    };
  }
  return {
    label: "Jadikan rujukan",
    color: "#d0bcff",
    text: "Pola ini menggambarkan kelompok pinjaman tertentu secara jelas. Bank bisa menjadikannya rujukan berbasis data saat menyusun kebijakan, penetapan harga, dan penawaran untuk kelompok seperti ini, supaya keputusan tetap konsisten dan mudah dijelaskan.",
  };
}
