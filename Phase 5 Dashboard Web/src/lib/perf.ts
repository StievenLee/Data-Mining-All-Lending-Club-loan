// perf.ts — pengukuran latensi filter di browser.
//
// YANG DIUKUR: jarak dari saat user mengubah filter sampai chart terakhir di
// halaman selesai digambar.
//
// Ini sengaja BUKAN sekadar durasi `chart.setOption()`. Bagian yang berpotensi
// lambat justru ada di hulu: memfilter ratusan ribu baris sample di memori, lalu
// menyusun ulang opsi chart. Mengukur setOption saja akan menghasilkan angka yang
// terlihat bagus tetapi tidak menjawab pertanyaan yang sebenarnya, yaitu apakah
// dashboard terasa responsif saat dipakai. Porsi setOption tetap dicatat terpisah
// (`paintMs`) supaya terlihat berapa bagian yang murni menggambar.
//
// Yang TIDAK diukur di sini: waktu muat awal (fetch + JSON.parse). Itu bukan
// latensi filter, dan mencampurnya akan membuat angka pertama selalu buruk —
// karena itu laporan baru dimulai setelah `markFilter()` pertama.

import { create } from "zustand";

export interface PerfState {
  /** Aksi filter → chart terakhir selesai. Ini angka yang dilaporkan. */
  totalMs: number | null;
  /** Porsi `setOption` ECharts saja, dari chart yang paling akhir selesai. */
  paintMs: number | null;
  /** Aksi apa yang barusan diukur, mis. "geser tahun". */
  label: string | null;
  /** Berapa kali filter diubah sejak halaman dibuka. */
  samples: number;
  cycle: number;
}

export const usePerf = create<PerfState>(() => ({
  totalMs: null,
  paintMs: null,
  label: null,
  samples: 0,
  cycle: 0,
}));

// State siklus disimpan di modul, bukan di store, supaya `markFilter` tidak
// memicu re-render apa pun sebelum pengukurannya selesai.
let cycle = 0;
let t0: number | null = null;
let pendingLabel = "";

/** Panggil tepat saat user mengubah filter, sebelum state berubah. */
export function markFilter(action: string): void {
  cycle += 1;
  t0 = performance.now();
  pendingLabel = action;
}

/** Panggil tiap satu chart selesai digambar. `paint` = durasi setOption. */
export function reportRender(paint: number): void {
  if (t0 == null) return; // belum ada aksi filter — ini render awal, bukan sampel
  const total = performance.now() - t0;
  const s = usePerf.getState();
  const sameCycle = s.cycle === cycle;
  // Satu halaman bisa memuat beberapa chart yang semuanya melapor pada siklus
  // yang sama. Yang menentukan "kapan halaman selesai" adalah chart yang paling
  // akhir, jadi diambil yang TERBESAR per siklus, bukan yang pertama melapor.
  if (sameCycle && total <= (s.totalMs ?? 0)) return;
  usePerf.setState({
    cycle,
    label: pendingLabel,
    totalMs: total,
    paintMs: paint,
    samples: sameCycle ? s.samples : s.samples + 1,
  });
}
