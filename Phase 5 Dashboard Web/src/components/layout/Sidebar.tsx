import { useDashboard } from "../../store/useDashboard";
import type { TabId } from "../../types";
import { TIER_COLORS } from "../../theme/colors";

const NAV: { id: TabId; label: string; color: string }[] = [
  { id: "ringkasan", label: "Ringkasan", color: TIER_COLORS["Kritis (DBSCAN + 3 metode)"] },
  { id: "segmentasi", label: "Segmentasi", color: TIER_COLORS["Kuat (3 metode)"] },
  { id: "rules", label: "Association Rules", color: TIER_COLORS["Sedang (2 metode)"] },
  { id: "anomali", label: "Anomali", color: TIER_COLORS["Sangat Kuat (DBSCAN + metode)"] },
];

export default function Sidebar() {
  const tab = useDashboard((s) => s.tab);
  const setTab = useDashboard((s) => s.setTab);
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-badge">λ</div>
        <div>
          <div className="brand-name">Synthetic Capital</div>
          <div className="brand-sub">KDD in Banking</div>
        </div>
      </div>
      <div className="nav-group-label">Eksplorasi</div>
      {NAV.map((n) => (
        <button
          key={n.id}
          className={`nav-item${tab === n.id ? " active" : ""}`}
          onClick={() => setTab(n.id)}
        >
          <span className="dot" style={{ color: n.color }} />
          {n.label}
        </button>
      ))}
      <a
        className="side-cta"
        href="https://vercel.com/new"
        target="_blank"
        rel="noreferrer"
        style={{ textAlign: "center" }}
      >
        Deploy ke Vercel
      </a>
    </aside>
  );
}
