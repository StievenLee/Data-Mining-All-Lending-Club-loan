import { useDashboard } from "../../store/useDashboard";

interface Props {
  bounds: [number, number];
  recordCount: number;
}

/** Filter rentang tahun: dua slider (dari/sampai) + preset cepat. */
export default function YearRangeSlider({ bounds, recordCount }: Props) {
  const [lo, hi] = bounds;
  const years = useDashboard((s) => s.years) ?? bounds;
  const setYears = useDashboard((s) => s.setYears);
  const [a, b] = years;

  const setLo = (v: number) => setYears([Math.min(v, b), b]);
  const setHi = (v: number) => setYears([a, Math.max(v, a)]);

  const presets: [string, number, number][] = [["Semua", lo, hi]];
  for (const n of [10, 5, 3]) if (hi - n + 1 > lo) presets.push([`${n}Y terakhir`, hi - n + 1, hi]);

  return (
    <div className="mb-[18px] rounded-[20px] border border-line bg-glass px-5 py-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
            Rentang tahun
          </span>
          <span className="font-mono text-[15px] font-bold text-lime">
            {a === b ? a : `${a}–${b}`}
          </span>
        </div>
        <div className="flex items-center gap-3.5">
          <span className="font-mono text-[11px] text-muted">
            {recordCount.toLocaleString("id-ID")} record
          </span>
          <div className="flex gap-2">
            {presets.map(([lbl, x, y]) => (
              <button
                key={lbl}
                onClick={() => setYears([x, y])}
                className="cursor-pointer rounded-full border border-line bg-bg-deep px-[11px] py-[5px] font-mono text-[11px] text-muted transition-all duration-150 hover:border-violet hover:text-text"
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3.5">
        <span className="font-mono text-[11px] text-muted">dari</span>
        <input
          type="range"
          min={lo}
          max={hi}
          step={1}
          value={a}
          onChange={(e) => setLo(Number(e.target.value))}
          className="h-1 flex-1 accent-lime"
        />
        <span className="font-mono text-[11px] text-muted">sampai</span>
        <input
          type="range"
          min={lo}
          max={hi}
          step={1}
          value={b}
          onChange={(e) => setHi(Number(e.target.value))}
          className="h-1 flex-1 accent-lime"
        />
      </div>
    </div>
  );
}
