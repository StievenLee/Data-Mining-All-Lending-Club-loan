// Tipe data selaras output scripts/build_data.py

export type Dataset = "accepted" | "rejected";
export type TabId = "ringkasan" | "preprocessing" | "segmentasi" | "rules" | "anomali" | "insight";

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

export interface ClusterProfile {
  cluster: number;
  nama_profil: string;
  n_anggota: number;
  default_rate: number;
  avg_int_rate: number;
  avg_fico: number;
}

// Profil klaster per (tahun, klaster) — untuk kartu segmen yang responsif tahun.
export interface ClusterYearRow {
  year: number;
  cluster: number;
  nama_profil: string;
  n_anggota: number;
  default_rate: number;
  avg_int_rate: number;
  avg_fico: number;
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
