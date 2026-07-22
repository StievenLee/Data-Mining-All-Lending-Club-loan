// Tipe data selaras output scripts/build_data.py

export type Dataset = "accepted" | "rejected";
export type TabId =
  | "ringkasan"
  | "preprocessing"
  | "segmentasi"
  | "rules"
  | "anomali"
  | "insight"
  | "laporan";

export interface TierYearRow {
  dataset: Dataset;
  year: number;
  anomaly_tier: string;
  count: number;
}

export interface VerdictYearRow {
  year: number;
  auto_verdict: string;
  count: number;
}

/** Profil klaster Fase 2. Skema kedua dataset tidak sama, jadi field khas
 *  masing-masing bersifat opsional — pakai helper di lib/cluster.ts, jangan baca
 *  field-nya langsung, supaya rejected (tanpa default_rate) tidak jadi NaN.
 *  accepted : default_rate, avg_int_rate, avg_fico
 *  rejected : avg_dti, avg_employment_length, avg_amount_requested, persentase_populasi */
export interface ClusterProfile {
  cluster: number;
  nama_profil: string;
  n_anggota: number;
  dataset?: Dataset; // absen pada data lama -> diperlakukan sebagai "accepted"
  default_rate?: number;
  avg_int_rate?: number;
  avg_fico?: number;
  avg_dti?: number;
  avg_employment_length?: number;
  avg_amount_requested?: number;
  persentase_populasi?: number;
}

// Profil klaster per (tahun, klaster) — untuk kartu segmen yang responsif tahun.
// Field metrik mengikuti ClusterProfile: beda dataset, beda kolom yang terisi.
export interface ClusterYearRow extends ClusterProfile {
  year: number;
}

export interface Rule {
  antecedent: string;
  consequent: string;
  support: number;
  confidence: number;
  lift: number;
  dataset: string;
}

// Sample scatter columnar: { n, columns: { col: [...] } }
export interface SampleColumnar {
  n: number;
  columns: Record<string, (number | string | null)[]>;
}

export interface DbscanMeta {
  n_noise: number;
  pct_noise: number;
  eps: number;
  sample_size: number;
}

export interface Summary {
  year_bounds: [number, number] | null;
  features: Record<Dataset, string[]>;
  tier_order: string[];
  kpi: {
    total_anomali_acc: number;
    kritis_acc: number;
    kritis_rej: number;
    n_rules: number;
    max_lift: number;
    dbscan_noise_acc: number;
  };
  dbscan: Record<Dataset, DbscanMeta>;
}

export interface DashboardData {
  summary: Summary;
  tiers: TierYearRow[];
  verdicts: VerdictYearRow[];
  clusters: ClusterProfile[];
  clustersByYear: ClusterYearRow[];
  rules: Rule[];
  samples: Record<Dataset, SampleColumnar>;
}
