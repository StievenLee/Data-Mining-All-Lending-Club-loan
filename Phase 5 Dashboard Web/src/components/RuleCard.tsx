import type { Rule } from "../types";
import { humanizeItems, ruleNarrative } from "../lib/ruleNarrative";

interface Props {
  rule: Rule;
  index: number;
}

/** Satu chip kondisi (item antecedent/consequent). */
function Chip({ text, tone }: { text: string; tone: "if" | "then" }) {
  const cls =
    tone === "then"
      ? "border-lime/40 bg-lime/[0.08] text-text"
      : "border-line bg-glass2 text-muted";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[12.5px] leading-none ${cls}`}
    >
      {text}
    </span>
  );
}

/** Satu tile metrik: nilai besar + label + penjelasan awam. */
function Metric({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  accent: string;
}) {
  return (
    <div className="rounded-[14px] border border-line bg-glass2 px-3 py-2.5">
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{label}</div>
      <div className={`mt-0.5 font-display text-[22px] font-semibold leading-none ${accent}`}>
        {value}
      </div>
      <div className="mt-1 text-[11px] leading-[1.35] text-muted">{hint}</div>
    </div>
  );
}

export default function RuleCard({ rule, index }: Props) {
  const conf = Number.isFinite(rule.confidence) ? rule.confidence : 0;
  const sup = Number.isFinite(rule.support) ? rule.support : 0;
  const lift = Number.isFinite(rule.lift) ? rule.lift : 0;

  const ifItems = humanizeItems(rule.antecedent);
  const thenItems = humanizeItems(rule.consequent);

  return (
    <div className="relative overflow-hidden rounded-[18px] border border-line bg-glass px-5 py-4 before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-lime before:content-['']">
      {/* Header: nomor + badge lift */}
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <span className="font-mono text-[11px] tracking-wide text-muted">Rule #{index}</span>
        <span className="rounded-full bg-lime px-3 py-1 font-mono text-[13px] font-bold text-ink shadow-[0_0_12px_rgba(195,244,0,0.3)]">
          {lift.toFixed(1)}× lift
        </span>
      </div>

      {/* Narasi cerita — kalimat utuh yang mudah dipahami */}
      <p className="mb-3.5 text-[15px] leading-[1.55] text-text">
        {ruleNarrative(rule.antecedent, rule.consequent)}
      </p>

      {/* Struktur eksplisit: JIKA (antecedents) -> MAKA (consequents) */}
      <div className="mb-3.5 rounded-[14px] border border-line bg-glass2/60 px-3.5 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            Jika
          </span>
          {ifItems.map((t, i) => (
            <Chip key={`if-${i}`} text={t} tone="if" />
          ))}
        </div>
        <div className="my-2 flex items-center gap-2 text-muted">
          <span aria-hidden className="text-lime">
            ↓
          </span>
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-lime">
            Maka
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {thenItems.map((t, i) => (
            <Chip key={`then-${i}`} text={t} tone="then" />
          ))}
        </div>
      </div>

      {/* Tiga metrik berlabel jelas + penjelasan awam */}
      <div className="grid grid-cols-3 gap-2">
        <Metric
          label="Support"
          value={`${(sup * 100).toFixed(1)}%`}
          hint="porsi dari seluruh data"
          accent="text-cyan"
        />
        <Metric
          label="Confidence"
          value={`${(conf * 100).toFixed(0)}%`}
          hint="tingkat keyakinan pola"
          accent="text-violet"
        />
        <Metric
          label="Lift"
          value={`${lift.toFixed(1)}×`}
          hint="vs. terjadi kebetulan"
          accent="text-lime"
        />
      </div>
    </div>
  );
}
