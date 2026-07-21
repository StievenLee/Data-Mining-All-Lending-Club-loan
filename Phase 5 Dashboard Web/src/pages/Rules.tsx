import { useMemo } from "react";
import type { DashboardData } from "../types";
import { useDashboard } from "../store/useDashboard";
import RuleCard from "../components/RuleCard";
import Card from "../components/Card";
import Callout from "../components/Callout";
import PageHead from "../components/PageHead";
import LiftSlider from "../components/filters/LiftSlider";

const TOP_N = 10;

export default function Rules({ data }: { data: DashboardData }) {
  const dataset = useDashboard((s) => s.dataset);
  const minLift = useDashboard((s) => s.minLift);
  const datasetLabel = dataset === "accepted" ? "Accepted" : "Rejected";

  const rules = useMemo(
    () => data.rules.filter((r) => r.dataset === datasetLabel),
    [data.rules, datasetLabel]
  );
  const maxLift = useMemo(() => Math.max(...rules.map((r) => r.lift), 1.1), [rules]);
  const shown = useMemo(
    () =>
      rules
        .filter((r) => r.lift >= minLift)
        .sort((a, b) => b.lift - a.lift)
        .slice(0, TOP_N),
    [rules, minLift]
  );

  return (
    <>
      <PageHead
        eyebrow="Fase 3 Apriori Association Rules"
        title="Aturan Asosiasi"
        sub={
          rules.length > 0
            ? `Dari ${rules.length.toLocaleString(
                "id-ID"
              )} rule dataset ${datasetLabel}, ditampilkan ${TOP_N} teratas per lift dalam bahasa bisnis. Geser slider untuk menaikkan ambang lift minimum.`
            : `Belum ada aturan asosiasi untuk dataset ${datasetLabel}.`
        }
        pills={[
          { label: "Rules", value: String(rules.length) },
          { label: "Lift tertinggi", value: rules.length ? maxLift.toFixed(2) : "–", kind: "accent" },
        ]}
      />
      <Callout eyebrow="Cara membaca setiap kartu">
        Tiap kartu dibaca sebagai cerita: <b>JIKA</b> sebuah pinjaman punya ciri tertentu,{" "}
        <b>MAKA</b> biasanya diikuti hal lain. <b>Support</b> = seberapa sering pola ini muncul
        di seluruh data. <b>Confidence</b> = seberapa yakin (dari kasus ber-ciri itu, berapa persen
        yang benar terjadi). <b>Lift</b> = seberapa kuat kaitannya dibanding terjadi kebetulan —
        makin tinggi makin bermakna.
      </Callout>
      <div className="mb-3.5 flex justify-end">
        <LiftSlider max={maxLift} />
      </div>
      <Card
        title="Association rules berperingkat"
        sub="Kartu narasi bisnis, diurutkan dari lift tertinggi."
      >
        {shown.length === 0 ? (
          <p className="font-mono text-[13px] leading-[1.6] text-muted">
            Tidak ada rule dengan lift di atas ambang ini. Turunkan slider lift.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {shown.map((r, i) => (
              <RuleCard key={`${r.antecedent}->${r.consequent}`} rule={r} index={i + 1} />
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
