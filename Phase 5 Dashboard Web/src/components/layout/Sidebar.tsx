import { useDashboard } from "../../store/useDashboard";
import type { TabId } from "../../types";
import NavIcon from "./NavIcon";

const NAV: { id: TabId; label: string }[] = [
  { id: "ringkasan", label: "Ringkasan" },
  { id: "segmentasi", label: "Segmentasi" },
  { id: "rules", label: "Association Rules" },
  { id: "anomali", label: "Anomali" },
];

// Tanpa background — hanya ikon + nama. Aktif ditandai warna lime saja.
const NAV_BASE =
  "flex w-full items-center gap-3 bg-transparent px-2 py-[11px] text-left text-sm mb-1 transition-colors duration-150";

export default function Sidebar() {
  const tab = useDashboard((s) => s.tab);
  const setTab = useDashboard((s) => s.setTab);
  return (
    <aside className="fixed bottom-0 left-0 top-[var(--nav)] z-30 flex w-[var(--side)] flex-col border-r border-line bg-bg-deep/55 px-[18px] py-6 backdrop-blur-[18px] max-[900px]:hidden">
      <div className="mb-7 flex items-center gap-3 px-1.5">
        <div className="grid h-[38px] w-[38px] flex-none place-items-center rounded-[11px] bg-[radial-gradient(circle_at_30%_30%,var(--color-lime),var(--color-lime-dim))] font-display font-bold text-ink shadow-[0_0_18px_rgba(195,244,0,0.35)]">
          λ
        </div>
        <div>
          <div className="font-display text-sm font-bold leading-[1.1]">Synthetic Capital</div>
          <div className="mt-[3px] font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
            KDD in Banking
          </div>
        </div>
      </div>
      <div className="mb-2.5 mt-1 px-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
        Eksplorasi
      </div>
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
      <a
        href="https://vercel.com/new"
        target="_blank"
        rel="noreferrer"
        className="mt-auto cursor-pointer rounded-full bg-lime p-3.5 text-center font-mono text-[13px] font-semibold tracking-[0.04em] text-ink shadow-[0_0_22px_rgba(195,244,0,0.32)] transition-transform duration-150 hover:-translate-y-px"
      >
        Deploy ke Vercel
      </a>
    </aside>
  );
}
