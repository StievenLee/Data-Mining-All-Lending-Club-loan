import { useDashboard } from "../../store/useDashboard";
import type { Dataset } from "../../types";

const SEG_BASE =
  "cursor-pointer whitespace-nowrap rounded-full border-0 px-2.5 py-1.5 font-mono text-[11px] transition-all duration-150 min-[640px]:px-[15px] min-[640px]:py-[7px] min-[640px]:text-xs";

export default function DatasetToggle() {
  const dataset = useDashboard((s) => s.dataset);
  const setDataset = useDashboard((s) => s.setDataset);
  const btn = (value: Dataset, label: string) => (
    <button
      onClick={() => setDataset(value)}
      className={
        SEG_BASE +
        (dataset === value
          ? " bg-lime font-semibold text-ink shadow-[0_0_14px_rgba(195,244,0,0.35)]"
          : " bg-transparent text-muted hover:text-text")
      }
    >
      {label}
    </button>
  );
  return (
    <div
      className="inline-flex rounded-full border border-line bg-bg-deep p-[3px]"
      role="group"
      aria-label="Pilih dataset"
    >
      {btn("accepted", "Accepted")}
      {btn("rejected", "Rejected")}
    </div>
  );
}
