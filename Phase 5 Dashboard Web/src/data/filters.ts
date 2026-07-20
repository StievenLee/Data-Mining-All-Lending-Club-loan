// filters.ts — logika filter MURNI atas data in-memory. Semua < beberapa ms.
// Tidak menyentuh jaringan; inilah kunci target <100ms per interaksi.

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
    pct: total ? +((strong / total) * 100).toFixed(1) : 0,
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

/** Profil klaster teragregasi untuk rentang tahun. Rata-rata (default/int/fico)
    di-weight jumlah anggota → sama persis dengan mean populasi pada rentang itu. */
export function clusterProfilesForYears(
  rows: ClusterYearRow[],
  [lo, hi]: YearRange
): ClusterProfile[] {
  const acc = new Map<
    number,
    { name: string; n: number; defW: number; intW: number; ficoW: number }
  >();
  for (const r of rows) {
    if (r.year < lo || r.year > hi) continue;
    const e =
      acc.get(r.cluster) ?? { name: r.nama_profil, n: 0, defW: 0, intW: 0, ficoW: 0 };
    e.n += r.n_anggota;
    e.defW += r.default_rate * r.n_anggota;
    e.intW += r.avg_int_rate * r.n_anggota;
    e.ficoW += r.avg_fico * r.n_anggota;
    acc.set(r.cluster, e);
  }
  return [...acc.entries()]
    .map(([cluster, e]) => ({
      cluster,
      nama_profil: e.name,
      n_anggota: e.n,
      default_rate: e.n ? e.defW / e.n : 0,
      avg_int_rate: e.n ? e.intW / e.n : 0,
      avg_fico: e.n ? e.ficoW / e.n : 0,
    }))
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
