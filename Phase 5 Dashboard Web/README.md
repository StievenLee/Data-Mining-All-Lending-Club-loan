# LC KDD Dashboard — Web Statis

Dashboard Knowledge Discovery in Banking (Lending Club, Fase 1–4) versi **web statis**.
Semua filter dikerjakan **di browser** (target < 100 ms), tanpa server Python.
Deploy sebagai situs statis (Vercel/Cloudflare/Netlify) — gratis, tanpa maintenance server.

> Ringkasan arsitektur & keputusan ada di [`PLAN.md`](./PLAN.md).

## Stack
- **Vite + React + TypeScript** (SPA statis)
- **Apache ECharts** (chart canvas, cepat)
- **Zustand** (state + sinkron URL)
- Data prep: **Python** (`scripts/build_data.py`)

## Cara menjalankan (lokal)

Prasyarat: Node ≥ 18, Python ≥ 3.10 (dengan pandas), dan CSV asli Fase 4 di
`../Phase 5 Dashboard/data/` (opsional — tanpa itu pipeline memakai dummy).

```bash
# 1. Bangun data ringkas ke public/data/ (sekali / saat data berubah)
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
Fase 1–4 (CSV/parquet, ratusan MB)
      │  scripts/build_data.py  (agregasi + sampling + kompresi)
      ▼
public/data/*.json  (total ~0.8 MB)  ──►  di-fetch SEKALI di browser
                                            └─► semua filter in-memory (<100ms)
```

File yang dihasilkan di `public/data/`:
| File | Isi |
|---|---|
| `summary.json` | KPI, rentang tahun, meta DBSCAN, daftar fitur |
| `tiers_by_year.json` | jumlah anomali per (dataset, tahun, tier) |
| `verdict_by_year.json` | tipologi verdict per tahun (accepted) |
| `clusters.json` | profil segmen Fase 2 |
| `rules.json` | association rules Fase 3 |
| `anomaly_sample_{accepted,rejected}.json` | ±6.000 titik scatter (columnar) |

## Deploy ke Vercel

1. Push repo ke GitHub.
2. Di Vercel: **New Project** → import repo.
3. Set **Root Directory** = `Phase 5 Dashboard Web`.
4. Framework auto-terdeteksi (Vite). Build `npm run build`, output `dist/`.
5. Deploy. Tiap `git push` = auto-deploy.

> `public/data/*.json` ikut ter-deploy sebagai aset statis (di-serve dari CDN).
> Jalankan `npm run data` **sebelum** commit bila data Fase 4 berubah.

## Catatan
- Data mentah (accepted/rejected ~1.7 GB) **tidak pernah** dikirim ke browser.
- Rejected (6 juta baris) diproses via chunking di `build_data.py`, lalu di-sample.
- Rules Fase 3 saat ini memakai fallback bila CSV belum diekspor dari notebook —
  taruh `results_apriori_cleaned.csv` di `../Phase 5 Dashboard/data/` untuk data nyata.
