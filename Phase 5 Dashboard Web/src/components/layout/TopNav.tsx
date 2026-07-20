import { useDashboard } from "../../store/useDashboard";
import DatasetToggle from "../filters/DatasetToggle";

const TAB_LABEL: Record<string, string> = {
  ringkasan: "Ringkasan",
  segmentasi: "Segmentasi",
  rules: "Association Rules",
  anomali: "Anomali",
};

// Toggle dataset relevan di semua tab (rules & segmentasi difilter/dibatasi per dataset juga)
const DATASET_TABS = new Set(["ringkasan", "segmentasi", "rules", "anomali"]);

export default function TopNav() {
  const tab = useDashboard((s) => s.tab);
  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-[var(--nav)] items-center gap-3 border-b border-line bg-bg-deep/70 px-4 backdrop-blur-[18px] min-[640px]:gap-5 min-[640px]:px-[22px]">
      <div className="flex min-w-0 items-center gap-3 min-[640px]:gap-[18px]">
        <span className="font-display text-base font-bold whitespace-nowrap text-lime">
          LC KDD CORE
        </span>
        <nav className="flex items-center gap-2.5 overflow-hidden font-mono text-xs text-ellipsis whitespace-nowrap max-[680px]:hidden">
          <span className="text-muted">Fase Analisis</span>
          <span className="text-line">/</span>
          <span className="text-text">{TAB_LABEL[tab]}</span>
        </nav>
      </div>
      <div className="ml-auto flex flex-none items-center gap-2 min-[640px]:gap-3.5">
        {DATASET_TABS.has(tab) && <DatasetToggle />}
      </div>
    </header>
  );
}
