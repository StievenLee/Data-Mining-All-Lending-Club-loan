// filters.ts — logika filter MURNI atas data in-memory. Semua < beberapa ms.
// Tidak menyentuh jaringan: filter = operasi array in-memory. (Target <100ms per
// interaksi dari PLAN.md belum pernah diukur — lihat README §Performa.)

import { TIER_ORDER } from "../theme/colors";
import type {
  ClusterProfile,
  ClusterYearRow,
  Dataset,
  SampleColumnar,
  TierYearRow,
  VerdictYearRow,
} from "../types";

export type YearRange = [number, number];

const STRONG_TIERS = new Set(TIER_ORDER.slice(0, 3)); // Kritis, Sangat Kuat, Kuat

/** Agregasi jumlah per tier untuk (dataset, rentang tahun). */
export function tierCounts(
  tiers: TierYearRow[],
  dataset: Dataset,
  [lo, hi]: YearRange
): { tier: string; count: number }[] {
  const acc = new Map<string, number>();
  for (const r of tiers) {
    if (r.dataset !== dataset) continue;
    if (r.year < lo || r.year > hi) continue;
    acc.set(r.anomaly_tier, (acc.get(r.anomaly_tier) ?? 0) + r.count);
  }
  // urutkan sesuai TIER_ORDER, buang yang 0
  return TIER_ORDER.map((t) => ({ tier: t, count: acc.get(t) ?? 0 })).filter(
    (d) => d.count > 0
  );
}

/** Persen anomali "kuat" (Kritis+SangatKuat+Kuat) dari total — untuk gauge. */
export function strongPct(counts: { tier: string; count: number }[]): {
  pct: number;
  strong: number;
  total: number;
  kritis: number;
} {
  let strong = 0;
  let total = 0;
  let kritis = 0;
  for (const { tier, count } of counts) {
    total += count;
    if (STRONG_TIERS.has(tier)) strong += count;
    if (tier === "Kritis (DBSCAN + 3 metode)") kritis += count;
  }
  return {
    pct: total ? +((strong / total) * 100).toFixed(2) : 0,
    strong,
    total,
    kritis,
  };
}

/** Agregasi verdict (accepted saja) untuk rentang tahun. */
export function verdictCounts(
  verdicts: VerdictYearRow[],
  [lo, hi]: YearRange
): { verdict: string; count: number }[] {
  const acc = new Map<string, number>();
  for (const r of verdicts) {
    if (r.year < lo || r.year > hi) continue;
    acc.set(r.auto_verdict, (acc.get(r.auto_verdict) ?? 0) + r.count);
  }
  return [...acc.entries()].map(([verdict, count]) => ({ verdict, count }));
}

/** Filter sample scatter (columnar) ke rentang tahun -> baris indeks yang lolos. */
export function filterSampleRows(
  sample: SampleColumnar,
  [lo, hi]: YearRange
): number[] {
  const years = sample.columns["year"] as (number | null)[] | undefined;
  const idx: number[] = [];
  for (let i = 0; i < sample.n; i++) {
    const y = years ? (years[i] as number | null) : null;
    if (y == null || (y >= lo && y <= hi)) idx.push(i);
  }
  return idx;
}

/** Lapisan sinyal pada peta anomali — dipakai chip "tampilkan hanya…". */
export type AnomalyLayer = "main" | "collective" | "contextual" | "highTier" | "noise";

/** Ambil maksimal `limit` baris dengan langkah merata (stride), bukan potong
    `slice(0, limit)`. Stride mempertahankan sebaran tahun/nilai sample asli,
    sedangkan slice hanya memperlihatkan bagian awal file. `limit` null = semua. */
export function limitRows(rows: number[], limit: number | null): number[] {
  if (limit == null || rows.length <= limit) return rows;
  const step = rows.length / limit;
  const out: number[] = new Array(limit);
  for (let k = 0; k < limit; k++) out[k] = rows[Math.floor(k * step)];
  return out;
}

/** Hitung anggota tiap lapisan pada baris yang sedang tampil — untuk angka di chip. */
export function anomalyLayerCounts(
  sample: SampleColumnar,
  rows: number[],
  tierOrder: string[] = []
): Record<AnomalyLayer, number> {
  const noise = sample.columns["is_dbscan_noise"] as number[] | undefined;
  const tier = sample.columns["anomaly_tier"] as string[] | undefined;
  const contextual = sample.columns["is_contextual_outlier"] as number[] | undefined;
  const collective = sample.columns["is_collective_outlier"] as number[] | undefined;
  const highTiers = new Set(tierOrder.slice(0, 2));

  const out: Record<AnomalyLayer, number> = {
    main: rows.length,
    collective: 0,
    contextual: 0,
    highTier: 0,
    noise: 0,
  };
  for (const i of rows) {
    if (collective?.[i]) out.collective++;
    if (contextual?.[i]) out.contextual++;
    if (noise?.[i]) out.noise++;
    if (tier && highTiers.has(tier[i])) out.highTier++;
  }
  return out;
}

/** Metrik yang dirata-rata per dataset — kolom yang terisi memang berbeda. */
const WEIGHTED_METRICS = [
  "default_rate",
  "avg_int_rate",
  "avg_fico",
  "avg_dti",
  "avg_employment_length",
  "avg_amount_requested",
] as const;

/** Profil klaster teragregasi untuk rentang tahun & dataset. Setiap rata-rata
    di-weight jumlah anggota → sama persis dengan mean populasi pada rentang itu.
    Metrik yang tidak dimiliki dataset ini dibiarkan undefined, bukan 0, supaya
    tidak tampil sebagai "0%" yang menyesatkan. */
export function clusterProfilesForYears(
  rows: ClusterYearRow[],
  [lo, hi]: YearRange,
  dataset: Dataset = "accepted"
): ClusterProfile[] {
  type Metric = (typeof WEIGHTED_METRICS)[number];
  const acc = new Map<
    number,
    { name: string; n: number; sums: Map<Metric, number> }
  >();
  for (const r of rows) {
    if ((r.dataset ?? "accepted") !== dataset) continue;
    if (r.year < lo || r.year > hi) continue;
    const e = acc.get(r.cluster) ?? { name: r.nama_profil, n: 0, sums: new Map() };
    e.n += r.n_anggota;
    for (const m of WEIGHTED_METRICS) {
      const v = r[m];
      if (v == null) continue;
      e.sums.set(m, (e.sums.get(m) ?? 0) + v * r.n_anggota);
    }
    acc.set(r.cluster, e);
  }
  return [...acc.entries()]
    .map(([cluster, e]) => {
      const metrics: Partial<Record<Metric, number>> = {};
      for (const [m, sum] of e.sums) metrics[m] = e.n ? sum / e.n : 0;
      return {
        cluster,
        nama_profil: e.name,
        n_anggota: e.n,
        dataset,
        ...metrics,
      };
    })
    .sort((a, b) => a.cluster - b.cluster);
}

/** Total record (semua tier) untuk (dataset, rentang) — untuk badge hitung. */
export function totalRecords(
  tiers: TierYearRow[],
  dataset: Dataset,
  range: YearRange
): number {
  return tierCounts(tiers, dataset, range).reduce((s, d) => s + d.count, 0);
}
