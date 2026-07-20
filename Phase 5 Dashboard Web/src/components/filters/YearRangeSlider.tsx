import { useDashboard } from "../../store/useDashboard";
import DualRangeSlider from "./DualRangeSlider";

interface Props {
  bounds: [number, number];
  recordCount: number;
}

/** Filter rentang tahun: dual-range slider (2 thumb) + preset cepat. */
export default function YearRangeSlider({ bounds, recordCount }: Props) {
  const [lo, hi] = bounds;
  const years = useDashboard((s) => s.years) ?? bounds;
  const setYears = useDashboard((s) => s.setYears);
  const [a, b] = years;

  const presets: [string, number, number][] = [["Semua", lo, hi]];
  for (const n of [10, 5, 3]) if (hi - n + 1 > lo) presets.push([`${n}Y terakhir`, hi - n + 1, hi]);

  return (
    <div className="sticky top-[calc(var(--nav)_+_8px)] z-20 mb-[18px] rounded-2xl border border-line bg-bg-deep/85 px-3.5 py-3 backdrop-blur-[16px] min-[640px]:rounded-[20px] min-[640px]:px-5 min-[640px]:py-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex items-center gap-2.5 min-[640px]:gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted min-[640px]:text-[11px]">
            Rentang tahun
          </span>
          <span className="font-mono text-sm font-bold text-lime min-[640px]:text-[15px]">
            {a === b ? a : `${a}–${b}`}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 min-[640px]:gap-3.5">
          <span className="font-mono text-[10px] text-muted min-[640px]:text-[11px]">
            {recordCount.toLocaleString("id-ID")} record
          </span>
          <div className="flex flex-wrap gap-1.5 min-[640px]:gap-2">
            {presets.map(([lbl, x, y]) => (
              <button
                key={lbl}
                onClick={() => setYears([x, y])}
                className="cursor-pointer rounded-full border border-line bg-bg-deep px-2.5 py-1 font-mono text-[10px] text-muted transition-all duration-150 hover:border-violet hover:text-text min-[640px]:px-[11px] min-[640px]:py-[5px] min-[640px]:text-[11px]"
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>
      </div>
      <DualRangeSlider lo={lo} hi={hi} a={a} b={b} onChange={setYears} />
    </div>
  );
}
