import { useMemo } from "react";
import type { ReactNode } from "react";
import type { DashboardData, TabId } from "../types";
import { useDashboard } from "../store/useDashboard";
import {
  clusterProfilesForYears,
  strongPct,
  tierCounts,
} from "../data/filters";
import {
  clusterOption,
  ruleNetworkOption,
  tierBarOption,
} from "../components/charts/options";
import EChart from "../components/EChart";
import Card from "../components/Card";
import Callout from "../components/Callout";
import PageHead from "../components/PageHead";
import YearRangeSlider from "../components/filters/YearRangeSlider";
import { isStrongOnly, recordUnit } from "../lib/scope";
import { REJECTED_RISK_NOTE, clustersFor } from "../lib/cluster";

/* ============================================================================
   Ikhtisar (home). Bukan halaman satu-fase, melainkan pintu masuk lintas fase:
   satu chart "tanda tangan" dari tiap fase mining (Segmentasi F2, Aturan F3,
   Anomali F4) ditambah KPI ringkas. Kedalaman tiap fase ada di tab-nya sendiri;
   di sini hanya sekilas + tautan untuk menuju ke sana. Angka ikut rentang tahun.
   ========================================================================== */

/** Tombol lompat ke tab lain — menjadikan Ikhtisar hub, bukan salinan tab lain. */
function GoTo({ to, children }: { to: TabId; children: ReactNode }) {
  const setTab = useDashboard((s) => s.setTab);
  return (
    <button
      onClick={() => setTab(to)}
      className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-line bg-glass2 px-3.5 py-1.5 font-mono text-[11px] font-semibold text-muted transition-colors hover:border-lime/40 hover:text-lime"
    >
      {children}
      <span aria-hidden="true">→</span>
    </button>
  );
}

export default function Ringkasan({ data }: { data: DashboardData }) {
  const dataset = useDashboard((s) => s.dataset);
  const years = useDashboard((s) => s.years) ?? data.summary.year_bounds!;
  const datasetLabel = dataset === "accepted" ? "Accepted" : "Rejected";

  // Fase 2 — segmen, agregat per tahun (fallback ke profil keseluruhan).
  const clusterProfiles = useMemo(() => {
    const byYear = clusterProfilesForYears(data.clustersByYear, years, dataset);
    return byYear.length ? byYear : clustersFor(data.clusters, dataset);
  }, [dataset, data.clustersByYear, data.clusters, years]);
  const cluster = useMemo(
    () => clusterOption(clusterProfiles, dataset),
    [clusterProfiles, dataset]
  );
  const population = useMemo(
    () => clusterProfiles.reduce((s, c) => s + c.n_anggota, 0),
    [clusterProfiles]
  );

  // Fase 3 — aturan tidak berlabel tahun. Kumpulkan aturan dataset ini, tampilkan
  // 12 lift tertinggi di jaringan, dan pakai jumlah/ lift dataset ini (bukan total
  // global summary.kpi) supaya pill konsisten dengan grafik yang tampil.
  const datasetRules = useMemo(
    () => data.rules.filter((r) => r.dataset === datasetLabel),
    [data.rules, datasetLabel]
  );
  const topRules = useMemo(
    () => [...datasetRules].sort((a, b) => b.lift - a.lift).slice(0, 12),
    [datasetRules]
  );
  const ruleNet = useMemo(() => ruleNetworkOption(topRules), [topRules]);

  // Fase 4 — distribusi tier keyakinan (ikut tahun).
  const counts = useMemo(
    () => tierCounts(data.tiers, dataset, years),
    [data.tiers, dataset, years]
  );
  const strong = useMemo(() => strongPct(counts), [counts]);
  const tierBar = useMemo(() => tierBarOption(counts), [counts]);

  const populationLabel =
    dataset === "accepted" ? "Pinjaman dianalisis" : "Pengajuan dianalisis";

  return (
    <>
      <PageHead
        eyebrow="Dashboard KDD · Lending Club 2007–2018"
        title="Home"
        sub={
          <>
            Pintu masuk lintas lima fase: satu grafik utama dari tiap tahap mining, plus
            angka kunci yang <b>ikut bergerak</b> saat rentang tahun (atau dataset) diubah.
            Buka tab masing-masing untuk kedalaman penuh. Semua filter dihitung langsung di browser.
          </>
        }
        pills={[
          { label: populationLabel, value: population.toLocaleString("id-ID") },
          { label: "Segmen", value: String(clusterProfiles.length) },
          { label: "Pola aturan", value: datasetRules.length.toLocaleString("id-ID"), kind: "accent" },
          { label: "Anomali kritis", value: strong.kritis.toLocaleString("id-ID"), kind: "ai" },
        ]}
      />
      <Callout eyebrow="Pertanyaan sentral KDD">
        Apa yang tidak terlihat dari data mentah? Data mentah menunjukkan <b>siapa</b> yang
        berisiko; yang ditambang di sini adalah <b>di mana</b> risiko menumpuk — pada segmen,
        pada pola kontrak, dan pada kasus yang menyimpang. Ketiganya harus dibentuk lebih dulu
        sebelum bisa ditanyakan, dan itulah yang membedakan penambangan dari pelaporan data.
      </Callout>
      <YearRangeSlider
        bounds={data.summary.year_bounds!}
        recordCount={population}
        recordUnit={recordUnit(dataset)}
      />

      <div className="mb-[18px] grid min-w-0 grid-cols-2 gap-[18px] max-[1080px]:grid-cols-1">
        <Card
          title="Segmen risiko nasabah"
          note={`Fase 2 · ${years[0]}–${years[1]}`}
          sub={
            dataset === "rejected"
              ? REJECTED_RISK_NOTE
              : "Tiga segmen alami; default rate naik dari Prime ke High-Risk, mengikuti rentang tahun."
          }
        >
          <EChart option={cluster} height={320} />
          <GoTo to="segmentasi">Telusuri profil segmen</GoTo>
        </Card>
        <Card
          title="Distribusi keyakinan anomali"
          note="Fase 4 · skala log"
          sub={
            isStrongOnly(dataset)
              ? "Makin ke atas makin banyak metode yang sepakat. Untuk rejected hanya tier bukti kuat (Kuat ke atas) yang dimuat, bukan total anomali."
              : "Makin ke atas makin banyak metode yang sepakat menandai record — makin kuat buktinya."
          }
        >
          <EChart option={tierBar} height={320} />
          <GoTo to="anomali">Buka peta & investigasi anomali</GoTo>
        </Card>
      </div>

      <Card
        title="Jaringan aturan asosiasi"
        note={`Fase 3 · ${topRules.length} lift tertinggi (${datasetLabel})`}
        sub={
          datasetRules.length === 0 ? (
            <>Belum ada aturan asosiasi untuk dataset {datasetLabel}.</>
          ) : (
            <>
              Tiap lingkaran satu ciri pinjaman, tiap panah satu aturan{" "}
              <b className="text-text">JIKA → MAKA</b>. Lingkaran besar = ciri penghubung yang
              disentuh banyak aturan; panah tebal &amp; hijau = kaitan kuat (lift).
            </>
          )
        }
      >
        <EChart option={ruleNet} height={420} />
        <GoTo to="rules">Baca semua aturan &amp; rekomendasinya</GoTo>
      </Card>
    </>
  );
}
