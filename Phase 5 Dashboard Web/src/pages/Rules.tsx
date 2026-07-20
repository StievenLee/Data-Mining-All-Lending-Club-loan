import { useMemo } from "react";
import type { DashboardData } from "../types";
import { useDashboard } from "../store/useDashboard";
import { rulesOption } from "../components/charts/options";
import EChart from "../components/EChart";
import Card from "../components/Card";
import PageHead from "../components/PageHead";
import LiftSlider from "../components/filters/LiftSlider";

export default function Rules({ data }: { data: DashboardData }) {
  const dataset = useDashboard((s) => s.dataset);
  const minLift = useDashboard((s) => s.minLift);
  const datasetLabel = dataset === "accepted" ? "Accepted" : "Rejected";

  const rules = useMemo(
    () => data.rules.filter((r) => r.dataset === datasetLabel),
    [data.rules, datasetLabel]
  );
  const maxLift = useMemo(() => Math.max(...rules.map((r) => r.lift), 2), [rules]);
  const shown = useMemo(
    () => rules.filter((r) => r.lift >= minLift).length,
    [rules, minLift]
  );
  const option = useMemo(() => rulesOption(rules, minLift), [rules, minLift]);
  const height = Math.max(360, shown * 34 + 90);

  return (
    <>
      <PageHead
        eyebrow="Fase 3 Apriori Association Rules"
        title="Aturan Asosiasi"
        sub={
          rules.length > 0 ? (
            <>
              <b>{shown}</b> dari {rules.length} aturan {dataset} dengan lift ≥{" "}
              <b>{minLift.toFixed(1)}</b>. Geser slider — grafik ter-filter di
              browser secara instan.
            </>
          ) : (
            `Belum ada aturan asosiasi untuk dataset ${dataset}.`
          )
        }
        pills={[
          { label: "Aturan tampil", value: String(shown) },
          { label: "Lift maks", value: rules.length ? maxLift.toFixed(2) : "–", kind: "accent" },
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
