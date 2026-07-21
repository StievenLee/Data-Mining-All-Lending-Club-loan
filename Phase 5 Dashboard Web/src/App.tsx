import { useEffect, useState } from "react";
import { loadAll } from "./data/loaders";
import { useDashboard } from "./store/useDashboard";
import type { DashboardData } from "./types";
import TopNav from "./components/layout/TopNav";
import Sidebar from "./components/layout/Sidebar";
import MobileNav from "./components/layout/MobileNav";
import Ringkasan from "./pages/Ringkasan";
import Preprocessing from "./pages/Preprocessing";
import Segmentasi from "./pages/Segmentasi";
import Rules from "./pages/Rules";
import Anomali from "./pages/Anomali";
import InsightBisnis from "./pages/InsightBisnis";

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
      <MobileNav />
      <main className="ml-[var(--side)] mt-[var(--nav)] min-w-0 max-w-[1520px] px-4 pb-[60px] pt-5 w-[calc(100%-var(--side))] min-[640px]:px-[34px] min-[640px]:pt-[30px] max-[900px]:ml-0 max-[900px]:w-full max-[900px]:pb-[92px]">
        {error && (
          <div className="grid min-h-[60vh] place-items-center font-mono tracking-[0.1em] text-muted">
            ⚠ {error}
          </div>
        )}
        {!data && !error && (
          <div className="grid min-h-[60vh] place-items-center font-mono tracking-[0.1em] text-muted">
            MEMUAT DATA…
          </div>
        )}
        {data && (
          <>
            {tab === "ringkasan" && <Ringkasan data={data} />}
            {tab === "preprocessing" && <Preprocessing />}
            {tab === "segmentasi" && <Segmentasi data={data} />}
            {tab === "rules" && <Rules data={data} />}
            {tab === "anomali" && <Anomali data={data} />}
            {tab === "insight" && <InsightBisnis data={data} />}
          </>
        )}
      </main>
    </>
  );
}
