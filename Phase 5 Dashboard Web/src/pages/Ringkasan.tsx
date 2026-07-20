import { useMemo } from "react";
import type { DashboardData } from "../types";
import { useDashboard } from "../store/useDashboard";
import {
  strongPct,
  tierCounts,
  totalRecords,
  verdictCounts,
} from "../data/filters";
import { gaugeOption, tierBarOption, verdictOption } from "../components/charts/options";
import EChart from "../components/EChart";
import Card from "../components/Card";
import PageHead from "../components/PageHead";
import YearRangeSlider from "../components/filters/YearRangeSlider";

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

  return (
    <>
      <PageHead
        eyebrow="Fase 4 · Deteksi Anomali"
        title="Ringkasan Temuan"
        sub={
          <>
            Dari <b>{total.toLocaleString("id-ID")}</b> record anomali{" "}
            {dataset}, sebanyak <b>{strong.pct}%</b> tergolong bukti kuat
            (3+ metode / DBSCAN). Semua filter dihitung langsung di browser.
          </>
        }
        pills={[
          { label: "Record", value: total.toLocaleString("id-ID") },
          { label: "Kritis", value: strong.kritis.toLocaleString("id-ID"), kind: "accent" },
          { label: "Noise DBSCAN", value: String(data.summary.kpi.dbscan_noise_acc), kind: "ai" },
        ]}
      />
      <YearRangeSlider bounds={data.summary.year_bounds!} recordCount={total} />

      <div className="mb-[18px] grid min-w-0 grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-[18px] max-[1080px]:grid-cols-1">
        <Card title="Distribusi Tier Keyakinan" note="skala log">
          <EChart option={tierBar} height={320} />
        </Card>
        <Card title="Bukti Kuat" note="% dari total">
          <EChart option={gauge} height={320} />
        </Card>
      </div>
      <div className="mb-[18px] grid min-w-0 grid-cols-2 gap-[18px] max-[1080px]:grid-cols-1">
        <Card
          title="Tipologi Verdict"
          sub={
            dataset === "accepted"
              ? "Klasifikasi otomatis: Sinyal Risiko, Kesalahan Data, Kasus Langka."
              : "Tipologi verdict hanya tersedia untuk dataset accepted."
          }
        >
          <EChart option={verdict} height={320} />
        </Card>
        <Card
          title="Cara Membaca"
          sub="Tier makin tinggi = makin banyak metode sepakat menandai baris sebagai anomali."
        >
          <div className="mt-3 flex flex-wrap gap-3.5">
            {counts.map((c) => (
              <span
                key={c.tier}
                className="flex items-center gap-[7px] font-mono text-[11px] text-muted"
              >
                <span className="h-[11px] w-[11px] rounded-[3px] bg-violet" />
                {c.tier}: {c.count.toLocaleString("id-ID")}
              </span>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
