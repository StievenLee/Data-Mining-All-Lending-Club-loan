// useDashboard.ts — state global ringan (Zustand) + sinkron ke URL (?tab&dataset&y0&y1&lift)
// sehingga filter bisa di-bookmark/di-share.

import { create } from "zustand";
import type { Dataset, TabId } from "../types";
import type { YearRange } from "../data/filters";
import { markFilter } from "../lib/perf";

interface DashboardState {
  tab: TabId;
  dataset: Dataset;
  years: YearRange | null; // null = belum diinisialisasi dari data
  minLift: number;
  setTab: (t: TabId) => void;
  setDataset: (d: Dataset) => void;
  setYears: (y: YearRange) => void;
  setMinLift: (v: number) => void;
  initYears: (bounds: [number, number]) => void;
}

const VALID_TABS: TabId[] = [
  "ringkasan",
  "preprocessing",
  "segmentasi",
  "rules",
  "anomali",
  "insight",
  "laporan",
];

function readURL(): Partial<DashboardState> {
  const p = new URLSearchParams(window.location.search);
  const out: Partial<DashboardState> = {};
  const tab = p.get("tab") as TabId | null;
  if (tab && VALID_TABS.includes(tab)) out.tab = tab;
  const ds = p.get("dataset");
  if (ds === "accepted" || ds === "rejected") out.dataset = ds;
  const y0 = p.get("y0");
  const y1 = p.get("y1");
  if (y0 && y1) out.years = [Number(y0), Number(y1)];
  const lift = p.get("lift");
  if (lift) out.minLift = Number(lift);
  return out;
}

function writeURL(s: DashboardState) {
  const p = new URLSearchParams();
  p.set("tab", s.tab);
  p.set("dataset", s.dataset);
  if (s.years) {
    p.set("y0", String(s.years[0]));
    p.set("y1", String(s.years[1]));
  }
  p.set("lift", String(s.minLift));
  const url = `${window.location.pathname}?${p.toString()}`;
  window.history.replaceState(null, "", url);
}

const initial = readURL();

export const useDashboard = create<DashboardState>((set, get) => {
  const sync = () => writeURL(get());
  return {
    tab: initial.tab ?? "ringkasan",
    dataset: initial.dataset ?? "accepted",
    years: initial.years ?? null,
    minLift: initial.minLift ?? 1.0,
    // markFilter() dipanggil SEBELUM set(), supaya stopwatch menyala sejak
    // aksi user, bukan sejak React sempat memproses perubahan state.
    setTab: (tab) => {
      markFilter("pindah tab");
      set({ tab });
      sync();
    },
    setDataset: (dataset) => {
      markFilter("ganti dataset");
      set({ dataset });
      sync();
    },
    setYears: (years) => {
      markFilter("geser rentang tahun");
      set({ years });
      sync();
    },
    setMinLift: (minLift) => {
      markFilter("geser ambang lift");
      set({ minLift });
      sync();
    },
    // initYears sengaja TIDAK ditandai: itu inisialisasi dari data saat halaman
    // pertama dimuat, bukan aksi filter. Menandainya akan mencampurkan waktu
    // fetch + parse ke dalam angka latensi filter.
    initYears: (bounds) => {
      if (!get().years) {
        set({ years: bounds });
        sync();
      }
    },
  };
});
