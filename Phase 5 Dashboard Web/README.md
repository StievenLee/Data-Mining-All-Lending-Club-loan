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
data_src/  (SATU-SATUNYA sumber input Fase 1–4: CSV/parquet/dbscan-json, ratusan MB, gitignored)
      │      └─ rules Fase 3 juga dibaca dari sini; fallback ke Phase 3/Results bila kosong
      │  scripts/build_data.py  (agregasi; scatter TIDAK di-sample)
      ▼
public/data/*.json  (43,8 MB mentah / ±4,1 MB gzip)  ──►  di-fetch SEKALI di browser
                                                       └─► semua filter in-memory
```

> Dua file berat Fase 1–2 (`clean_{accepted,rejected}_loans.csv` dan parquet label klaster)
> tetap dibaca langsung dari folder aslinya, bukan disalin ke `data_src/`, karena ukurannya
> mencapai 2,7 GB. Yang dipusatkan di `data_src/` adalah seluruh input berukuran wajar.

File yang dihasilkan di `public/data/` (ukuran hasil build 21 Juli 2026):

| File | Isi | Mentah | Gzip |
|---|---|---|---|
| `anomaly_sample_rejected.json` | **547.100** titik scatter (columnar) | 27,95 MB | 2,44 MB |
| `anomaly_sample_accepted.json` | **177.070** titik scatter (columnar) | 15,83 MB | 1,63 MB |
| `clusters_by_year.json` | profil segmen Fase 2 per (dataset, tahun) | 12 KB | ~3 KB |
| `rules.json` | 29 association rules Fase 3 (25 accepted + 4 rejected) | ~6 KB | ~2 KB |
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
| Bundle JS (gzip) | ±298 KB | laporan `vite build` (echarts 212 + react 45 + app 40) |
| `JSON.parse` kedua sample | ±310 ms | Node 20, desktop — **bukan** kelas HP |
| Heap setelah parse | ±106 MB | `process.memoryUsage()` |

### Latensi filter — diukur langsung di browser

Sejak `src/lib/perf.ts` dipasang, latensi filter **diukur saat dashboard dipakai** dan
angkanya tampil di badge **LATENSI** pada bar atas (arahkan kursor untuk rinciannya).
Klaim "<100 ms per filter" di `PLAN.md` karena itu tidak lagi tanpa dasar — tetapi
**verifikasi sendiri di perangkat yang dipakai saat demo**, jangan kutip dari sini.

Yang diukur adalah **jarak dari aksi user sampai chart terakhir selesai digambar**, bukan
hanya durasi `chart.setOption()`. Bagian yang berpotensi lambat justru di hulu (memfilter
ratusan ribu baris di memori lalu menyusun ulang opsi chart); mengukur `setOption` saja
akan menghasilkan angka bagus yang tidak menjawab apa pun. Porsi menggambar tetap dicatat
terpisah supaya terlihat berapa bagian yang murni ECharts.

Yang **tidak** masuk hitungan: waktu muat awal (fetch + `JSON.parse`). Itu bukan latensi
filter, dan mencampurnya membuat sampel pertama selalu buruk — karena itu pengukuran baru
dimulai setelah aksi filter pertama, dan sebelum itu badge menampilkan `–`, bukan `0 ms`.

Warna badge: hijau <100 ms, amber <300 ms, merah di atasnya. Aksi terberat yang layak diuji
adalah **mengubah jumlah titik ke "Semua"** di tab Anomali — itu batas atas beban nyata
dashboard ini.

#### Biaya jalur filter (JS saja, tanpa ECharts & paint)

Diukur dengan Node 22 di desktop atas data asli `public/data/anomaly_sample_*.json`. Kolom
"sebelum" adalah implementasi lama yang mengalokasikan objek per titik; "sesudah" adalah
`prepareScatter()` satu-lintasan yang sekarang.

| Dataset | Titik | Sebelum | Sesudah |
|---|---|---|---|
| Accepted (177 rb) | 10.000 | 2,6 ms | 2,2 ms |
| Accepted | 50.000 | 9,1 ms | 3,5 ms |
| Accepted | Semua | 53,8 ms | **11,9 ms** |
| Rejected (547 rb) | 10.000 | 1,5 ms | 0,5 ms |
| Rejected | 50.000 | 8,7 ms | 2,3 ms |
| Rejected | Semua | 182,3 ms | **47,2 ms** |

Tambahkan ±3 ms (accepted) / ±10 ms (rejected) untuk `filterSampleRows`, yang selalu
memindai seluruh baris tanpa memandang batas titik. Angka ini **batas bawah**: internal
ECharts dan waktu paint belum termasuk, dan itulah yang diukur badge LATENSI.

**Yang masih belum diukur:** First Contentful Paint.

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
- Tab **Laporan KDD** (`src/pages/Laporan.tsx`) adalah versi layar dari
  `LAPORAN_KNOWLEDGE_DISCOVERY.md` di root repo. Angkanya sengaja **statis dan tidak ikut
  filter**: laporan adalah dokumen yang ditandatangani pada satu titik waktu, jadi isinya harus
  tetap sama walau rentang tahun digeser di tab lain. Bila laporan `.md` diperbarui, halaman ini
  harus diperbarui manual — keduanya tidak terhubung otomatis. Tab **Insight Bisnis** adalah
  kebalikannya: angkanya dihitung dari data dashboard.
- Chart di tab **Preprocessing** (`src/components/charts/phase1Options.ts`) juga statis, disalin
  dari output notebook Fase 1. Sumber tiap angka ditulis sebagai komentar di atas konstantanya.
- Rejected diproses via chunking di `build_data.py`, lalu **difilter ke tier "Kuat" ke atas**
  (`REJECTED_MIN_TIER_RANK = 2`) — bukan di-sample. Tier Sedang & Lemah rejected tidak ikut,
  jadi angka rejected di dashboard bukan total anomali rejected (ini juga dinyatakan di UI).
- Rules Fase 3 dibaca dari **`data_src/results_apriori_{accepted,rejected}.csv`** (data nyata —
  bukan `_cleaned`, yang hanya berisi 14 rule pilihan untuk narasi). Setiap kali notebook Fase 3
  dijalankan ulang, **salin ulang kedua CSV itu dari `Phase 3 Associate Rule/Results/` ke
  `data_src/`**, lalu jalankan `npm run data`.
- Bila langkah salin itu terlewat, `build_data.py` **otomatis fallback ke
  `Phase 3 Associate Rule/Results/`** — bukan diam-diam memakai dummy. Sumber yang benar-benar
  terpakai selalu tercetak di log build, contoh:
  `[build_data] rules Accepted: 25 rule dari data_src`.
- Perlu diketahui: root `.gitignore` memuat pola `*.csv`, sehingga **kedua lokasi sama-sama
  tidak ter-commit**. Pada clone baru, rules harus dibangun ulang dengan menjalankan notebook
  Fase 3. Yang ter-commit dan dipakai saat deploy adalah hasil jadinya, `public/data/rules.json`.
