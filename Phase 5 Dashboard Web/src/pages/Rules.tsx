import { useEffect, useMemo, useState } from "react";
import type { DashboardData } from "../types";
import { useDashboard } from "../store/useDashboard";
import { ruleFeatures } from "../lib/ruleNarrative";
import RuleCard from "../components/RuleCard";
import Card from "../components/Card";
import Callout from "../components/Callout";
import PageHead from "../components/PageHead";
import LiftSlider from "../components/filters/LiftSlider";
import FeatureFilter from "../components/filters/FeatureFilter";

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

  // Himpunan key fitur per rule (dihitung sekali per dataset).
  const featureKeys = useMemo(() => {
    const m = new Map<(typeof rules)[number], Set<string>>();
    for (const r of rules) {
      m.set(r, new Set(ruleFeatures(r.antecedent, r.consequent).map((f) => f.key)));
    }
    return m;
  }, [rules]);

  // Pilihan fitur reset saat ganti dataset (set fitur beda antar dataset).
  const [selected, setSelected] = useState<string[]>([]);
  useEffect(() => setSelected([]), [datasetLabel]);

  // Rule yang lolos ambang lift — basis untuk opsi filter & hasil akhir.
  const liftPassed = useMemo(() => rules.filter((r) => r.lift >= minLift), [rules, minLift]);

  // Opsi fitur + jumlah rule yang memuatnya (pada ambang lift saat ini).
  const options = useMemo(() => {
    const meta = new Map<string, { key: string; label: string; count: number }>();
    for (const r of liftPassed) {
      for (const f of ruleFeatures(r.antecedent, r.consequent)) {
        const e = meta.get(f.key) ?? { key: f.key, label: f.label, count: 0 };
        e.count += 1;
        meta.set(f.key, e);
      }
    }
    return [...meta.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }, [liftPassed]);

  // Hasil: memuat SEMUA fitur terpilih, diurutkan lift tertinggi.
  const matched = useMemo(
    () =>
      liftPassed
        .filter((r) => selected.every((k) => featureKeys.get(r)?.has(k)))
        .sort((a, b) => b.lift - a.lift),
    [liftPassed, selected, featureKeys]
  );
  const shown = matched.slice(0, TOP_N);

  const toggle = (key: string) =>
    setSelected((s) => (s.includes(key) ? s.filter((k) => k !== key) : [...s, key]));

  const selectedLabels = options
    .filter((o) => selected.includes(o.key))
    .map((o) => o.label)
    .join(", ");

  return (
    <>
      <PageHead
        eyebrow="Fase 3 Apriori Association Rules"
        title="Aturan Asosiasi"
        sub={
          rules.length > 0
            ? `Dari ${rules.length.toLocaleString(
                "id-ID"
              )} rule dataset ${datasetLabel}, ditampilkan hingga ${TOP_N} teratas per lift. Geser slider lift atau pilih fitur untuk mempersempit.`
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
      <div className="mb-3.5">
        <FeatureFilter
          options={options}
          selected={selected}
          onToggle={toggle}
          onClear={() => setSelected([])}
        />
      </div>
      <div className="mb-3.5 flex justify-end">
        <LiftSlider max={maxLift} />
      </div>
      <Card
        title="Association rules berperingkat"
        sub={
          selected.length > 0
            ? `${matched.length} rule memuat: ${selectedLabels} — diurutkan lift tertinggi.`
            : "Kartu narasi bisnis, diurutkan dari lift tertinggi."
        }
      >
        {shown.length === 0 ? (
          <p className="font-mono text-[13px] leading-[1.6] text-muted">
            {selected.length > 0
              ? "Tidak ada rule yang memuat semua fitur terpilih pada ambang lift ini. Kurangi fitur atau turunkan slider lift."
              : "Tidak ada rule dengan lift di atas ambang ini. Turunkan slider lift."}
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
