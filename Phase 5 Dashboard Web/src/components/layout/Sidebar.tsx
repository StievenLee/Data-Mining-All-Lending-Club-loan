import { useDashboard } from "../../store/useDashboard";
import type { TabId } from "../../types";
import NavIcon from "./NavIcon";

const NAV: { id: TabId; label: string }[] = [
  { id: "ringkasan", label: "Ringkasan" },
  { id: "preprocessing", label: "Preprocessing" },
  { id: "segmentasi", label: "Segmentasi" },
  { id: "rules", label: "Association Rules" },
  { id: "anomali", label: "Anomali" },
  { id: "insight", label: "Insight Bisnis" },
  { id: "laporan", label: "Laporan KDD" },
];

// Tanpa background — hanya ikon + nama. Aktif ditandai warna lime saja.
const NAV_BASE =
  "flex w-full items-center gap-3 bg-transparent px-2 py-[11px] text-left text-sm mb-1 transition-colors duration-150";

export default function Sidebar() {
  const tab = useDashboard((s) => s.tab);
  const setTab = useDashboard((s) => s.setTab);
  return (
    <aside className="fixed bottom-0 left-0 top-[var(--nav)] z-30 flex w-[var(--side)] flex-col border-r border-line bg-bg-deep/55 px-[18px] py-6 backdrop-blur-[18px] max-[900px]:hidden">
      {NAV.map((n) => {
        const active = tab === n.id;
        return (
          <button
            key={n.id}
            onClick={() => setTab(n.id)}
            className={NAV_BASE + (active ? " font-medium text-lime" : " text-muted hover:text-text")}
          >
            <NavIcon tab={n.id} className="flex-none" />
            {n.label}
          </button>
        );
      })}
    </aside>
  );
}
