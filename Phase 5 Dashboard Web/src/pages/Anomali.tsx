import { useMemo, useState } from "react";
import type { DashboardData } from "../types";
import { useDashboard } from "../store/useDashboard";
import { filterSampleRows, totalRecords } from "../data/filters";
import { anomalyScatterOption } from "../components/charts/options";
import EChart from "../components/EChart";
import Card from "../components/Card";
import PageHead from "../components/PageHead";
import DatasetToggle from "../components/filters/DatasetToggle";
import YearRangeSlider from "../components/filters/YearRangeSlider";

export default function Anomali({ data }: { data: DashboardData }) {
  const dataset = useDashboard((s) => s.dataset);
  const years = useDashboard((s) => s.years) ?? data.summary.year_bounds!;
  const sample = data.samples[dataset];
  const feats = data.summary.features[dataset];

  const [xKey, setXKey] = useState(feats[0]);
  const [yKey, setYKey] = useState(feats[1] ?? feats[0]);
  // pastikan sumbu valid saat ganti dataset
  const safeX = feats.includes(xKey) ? xKey : feats[0];
  const safeY = feats.includes(yKey) ? yKey : feats[1] ?? feats[0];

  const rows = useMemo(() => filterSampleRows(sample, years), [sample, years]);
  const option = useMemo(
    () => anomalyScatterOption(sample, rows, safeX, safeY),
    [sample, rows, safeX, safeY]
  );
  const total = totalRecords(data.tiers, dataset, years);

  const selStyle = {
    fontFamily: "var(--mono)",
    fontSize: 12,
    background: "var(--bg-deep)",
    color: "var(--text)",
    border: "1px solid var(--line)",
    borderRadius: 8,
    padding: "6px 10px",
  } as const;

  return (
    <>
      <PageHead
        eyebrow="Fase 4 · Isolation Forest + DBSCAN"
        title="Peta Anomali"
        sub={
          <>
            Sample <b>{rows.length.toLocaleString("id-ID")}</b> titik dari{" "}
            {total.toLocaleString("id-ID")} record {dataset}. Warna = iso_score;
            lingkaran cyan = noise DBSCAN (Fase 2).
          </>
        }
        pills={[
          { label: "Titik tampil", value: rows.length.toLocaleString("id-ID") },
          { label: "Dataset", value: dataset, kind: "ai" },
        ]}
      />
      <div className="flex flex-wrap items-center justify-end gap-3 mb-3.5">
        <select style={selStyle} value={safeX} onChange={(e) => setXKey(e.target.value)}>
          {feats.map((f) => (
            <option key={f} value={f}>
              X: {f}
            </option>
          ))}
        </select>
        <select style={selStyle} value={safeY} onChange={(e) => setYKey(e.target.value)}>
          {feats.map((f) => (
            <option key={f} value={f}>
              Y: {f}
            </option>
          ))}
        </select>
        <DatasetToggle />
      </div>
      <YearRangeSlider bounds={data.summary.year_bounds!} recordCount={total} />
      <Card title="Scatter Anomali" note={`${safeX} × ${safeY}`}>
        <EChart option={option} height={480} />
      </Card>
    </>
  );
}
