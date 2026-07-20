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
    <div className="year-filter">
      <div className="year-filter-head">
        <div className="year-filter-title">
          <span className="year-filter-label">Rentang tahun</span>
          <span className="year-badge">{a === b ? a : `${a}–${b}`}</span>
        </div>
        <div className="year-filter-actions">
          <span className="year-count">
            {recordCount.toLocaleString("id-ID")} record
          </span>
          <div className="year-presets">
            {presets.map(([lbl, x, y]) => (
              <button
                key={lbl}
                className="year-preset-btn"
                onClick={() => setYears([x, y])}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="range-wrap">
        <span className="year-count">dari</span>
        <input type="range" min={lo} max={hi} step={1} value={a} onChange={(e) => setLo(Number(e.target.value))} />
        <span className="year-count">sampai</span>
        <input type="range" min={lo} max={hi} step={1} value={b} onChange={(e) => setHi(Number(e.target.value))} />
      </div>
    </div>
  );
}
