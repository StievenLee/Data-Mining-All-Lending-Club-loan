// Landing.tsx — halaman pembuka sebelum dashboard. Statis (tidak menunggu fetch
// data), jadi tampil instan; klik CTA baru memicu mount <App/> yang mengambil data.

import type { TabId } from "../types";
import { useDashboard } from "../store/useDashboard";

interface Props {
  onEnter: () => void;
}

const PHASES: { id: TabId; tag: string; title: string; desc: string; color: string }[] = [
  {
    id: "preprocessing",
    tag: "Fase 1",
    title: "Preprocessing",
    desc: "Pembersihan & validasi data mentah accepted/rejected sebelum dianalisis.",
    color: "#7df4ff",
  },
  {
    id: "segmentasi",
    tag: "Fase 2",
    title: "Segmentasi",
    desc: "Klaster nasabah berdasarkan profil risiko & perilaku pinjaman.",
    color: "#d0bcff",
  },
  {
    id: "rules",
    tag: "Fase 3",
    title: "Association Rules",
    desc: "Pola & korelasi antar-fitur yang sering muncul bersama.",
    color: "#ffd479",
  },
  {
    id: "anomali",
    tag: "Fase 4",
    title: "Anomali",
    desc: "Isolation Forest + DBSCAN menandai record di luar kebiasaan.",
    color: "#c3f400",
  },
  {
    id: "insight",
    tag: "Sintesis",
    title: "Insight Bisnis",
    desc: "Ringkasan lintas-fase jadi rekomendasi yang bisa ditindaklanjuti.",
    color: "#ffb4ab",
  },
  {
    id: "laporan",
    tag: "Dokumentasi",
    title: "Laporan KDD",
    desc: "Metodologi lengkap: dari data mentah sampai kesimpulan.",
    color: "#c4c9ac",
  },
];

const STATS: { label: string; value: string }[] = [
  { label: "Record accepted", value: "177.070" },
  { label: "Record rejected", value: "547.100" },
  { label: "Rentang tahun", value: "2007–2018" },
  { label: "Fase analisis", value: "4" },
];

export default function Landing({ onEnter }: Props) {
  const setTab = useDashboard((s) => s.setTab);

  const goToTab = (id: TabId) => {
    setTab(id);
    onEnter();
  };

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <header className="flex h-[var(--nav)] items-center justify-between border-b border-line px-4 min-[640px]:px-[22px]">
        <span className="font-display text-base font-bold text-lime">LC KDD CORE</span>
        <button
          type="button"
          onClick={onEnter}
          className="cursor-pointer rounded-full border border-line bg-glass px-3.5 py-1.5 font-mono text-xs text-muted transition-colors duration-150 hover:border-lime hover:text-text"
        >
          Buka Dashboard
        </button>
      </header>

      <main className="mx-auto max-w-[1080px] px-4 pb-24 pt-16 min-[640px]:px-[34px] min-[640px]:pt-24">
        {/* Hero */}
        <div className="max-w-[720px]">
          <h1 className="font-display text-4xl font-bold leading-[1.1] tracking-[-0.02em] text-text min-[640px]:text-5xl">
            Dari data pinjaman mentah menjadi{" "}
            <span className="text-lime">keputusan yang bisa dipertanggungjawabkan</span>.
          </h1>
          <p className="mt-5 text-[15px] leading-[1.7] text-muted min-[640px]:text-base">
            Knowledge Discovery — preprocessing, segmentasi, association rules,
            dan deteksi anomali. Diterapkan pada data pengajuan pinjaman Lending Club, lalu
            disajikan sebagai dashboard interaktif.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onEnter}
              className="cursor-pointer rounded-full bg-lime px-5 py-2.5 font-mono text-sm font-semibold text-ink transition-transform duration-150 hover:scale-[1.03]"
            >
              Buka Dashboard
            </button>
            <a
              href="#fase"
              className="cursor-pointer rounded-full border border-line bg-glass px-5 py-2.5 font-mono text-sm text-muted transition-colors duration-150 hover:border-violet hover:text-text"
            >
              Lihat alur fase
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-14 grid grid-cols-2 gap-3 min-[640px]:grid-cols-4 min-[640px]:gap-4">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-line bg-glass px-4 py-4 backdrop-blur-[16px] min-[640px]:rounded-[20px]"
            >
              <div className="font-mono text-xl font-bold text-text min-[640px]:text-2xl">
                {s.value}
              </div>
              <div className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Fase */}
        <div id="fase" className="mt-20 scroll-mt-24">
          <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            Alur analisis
          </div>
          <h2 className="mb-8 font-display text-2xl font-semibold tracking-[-0.01em] text-text">
            Enam halaman, satu alur cerita
          </h2>
          <div className="grid grid-cols-1 gap-4 min-[640px]:grid-cols-2 min-[900px]:grid-cols-3">
            {PHASES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => goToTab(p.id)}
                className="group relative cursor-pointer overflow-hidden rounded-[18px] border border-line bg-glass px-5 py-[18px] text-left transition-colors duration-150 hover:border-[var(--accent)]"
                style={{ ["--accent" as string]: p.color }}
              >
                <div
                  className="absolute inset-y-0 left-0 w-[3px] opacity-70"
                  style={{ background: p.color }}
                />
                <div
                  className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em]"
                  style={{ color: p.color }}
                >
                  {p.tag}
                </div>
                <div className="mb-1.5 font-display text-base font-semibold text-text">
                  {p.title}
                </div>
                <p className="text-[13px] leading-[1.55] text-muted">{p.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-line px-4 py-6 text-center font-mono text-[11px] text-muted min-[640px]:px-[34px]">
        Dibangun dengan React + ECharts · data diproses offline, disajikan statis
      </footer>
    </div>
  );
}
