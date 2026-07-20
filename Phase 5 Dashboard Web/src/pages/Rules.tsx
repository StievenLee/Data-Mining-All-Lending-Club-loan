import { useMemo } from "react";
import type { DashboardData } from "../types";
import { useDashboard } from "../store/useDashboard";
import { rulesOption } from "../components/charts/options";
import EChart from "../components/EChart";
import Card from "../components/Card";
import PageHead from "../components/PageHead";
import LiftSlider from "../components/filters/LiftSlider";

export default function Rules({ data }: { data: DashboardData }) {
  const minLift = useDashboard((s) => s.minLift);
  const maxLift = useMemo(
    () => Math.max(...data.rules.map((r) => r.lift), 2),
    [data.rules]
  );
  const shown = useMemo(
    () => data.rules.filter((r) => r.lift >= minLift).length,
    [data.rules, minLift]
  );
  const option = useMemo(() => rulesOption(data.rules, minLift), [data.rules, minLift]);
  const height = Math.max(360, shown * 34 + 90);

  return (
    <>
      <PageHead
        eyebrow="Fase 3 · Apriori Association Rules"
        title="Aturan Asosiasi"
        sub={
          <>
            <b>{shown}</b> dari {data.rules.length} aturan dengan lift ≥{" "}
            <b>{minLift.toFixed(1)}</b>. Geser slider — grafik ter-filter di
            browser secara instan.
          </>
        }
        pills={[
          { label: "Aturan tampil", value: String(shown) },
          { label: "Lift maks", value: maxLift.toFixed(2), kind: "accent" },
        ]}
      />
      <div className="mb-3.5 flex justify-end">
        <LiftSlider max={maxLift} />
      </div>
      <Card
        title="Aturan berdasarkan Lift"
        sub="Panjang bar = lift (kekuatan asosiasi), warna = confidence."
      >
        <EChart option={option} height={height} />
      </Card>
    </>
  );
}
