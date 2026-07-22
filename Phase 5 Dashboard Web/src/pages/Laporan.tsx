import type { ReactNode } from "react";
import PageHead from "../components/PageHead";
import Card from "../components/Card";
import Callout from "../components/Callout";

/* ============================================================================
   Fase 5 · Laporan Knowledge Discovery — versi layar dari
   LAPORAN_KNOWLEDGE_DISCOVERY.md (dokumen naratif di root repo).

   Angkanya STATIS dan disalin apa adanya dari laporan tersebut, yang seluruhnya
   berasal dari eksekusi notebook Fase 1-4. Halaman ini sengaja tidak menghitung
   ulang dari data dashboard: laporan adalah dokumen yang ditandatangani pada satu
   titik waktu, jadi angkanya harus tetap sama walau filter tahun digeser di tab lain.
   Tab "Insight Bisnis" adalah kebalikannya: di sana angka ikut data.
   ========================================================================== */

// -- helper presentasional --------------------------------------------------

/** Nomor bab besar, dipakai di judul tiap Card. */
function ChapterNo({ n }: { n: number }) {
  return (
    <span className="inline-grid h-6 w-6 place-items-center rounded-full bg-lime font-mono text-[12px] font-bold text-ink">
      {n}
    </span>
  );
}

/** Label temuan ke-N di kepala kartu temuan. */
function FindingTag({ n, tone }: { n: number; tone: string }) {
  return (
    <span
      className="rounded-full border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em]"
      style={{ borderColor: tone + "55", color: tone }}
    >
      Temuan {n}
    </span>
  );
}

/** Blok berlabel di dalam kartu temuan (Bukti / Artinya / Batasan). */
function Block({
  label,
  color,
  children,
}: {
  label: string;
  color: string;
  children: ReactNode;
}) {
  return (
    <div
      className="mt-3.5 rounded-[14px] border px-4 py-3"
      style={{ borderColor: color + "40", background: color + "0f" }}
    >
      <div
        className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em]"
        style={{ color }}
      >
        {label}
      </div>
      <div className="text-[13.5px] leading-[1.6] text-text">{children}</div>
    </div>
  );
}

