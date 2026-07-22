import { useMemo } from "react";
import type { ReactNode } from "react";
import { useDashboard } from "../store/useDashboard";
import PageHead from "../components/PageHead";
import Card from "../components/Card";
import Callout from "../components/Callout";
import EChart from "../components/EChart";
import {
  columnFunnelOption,
  featureScoreOption,
  rejectedMissingOption,
  sparseDensityOption,
  statusDonutOption,
} from "../components/charts/phase1Options";

/* ============================================================================
   Fase 1 · Preprocessing — halaman report naratif.
   Semua angka bersifat statis (fakta hasil notebook Fase 1), diverifikasi dari
   header CSV output: clean_accepted_loans.csv (1.348.099 baris × 14 fitur),
   clean_for_apriori_accepted.csv (74 item), clean_rejected_loans.csv (8 kolom).
   ========================================================================== */

// -- helper presentasional kecil (konsisten dgn token desain app) -----------

function Stat({ value, label, accent = "text-text" }: { value: string; label: string; accent?: string }) {
  return (
    <div className="rounded-[14px] border border-line bg-glass2 px-3.5 py-3">
      <div className={`font-display text-[22px] font-semibold leading-none ${accent}`}>{value}</div>
      <div className="mt-1.5 text-[12px] leading-[1.35] text-muted">{label}</div>
    </div>
  );
}

function SectionNo({ n }: { n: number }) {
  return (
    <span className="inline-grid h-6 w-6 place-items-center rounded-full bg-lime font-mono text-[12px] font-bold text-ink">
      {n}
    </span>
  );
}

/** Baris "apa yang dilakukan + alasan", dengan titik warna kategori. */
function DoRow({ color, title, detail }: { color: string; title: ReactNode; detail: ReactNode }) {
  return (
    <div className="flex gap-3 py-2.5">
      <span className="mt-[7px] h-2 w-2 flex-none rounded-full" style={{ background: color }} />
      <div className="min-w-0">
        <div className="text-[14px] font-semibold text-text">{title}</div>
        <div className="mt-0.5 text-[13px] leading-[1.55] text-muted">{detail}</div>
      </div>
    </div>
  );
}

