import { useDashboard } from "../../store/useDashboard";
import DatasetToggle from "../filters/DatasetToggle";

const TAB_LABEL: Record<string, string> = {
  ringkasan: "Ringkasan",
  segmentasi: "Segmentasi",
  rules: "Association Rules",
  anomali: "Anomali",
};

// Toggle dataset hanya relevan di tab yang memakainya
const DATASET_TABS = new Set(["ringkasan", "anomali"]);

export default function TopNav() {
  const tab = useDashboard((s) => s.tab);
  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-[var(--nav)] items-center gap-5 border-b border-line bg-bg-deep/70 px-[22px] backdrop-blur-[18px]">
      <div className="flex min-w-0 items-center gap-[18px]">
        <span className="font-display text-base font-bold whitespace-nowrap text-lime">
          LC KDD CORE
        </span>
        <nav className="flex items-center gap-2.5 overflow-hidden font-mono text-xs text-ellipsis whitespace-nowrap">
          <span className="text-muted">Fase Analisis</span>
          <span className="text-line">/</span>
          <span className="text-text">{TAB_LABEL[tab]}</span>
        </nav>
      </div>
      <div className="ml-auto flex flex-none items-center gap-3.5">
        {DATASET_TABS.has(tab) && <DatasetToggle />}
        <span className="flex items-center gap-[7px] rounded-full border border-lime/40 px-3 py-1.5 font-mono text-[11px] tracking-[0.09em] text-lime">
          <span className="h-[7px] w-[7px] animate-[pulseDot_2.4s_infinite] rounded-full bg-lime shadow-[0_0_8px_var(--color-lime)]" />
          LIVE
        </span>
        <span
          className="h-8 w-8 flex-none rounded-full border border-line bg-[conic-gradient(from_210deg,var(--color-violet),var(--color-lime),var(--color-cyan),var(--color-violet))]"
          aria-hidden
        />
      </div>
    </header>
  );
}
