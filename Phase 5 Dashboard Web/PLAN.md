# Rencana Migrasi Dashboard — Versi Web Statis (Client-Side)

> ⚠️ **Dokumen ini adalah RENCANA pra-implementasi, bukan deskripsi keadaan sekarang.**
> Sengaja tidak disunting agar tetap jadi catatan keputusan awal. Beberapa target di
> dalamnya **tidak tercapai** dan beberapa keputusan berubah di tengah jalan — semuanya
> dicatat apa adanya di **[§13 Realisasi vs Rencana](#13-realisasi-vs-rencana)**.
> **Baca §13 dulu sebelum mengutip angka mana pun dari dokumen ini.**
> Untuk keadaan terkini, lihat [`README.md`](./README.md).

> Tujuan: dashboard KDD Lending Club yang **lebih cepat (<100ms per filter)**, **elegan**,
> **gratis di-deploy**, tanpa server Python yang harus nyala 24 jam.
>
> Prinsip inti: **data berat diproses SEKALI di build-time**, hasil ringkasnya dikirim ke
> browser, dan **SEMUA filter dikerjakan di browser** (tanpa roundtrip server).

---

## 1. Ringkasan Keputusan (TL;DR)

| Aspek | Sekarang (Dash) | Rencana Baru (Web Statis) |
|---|---|---|
| Framework | Dash (server Python) | **Vite + React + TypeScript** |
| Chart | Plotly (Python) | **Apache ECharts** (canvas, cepat) |
| Filter | roundtrip ke server tiap klik | **di browser, in-memory** → <100ms |
| Data ke browser | dihitung ulang tiap request | **pre-agregasi sekali** → 1–3 MB total |
| Deploy | butuh VPS/Render (bayar) | **Vercel / Cloudflare Pages (gratis)** |
| Loading awal | 1 lokasi server | **CDN edge** (cepat di mana saja) |
| Identitas visual | "Synthetic Capital" (dipertahankan) | sama, dipindah ke CSS variables |

**Kenapa Vercel, bukan VPS:** karena filter jalan di browser, server cuma mengirim file
sekali. Vercel menyebar file ke CDN (banyak lokasi) → loading awal lebih cepat, gratis, tanpa
maintenance. VPS baru relevan kalau tetap pakai Dash (yang justru sumber lambatnya).

---

## 2. Sasaran & Batasan

### Sasaran (Goals)
- **Performa:** setiap interaksi filter selesai render **< 100 ms** (diukur, bukan asumsi).
- **Loading awal:** First Contentful Paint < 1.5s di koneksi 4G; total transfer data < 3 MB.
- **Paritas fitur:** semua tab & filter dashboard lama tetap ada (lihat §6).
- **Deploy statis:** bisa di-deploy ke Vercel/Cloudflare/Netlify tanpa server backend.
- **Data asli:** tersambung ke output nyata Fase 1–4 (bukan dummy lagi).
- **Identitas visual:** pertahankan tema "Synthetic Capital" (glassmorphism, neon lime/violet/cyan).

### Bukan Sasaran (Non-Goals)
- Tidak mengirim data mentah (~1.7 GB/file) ke browser — **tidak pernah**.
- Tidak mengubah notebook Fase 1–4. Pipeline baru hanya **membaca** output-nya.
- Tidak membangun auth/login/multi-user (dashboard read-only publik/internal).
- Belum perlu real-time streaming (data historis, statis).

---

## 3. Arsitektur

```
┌─────────────────────────────────────────────────────────────────┐
│  BUILD-TIME (di mesin kamu, dijalankan sekali / saat data ganti) │
│                                                                   │
│  Output Fase 1–4  ──►  scripts/build_data.py  ──►  public/data/  │
│  (parquet/csv/json,       (agregasi + sampling      (JSON kecil + │
│   ratusan MB)              + kompresi)                Arrow/parquet)│
└─────────────────────────────────────────────────────────────────┘
                                   │  (di-commit / di-upload sekali)
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│  RUNTIME (browser pengunjung)                                     │
│                                                                   │
│  1. Buka web  →  unduh app (JS/CSS) + data ringkas (1–3 MB) SEKALI│
│  2. Data disimpan di memori browser (Arrow / JS array)            │
│  3. Filter (tahun/dataset/tier/lift) → query in-memory → <100ms   │
│  4. ECharts re-render dari data yang sudah di tangan → instan     │
│                                                                   │
│  ► Server TIDAK terlibat saat filter. Cuma melayani file statis.  │
└─────────────────────────────────────────────────────────────────┘
```

### Dua lapis data (kunci performa & hemat kuota)
1. **Summary JSON (utama, ~50–300 KB):** agregat siap pakai — KPI, tier-count per tahun,
   profil klaster, daftar rules, meta DBSCAN. Cukup untuk 90% interaksi. Filter = filter
   array kecil → instan.
2. **Sample Arrow/Parquet (~0.5–2 MB):** ±6.000 baris representatif untuk scatter anomali
   (mempertahankan `SCATTER_SAMPLE=6000` dari kode lama). Difilter in-memory pakai Arrow.
3. *(Opsional, tahap lanjut)* **DuckDB-WASM** untuk drilldown ad-hoc di atas parquet — hanya
   di-load kalau user membuka mode "eksplorasi detail". Tidak dibebankan ke loading awal.

---

## 4. Tech Stack + Alasan

| Lapisan | Pilihan | Alasan |
|---|---|---|
| Build tool | **Vite** | Dev server instan, bundle kecil, output statis siap Vercel. |
| UI | **React + TypeScript** | Ekosistem terbesar, type-safe, cocok Vercel. |
| Styling | **Tailwind CSS** + CSS vars | Cepat, konsisten; token tema lama dipindah 1:1. |
| Chart | **Apache ECharts** | Canvas/WebGL, ringan, sangat cepat utk ribuan titik → dukung <100ms. |
| Data in-memory | **Apache Arrow (arrow-js)** | Format kolomnar, filter super cepat, ukuran kecil. |
| State | **Zustand** + URL params | Ringan; filter tersimpan di URL (bisa di-share/bookmark). |
| Data prep | **Python (pandas/pyarrow)** | Pakai ulang logika `data_loader.py`, output ke JSON/Arrow. |
| Deploy | **Vercel** (util. Cloudflare Pages) | Static + CDN edge, gratis, CI otomatis dari Git. |

**Catatan pilihan chart:** ECharts dipilih ketimbang Plotly.js karena bundle lebih kecil dan
render canvas jauh lebih cepat untuk scatter padat. Jika ingin transisi minim dari Plotly,
`plotly.js-dist-min` bisa jadi alternatif, tapi lebih berat (~3 MB) dan lebih lambat.

---

## 5. Struktur Folder Target

```
Phase 5 Dashboard Web/
├── PLAN.md                     # dokumen ini
├── README.md                   # quickstart (dibuat di Fase 0)
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── index.html
├── scripts/
│   └── build_data.py           # pipeline: Fase 1–4  →  public/data/*
├── public/
│   └── data/                   # OUTPUT build_data.py (di-commit)
│       ├── summary.json        # KPI, meta, tahun-bounds
│       ├── tiers_by_year.json  # tier-count per (dataset, tahun)
│       ├── clusters.json       # profil klaster Fase 2
│       ├── rules.json          # association rules Fase 3
│       └── anomaly_sample.arrow# ±6k baris utk scatter Fase 4
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── theme/
│   │   ├── tokens.css          # "Synthetic Capital" (dari theme.py)
│   │   └── echarts-theme.ts    # tema chart konsisten
│   ├── data/
│   │   ├── loaders.ts          # fetch + cache summary/arrow sekali
│   │   └── filters.ts          # logika filter in-memory (year/tier/lift/dataset)
│   ├── store/
│   │   └── useDashboard.ts     # Zustand: dataset, years, lift, activeTab
│   ├── components/
│   │   ├── layout/             # TopNav, Sidebar, PageHead, Pill, Card
│   │   ├── filters/            # YearRangeSlider, DatasetToggle, LiftSlider
│   │   └── charts/             # Gauge, TierBar, VerdictChart, ClusterChart,
│   │                           # RulesScatter, AnomalyScatter
│   └── pages/
│       ├── Ringkasan.tsx
│       ├── Segmentasi.tsx
│       ├── Rules.tsx
│       └── Anomali.tsx
```

---

## 6. Peta Paritas Fitur (dari Dash lama → Web baru)

| Fitur lama (Dash) | Sumber data | Komponen baru | Filter di browser? |
|---|---|---|---|
| Tab **Ringkasan**: gauge % anomali kuat | tier counts | `Gauge` | ✅ year, dataset |
| Bar chart tier | `tiers_by_year.json` | `TierBar` | ✅ year, dataset |
| Verdict chart | anomaly sample | `VerdictChart` | ✅ year, dataset |
| Tab **Segmentasi**: profil klaster | `clusters.json` | `ClusterChart` | ✅ (statis) |
| Tab **Rules**: scatter support×conf, size=lift | `rules.json` | `RulesScatter` | ✅ **lift slider** |
| Tab **Anomali**: scatter fitur × iso_score | `anomaly_sample.arrow` | `AnomalyScatter` | ✅ dataset, year, sumbu |
| Toggle **dataset** accepted/rejected | semua | `DatasetToggle` (store) | ✅ |
| **Slider tahun** + preset (Semua/10Y/5Y/3Y) | semua | `YearRangeSlider` | ✅ |
| KPI pills (total, kritis, lift maks, DBSCAN) | `summary.json` | `Pill` | ✅ |
| Breadcrumb, live-badge, avatar | — | layout | — |

Semua warna verdict/tier (`VERDICT_COLORS`, `TIER_COLORS`) dan `TIER_ORDER` dipindahkan ke
`echarts-theme.ts` supaya konsisten dengan versi lama.

---

## 7. Pipeline Data (`scripts/build_data.py`)

Tugas: baca output NYATA Fase 1–4, hasilkan file kecil untuk `public/data/`.

| Sumber (real) | Path (perkiraan) | Hasil |
|---|---|---|
| DBSCAN meta | `Phase 5 Dashboard/dbscan_outliers_*.json` | `summary.json` (n_noise, eps, dll) |
| Cluster labels | `Phase 1 Preprocessing/Phase 2 Clustering/Results/cluster_labels_accepted.parquet` | `clusters.json` (profil, default rate, n_anggota) |
| Cluster meta | `.../cluster_labels_meta_accepted.json` | `clusters.json` |
| Association rules | output Apriori Fase 3 (`results_apriori_*.csv` bila diekspor) | `rules.json` |
| Anomaly report | output Fase 4 (`Phase 4 .../Results/*`) | `tiers_by_year.json` + `anomaly_sample.arrow` |

Logika:
1. **Agregat, bukan baris mentah:** hitung tier-count per (dataset, tahun) → JSON puluhan KB.
2. **Sampling scatter:** pertahankan aturan lama — semua baris tier "Kritis/Sangat Kuat"
   dipertahankan, sisanya di-sample sampai total ±6.000 baris. Ekspor ke Arrow.
3. **Rejected:** tetap difilter ke tier ≥ "Kuat" + sampling (seperti `REJECTED_MIN_TIER_RANK`).
4. **Fallback dummy:** kalau file asli belum ada, tulis dummy berskema sama (port dari
   `data_loader.py`) supaya web tetap bisa jalan saat dev.
5. **Validasi ukuran:** cetak ukuran tiap output; gagal-kan build kalau total > 3 MB.

> Catatan: sebagian output Fase 3/4 saat ini masih di dalam notebook (belum diekspor ke
> CSV/parquet). Langkah pertama pipeline = tambahkan sel ekspor di notebook / baca dari
> Results yang sudah ada. Ini didetailkan di Fase 1 implementasi.

---

## 8. Tahap Implementasi (berurutan, tiap tahap bisa dites)

### Fase 0 — Scaffold proyek (½ hari)
- Init Vite + React + TS + Tailwind di folder ini.
- Pindahkan token tema dari `theme.py` → `src/theme/tokens.css`.
- Buat layout shell (TopNav + Sidebar + Main) meniru CSS lama.
- **Deliverable:** `npm run dev` menampilkan shell kosong bertema benar.

### Fase 1 — Pipeline data (1 hari)
- Tulis `scripts/build_data.py`; sambungkan ke output real Fase 1–4 (+ fallback dummy).
- Tambahkan sel ekspor di notebook Fase 3/4 bila outputnya belum berupa file.
- **Deliverable:** `public/data/*` terisi, total < 3 MB, tervalidasi.

### Fase 2 — Data layer di browser (½ hari)
- `loaders.ts`: fetch summary JSON + Arrow sekali, cache di memori/Zustand.
- `filters.ts`: fungsi murni filter (year/tier/lift/dataset) atas data in-memory.
- **Deliverable:** unit test filter (Vitest) — hasil benar & < 5ms per panggilan.

### Fase 3 — Filter & state (½ hari)
- `useDashboard.ts` (Zustand) + sinkronisasi ke URL (`?dataset=&y0=&y1=&lift=`).
- Komponen `YearRangeSlider`, `DatasetToggle`, `LiftSlider`, preset tahun.
- **Deliverable:** ubah filter → state & URL berubah (belum ada chart).

### Fase 4 — Chart & halaman (2 hari)
- `echarts-theme.ts` + komponen chart (Gauge, TierBar, VerdictChart, ClusterChart,
  RulesScatter, AnomalyScatter).
- Rakit 4 halaman (Ringkasan, Segmentasi, Rules, Anomali) + KPI pills.
- Chart re-render dari data in-memory saat store berubah (pakai `useMemo`).
- **Deliverable:** semua tab & filter berfungsi penuh dari data asli.

### Fase 5 — Optimasi & ukur (½ hari)
- Ukur latensi filter (Performance API); pastikan p95 < 100ms.
- Lazy-load chart per tab; `React.memo`; hindari re-render tak perlu.
- (Opsional) DuckDB-WASM untuk mode drilldown.
- **Deliverable:** laporan angka latensi + ukuran bundle.

### Fase 6 — Deploy (¼ hari)
- Push ke Git; hubungkan repo ke Vercel (framework preset: Vite, output `dist/`).
- Verifikasi di URL produksi; cek Lighthouse.
- **Deliverable:** URL publik + panduan deploy di README.

**Estimasi total: ±5–6 hari kerja.**

---

## 9. Anggaran Performa (acceptance criteria)

| Metrik | Target | Cara ukur | **Hasil aktual** |
|---|---|---|---|
| Latensi 1 filter (p95) | **< 100 ms** | `performance.now()` sebelum/sesudah render | ❓ **tidak pernah diukur** |
| Total transfer data | **< 3 MB** | Network tab / laporan build | ❌ **±4,1 MB gzip** (43,8 MB mentah) |
| First Contentful Paint | < 1.5 s (4G) | Lighthouse | ❓ tidak pernah diukur |
| Bundle JS (gzip) | < 500 KB (di luar data) | `vite build` report | ✅ ±268 KB |
| Ukuran `summary.json` | < 300 KB | validasi di `build_data.py` | ✅ 2,6 KB |

Kalau salah satu target meleset → optimasi (agregasi lebih agresif / kurangi sample /
lazy-load) sebelum lanjut.

> **Yang benar-benar terjadi:** dua target meleset dan dua tidak pernah diuji, tapi
> aturan "optimasi sebelum lanjut" di atas **tidak dijalankan**. Ambang validasi di
> `build_data.py` justru dinaikkan dari 3 MB ke `MAX_TOTAL_MB = 50.0` agar build lolos.
> Rinciannya di §13.

---

## 10. Deployment

**Rekomendasi utama: Vercel.**
1. `git push` repo (folder ini sebagai root proyek, atau set "Root Directory" di Vercel).
2. Vercel deteksi Vite → build `npm run build` → serve `dist/` dari CDN edge.
3. Setiap `git push` = auto-deploy (preview per branch + production di `main`).
4. Gratis untuk proyek hobi/portofolio; tanpa server yang harus dikelola.

**Alternatif setara:** Cloudflare Pages, Netlify, GitHub Pages (semua statis).
Data `public/data/*` ikut ter-deploy sebagai file statis — di-serve dari CDN yang sama.

**VPS hanya jika:** kelak butuh backend rahasia/berat (mis. query real-time atas data mentah
1.7 GB). Untuk lingkup dashboard analitik ini, tidak diperlukan.

---

## 11. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Output Fase 3/4 belum berupa file | pipeline macet | Fase 1: tambah sel ekspor / baca Results yg ada; fallback dummy |
| Data ringkas ternyata > 3 MB | loading berat | agregasi lebih agresif, turunkan sample, gzip/Arrow |
| Scatter terlalu padat → lag | filter > 100ms | ECharts canvas + `large:true`; batasi sample |
| Tim belum familiar React | lambat | komponen kecil, TypeScript, contoh per chart |
| Perlu SQL ad-hoc kompleks | fitur kurang | DuckDB-WASM opsional (Fase 5), on-demand |

---

## 12. Langkah Berikutnya (menunggu persetujuan)

1. ✅ Setujui plan ini.
2. Mulai **Fase 0** (scaffold Vite+React+Tailwind + shell bertema).
3. Paralel: konfirmasi lokasi file output real Fase 3 & 4 untuk `build_data.py`.

---

## 13. Realisasi vs Rencana

*(Ditambahkan 22 Juli 2026, setelah audit. Bagian §1–§12 di atas dibiarkan seperti aslinya
sebagai catatan keputusan awal; bagian ini yang menyatakan keadaan sebenarnya.)*

### Ringkasan penyimpangan

| Rencana (§) | Isi rencana | Realisasi |
|---|---|---|
| §3, §7.2 | Scatter di-sample ke **±6.000 baris** | ❌ **Sampling dicabut.** Seluruh titik terfilter dikirim: **177.070** (accepted) + **547.100** (rejected). Keputusan sadar, atas permintaan eksplisit, agar selaras dashboard Dash lama. |
| §3, §9 | Total data ke browser **1–3 MB** | ❌ **43,8 MB mentah / ±4,1 MB gzip.** Konsekuensi langsung dari poin di atas. |
| §7.5 | Build **gagal** kalau output > 3 MB | ❌ Ambang dinaikkan ke `MAX_TOTAL_MB = 50.0`. Pagar mutunya dilonggarkan, bukan masalahnya diperbaiki. |
| §2, §9 | Latensi filter **< 100 ms**, "diukur, bukan asumsi" | ❓ **Tidak pernah diukur.** Prop `onRenderMs` ada di `EChart.tsx` tapi tidak punya pemanggil. Klaim <100 ms di seluruh dokumen ini **tanpa dasar empiris**. |
| §8 Fase 2 | Unit test filter (Vitest), < 5 ms per panggilan | ❌ **Tidak ada test sama sekali**; Vitest tidak terpasang. |
| §8 Fase 5 | Lazy-load chart per tab | ❌ Belum. `loadAll()` menarik semua data sebelum tab mana pun tampil, termasuk tab Preprocessing yang tak butuh data. |
| §3, §4 | Data in-memory pakai **Apache Arrow** | 🔄 Diganti **JSON columnar** (`{n, columns:{...}}`). Lebih sederhana, gzip-nya efisien; Arrow tak jadi dipakai. |
| §4 | Chart ECharts, Vite, React+TS, Zustand, Tailwind | ✅ Sesuai rencana. |
| §2 | Paritas fitur + data asli Fase 1–4 | ✅ Tercapai, malah lebih: tab Preprocessing & Insight Bisnis tidak ada di rencana awal. |
| §7 | Sumber DBSCAN dari folder `Phase 5 Dashboard/` | 🔄 Folder Dash lama sudah **dihapus** (22 Juli 2026). Semua input kini dari `data_src/` + folder Fase 1–4. |

### Kompensasi yang sudah dikerjakan

Karena sampling dicabut, beban dipindah ke sisi klien sebagai **kontrol yang bisa dipilih
user**, bukan sebagai batas tersembunyi:

- Scatter anomali punya pembatas jumlah titik **5.000 / 10.000 / 50.000 / Semua**, default
  10.000, memakai stride merata (`limitRows` di `src/data/filters.ts`) supaya sebaran tahun
  dan nilai tetap representatif. Mode "Semua" tetap tersedia satu klik.
- Chip isolasi lapisan (Anomali / Kolektif / Kontekstual / Tier tinggi / Noise) agar user
  bisa fokus ke satu jenis anomali tanpa harus menggambar semuanya sekaligus.

### Utang teknis yang masih terbuka

Urut dari dampak terbesar:

1. **Lazy-load sample per dataset** saat tab Anomali dibuka — menghapus ±4 MB dari jalur
   loading awal untuk 5 dari 6 tab.
2. **Pasang `onRenderMs`** ke minimal satu chart, tampilkan p95-nya, supaya klaim performa
   punya dasar. Selama ini belum ada, jangan kutip angka <100 ms.
3. **Test untuk `filters.ts`** — fungsinya murni dan sepele diuji (`strongPct`,
   `clusterProfilesForYears`, `limitRows`).
4. **`public/data/*.json` di-commit** — tiap regenerasi menambah ±4 MB ke riwayat git
   (repo terkompresi kini 18,5 MiB). Pertimbangkan build-time generation di Vercel.

### Catatan kejujuran isi (bukan teknis)

Tiga kalimat di UI melampaui apa yang datanya bisa buktikan. **Ketiganya sudah diperbaiki
22 Juli 2026**; dicatat di sini sebagai riwayat, karena pola kesalahannya gampang berulang
saat menulis narasi baru.

- `src/pages/Anomali.tsx` — dulu: *"Pola loan-stacking seperti ini paling sering berakhir
  gagal bayar."* Masalahnya: Fase 4 tidak menghitung default-rate per pola, jadi itu
  ramalan hasil tanpa dasar. Sekarang kartu itu menyatakan **kekuatan buktinya** (tier
  Kritis: DBSCAN + 3 metode sepakat) dan berhenti di situ.
- `src/pages/InsightBisnis.tsx` — dulu: *"Sistem penilaian grade dan penetapan bunga sudah
  selaras dengan hasil nyata."* Masalahnya: (a) aturan asosiasi mengukur ko-okurensi, bukan
  validasi sistem; (b) 38,9% pinjaman berstatus *Current* dibuang di Fase 1, sehingga
  proporsi *Fully Paid* naik (survivorship bias) dan itu tidak disebut di tempat
  kesimpulannya ditarik. Sekarang kalimatnya hanya menyatakan konsistensi antar-variabel,
  ditambah paragraf "Batasan" yang menyebut kedua hal itu **di kartu yang sama**. Kalimat
  "hampir selalu" untuk confidence 84% juga diganti "84 dari 100 kasus".
- `src/pages/Ringkasan.tsx` — dulu: *"di sanalah sinyal risiko **sejati** berada."*
  Kesepakatan antar-metode unsupervised menunjukkan konsistensi deteksi, bukan kebenaran
  risiko — tidak ada label ground-truth yang memvalidasinya di Fase 4. Sekarang:
  *"kandidat risiko terkuat untuk ditinjau lebih dulu"* — menyatakan prioritas antrean
  peninjauan, yang memang itulah gunanya tier.

**Aturan yang dipakai ke depan:** kalau sebuah kalimat menyatakan *outcome* (gagal bayar,
lunas, benar/salahnya sebuah sistem), harus ada kolom di `public/data/` yang menghitungnya.
Kalau tidak ada, tulis kekuatan bukti atau ko-okurensinya saja.

Sebaliknya, angka-angka keras yang dicek ulang **cocok dengan sumbernya**: 1.348.099 baris
accepted (parquet Fase 2), confidence 84% & lift 5,772 (rules Fase 3), serta ketiga z-score
kartu kasus di tab Anomali (`anomaly_report_accepted.csv`).

> Setelah disetujui, aku bisa langsung eksekusi Fase 0 & 1 di folder ini.
