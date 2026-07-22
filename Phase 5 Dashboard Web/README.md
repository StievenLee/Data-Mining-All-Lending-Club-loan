# LC KDD Dashboard — Web Statis

Dashboard Knowledge Discovery in Banking (Lending Club, Fase 1–4) versi **web statis**.
Semua filter dikerjakan **di browser** tanpa server Python: data ringkas di-fetch sekali,
sisanya operasi array in-memory. Deploy sebagai situs statis (Vercel/Cloudflare/Netlify).

> Ringkasan arsitektur & keputusan ada di [`PLAN.md`](./PLAN.md) — itu dokumen **rencana
> pra-implementasi**; beberapa targetnya tidak tercapai dan dicatat apa adanya di §13
> dokumen tersebut. Angka di README ini adalah angka **hasil ukur**, bukan target.

## Stack
- **Vite + React + TypeScript** (SPA statis)
- **Tailwind CSS v4** (styling — utility class di komponen; token desain di `@theme`)
- **Apache ECharts** (chart canvas, cepat)
- **Zustand** (state + sinkron URL)
- Data prep: **Python** (`scripts/build_data.py`)

### Cara ubah tampilan
- **Warna/font global** → `src/styles.css` blok `@theme` (1 sumber; ubah `--color-lime` →
  semua `bg-lime`/`text-lime` ikut berubah).
- **Layout/spacing** → utility class langsung di komponen (`src/components`, `src/pages`).
- **Efek kompleks** (glassmorphism, keyframe) → `src/styles.css` (base + `@keyframes`).

## Cara menjalankan (lokal)

Prasyarat: Node ≥ 18, Python ≥ 3.10 (dengan pandas), dan input asli Fase 1–4 di
`data_src/` (gitignored; opsional — tanpa itu pipeline memakai dummy).

```bash
# 1. Bangun data dashboard ke public/data/ (sekali / saat data Fase 1-4 berubah)
npm run data           # = python scripts/build_data.py

# 2. Install dependency & jalankan dev server
npm install
npm run dev            # http://localhost:5173

# 3. Build produksi statis
npm run build          # output ke dist/
npm run preview        # cek hasil build
```

## Alur data

```
data_src/  (input Fase 1–4: CSV/parquet/dbscan-json, ratusan MB, gitignored)
      │  scripts/build_data.py  (agregasi; scatter TIDAK di-sample)
      ▼
public/data/*.json  (43,8 MB mentah / ±4,1 MB gzip)  ──►  di-fetch SEKALI di browser
                                                       └─► semua filter in-memory
```

File yang dihasilkan di `public/data/` (ukuran hasil build 21 Juli 2026):

| File | Isi | Mentah | Gzip |
|---|---|---|---|
| `anomaly_sample_rejected.json` | **547.100** titik scatter (columnar) | 27,95 MB | 2,44 MB |
| `anomaly_sample_accepted.json` | **177.070** titik scatter (columnar) | 15,83 MB | 1,63 MB |
| `clusters_by_year.json` | profil segmen Fase 2 per (dataset, tahun) | 12 KB | ~3 KB |
| `rules.json` | 99 association rules Fase 3 (95 accepted + 4 rejected) | 17 KB | ~4 KB |
| `tiers_by_year.json` | jumlah anomali per (dataset, tahun, tier) | 6 KB | ~1 KB |
| `summary.json` | KPI, rentang tahun, meta DBSCAN, daftar fitur | 2,6 KB | ~1 KB |
| `verdict_by_year.json` | tipologi verdict per tahun (accepted) | 1,8 KB | <1 KB |
| `clusters.json` | profil segmen keseluruhan (fallback) | 1,5 KB | <1 KB |
| **Total** | | **43,82 MB** | **±4,1 MB** |

Dua file scatter itu **99,6% dari payload**. Keduanya berisi seluruh record anomali
terfilter — **tanpa sampling**, sesuai permintaan agar selaras dashboard Dash lama
(lihat docstring `sample_scatter` di `scripts/build_data.py`). Konsekuensinya jujur
dicatat di bagian [Performa](#performa-angka-terukur) di bawah.

## Performa (angka terukur)

| Metrik | Angka | Cara ukur |
|---|---|---|
| Transfer data (gzip) | ±4,1 MB | `gzip -6` atas `public/data/*` |
| Transfer data (mentah) | 43,82 MB | ukuran file |
| Bundle JS (gzip) | ±268 KB | laporan `vite build` (echarts 194 + react 45 + app 28) |
| `JSON.parse` kedua sample | ±310 ms | Node 20, desktop — **bukan** kelas HP |
| Heap setelah parse | ±106 MB | `process.memoryUsage()` |

**Yang belum diukur:** latensi per-filter di browser dan First Contentful Paint. Prop
`onRenderMs` di `src/components/EChart.tsx` disiapkan untuk itu tapi **belum ada satu pun
pemanggil**, jadi klaim "<100 ms per filter" di `PLAN.md` sampai sekarang **tidak berdasar
pengukuran**. Jangan kutip angka itu sebelum instrumentasinya dipasang.

**Keterbatasan yang diketahui:**
- `loadAll()` menarik **kedua** sample sekaligus sebelum tab mana pun tampil — termasuk tab
  Preprocessing yang tidak memakai data sama sekali. Lazy-load per tab belum dikerjakan.
- Scatter anomali default menggambar **10.000 titik** (opsi: 5.000 / 10.000 / 50.000 /
  Semua). Mode "Semua" menggambar ratusan ribu titik dan terasa berat — itu sebabnya
  batas default ada.
- `public/data/*.json` ikut di-commit, jadi tiap `npm run data` menambah ±4 MB ke riwayat
  git. Repo terkompresi saat ini 18,5 MiB.
- Belum ada test sama sekali (tidak ada Vitest / script `test`).

## Deploy ke Vercel

1. Push repo ke GitHub.
2. Di Vercel: **New Project** → import repo.
3. Set **Root Directory** = `Phase 5 Dashboard Web`.
4. Framework auto-terdeteksi (Vite). Build `npm run build`, output `dist/`.
5. Deploy. Tiap `git push` = auto-deploy.

> `public/data/*.json` ikut ter-deploy sebagai aset statis (di-serve dari CDN).
> Jalankan `npm run data` **sebelum** commit bila data Fase 4 berubah.

## Catatan
- Data mentah (accepted/rejected ~1.7 GB) **tidak pernah** dikirim ke browser — yang dikirim
  hanya kolom terpakai dari baris yang sudah ditandai anomali.
- Rejected diproses via chunking di `build_data.py`, lalu **difilter ke tier "Kuat" ke atas**
  (`REJECTED_MIN_TIER_RANK = 2`) — bukan di-sample. Tier Sedang & Lemah rejected tidak ikut,
  jadi angka rejected di dashboard bukan total anomali rejected (ini juga dinyatakan di UI).
- Rules Fase 3 dibaca dari `Phase 3 Associate Rule/Results/results_apriori_{accepted,rejected}.csv`
  (accepted + rejected, data nyata — bukan `_cleaned`); memakai fallback dummy bila file tak ada.