function Chip({ children, tone = "plain" }: { children: ReactNode; tone?: "plain" | "target" }) {
  const cls =
    tone === "target"
      ? "border-lime/45 bg-lime/[0.09] text-text"
      : "border-line bg-glass2 text-muted";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[12.5px] leading-none ${cls}`}>
      {children}
    </span>
  );
}

/** Kartu file output: nama file, ukuran, tujuan pemakaian di fase berikutnya. */
function OutputCard({
  file,
  size,
  desc,
  use,
  accent,
}: {
  file: string;
  size: string;
  desc: string;
  use: string;
  accent: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[18px] border border-line bg-glass px-5 py-4">
      <div className="absolute inset-y-0 left-0 w-[3px]" style={{ background: accent }} />
      <div className="font-mono text-[12.5px] font-semibold text-text break-all">{file}</div>
      <div className="mt-1 font-mono text-[11px] text-muted">{size}</div>
      <p className="mt-2.5 text-[13px] leading-[1.55] text-muted">{desc}</p>
      <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-line bg-glass2 px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.1em]" style={{ color: accent }}>
        → {use}
      </div>
    </div>
  );
}

// -- data statis (label ramah untuk 14 fitur final clustering) --------------

const FINAL_FEATURES: string[] = [
  "Grade kredit (A–G)",
  "Suku bunga (int_rate)",
  "Tenor (36 / 60 bln)",
  "Rumah: KPR / mortgage",
  "Rumah: sewa",
  "Tujuan: konsolidasi utang",
  "Skor FICO saat pengajuan",
  "Inquiry kredit 6 bln terakhir",
  "Cicilan bulanan (installment)",
  "Akun dibuka 24 bln terakhir",
  "Trade line dibuka 12 bln terakhir",
  "Verifikasi: source verified",
  "Verifikasi: verified",
  "Status listing awal (w)",
];

const STEPS: { no: number; name: string; desc: string }[] = [
  { no: 1, name: "EDA", desc: "Kenali struktur, missing, outlier, & target" },
  { no: 2, name: "Cleaning", desc: "Buang kolom bermasalah, rapikan tipe & outlier" },
  { no: 3, name: "Transformasi", desc: "Encoding, scaling, log, & binning" },
  { no: 4, name: "Feature Selection", desc: "Pilih fitur paling informatif" },
  { no: 5, name: "Output", desc: "CSV bersih siap Segmentasi & Apriori" },
];

/** Report dataset ACCEPTED (pipeline penuh). */
function AcceptedReport() {
  // Opsi chart bersifat konstan (angka Fase 1 statis), tetapi tetap di-memo agar
  // EChart tidak menerima objek baru tiap render dan menggambar ulang percuma.
  const statusDonut = useMemo(() => statusDonutOption(), []);
  const columnFunnel = useMemo(() => columnFunnelOption(), []);
  const featureScore = useMemo(() => featureScoreOption(), []);

  return (
    <>
      <PageHead
        eyebrow="Fase 1 · Preprocessing · Accepted"
        title="Dari Data Mentah ke Data Siap Pakai"
        sub={
          <>
            Laporan singkat perjalanan data: dari <b>2,26 juta</b> baris mentah dengan 151 kolom
            campur-aduk, menjadi tabel bersih dan rapi yang siap dipakai untuk Segmentasi dan
            Association Rules. Ditulis ringkas agar mudah dipahami tanpa latar teknis.
          </>
        }
        pills={[
          { label: "Baris final", value: "1,35 jt" },
          { label: "Fitur terpilih", value: "14", kind: "accent" },
        ]}
      />

      <Callout eyebrow="Gambaran besar">
        Data mentah tidak bisa langsung dianalisis karena banyak nilai kosong, format berantakan,
        dan kolom yang menyesatkan. Fase 1 membereskan semua itu lewat <b>5 langkah</b> berurutan,
        sehingga menghasilkan file <b>CSV siap pakai</b> untuk Fase 2 (Segmentasi) dan Fase 3
        (Association Rules).
      </Callout>

      {/* Alur 5 langkah */}
      <Card title="Alur pengerjaan" sub="Lima langkah, dari mengenali data sampai menghasilkan file bersih.">
        <div className="grid grid-cols-1 gap-2.5 min-[560px]:grid-cols-2 min-[900px]:grid-cols-5">
          {STEPS.map((s) => (
            <div key={s.no} className="rounded-[14px] border border-line bg-glass2 px-3.5 py-3">
              <SectionNo n={s.no} />
              <div className="mt-2 font-display text-[15px] font-semibold text-text">{s.name}</div>
              <div className="mt-1 text-[12px] leading-[1.4] text-muted">{s.desc}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="h-[18px]" />

      {/* Dua dataset mentah */}
      <Card title="Titik awal: dua dataset mentah" sub="Diproses terpisah karena karakternya berbeda.">
        <div className="grid grid-cols-2 gap-2.5 min-[560px]:grid-cols-4">
          <Stat value="2,26 jt" label="Baris pinjaman DITERIMA (accepted)" accent="text-cyan" />
          <Stat value="151" label="Kolom awal accepted (banyak & campur)" />
          <Stat value="27,60 jt" label="Baris pengajuan DITOLAK (rejected)" accent="text-violet" />
          <Stat value="9" label="Kolom awal rejected (jauh lebih sederhana)" />
        </div>
        <p className="mt-3.5 text-[13.5px] leading-[1.6] text-muted">
          Dataset <b className="text-text">accepted</b> diproses penuh karena kaya fitur dan punya
          label hasil pinjaman (<span className="font-mono text-[12.5px]">loan_status</span>).
          Dataset <b className="text-text">rejected</b> diproses dengan pipeline lebih sederhana
          sebagai pembanding, karena ia tidak punya label hasil.
        </p>
      </Card>

      <div className="h-[18px]" />

      {/* 1 EDA */}
      <Card title={<span className="inline-flex items-center gap-2.5"><SectionNo n={1} /> Kenali Data (EDA)</span>}
        sub="Memahami data sebelum menyentuhnya: struktur, nilai kosong, outlier, dan target.">
        <p className="text-[13.5px] leading-[1.6] text-muted">
          Sebelum diubah, data dipelajari dulu. Ditemukan banyak kolom dengan nilai kosong
          (sebagian &gt;80%), outlier ekstrem (mis. pendapatan tahunan yang panjang ekornya), dan
          label hasil pinjaman yang belum final. Temuan ini menentukan keputusan di langkah cleaning.
        </p>
        <div className="mt-3.5 grid grid-cols-1 items-center gap-3 min-[820px]:grid-cols-[1fr_320px]">
          <div className="grid grid-cols-3 gap-2.5 min-[820px]:grid-cols-1">
            <Stat value="47,63%" label="Fully Paid (lunas)" accent="text-lime" />
            <Stat value="11,88%" label="Charged Off (gagal bayar)" accent="text-error" />
            <Stat value="38,85%" label="Current / berjalan, dibuang (belum final)" accent="text-amber" />
          </div>
          <EChart option={statusDonut} height={300} />
        </div>
        <p className="mt-3 text-[13px] leading-[1.55] text-muted">
          Status yang belum selesai (Current, Late, In Grace Period) <b className="text-text">dikeluarkan</b>{" "}
          agar tidak menambah kebisingan, sehingga hanya pinjaman dengan hasil akhir yang dipakai.
        </p>
      </Card>

      <div className="h-[18px]" />

      {/* 2 Cleaning */}
      <Card title={<span className="inline-flex items-center gap-2.5"><SectionNo n={2} /> Bersihkan Data (Cleaning)</span>}
        sub="Setiap keputusan pembersihan punya alasan yang jelas.">
        <div className="grid grid-cols-1 gap-3 min-[900px]:grid-cols-[300px_1fr]">
          <div className="min-w-0">
            <div className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
              Penyusutan kolom
            </div>
            <EChart option={columnFunnel} height={250} />
            <p className="mt-1 text-[12px] leading-[1.5] text-muted">
              Dari 151 kolom, tersisa 87 setelah pembersihan. Jumlah ini sempat naik lagi saat
              encoding, lalu diseleksi di langkah 4.
            </p>
          </div>
          <div className="min-w-0 divide-y divide-line">
            <DoRow color="#ffb4ab" title="Buang kolom yang mayoritas kosong (>50%)"
              detail="Kolom yang lebih dari separuh nilainya hilang tidak bisa diisi ulang secara andal tanpa menimbulkan bias." />
            <DoRow color="#ffb4ab" title="Buang kolom identitas & tak informatif"
              detail={<>Seperti <span className="font-mono text-[12px]">id, url, emp_title, zip_code, title</span>, yang unik atau terlalu beragam sehingga tidak stabil sebagai fitur.</>} />
            <DoRow color="#d0bcff" title={<>Buang kolom &ldquo;bocor&rdquo; (data leakage)</>}
              detail={<>Kolom yang nilainya baru ada <b className="text-text">setelah</b> pinjaman berjalan (mis. <span className="font-mono text-[12px]">total_pymnt, last_fico_range</span>). Memakainya sama dengan &ldquo;mengintip masa depan&rdquo; sehingga hasil jadi tidak sah. FICO <b className="text-text">saat pengajuan</b> tetap dipertahankan karena sah.</>} />
            <DoRow color="#7df4ff" title="Rapikan tipe & format yang tidak konsisten"
              detail={<>Contoh: <span className="font-mono text-[12px]">&ldquo; 36 months&rdquo;</span> → angka 36; <span className="font-mono text-[12px]">&ldquo;10+ years&rdquo;</span> → 10; tanggal <span className="font-mono text-[12px]">&ldquo;Jan-2015&rdquo;</span> → tahun & bulan.</>} />
            <DoRow color="#c3f400" title="Tangani outlier tanpa membuang baris"
              detail="Nilai ekstrem dipangkas ke batas wajar (IQR capping / winsorization). Pendapatan tahunan ditangani khusus: dipangkas P1–P99 lalu di-log agar distribusinya lebih normal." />
            <DoRow color="#c4c9ac" title="Isi sisa nilai kosong & hapus duplikat"
              detail="Angka diisi median (tahan terhadap outlier), kategori diisi modus. Baris yang benar-benar kembar dihapus." />
          </div>
        </div>
      </Card>

      <div className="h-[18px]" />

      {/* 3 Transformasi */}
      <Card title={<span className="inline-flex items-center gap-2.5"><SectionNo n={3} /> Ubah Bentuk (Transformasi)</span>}
        sub="Data diubah ke bentuk angka yang bisa diproses algoritma.">
        <div className="divide-y divide-line">
          <DoRow color="#c3f400" title="Target dijadikan biner"
            detail={<><span className="font-mono text-[12px]">loan_status</span> → 0 = lunas (Fully Paid), 1 = gagal bayar (Default / Charged Off).</>} />
          <DoRow color="#7df4ff" title="Kategori diubah jadi angka"
            detail="Grade A–G & lama kerja 0–10 memakai urutan alami (ordinal); kategori tanpa urutan (mis. kepemilikan rumah, tujuan pinjaman) memakai One-Hot Encoding." />
          <DoRow color="#d0bcff" title="Skala fitur disamakan (StandardScaler)"
            detail="Semua fitur numerik dibuat rata-rata 0 & simpangan 1, supaya K-Means/DBSCAN (berbasis jarak) tidak didominasi fitur berskala besar." />
          <DoRow color="#ffd479" title="Binning untuk Apriori"
            detail={<>Nilai kontinu dikelompokkan jadi kategori bermakna: <span className="font-mono text-[12px]">loan_amnt, income, int_rate, dti</span> → mis. &ldquo;Rendah / Sedang / Tinggi&rdquo;, agar bisa dijadikan pola aturan.</>} />
        </div>
        <div className="mt-3.5 rounded-[14px] border border-amber/25 bg-amber/[0.06] px-4 py-3 text-[13px] leading-[1.55] text-muted">
          <b className="text-text">Catatan keseimbangan kelas:</b> perbandingan lunas vs gagal bayar sekitar{" "}
          <b className="text-text">80 : 20</b>. Karena itu Apriori memakai ambang support rendah (≥0,05)
          agar pola kelas minoritas (gagal bayar) tetap terdeteksi.
        </div>
      </Card>

      <div className="h-[18px]" />

      {/* 4 Feature Selection */}
      <Card title={<span className="inline-flex items-center gap-2.5"><SectionNo n={4} /> Pilih Fitur (Feature Selection)</span>}
        sub="Menyaring fitur paling informatif, membuang yang redundan.">
        <p className="text-[13.5px] leading-[1.6] text-muted">
          Dua metode digabung agar lebih andal: <b className="text-text">Korelasi Pearson</b> (hubungan
          linear) dan <b className="text-text">Mutual Information</b> (menangkap pola non-linear).
          Skornya dirata-rata, lalu jumlah fitur ditentukan di titik <b className="text-text">elbow</b>
          {" "}(top-16). Terakhir, dari pasangan fitur yang terlalu mirip (korelasi &gt;0,90) salah satunya
          dibuang, sehingga menyisakan <b className="text-text">14 fitur final</b> untuk segmentasi.
        </p>
        <div className="mt-4 mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          16 fitur teratas & sumbangan tiap metode
        </div>
        <EChart option={featureScore} height={470} />
        <p className="mt-1 text-[12.5px] leading-[1.55] text-muted">
          Panjang tiap batang adalah <b className="text-text">Combined Score</b>, yaitu rata-rata dua
          skor yang sudah disamakan skalanya. Bagian biru menunjukkan sumbangan korelasi, bagian ungu
          sumbangan mutual information. Perhatikan bahwa keduanya sering tidak sejalan: &ldquo;status
          listing awal&rdquo; hampir tidak berkorelasi (0,01) tetapi mutual information-nya tertinggi
          &mdash; hubungan yang non-linear seperti ini akan terlewat kalau hanya memakai korelasi.
          Dua batang redup adalah fitur yang akhirnya dibuang karena hampir kembar dengan fitur lain.
        </p>

        <div className="mt-4 mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          14 fitur final + target
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FINAL_FEATURES.map((f) => (
            <Chip key={f}>{f}</Chip>
          ))}
          <Chip tone="target">＋ Target: lunas vs gagal bayar</Chip>
        </div>
        <p className="mt-3.5 text-[13px] leading-[1.55] text-muted">
          Dataset <b className="text-text">rejected</b> tidak melewati feature selection: hanya tersisa
          8 kolom dan tidak punya label target, jadi ke-8 kolomnya dipertahankan apa adanya.
        </p>
      </Card>

      <div className="h-[18px]" />

      {/* 5 Output */}
      <Card title={<span className="inline-flex items-center gap-2.5"><SectionNo n={5} /> Hasil: CSV Siap Pakai</span>}
        sub="Tiga file bersih, jembatan ke fase analisis berikutnya.">
        <div className="grid grid-cols-1 gap-3 min-[820px]:grid-cols-3">
          <OutputCard
            file="clean_accepted_loans.csv"
            size="1.348.099 baris × 14 fitur (+ target)"
            desc="Data pinjaman diterima yang sudah bersih & terstandardisasi. Setiap fitur berskala sama."
            use="Fase 2 · Segmentasi"
            accent="#7df4ff"
          />
          <OutputCard
            file="clean_for_apriori_accepted.csv"
            size="74 item biner (grade, sub-grade, bin, status, tenor)"
            desc="Versi ter-binning: fitur kontinu jadi kategori bermakna, siap dijadikan pola co-occurrence."
            use="Fase 3 · Association Rules"
            accent="#c3f400"
          />
          <OutputCard
            file="clean_rejected_loans.csv"
            size="8 kolom (Amount Requested, DTI, Employment Length, …)"
            desc="Pengajuan yang ditolak, sebagai pembanding untuk memahami profil penolakan."
            use="Analisis komparatif"
            accent="#d0bcff"
          />
        </div>
        <p className="mt-3.5 text-[13px] leading-[1.6] text-muted">
          Dua file pendukung juga diekspor agar fase lain tetap punya konteks:{" "}
          <span className="font-mono text-[12px]">issue_year_accepted.parquet</span> (tahun penerbitan
          untuk filter waktu di dashboard) dan{" "}
          <span className="font-mono text-[12px]">raw_counts_accepted.parquet</span> (nilai asli
          sebelum diskalakan, untuk verifikasi anomali di Fase 4).
        </p>
      </Card>
    </>
  );
}

// -- data statis dataset REJECTED -------------------------------------------

// 8 kolom final (label ramah). Tiga bertanda * ikut distandardisasi (numerik).
const REJECTED_COLS: { label: string; numeric?: boolean }[] = [
  { label: "Jumlah diminta (Amount Requested)", numeric: true },
  { label: "Rasio utang / DTI", numeric: true },
  { label: "Lama bekerja (0–10)", numeric: true },
  { label: "Tanggal pengajuan" },
  { label: "Judul pinjaman (Loan Title)" },
  { label: "Kode pos (Zip Code)" },
  { label: "Negara bagian (State)" },
  { label: "Kode kebijakan (Policy Code)" },
];

const REJECTED_STEPS: { no: number; name: string; desc: string }[] = [
  { no: 1, name: "EDA ringkas", desc: "Kenali 9 kolom, missing, & outlier DTI" },
  { no: 2, name: "Cleaning", desc: "Buang duplikat & kolom kosong, rapikan tipe" },
  { no: 3, name: "Normalisasi", desc: "Samakan skala 3 fitur numerik" },
  { no: 4, name: "Output", desc: "CSV pembanding + sparse (.npz) untuk Apriori" },
];

/** Report dataset REJECTED (pipeline lebih sederhana, tanpa target/feature selection). */
function RejectedReport() {
  const missing = useMemo(() => rejectedMissingOption(), []);
  const density = useMemo(() => sparseDensityOption(), []);

  return (
    <>
      <PageHead
        eyebrow="Fase 1 · Preprocessing · Rejected"
        title="Data Ditolak: Pipeline yang Lebih Ringkas"
        sub={
          <>
            Pengajuan yang <b>ditolak</b> punya jauh lebih sedikit informasi, yaitu hanya 9 kolom dan{" "}
            <b>tanpa label hasil pinjaman</b>. Maka pipeline-nya lebih sederhana: fokus merapikan
            dan menyamakan skala, lalu dipakai sebagai <b>pembanding</b> untuk memahami profil penolakan.
          </>
        }
        pills={[
          { label: "Baris", value: "27,60 jt" },
          { label: "File output", value: "3", kind: "accent" },
        ]}
      />

      <Callout eyebrow="Kenapa diproses terpisah">
        Dataset ditolak tidak punya kolom <b>loan_status</b> (tidak ada hasil lunas/gagal bayar),
        sehingga metode yang butuh target seperti feature selection <b>tidak bisa dipakai</b>.
        Perannya adalah <b>pembanding</b>: memahami seperti apa pengajuan yang tidak lolos kebijakan kredit.
      </Callout>

      {/* Alur ringkas */}
      <Card title="Alur pengerjaan" sub="Lebih pendek dari pipeline accepted, hanya empat langkah.">
        <div className="grid grid-cols-1 gap-2.5 min-[560px]:grid-cols-2 min-[900px]:grid-cols-4">
          {REJECTED_STEPS.map((s) => (
            <div key={s.no} className="rounded-[14px] border border-line bg-glass2 px-3.5 py-3">
              <SectionNo n={s.no} />
              <div className="mt-2 font-display text-[15px] font-semibold text-text">{s.name}</div>
              <div className="mt-1 text-[12px] leading-[1.4] text-muted">{s.desc}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="h-[18px]" />

      {/* Titik awal */}
      <Card title="Titik awal: 27,60 juta pengajuan ditolak" sub="Sederhana kolomnya, tetapi sangat banyak barisnya.">
        <div className="grid grid-cols-3 gap-2.5">
          <Stat value="27,60 jt" label="Baris pengajuan ditolak" accent="text-violet" />
          <Stat value="9" label="Kolom awal (mentah)" />
          <Stat value="8" label="Kolom setelah dibersihkan" accent="text-lime" />
        </div>
        <p className="mt-3.5 text-[13.5px] leading-[1.6] text-muted">
          Data ditolak <b className="text-text">bukan sampel acak</b>, melainkan hasil penyaringan
          kebijakan kredit. Jadi ia dibaca sebagai gambaran karakteristik pengajuan yang gagal lolos,
          bukan sebagai populasi umum.
        </p>
      </Card>

      <div className="h-[18px]" />

      {/* Langkah pembersihan */}
      <Card title={<span className="inline-flex items-center gap-2.5"><SectionNo n={2} /> Bersihkan &amp; Rapikan</span>}
        sub="Sedikit langkah, tetapi tetap ada alasan di tiap keputusan.">
        <div className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          Nilai kosong per kolom
        </div>
        <EChart option={missing} height={230} />
        <p className="mb-4 mt-1 text-[12.5px] leading-[1.55] text-muted">
          Hanya <b className="text-text">Risk_Score</b> yang melewati ambang 50 persen, sehingga
          hanya kolom itu yang dibuang. Lima kolom lain nyaris penuh dan cukup diisi dengan median
          atau modus, tanpa kehilangan informasi berarti.
        </p>
        <div className="divide-y divide-line">
          <DoRow color="#c4c9ac" title="Hapus baris duplikat"
            detail="Baris identik hanya redundansi dan tidak menambah informasi." />
          <DoRow color="#7df4ff" title="Ubah DTI dari teks jadi angka"
            detail={<>Nilai seperti <span className="font-mono text-[12px]">&ldquo;38.64%&rdquo;</span> disimpan sebagai teks, lalu dikonversi ke angka agar bisa dihitung.</>} />
          <DoRow color="#ffb4ab" title="Buang Risk_Score (66,80% kosong)"
            detail="Terlalu banyak nilai hilang untuk diisi ulang secara andal. Kolom lain diisi median (angka) / modus (kategori)." />
          <DoRow color="#7df4ff" title="Samakan format Employment Length"
            detail={<><span className="font-mono text-[12px]">&ldquo;10+ years&rdquo;</span> → angka 0–10, konsisten dengan lama kerja di dataset accepted.</>} />
          <DoRow color="#c3f400" title="Jinakkan DTI yang absurd"
            detail={<>Ada nilai DTI sampai puluhan juta persen. Dipangkas ringan (P1–P99) agar tidak merusak skala, tetapi <b className="text-text">nilai DTI tinggi yang realistis tetap dipertahankan</b> karena jadi sinyal penting (muncul sebagai Anti-Persona di Fase 2).</>} />
          <DoRow color="#d0bcff" title="Samakan skala 3 fitur numerik"
            detail={<>Jumlah diminta (ribuan), DTI (puluhan), dan lama kerja (0–10) berbeda skala jauh. StandardScaler menyeragamkannya (rata-rata 0, simpangan 1) agar setara saat dipakai di analisis berbasis jarak.</>} />
        </div>
      </Card>

      <div className="h-[18px]" />

      {/* Tanpa feature selection + 8 kolom */}
      <Card title="Tanpa Feature Selection" sub="Kolomnya sudah sedikit, jadi semuanya dipertahankan.">
        <p className="text-[13.5px] leading-[1.6] text-muted">
          Karena hanya tersisa 8 kolom dan tidak ada target untuk diukur relevansinya, tidak ada
          fitur yang perlu dibuang. Ketiga fitur numerik bertanda <b className="text-lime">*</b> ikut
          distandardisasi; sisanya kolom identitas/konteks.
        </p>
        <div className="mt-3.5 mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          8 kolom final
        </div>
        <div className="flex flex-wrap gap-1.5">
          {REJECTED_COLS.map((c) => (
            <Chip key={c.label} tone={c.numeric ? "target" : "plain"}>
              {c.label}
              {c.numeric && <span className="ml-1 text-lime">*</span>}
            </Chip>
          ))}
        </div>
      </Card>

      <div className="h-[18px]" />

      {/* Siapkan untuk Apriori (sparse) */}
      <Card
        title="Siapkan untuk Apriori (format hemat memori)"
        sub="Rejected juga disiapkan untuk Association Rules, tetapi tidak sebagai CSV biasa."
      >
        <p className="text-[13.5px] leading-[1.6] text-muted">
          Tiga fitur di-bin lalu di-One-Hot menjadi <b className="text-text">12 kolom biner</b>: Amount
          Requested, Debt-To-Income Ratio, dan Employment Length. Karena rejected punya sekitar{" "}
          <b className="text-text">27 juta baris</b>, menyimpannya sebagai tabel biasa (dense) akan
          menghabiskan lebih dari 10 GB RAM. Solusinya memakai <b className="text-text">sparse matrix</b>,
          yaitu format yang hanya menyimpan nilai 1 dan mengabaikan nilai 0, sehingga hemat 10 sampai 50
          kali lipat.
        </p>
        <div className="mt-3.5 grid grid-cols-1 items-center gap-3 min-[820px]:grid-cols-[1fr_300px]">
          <div className="grid grid-cols-2 gap-2.5">
            <Stat value="27,49 jt" label="Baris (seluruh data ditolak)" accent="text-violet" />
            <Stat value="12" label="Kolom biner (item Apriori)" accent="text-lime" />
            <Stat value="25%" label="Kepadatan nilai 1 (density)" />
            <Stat value="66 MB" label="Ukuran file sparse (.npz)" accent="text-cyan" />
          </div>
          <EChart option={density} height={280} />
        </div>
      </Card>

      <div className="h-[18px]" />

      {/* Output */}
      <Card title="Hasil: Tiga File Output" sub="Satu untuk clustering/komparatif, dua untuk Apriori.">
        <div className="grid grid-cols-1 gap-3 min-[820px]:grid-cols-3">
          <OutputCard
            file="clean_rejected_loans.csv"
            size="8 kolom (Amount Requested, DTI, Employment Length, …)"
            desc="Tabel bersih dan ternormalisasi. Fitur numeriknya berskala sama sehingga langsung bisa dipakai pada analisis berbasis jarak."
            use="Segmentasi & komparatif · Fase 2 & 4"
            accent="#d0bcff"
          />
          <OutputCard
            file="clean_for_apriori_rejected_sparse.npz"
            size="Matriks biner 27,49 jt × 12 (sparse, ~66 MB)"
            desc="Data ditolak dalam bentuk One-Hot yang hemat memori, siap dijadikan pola co-occurrence tanpa membebani RAM."
            use="Association Rules · Fase 3"
            accent="#c3f400"
          />
          <OutputCard
            file="clean_for_apriori_rejected_columns.json"
            size="12 nama kolom biner"
            desc="Daftar nama kolom untuk merekonstruksi matriks sparse saat Apriori dijalankan, karena file .npz tidak menyimpan nama kolom."
            use="Pendamping file .npz"
            accent="#7df4ff"
          />
        </div>
        <p className="mt-3.5 text-[13px] leading-[1.6] text-muted">
          Ketiganya menjadikan sisi ditolak sebagai kaca pembanding: dengan menyandingkan profil pinjaman{" "}
          <b className="text-text">diterima</b> dan <b className="text-text">ditolak</b>, kita bisa
          melihat batas kebijakan kredit, misalnya rentang DTI atau jumlah pinjaman yang cenderung ditolak.
        </p>
      </Card>
    </>
  );
}

export default function Preprocessing() {
  const dataset = useDashboard((s) => s.dataset);
  return dataset === "rejected" ? <RejectedReport /> : <AcceptedReport />;
}
