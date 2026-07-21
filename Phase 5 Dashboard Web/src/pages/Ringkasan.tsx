import { useMemo } from "react";
import type { DashboardData } from "../types";
import { useDashboard } from "../store/useDashboard";
import {
  clusterProfilesForYears,
  strongPct,
  tierCounts,
  totalRecords,
  verdictCounts,
} from "../data/filters";
import {
  clusterOption,
  gaugeOption,
  tierBarOption,
  verdictOption,
} from "../components/charts/options";
import EChart from "../components/EChart";
import Card from "../components/Card";
import Callout from "../components/Callout";
import PageHead from "../components/PageHead";
import YearRangeSlider from "../components/filters/YearRangeSlider";
import { fmt2 } from "../lib/format";
import { REJECTED_SCOPE_TEXT, isStrongOnly, recordUnit } from "../lib/scope";

export default function Ringkasan({ data }: { data: DashboardData }) {
  const dataset = useDashboard((s) => s.dataset);
  const years = useDashboard((s) => s.years) ?? data.summary.year_bounds!;

  const counts = useMemo(
    () => tierCounts(data.tiers, dataset, years),
    [data.tiers, dataset, years]
  );
  const strong = useMemo(() => strongPct(counts), [counts]);
  const verdicts = useMemo(
    () => (dataset === "accepted" ? verdictCounts(data.verdicts, years) : []),
    [data.verdicts, dataset, years]
  );
  const total = useMemo(
    () => totalRecords(data.tiers, dataset, years),
    [data.tiers, dataset, years]
  );

  const gauge = useMemo(() => gaugeOption(strong.pct), [strong.pct]);
  const tierBar = useMemo(() => tierBarOption(counts), [counts]);
  const verdict = useMemo(() => verdictOption(verdicts), [verdicts]);
  const clusterProfiles = useMemo(
    () =>
      data.clustersByYear.length
        ? clusterProfilesForYears(data.clustersByYear, years)
        : data.clusters,
    [data.clustersByYear, data.clusters, years]
  );
  const cluster = useMemo(() => clusterOption(clusterProfiles), [clusterProfiles]);
  const strongOnly = isStrongOnly(dataset);

  return (
    <>
      <PageHead
        eyebrow="Fase 4 Deteksi Anomali"
        title="Ringkasan Temuan"
        sub={
          strongOnly ? (
            <>
              Dimuat <b>{total.toLocaleString("id-ID")}</b> record anomali {dataset}{" "}
              <b>bukti kuat</b> (3+ metode / DBSCAN); tier Sedang &amp; Lemah tidak
              diekspor, jadi ini bukan total anomali {dataset}. Semua filter dihitung
              langsung di browser.
            </>
          ) : (
            <>
              Dari <b>{total.toLocaleString("id-ID")}</b> record anomali{" "}
              {dataset}, sebanyak <b>{fmt2(strong.pct)}%</b> tergolong bukti kuat
              (3+ metode / DBSCAN). Semua filter dihitung langsung di browser.
            </>
          )
        }
        pills={[
          {
            label: strongOnly ? "Record bukti kuat" : "Record",
            value: total.toLocaleString("id-ID"),
          },
          { label: "Kritis", value: strong.kritis.toLocaleString("id-ID"), kind: "accent" },
          { label: "Noise DBSCAN", value: String(data.summary.dbscan[dataset].n_noise), kind: "ai" },
        ]}
      />
      <Callout eyebrow="Pertanyaan sentral KDD">
        Apa yang tidak terlihat dari data mentah? Anomali paling penting bukan satu nilai yang
        ekstrem, melainkan <b>record yang disepakati banyak metode sekaligus</b> dan terisolasi dari
        seluruh klaster. Di titik itulah bukti statistik dan struktural bertemu, dan di sanalah sinyal
        risiko sejati berada.
      </Callout>
      <YearRangeSlider
        bounds={data.summary.year_bounds!}
        recordCount={total}
        recordUnit={recordUnit(dataset)}
      />

      <div className="mb-[18px] grid min-w-0 grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-[18px] max-[1080px]:grid-cols-1">
        <Card
          title="Distribusi tier keyakinan"
          note="skala log"
          sub={strongOnly ? REJECTED_SCOPE_TEXT : undefined}
        >
          <EChart option={tierBar} height={320} />
        </Card>
        <Card
          title="Bukti kuat"
          note={strongOnly ? "cakupan data" : "% dari total"}
          sub={
            strongOnly
              ? "Selalu 100% untuk rejected: yang dimuat memang hanya tier bukti kuat."
              : undefined
          }
        >
          <EChart option={gauge} height={320} />
        </Card>
      </div>

      <div className="mb-[18px] grid min-w-0 grid-cols-2 gap-[18px] max-[1080px]:grid-cols-1">
        <Card
          title="Komposisi tipologi anomali"
          note="auto-verdict"
          sub="Klasifikasi tiap anomali ke tiga tipologi bisnis."
        >
          <EChart option={verdict} height={320} />
        </Card>
        <Card
          title="Segmen risiko nasabah"
          note={`Fase 2 · ${years[0]}–${years[1]}`}
          sub="Default rate naik dari Prime ke Highest-Risk, mengikuti rentang tahun."
        >
          <EChart option={cluster} height={320} />
        </Card>
      </div>
    </>
  );
}
