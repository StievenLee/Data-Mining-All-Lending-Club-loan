import { useDashboard } from "../../store/useDashboard";

interface Props {
  max: number;
}

export default function LiftSlider({ max }: Props) {
  const minLift = useDashboard((s) => s.minLift);
  const setMinLift = useDashboard((s) => s.setMinLift);
  return (
    <div className="lift-ctl">
      <span className="year-filter-label">min lift</span>
      <input
        type="range"
        min={1}
        max={Math.max(2, Math.ceil(max))}
        step={0.1}
        value={minLift}
        onChange={(e) => setMinLift(Number(e.target.value))}
      />
      <span className="val">{minLift.toFixed(1)}</span>
    </div>
  );
}
