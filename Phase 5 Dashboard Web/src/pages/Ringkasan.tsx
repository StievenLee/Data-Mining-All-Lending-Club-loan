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
import DatasetToggle from "../components/filters/DatasetToggle";
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
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <DatasetToggle />
      </div>
      <YearRangeSlider bounds={data.summary.year_bounds!} recordCount={total} />

      <div className="grid g-21">
        <Card title="Distribusi Tier Keyakinan" note="skala log">
          <EChart option={tierBar} height={320} />
        </Card>
        <Card title="Bukti Kuat" note="% dari total">
          <EChart option={gauge} height={320} />
        </Card>
      </div>
      <div className="grid g-11">
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
          <div className="legend-row">
            {counts.map((c) => (
              <span key={c.tier} className="legend-chip">
                <span
                  className="swatch"
                  style={{ background: "var(--violet)" }}
                />
                {c.tier}: {c.count.toLocaleString("id-ID")}
              </span>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
