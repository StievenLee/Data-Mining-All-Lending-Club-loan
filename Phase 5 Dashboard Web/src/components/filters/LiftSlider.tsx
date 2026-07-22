import { useDashboard } from "../../store/useDashboard";
import { fmt2 } from "../../lib/format";
import { useRafCommit } from "../../lib/useRafCommit";

interface Props {
  max: number;
}

export default function LiftSlider({ max }: Props) {
  const minLift = useDashboard((s) => s.minLift);
  const setMinLift = useDashboard((s) => s.setMinLift);
  // Sama seperti slider tahun: satu commit per frame, bukan per event input.
  // Di halaman Rules ini menggambar ulang jaringan rule, jadi tetap sepadan.
  const commitMinLift = useRafCommit(setMinLift);
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">min lift</span>
      <input
        type="range"
        min={1}
        max={Math.max(2, Math.ceil(max))}
        step={0.1}
        value={minLift}
        onChange={(e) => commitMinLift(Number(e.target.value))}
        className="w-40 accent-violet"
      />
      <span className="min-w-[34px] font-mono text-[13px] text-violet">{fmt2(minLift)}</span>
    </div>
  );
}
