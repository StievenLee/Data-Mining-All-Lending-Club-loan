import { useDashboard } from "../../store/useDashboard";

const TAB_LABEL: Record<string, string> = {
  ringkasan: "Ringkasan",
  segmentasi: "Segmentasi",
  rules: "Association Rules",
  anomali: "Anomali",
};

export default function TopNav() {
  const tab = useDashboard((s) => s.tab);
  return (
    <header className="topnav">
      <div className="topnav-left">
        <span className="wordmark">LC · KDD CORE</span>
        <nav className="crumb">
          <span className="crumb-muted">Fase 5</span>
          <span className="crumb-sep">/</span>
          <span className="crumb-cur">{TAB_LABEL[tab]}</span>
        </nav>
      </div>
      <div className="topnav-right">
        <span className="live-badge">
          <span className="live-dot" />
          STATIS · 0.8 MB
        </span>
        <span className="avatar" aria-hidden />
      </div>
    </header>
  );
}
