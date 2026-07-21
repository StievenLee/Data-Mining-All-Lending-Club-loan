// loaders.ts — unduh SEMUA data ringkas SEKALI (total ~0.8 MB), cache di memori.
// Setelah ini tak ada request server lagi; semua filter jalan di browser.

import type {
  DashboardData,
  ClusterProfile,
  ClusterYearRow,
  Rule,
  SampleColumnar,
  Summary,
  TierYearRow,
  VerdictYearRow,
} from "../types";

const BASE = import.meta.env.BASE_URL; // "./" -> relatif thd halaman

async function getJSON<T>(name: string): Promise<T> {
  const res = await fetch(`${BASE}data/${name}`);
  if (!res.ok) throw new Error(`Gagal memuat ${name}: ${res.status}`);
  return (await res.json()) as T;
}

let cache: DashboardData | null = null;

export async function loadAll(): Promise<DashboardData> {
  if (cache) return cache;
  const [summary, tiers, verdicts, clusters, clustersByYear, rules, sampAcc, sampRej] =
    await Promise.all([
      getJSON<Summary>("summary.json"),
      getJSON<TierYearRow[]>("tiers_by_year.json"),
      getJSON<VerdictYearRow[]>("verdict_by_year.json"),
      getJSON<ClusterProfile[]>("clusters.json"),
      getJSON<ClusterYearRow[]>("clusters_by_year.json"),
      getJSON<Rule[]>("rules.json"),
      getJSON<SampleColumnar>("anomaly_sample_accepted.json"),
      getJSON<SampleColumnar>("anomaly_sample_rejected.json"),
    ]);
  cache = {
    summary,
    tiers,
    verdicts,
    clusters,
    clustersByYear,
    rules,
    samples: { accepted: sampAcc, rejected: sampRej },
  };
  return cache;
}
