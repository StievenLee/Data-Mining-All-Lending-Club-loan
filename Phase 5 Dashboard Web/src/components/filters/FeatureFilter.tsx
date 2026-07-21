import type { FeatureMeta } from "../../lib/ruleNarrative";

interface Option extends FeatureMeta {
  count: number; // jumlah rule (setelah ambang lift) yang memuat fitur ini
}

interface Props {
  options: Option[];
  selected: string[];
  onToggle: (key: string) => void;
  onClear: () => void;
}

const CHIP_BASE =
  "cursor-pointer whitespace-nowrap rounded-full border px-3 py-1.5 font-mono text-[11px] transition-all duration-150";

/** Filter multi-pilih berdasarkan fitur (grade, jumlah pinjaman, dst).
 *  Memilih fitur -> hanya rule yang memuat SEMUA fitur terpilih yang tampil. */
export default function FeatureFilter({ options, selected, onToggle, onClear }: Props) {
  if (options.length === 0) return null;
  return (
    <div className="rounded-[14px] border border-line bg-glass2/60 px-3.5 py-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          Saring per fitur
        </span>
        <button
          onClick={onClear}
          disabled={selected.length === 0}
          className={
            "font-mono text-[11px] transition-colors " +
            (selected.length === 0
              ? "cursor-default text-muted/50"
              : "cursor-pointer text-violet hover:text-lime")
          }
        >
          Reset
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = selected.includes(o.key);
          return (
            <button
              key={o.key}
              onClick={() => onToggle(o.key)}
              aria-pressed={on}
              className={
                CHIP_BASE +
                (on
                  ? " border-lime bg-lime font-semibold text-ink shadow-[0_0_12px_rgba(195,244,0,0.3)]"
                  : " border-line bg-glass2 text-muted hover:text-text")
              }
            >
              {o.label}
              <span className={on ? " text-ink/70" : " text-muted/60"}> · {o.count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
