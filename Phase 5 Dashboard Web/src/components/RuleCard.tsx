import type { Rule } from "../types";
import { ruleNarrative } from "../lib/ruleNarrative";

interface Props {
  rule: Rule;
  index: number;
}

export default function RuleCard({ rule, index }: Props) {
  const conf = Number.isFinite(rule.confidence) ? rule.confidence : 0;
  const sup = Number.isFinite(rule.support) ? rule.support : 0;
  const lift = Number.isFinite(rule.lift) ? rule.lift : 0;

  return (
    <div className="relative overflow-hidden rounded-[18px] border border-line bg-glass px-5 py-4 before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-lime before:content-['']">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="font-mono text-[11px] tracking-wide text-muted">Rule #{index}</span>
        <span className="rounded-full bg-lime px-3 py-1 font-mono text-[13px] font-bold text-ink shadow-[0_0_12px_rgba(195,244,0,0.3)]">
          {lift.toFixed(1)}× lift
        </span>
      </div>
      <p className="mb-3 text-[15px] leading-[1.55] text-text">
        {ruleNarrative(rule.antecedent, rule.consequent)}
      </p>
      <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-glass2">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet to-lime"
          style={{ width: `${Math.min(100, Math.max(0, conf * 100))}%` }}
        />
      </div>
      <div className="font-mono text-[11px] tracking-wide text-muted">
        confidence {(conf * 100).toFixed(0)}% · muncul di {(sup * 100).toFixed(1)}% data ·{" "}
        {lift.toFixed(1)}× lebih sering dari kebetulan
      </div>
    </div>
  );
}