/** Tabel ringkas yang aman di layar sempit (bisa digeser horizontal sendiri). */
function MiniTable({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="-mx-1 mt-3 overflow-x-auto px-1">
      <table className="w-full min-w-[420px] border-collapse text-[13px]">
        <thead>
          <tr>
            {head.map((h, i) => (
              <th
                key={h}
                className={
                  "border-b border-line pb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted " +
                  (i === 0 ? "text-left" : "text-right")
                }
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className="border-b border-line/60 last:border-0">
              {r.map((cell, ci) => (
                <td
                  key={ci}
                  className={
                    "py-2.5 leading-[1.45] " +
                    (ci === 0 ? "pr-3 text-text" : "pl-3 text-right font-mono text-muted")
                  }
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Angka yang ditonjolkan di dalam sel tabel. */
function Hi({ children, color = "#c3f400" }: { children: ReactNode; color?: string }) {
  return (
    <span className="font-semibold" style={{ color }}>
      {children}
    </span>
  );
}

function Tile({ value, label, accent = "text-text" }: { value: string; label: string; accent?: string }) {
  return (
    <div className="rounded-[14px] border border-line bg-glass2 px-3.5 py-3">
      <div className={`font-display text-[21px] font-semibold leading-none ${accent}`}>{value}</div>
      <div className="mt-1.5 text-[12px] leading-[1.35] text-muted">{label}</div>
    </div>
  );
}

/** Butir bernomor untuk daftar rekomendasi & keterbatasan. */
function NumberedItem({
  n,
  accent,
  title,
  children,
}: {
  n: number;
  accent: string;
  title: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-3 py-3">
      <span
        className="mt-0.5 inline-grid h-[22px] w-[22px] flex-none place-items-center rounded-full font-mono text-[11px] font-bold text-ink"
        style={{ background: accent }}
      >
        {n}
      </span>
      <div className="min-w-0">
        <div className="text-[14px] font-semibold leading-[1.45] text-text">{title}</div>
        <div className="mt-1 text-[13px] leading-[1.6] text-muted">{children}</div>
      </div>
    </div>
  );
}

// -- data statis (disalin dari laporan) -------------------------------------

const SUDAH_JELAS: [string, string][] = [
  [
    "Skor kredit rendah cenderung dikenai bunga lebih tinggi",
    "67% peminjam pada kelompok FICO terendah menerima bunga di atas median, dibanding hanya 21% pada kelompok FICO tertinggi",
  ],
  ["Bunga tinggi lebih sering gagal bayar", "35,90% pada kelompok bunga tertinggi vs 6,70% pada kelompok terendah"],
  [
    "Sebagian besar pinjaman untuk melunasi utang lama",
    "Debt consolidation mendominasi seluruh kategori tujuan pinjaman",
  ],
];

const REKOMENDASI: { title: string; body: string; dasar: string; accent: string }[] = [
  {
    title: "Perlakukan tenor sebagai variabel risiko tersendiri",
    body: "Tenor bukan sekadar preferensi cicilan nasabah, melainkan pilihan produk yang menentukan risiko. Batasi kombinasi tenor 60 bulan dengan nominal besar untuk peminjam berbunga tinggi.",
    dasar: "Temuan 1",
    accent: "#c3f400",
  },
  {
    title: "Terapkan sebagai batas eksposur portofolio, bukan aturan tolak individual",
    body: "Mayoritas pinjaman bertenor panjang tetap lunas. Menolak per pengajuan akan merugikan ribuan nasabah yang sebenarnya membayar penuh.",
    dasar: "Temuan 1 (batasan)",
    accent: "#ffb4ab",
  },
  {
    title: "Periksa kewajaran bunga di dalam tiap kelas skor kredit",
    body: "Bukan hanya terhadap seluruh populasi. Tinjau manual 5.274 kasus yang teridentifikasi sebagai prioritas salah penetapan harga (mispricing).",
    dasar: "Temuan 2",
    accent: "#7df4ff",
  },
  {
    title: "Prioritaskan tinjauan manual pada 42.440 kasus irisan",
    body: "Yaitu yang menyimpang sekaligus di tingkat segmen dan tingkat individu, bukan pada seluruh 347 ribu anggota segmen berisiko.",
    dasar: "Temuan 3",
    accent: "#d0bcff",
  },
  {
    title: "Jadwalkan peninjauan kebijakan penjaminan secara berkala",
    body: "Komposisi risiko terbukti bergeser lebih dari dua kali lipat sepanjang periode data, sehingga kebijakan tidak boleh ditetapkan sekali lalu dibiarkan.",
    dasar: "Temuan 4",
    accent: "#ffd479",
  },
  {
    title: "Jangan membaca membaiknya angka gagal bayar tahun terakhir sebagai keberhasilan",
    body: "Pinjaman terbaru belum cukup matang untuk sempat gagal bayar, sehingga angkanya terlihat bagus secara semu.",
    dasar: "Temuan 4",
    accent: "#ffd479",
  },
  {
    title: "Selalu uji apakah sebuah pola hanya memantulkan kebijakan internal",
    body: "Lakukan sebelum melaporkannya sebagai temuan. Ini pelajaran terbesar proyek, dan biayanya adalah 89% temuan versi pertama kami.",
    dasar: "Temuan 5",
    accent: "#571bc1",
  },
];

const KETERBATASAN: { title: string; body: ReactNode }[] = [
  {
    title: "Aturan asosiasi mengukur kemunculan bersama, bukan sebab-akibat",
    body: "Tidak ada satu pun temuan di laporan ini yang membuktikan bahwa memperpendek tenor akan menurunkan gagal bayar. Yang terbukti hanyalah bahwa keduanya menumpuk di tempat yang sama.",
  },
  {
    title: "Deteksi outlier berbasis kepadatan (DBSCAN) dijalankan pada sampel 5.000 baris",
    body: "Bukan seluruh 1,35 juta populasi, karena keterbatasan komputasi. Akibatnya lapisan bukti tertinggi pada deteksi anomali (44 kasus paling meyakinkan) mewarisi keterbatasan sampel itu. Temuan 2 dan 3 tidak terpengaruh karena keduanya dihitung pada populasi penuh.",
  },
  {
    title: "Hanya pinjaman yang sudah selesai yang dianalisis",
    body: "Pinjaman yang masih berjalan (38,90% dari data asli) dibuang karena hasil akhirnya belum diketahui. Proporsi pelunasan di laporan ini karena itu lebih tinggi dibanding bila seluruh pinjaman ikut dihitung.",
  },
  {
    title: "Dataset pengajuan yang ditolak sangat terbatas",
    body: "Hanya memuat tiga atribut: jumlah yang diminta, rasio utang, dan lama bekerja. Pola yang bisa ditemukan di sana lemah (kekuatan 1,3 sampai 1,4 kali dibanding 2,0 sampai 3,0 kali pada pinjaman diterima). Kelemahan itu sendiri informatif: keputusan penolakan tampaknya tidak ditentukan oleh kombinasi sederhana ketiga atribut tersebut.",
  },
  {
    title: "Segmentasi menghasilkan kelompok yang saling tumpang tindih",
    body: "Bukan terpisah tegas (silhouette score 0,125). Ini mencerminkan sifat perilaku kredit yang gradual, bukan kegagalan metode. Jumlah segmen dipilih berdasarkan kemampuannya memisahkan tingkat gagal bayar nyata, bukan berdasarkan skor internal, dan hal itu dinyatakan terbuka.",
  },
  {
    title: "Sebagian pola tenor kemungkinan mencerminkan kebijakan produk",
    body: "Yang membatasi tenor 60 bulan untuk nominal di atas ambang tertentu. Berbeda dari tautologi harga yang dibuang (deterministik, 99,90%), hubungan ini masih menyisakan variasi nyata (63,90%), sehingga dilaporkan dengan catatan ini alih-alih disembunyikan.",
  },
];

// -- halaman ----------------------------------------------------------------

export default function Laporan() {
  return (
    <>
      <PageHead
        eyebrow="Fase 5 · Laporan Knowledge Discovery"
        title="Apa yang Kami Temukan yang Tidak Sudah Terlihat?"
        sub={
          <>
            Laporan lengkap proyek KDD ini, ditulis untuk pembaca <b>non-teknis</b>. Seluruh angka
            berasal langsung dari eksekusi notebook Fase 1 sampai Fase 4, bukan estimasi. Istilah
            teknis dijelaskan saat pertama kali muncul.
          </>
        }
        pills={[
          { label: "Temuan utama", value: "5", kind: "accent" },
          { label: "Rekomendasi", value: "7" },
          { label: "Keterbatasan", value: "6", kind: "ai" },
        ]}
      />

      <Callout eyebrow="Ringkasan eksekutif">
        Sinyal gagal bayar yang paling kuat <b>tidak melekat pada siapa peminjamnya</b>, melainkan
        pada <b>bagaimana kontraknya disusun</b>. Tenor 60 bulan berfungsi seperti corong: ia
        mengumpulkan pinjaman berbunga tinggi, berkualitas kredit rendah, dan bernominal besar di
        satu tempat, lalu kombinasi itu bermuara pada gagal bayar jauh di atas ekspektasi. Tenor dan
        plafon adalah dua hal yang <b>dikendalikan sendiri oleh pemberi pinjaman</b>, sehingga temuan
        ini bisa langsung ditindaklanjuti lewat kebijakan produk.
      </Callout>

      {/* 1 · Konteks & pertanyaan sentral */}
      <Card
        title={
          <span className="inline-flex items-center gap-2.5">
            <ChapterNo n={1} /> Konteks dan Pertanyaan Sentral
          </span>
        }
        sub="Kenapa proyek ini menetapkan standar yang lebih ketat untuk dirinya sendiri."
      >
        <p className="text-[13.5px] leading-[1.6] text-muted">
          Lending Club adalah platform pinjaman antar-orang (<i>peer-to-peer</i>). Setiap pengajuan
          dinilai, diberi peringkat kredit (<b className="text-text">grade</b> A sampai G), lalu
          ditentukan suku bunganya. Pengajuan yang lolos menjadi pinjaman; yang tidak lolos tercatat
          di dataset terpisah. Kami menganalisis{" "}
          <b className="text-text">2,26 juta pinjaman yang disetujui</b> dan{" "}
          <b className="text-text">27,60 juta pengajuan yang ditolak</b> sepanjang 2007 sampai 2018.
        </p>
        <p className="mt-3 text-[13.5px] leading-[1.6] text-muted">
          Data ini sudah sangat sering dianalisis, dan sebagian besar analisisnya berhenti pada
          kesimpulan yang bisa ditebak: skor kredit rendah berarti bunga tinggi, bunga tinggi berarti
          risiko gagal bayar lebih besar. Karena itu pertanyaan yang kami kejar bukan &ldquo;berapa
          akurat model kami&rdquo;, melainkan:
        </p>
        <blockquote className="relative mt-3.5 overflow-hidden rounded-[18px] border border-lime/30 bg-[linear-gradient(110deg,rgba(195,244,0,0.14),rgba(19,19,24,0.5)_70%)] py-4 pl-6 pr-5">
          <span className="absolute inset-y-0 left-0 w-[3px] bg-lime" aria-hidden="true" />
          <p className="max-w-[62ch] font-display text-[16px] font-semibold leading-[1.5] text-text min-[640px]:text-[19px]">
            Apa yang kami temukan yang tidak sudah terlihat dari data mentah?
          </p>
        </blockquote>
        <p className="mt-3.5 text-[13.5px] leading-[1.6] text-muted">
          Sebuah temuan hanya dihitung menjawab pertanyaan itu bila memenuhi tiga syarat:{" "}
          <b className="text-text">(a)</b> tidak bisa diperoleh dengan satu tabel pivot sederhana,{" "}
          <b className="text-text">(b)</b> tidak sekadar mengulang aturan main yang memang sudah
          tertanam di dalam data, dan <b className="text-text">(c)</b> mengubah keputusan yang akan
          diambil.
        </p>
      </Card>

      <div className="h-[18px]" />

      {/* 2 · Yang sudah terlihat sebelum menambang */}
      <Card
        title={
          <span className="inline-flex items-center gap-2.5">
            <ChapterNo n={2} /> Apa yang Sudah Terlihat Sebelum Kami Menambang
          </span>
        }
        sub="Supaya klaim 'temuan baru' bisa diuji, kami jujur dulu tentang apa yang sudah kelihatan tanpa teknik apa pun."
      >
        <MiniTable
          head={["Sudah jelas dari data mentah", "Angka"]}
          rows={SUDAH_JELAS.map(([a, b]) => [a, b])}
        />
        <p className="mt-3.5 text-[13.5px] leading-[1.6] text-muted">
          Ketiganya benar, tetapi <b className="text-text">tidak satu pun mengubah keputusan siapa
          pun</b>. Semuanya konfirmasi atas hal yang memang sudah diasumsikan. Lima temuan berikut
          adalah yang menurut kami melampaui titik ini.
        </p>
      </Card>

      <div className="h-[18px]" />

      {/* 3 · Lima temuan */}
      <div className="mb-3.5 mt-1 flex items-center gap-3">
        <ChapterNo n={3} />
        <h2 className="font-display text-[21px] font-bold tracking-[-0.02em] text-text">
          Lima Temuan
        </h2>
      </div>

      {/* Temuan 1 */}
      <Card
        title={
          <span className="inline-flex flex-wrap items-center gap-2.5">
            <FindingTag n={1} tone="#c3f400" /> Risiko melekat pada struktur kontrak, bukan pada
            peminjam
          </span>
        }
        sub="Tenor 60 bulan berperilaku seperti corong: menarik tiga jenis risiko yang berbeda ke satu tempat."
      >
        <p className="text-[13.5px] leading-[1.6] text-muted">
          Tenor 60 bulan bukan sekadar pilihan nasabah yang ingin cicilan lebih ringan. Ia menarik
          bunga tinggi, grade rendah, dan nominal besar ke satu titik, lalu titik itu memiliki
          tingkat gagal bayar di atas ekspektasi.
        </p>
        <Block label="Buktinya · dari aturan asosiasi Fase 3" color="#7df4ff">
          Angka <b>lift</b> berarti &ldquo;berapa kali lebih sering dari yang diperkirakan kalau
          kedua hal itu tidak berhubungan&rdquo;. Lift 2,73 berarti 2,73 kali lebih sering dari
          kebetulan.
          <MiniTable
            head={["Pola", "Muncul pada", "Kekuatan (lift)"]}
            rows={[
              ["Bunga di atas 20% → tenor 60 bulan", "66% kasus", "2,73×"],
              ["Grade E → tenor 60 bulan", "61% kasus", "2,54×"],
              [
                <>
                  Tenor 60 bulan → pinjaman besar (20–35 ribu USD) yang <Hi color="#ffb4ab">gagal
                  bayar</Hi>
                </>,
                "13% kasus",
                <Hi>2,66×</Hi>,
              ],
              [
                <>
                  Tenor 60 bulan → pinjaman menengah (10–20 ribu USD) yang{" "}
                  <Hi color="#ffb4ab">gagal bayar</Hi>
                </>,
                "17% kasus",
                "2,15×",
              ],
              ["Pinjaman gagal bayar → penyewa rumah bertenor 60 bulan", "16% kasus", "2,03×"],
            ]}
          />
        </Block>
        <Block label="Mengapa ini tidak terlihat dari data mentah" color="#d0bcff">
          Bila kolom tenor dilihat sendirian, ia hanya menunjukkan dua nilai (36 atau 60 bulan) tanpa
          sesuatu yang mencolok. Bila kolom bunga dilihat sendirian, hubungannya dengan gagal bayar
          memang sudah diketahui. Yang tidak terlihat adalah bahwa{" "}
          <b>tenor menjadi titik pertemuan</b> dari bunga tinggi, grade rendah, dan nominal besar
          sekaligus. Tidak ada satu tabel pivot yang menampilkan hal itu.
        </Block>
        <Block label="Artinya untuk bisnis" color="#c3f400">
          Ini temuan yang paling bisa ditindaklanjuti di seluruh proyek, karena tenor dan plafon
          ditentukan oleh <b>pemberi pinjaman</b>, bukan oleh nasabah. Berbeda dari pendapatan atau
          skor kredit yang hanya bisa disaring, struktur kontrak bisa langsung diubah.
        </Block>
        <Block label="Batasan yang perlu dijaga" color="#ffb4ab">
          <b>Confidence</b> pola gagal bayar ini rendah (13 sampai 17 persen), artinya mayoritas
          pinjaman bertenor 60 bulan <b>tetap lunas</b>. Pola ini karena itu{" "}
          <b>tidak boleh dipakai untuk menolak satu pengajuan</b>. Nilainya ada di tingkat
          portofolio, sebagai dasar pembatasan eksposur agregat. Kami menekankan pembedaan ini karena
          keliru menerapkannya akan merugikan ribuan nasabah yang sebenarnya membayar penuh.
        </Block>
      </Card>

      <div className="h-[18px]" />

      {/* Temuan 2 */}
      <Card
        title={
          <span className="inline-flex flex-wrap items-center gap-2.5">
            <FindingTag n={2} tone="#7df4ff" /> 5.274 pinjaman yang &ldquo;wajar&rdquo; menurut semua
            ukuran umum, tetapi janggal dalam konteksnya
          </span>
        }
        sub="Kejanggalan yang hanya muncul relatif terhadap kelompok skor kreditnya sendiri."
      >
        <p className="text-[13.5px] leading-[1.6] text-muted">
          Bunga 15 persen adalah hal biasa bagi peminjam berskor kredit rendah, tetapi menjadi
          janggal bila diberikan kepada peminjam berskor kredit sangat tinggi. Penyaringan biasa
          tidak bisa menangkap kejanggalan semacam ini, karena 15 persen tidak ekstrem menurut ukuran
          populasi mana pun.
        </p>
        <Block label="Buktinya" color="#7df4ff">
          Seluruh peminjam dibagi ke dalam lima kelompok skor kredit, lalu kewajaran bunga dinilai
          ulang <b>di dalam</b> tiap kelompok, bukan terhadap seluruh populasi.
          <MiniTable
            head={["Kelompok", "Jumlah", "Tingkat gagal bayar"]}
            rows={[
              ["Seluruh populasi", "1.348.099", "19,98%"],
              ["Bunga janggal dalam konteks skor kreditnya", "14.385 (1,07%)", "—"],
              [
                <b className="text-text">Di antaranya: lolos seluruh penyaringan biasa</b>,
                <Hi>5.274</Hi>,
                <Hi color="#ffb4ab">40,37%</Hi>,
              ],
            ]}
          />
          Angka terakhir itulah intinya. Lima ribu pinjaman ini{" "}
          <b>tidak tertangkap oleh satu pun metode penyaringan standar</b>, namun tingkat gagal
          bayarnya <b>dua kali lipat rata-rata populasi</b>.
        </Block>
        <Block label="Mengapa ini tidak terlihat dari data mentah" color="#d0bcff">
          Menyaring kolom bunga secara global akan melewatkan seluruh 5.274 pinjaman ini, karena
          nilainya memang tidak ekstrem. Mereka hanya terlihat setelah pertanyaannya diubah dari
          &ldquo;apakah bunga ini tinggi?&rdquo; menjadi{" "}
          <b>&ldquo;apakah bunga ini tinggi untuk orang seperti dia?&rdquo;</b>
        </Block>
        <Block label="Artinya untuk bisnis" color="#c3f400">
          Ketidaksesuaian antara harga dan risiko seperti ini adalah kandidat kuat untuk dua hal:
          kesalahan penetapan harga (<i>mispricing</i>) atau kesalahan input data. Keduanya merugikan
          dan keduanya bisa diperbaiki. Karena jumlahnya hanya lima ribuan dari 1,35 juta, daftar ini
          realistis untuk ditinjau manual oleh tim risiko.
        </Block>
      </Card>

      <div className="h-[18px]" />

      {/* Temuan 3 */}
      <Card
        title={
          <span className="inline-flex flex-wrap items-center gap-2.5">
            <FindingTag n={3} tone="#d0bcff" /> Menyimpang di dua tingkat sekaligus jauh lebih
            berbahaya
          </span>
        }
        sub="Ada dua cara sebuah pinjaman bisa berisiko: sebagai anggota segmen, atau sebagai individu. Kami menguji pertemuannya."
      >
        <Block label="Buktinya" color="#d0bcff">
          Segmentasi Fase 2 membagi peminjam ke tiga kelompok alami. Deteksi anomali Fase 4 menandai
          individu yang menyimpang. Irisan keduanya:
          <MiniTable
            head={["Kelompok", "Jumlah", "Tingkat gagal bayar"]}
            rows={[
              ["Seluruh populasi", "1.348.099", "19,98%"],
              ["Segmen High-Risk (hasil segmentasi)", "347.489 (25,80%)", "33,37%"],
              [
                <b className="text-text">
                  Segmen High-Risk yang JUGA menyimpang secara individual
                </b>,
                <Hi>42.440 (3,20%)</Hi>,
                <Hi color="#ffb4ab">36,55%</Hi>,
              ],
            ]}
          />
          Perlu dicatat bahwa segmentasi ini dibentuk <b>tanpa pernah melihat status gagal bayar</b>.
          Algoritma hanya melihat ciri pengajuan. Bahwa ketiga segmen ternyata memiliki tingkat gagal
          bayar berjenjang rapi (11,65% → 19,19% → 33,37%) adalah konfirmasi independen bahwa
          segmentasinya menangkap sesuatu yang nyata, bukan pengelompokan acak.
        </Block>
        <Block label="Mengapa ini tidak terlihat dari data mentah" color="#7df4ff">
          Baik &ldquo;segmen&rdquo; maupun &ldquo;individu menyimpang&rdquo; tidak ada sebagai kolom
          di data asli. Keduanya harus dibentuk lebih dulu, dan barulah irisannya bisa ditanyakan.
        </Block>
        <Block label="Artinya untuk bisnis" color="#c3f400">
          Ini memberi tim risiko urutan prioritas yang jelas. Meninjau seluruh 347 ribu anggota
          segmen High-Risk tidak realistis. Meninjau <b>42 ribu</b> yang menyimpang di dua tingkat
          sekaligus jauh lebih mungkin, dan kelompok itu memang lebih berisiko.
        </Block>
      </Card>

      <div className="h-[18px]" />

      {/* Temuan 4 */}
      <Card
        title={
          <span className="inline-flex flex-wrap items-center gap-2.5">
            <FindingTag n={4} tone="#ffd479" /> Komposisi risiko bergeser diam-diam, dan angka tahun
            terakhir menipu
          </span>
        }
        sub="Pergeserannya bertahap, sehingga tidak terlihat dari satu potret tahun mana pun."
      >
        <Block label="Buktinya" color="#ffd479">
          <MiniTable
            head={["Periode", "Proporsi segmen High-Risk", "Gagal bayar keseluruhan"]}
            rows={[
              ["2009 (titik terendah)", "11,10%", "13,70–14,00%"],
              ["2013–2018", "24–29%", "—"],
              ["2016 (puncak)", "—", "23,29%"],
              ["2018", "—", "15,76%"],
            ]}
          />
          Proporsi peminjam berisiko tinggi <b>naik lebih dari dua kali lipat</b> dari titik
          terendahnya.
        </Block>
        <Block label="Peringatan penting tentang angka 2018" color="#ffb4ab">
          Penurunan tajam tingkat gagal bayar pada 2018 (dari 23,29% ke 15,76%){" "}
          <b>hampir pasti bukan perbaikan kualitas kredit</b>. Pinjaman yang diterbitkan pada 2018
          belum memiliki cukup waktu untuk gagal bayar saat data diambil. Ini disebut{" "}
          <i>right-censoring</i>. Membaca angka itu sebagai kabar baik adalah kesalahan interpretasi
          yang serius, dan kami menyebutkannya secara eksplisit justru karena angkanya terlihat
          meyakinkan.
        </Block>
        <Block label="Artinya untuk bisnis" color="#c3f400">
          Kebijakan penjaminan (<i>underwriting</i>) tidak boleh ditetapkan sekali di awal lalu
          dibiarkan. Satu hal yang menenangkan: urutan risiko antar segmen tetap konsisten{" "}
          <b>di setiap tahun tanpa kecuali</b>, sehingga kerangka segmentasinya sendiri tetap bisa
          diandalkan meski komposisinya berubah.
        </Block>
      </Card>

      <div className="h-[18px]" />

      {/* Temuan 5 */}
      <Card
        title={
          <span className="inline-flex flex-wrap items-center gap-2.5">
            <FindingTag n={5} tone="#571bc1" /> Pola paling mengesankan secara angka justru yang
            paling tidak bernilai
          </span>
        }
        sub="Temuan metodologis, dan sekaligus koreksi atas kesalahan kami sendiri."
      >
        <p className="text-[13.5px] leading-[1.6] text-muted">
          Versi pertama analisis aturan asosiasi kami menghasilkan pola yang tampak luar biasa:
        </p>
        <blockquote className="relative mt-3 overflow-hidden rounded-[16px] border border-violet/25 bg-violet/[0.07] py-3.5 pl-5 pr-4">
          <span className="absolute inset-y-0 left-0 w-[3px] bg-violet" aria-hidden="true" />
          <p className="text-[14px] italic leading-[1.55] text-text">
            &ldquo;Bunga sangat rendah (di bawah 8%) menandai pinjaman Grade A&rdquo; — muncul pada{" "}
            <b className="not-italic text-violet">99,90% kasus</b>,{" "}
            <b className="not-italic text-violet">5,7 kali</b> lebih sering dari kebetulan.
          </p>
        </blockquote>
        <p className="mt-3.5 text-[13.5px] leading-[1.6] text-muted">
          Angka nyaris sempurna. Kami sempat menjadikannya temuan utama.{" "}
          <b className="text-error">Itu keliru.</b> Lending Club menetapkan suku bunga{" "}
          <b className="text-text">berdasarkan</b> grade sebagai bagian dari kebijakan kreditnya.
          Bunga bukan atribut independen yang kebetulan berhubungan dengan grade; bunga adalah{" "}
          <b className="text-text">hasil perhitungan dari</b> grade. Menemukan bahwa keduanya selalu
          muncul bersama sama saja dengan &ldquo;menemukan&rdquo; bahwa harga di label sesuai dengan
          harga di kasir. Algoritma hanya memantulkan kembali aturan yang kami sendiri masukkan ke
          dalam data.
        </p>
        <Block label="Seberapa besar dampaknya" color="#571bc1">
          <MiniTable
            head={["", "Ambang awal (5%)", "Ambang final (3%)"]}
            rows={[
              ["Pola awal (sebelum pembersihan)", "928", "4.102"],
              [
                <>
                  Dibuang karena <b className="text-text">tautologi penetapan harga</b>
                </>,
                <Hi color="#ffb4ab">824 (88,80%)</Hi>,
                <Hi color="#ffb4ab">3.206 (78,20%)</Hi>,
              ],
              ["Dibuang karena relasi definisi grade / sub-grade", "88", "808"],
              ["Dibuang karena memakai informasi masa depan", "0", "1"],
              [
                <b className="text-text">Tersisa benar-benar non-trivial</b>,
                <Hi>16 (1,70%)</Hi>,
                <Hi>87 (2,10%)</Hi>,
              ],
              ["Setelah perapian pola bersarang", "5", <Hi>25</Hi>],
            ]}
          />
          Di kedua ambang, lebih dari <b>97% pola gugur</b> sebagai bukan-temuan. Kami memulai dengan
          ambang kemunculan 5%, tetapi di situ hanya tersisa 5 pola, di bawah syarat minimal 10 yang
          ditetapkan tugas. Karena ruang pola yang benar-benar non-trivial jauh lebih tipis daripada
          yang terlihat semula, ambang kemunculan diturunkan ke 3% (masih setara sekitar 40.000
          pinjaman per pola). Hanya satu dimensi yang dilonggarkan: ambang kekuatan tetap
          dipertahankan di 2 kali.
        </Block>
        <Block label="Konsekuensi yang mengubah kesimpulan, bukan sekadar mengurangi jumlah" color="#ffd479">
          Pada versi pertama, kategori pola &ldquo;berisiko&rdquo; kami <b>kosong sama sekali</b>, dan
          kami menyimpulkan bahwa risiko ekstrem tidak memiliki pola massal.{" "}
          <b>Kesimpulan itu salah.</b> Kategori tersebut kosong bukan karena polanya tidak ada,
          melainkan karena 824 pola tautologis berkekuatan jauh lebih tinggi (5,7×) menenggelamkan
          pola risiko yang sesungguhnya (2,0 sampai 2,7×) di bawah ambang penyaringan. Setelah
          tautologi dibuang, pola gagal bayar yang nyata, termasuk seluruh Temuan 1, baru muncul.
        </Block>
        <Block label="Artinya secara umum" color="#c3f400">
          Ukuran kekuatan statistik seperti <i>lift</i> tidak pernah cukup berdiri sendiri. Ia harus
          selalu dipasangkan dengan pemahaman tentang <b>bagaimana data itu terbentuk</b>. Tanpa itu,
          sebuah sistem bisa dengan sangat percaya diri melaporkan kebijakannya sendiri kembali
          kepada pembuatnya, dan menyebutnya penemuan.
        </Block>
      </Card>

      <div className="h-[18px]" />

      {/* 4 · Jawaban pertanyaan sentral */}
      <Card
        title={
          <span className="inline-flex items-center gap-2.5">
            <ChapterNo n={4} /> Jawaban Langsung atas Pertanyaan Sentral
          </span>
        }
        sub="Apa yang kami temukan yang tidak sudah terlihat dari data mentah?"
      >
        <blockquote className="relative overflow-hidden rounded-[18px] border border-lime/30 bg-[linear-gradient(110deg,rgba(195,244,0,0.14),rgba(19,19,24,0.5)_70%)] py-4 pl-6 pr-5">
          <span className="absolute inset-y-0 left-0 w-[3px] bg-lime" aria-hidden="true" />
          <p className="max-w-[64ch] font-display text-[16px] font-semibold leading-[1.5] text-text min-[640px]:text-[18px]">
            Kami menemukan bahwa risiko terkonsentrasi di tempat yang tidak dilihat orang: pada
            struktur kontrak, pada konteks, dan pada irisan.
          </p>
        </blockquote>
        <p className="mt-3.5 text-[13.5px] leading-[1.6] text-muted">
          Data mentah menunjukkan <b className="text-text">siapa</b> yang berisiko, yaitu peminjam
          berskor kredit rendah dan berbunga tinggi. Itu sudah diketahui. Yang tidak terlihat adalah{" "}
          <b className="text-text">di mana</b> risiko itu menumpuk:
        </p>
        <div className="mt-3.5 divide-y divide-line">
          <NumberedItem n={1} accent="#c3f400" title="Pada struktur kontrak">
            Tenor 60 bulan mempertemukan bunga tinggi, grade rendah, dan nominal besar, lalu
            pertemuan itu berujung gagal bayar 2,7 kali lebih sering dari ekspektasi. Tidak satu pun
            dari ketiga atribut itu tampak berbahaya bila dilihat sendiri-sendiri.
          </NumberedItem>
          <NumberedItem n={2} accent="#7df4ff" title="Pada konteks">
            5.274 pinjaman berbunga yang sepenuhnya wajar menurut ukuran populasi ternyata janggal
            untuk kelas skor kreditnya sendiri, dan gagal bayar 40,37 persen, dua kali lipat
            rata-rata. Mereka tidak akan pernah tertangkap oleh penyaringan kolom mana pun.
          </NumberedItem>
          <NumberedItem n={3} accent="#d0bcff" title="Pada irisan">
            42.440 pinjaman yang menyimpang sekaligus di tingkat segmen dan tingkat individu memiliki
            gagal bayar 36,55 persen, di atas rata-rata segmen berisiko itu sendiri.
          </NumberedItem>
        </div>
        <p className="mt-3.5 text-[13.5px] leading-[1.6] text-muted">
          Ketiganya punya satu kesamaan:{" "}
          <b className="text-text">tidak ada satu pun yang berupa kolom di data asli</b>. Struktur
          kontrak, konteks, dan irisan semuanya harus dibentuk lebih dulu sebelum bisa ditanyakan.
          Itulah tepatnya yang membedakan <i>penambangan</i> data dari <i>pelaporan</i> data.
        </p>
        <div className="mt-3.5 rounded-[14px] border border-violet/25 bg-violet/[0.07] px-4 py-3 text-[13.5px] leading-[1.6] text-muted">
          Sebagai catatan penutup yang sama pentingnya: kami juga menemukan{" "}
          <b className="text-text">apa yang bukan temuan</b>. Delapan puluh sembilan persen pola
          pertama kami hanyalah kebijakan platform yang membaca dirinya sendiri. Menyingkirkannya
          menurunkan angka-angka kami secara drastis, tetapi itulah yang membuat sisanya layak
          dipercaya.
        </div>
      </Card>

      <div className="h-[18px]" />

      {/* 5 · Rekomendasi */}
      <Card
        title={
          <span className="inline-flex items-center gap-2.5">
            <ChapterNo n={5} /> Rekomendasi
          </span>
        }
        sub="Tujuh langkah yang bisa dijalankan, masing-masing bersandar pada temuan tertentu."
      >
        <div className="divide-y divide-line">
          {REKOMENDASI.map((r, i) => (
            <NumberedItem
              key={r.title}
              n={i + 1}
              accent={r.accent}
              title={
                <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  {r.title}
                  <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.1em] text-muted">
                    {r.dasar}
                  </span>
                </span>
              }
            >
              {r.body}
            </NumberedItem>
          ))}
        </div>
      </Card>

      <div className="h-[18px]" />

      {/* 6 · Keterbatasan */}
      <Card
        title={
          <span className="inline-flex items-center gap-2.5">
            <ChapterNo n={6} /> Keterbatasan
          </span>
        }
        sub="Dicantumkan karena temuan yang batasannya tidak dinyatakan lebih berbahaya daripada temuan yang lebih sedikit."
      >
        <div className="divide-y divide-line">
          {KETERBATASAN.map((k, i) => (
            <NumberedItem key={k.title} n={i + 1} accent="#c4c9ac" title={k.title}>
              {k.body}
            </NumberedItem>
          ))}
        </div>
      </Card>

      <div className="h-[18px]" />

      {/* 7 · Lampiran angka kunci */}
      <Card
        title={
          <span className="inline-flex items-center gap-2.5">
            <ChapterNo n={7} /> Lampiran: Angka Kunci per Fase
          </span>
        }
        sub="Seluruh angka dapat ditelusuri ke notebook Fase 1 sampai Fase 4 di repositori proyek."
      >
        {/* Fase 1 */}
        <div className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan">
          Fase 1 · Preprocessing
        </div>
        <div className="grid grid-cols-2 gap-2.5 min-[720px]:grid-cols-4">
          <Tile value="2,26 jt × 151" label="Data awal diterima (baris × kolom)" accent="text-cyan" />
          <Tile value="27,60 jt × 9" label="Data awal ditolak (baris × kolom)" accent="text-violet" />
          <Tile value="1.348.099 × 14" label="Data akhir + 1 target" accent="text-lime" />
          <Tile value="80 : 20" label="Lunas dibanding gagal bayar" accent="text-amber" />
        </div>
        <p className="mt-3 text-[13px] leading-[1.6] text-muted">
          Kolom bocor (<i>leakage</i>) yang dibuang: skor kredit terkini dan seluruh arus kas
          pasca-pinjaman, karena baru tersedia setelah keputusan kredit diambil.
        </p>

        {/* Fase 2 */}
        <div className="mb-1.5 mt-6 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-lime">
          Fase 2 · Segmentasi
        </div>
        <p className="text-[13px] leading-[1.6] text-muted">
          Tiga segmen, dipilih berdasarkan validasi eksternal (kemampuan memisahkan gagal bayar
          nyata), bukan berdasarkan skor internal.
        </p>
        <MiniTable
          head={["Segmen", "Jumlah", "Porsi", "Gagal bayar"]}
          rows={[
            ["Prime / Low-Risk", "512.208", "38,00%", <Hi>11,65%</Hi>],
            ["Moderate-Risk", "488.402", "36,20%", <Hi color="#ffd479">19,19%</Hi>],
            ["High-Risk", "347.489", "25,80%", <Hi color="#ffb4ab">33,37%</Hi>],
          ]}
        />

        {/* Fase 3 */}
        <div className="mb-1.5 mt-6 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-violet">
          Fase 3 · Aturan Asosiasi (setelah koreksi tautologi)
        </div>
        <div className="grid grid-cols-1 gap-2.5 min-[720px]:grid-cols-3">
          <Tile value="3% / 2×" label="Ambang kemunculan (≈40.000 pinjaman) & kekuatan minimal" accent="text-violet" />
          <Tile value="25 pola" label="Non-trivial terdokumentasi, dikelompokkan ke tiga tema" accent="text-lime" />
          <Tile value="1,3–1,4×" label="Pola terkuat pada pinjaman ditolak, jauh lebih lemah" accent="text-cyan" />
        </div>
        <p className="mt-3 text-[13px] leading-[1.6] text-muted">
          Lemahnya pola pada sisi ditolak itu sendiri merupakan temuan: keputusan penolakan tampaknya
          tidak ditentukan oleh kombinasi sederhana dari atribut yang tersedia.
        </p>

        {/* Fase 4 */}
        <div className="mb-1.5 mt-6 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-amber">
          Fase 4 · Deteksi Anomali
        </div>
        <MiniTable
          head={["Tingkat keyakinan", "Jumlah"]}
          rows={[
            ["Lemah (1 metode)", "106.153"],
            ["Sedang (2 metode)", "48.025"],
            ["Kuat (3 metode)", "22.833"],
            ["Sangat Kuat (+ DBSCAN)", "15"],
            [<b className="text-text">Kritis (DBSCAN + 3 metode)</b>, <Hi color="#ffb4ab">44</Hi>],
          ]}
        />
        <p className="mt-3 text-[13px] leading-[1.6] text-muted">
          Tipologi: <b className="text-text">137.360</b> kasus langka yang sah ·{" "}
          <b className="text-text">39.361</b> sinyal risiko · <b className="text-text">349</b> dugaan
          kesalahan data. Seluruh 349 dugaan kesalahan data{" "}
          <b className="text-text">diverifikasi ulang</b> terhadap nilai aslinya, dan ternyata bukan
          kesalahan input melainkan perilaku pembukaan banyak akun kredit yang nyata dan berisiko.
        </p>
      </Card>
    </>
  );
}
