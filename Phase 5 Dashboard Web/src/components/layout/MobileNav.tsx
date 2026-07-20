import { useDashboard } from "../../store/useDashboard";
import type { TabId } from "../../types";
import NavIcon from "./NavIcon";

// Label pendek agar muat di bar bawah mobile.
const NAV: { id: TabId; label: string }[] = [
  { id: "ringkasan", label: "Ringkasan" },
  { id: "segmentasi", label: "Segmen" },
  { id: "rules", label: "Rules" },
  { id: "anomali", label: "Anomali" },
];

/** Navigasi bawah — hanya tampil <900px (saat sidebar disembunyikan). */
export default function MobileNav() {
  const tab = useDashboard((s) => s.tab);
  const setTab = useDashboard((s) => s.setTab);
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 hidden grid-cols-4 border-t border-line bg-bg-deep/90 backdrop-blur-[18px] max-[900px]:grid">
      {NAV.map((n) => {
        const active = tab === n.id;
        return (
          <button
            key={n.id}
            onClick={() => setTab(n.id)}
            className={
              "flex flex-col items-center gap-1 py-2.5 font-mono text-[10px] transition-colors " +
              (active ? "text-lime" : "text-muted")
            }
          >
            <NavIcon tab={n.id} className="flex-none" />
            {n.label}
          </button>
        );
      })}
    </nav>
  );
}
