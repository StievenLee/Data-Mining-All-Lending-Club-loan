// loaders.ts — unduh SEMUA data SEKALI, cache di memori. Setelah ini tak ada
// request server lagi; semua filter jalan di browser.
//
// UKURAN NYATA: 43,8 MB mentah / ±4,1 MB gzip, 99,6% berasal dari dua file scatter
// (177.070 + 547.100 titik, tanpa sampling). Parse-nya ±310 ms di Node desktop dan
// menahan ±106 MB heap, dan ini diblokir di depan SEMUA tab -- termasuk Preprocessing
// yang tak memakai data apa pun. Lazy-load per tab adalah perbaikan yang belum dikerjakan.

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
