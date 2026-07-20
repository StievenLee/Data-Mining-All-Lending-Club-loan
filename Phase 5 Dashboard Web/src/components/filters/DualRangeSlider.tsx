interface Props {
  lo: number;
  hi: number;
  a: number;
  b: number;
  onChange: (v: [number, number]) => void;
}

/** Satu track dengan 2 thumb + isian di antaranya. Dua <input range> ditumpuk;
    hanya thumb yang menerima klik (pointer-events di CSS). */
export default function DualRangeSlider({ lo, hi, a, b, onChange }: Props) {
  const span = Math.max(1, hi - lo);
  const leftPct = ((a - lo) / span) * 100;
  const widthPct = ((b - a) / span) * 100;

  const setLo = (v: number) => onChange([Math.min(v, b), b]);
  const setHi = (v: number) => onChange([a, Math.max(v, a)]);

  return (
    <div className="dual-range">
      <div className="track" />
      <div className="track-fill" style={{ left: `${leftPct}%`, width: `${widthPct}%` }} />
      <input
        type="range"
        min={lo}
        max={hi}
        step={1}
        value={a}
        onChange={(e) => setLo(Number(e.target.value))}
        aria-label="Tahun mulai"
      />
      <input
        type="range"
        min={lo}
        max={hi}
        step={1}
        value={b}
        onChange={(e) => setHi(Number(e.target.value))}
        aria-label="Tahun akhir"
      />
    </div>
  );
}
