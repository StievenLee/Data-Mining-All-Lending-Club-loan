import { useEffect, useState } from "react";
import { loadAll } from "./data/loaders";
import { useDashboard } from "./store/useDashboard";
import type { DashboardData } from "./types";
import TopNav from "./components/layout/TopNav";
import Sidebar from "./components/layout/Sidebar";
import Ringkasan from "./pages/Ringkasan";
import Segmentasi from "./pages/Segmentasi";
import Rules from "./pages/Rules";
import Anomali from "./pages/Anomali";

export default function App() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const tab = useDashboard((s) => s.tab);
  const initYears = useDashboard((s) => s.initYears);

  useEffect(() => {
    loadAll()
      .then((d) => {
        if (d.summary.year_bounds) initYears(d.summary.year_bounds);
        setData(d);
      })
      .catch((e) => setError(String(e)));
  }, [initYears]);

  return (
    <>
      <TopNav />
      <Sidebar />
      <main className="main">
        {error && <div className="loading">⚠ {error}</div>}
        {!data && !error && <div className="loading">MEMUAT DATA…</div>}
        {data && (
          <>
            {tab === "ringkasan" && <Ringkasan data={data} />}
            {tab === "segmentasi" && <Segmentasi data={data} />}
            {tab === "rules" && <Rules data={data} />}
            {tab === "anomali" && <Anomali data={data} />}
          </>
        )}
      </main>
    </>
  );
}
