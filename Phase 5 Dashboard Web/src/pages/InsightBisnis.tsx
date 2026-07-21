import { useMemo } from "react";
import type { ReactNode } from "react";
import type { DashboardData } from "../types";
import PageHead from "../components/PageHead";
import Card from "../components/Card";
import Callout from "../components/Callout";

/* ============================================================================
   Insight Bisnis (Fase 1-4). Menyintesis temuan tiap fase jadi bahasa bisnis
   yang mudah dipahami, memakai angka NYATA dari data dashboard. Gaya penulisan
   sengaja tanpa tanda pisah panjang agar ramah untuk semua pembaca.
   ========================================================================== */

// -- helper presentasional -------------------------------------------------

function idNum(n: number): string {
  return n.toLocaleString("id-ID");
}
function idPct(x: number, dp = 1): string {
  return x.toFixed(dp).replace(".", ",") + "%";
}

function Tile({ value, label, accent = "text-text" }: { value: string; label: string; accent?: string }) {
  return (
    <div className="rounded-[14px] border border-line bg-glass2 px-3.5 py-3">
      <div className={`font-display text-[21px] font-semibold leading-none ${accent}`}>{value}</div>
      <div className="mt-1.5 text-[12px] leading-[1.35] text-muted">{label}</div>
    </div>
  );
}

function PhaseTag({ children, color }: { children: ReactNode; color: string }) {
  return (
    <span
      className="rounded-full border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em]"
      style={{ borderColor: color + "55", color }}
    >
      {children}
    </span>
  );
}

/** Blok "Artinya untuk bisnis" di dalam kartu insight. */
function Meaning({ children }: { children: ReactNode }) {
  return (
    <div className="mt-3.5 rounded-[14px] border border-lime/25 bg-lime/[0.05] px-4 py-3">
      <div className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-lime">
        Artinya untuk bisnis
      </div>
      <p className="text-[13.5px] leading-[1.6] text-text">{children}</p>
    </div>
  );
}

/** Kartu rekomendasi (CTA) bernomor. */
function ActionCard({
  n,
  title,
  body,
  accent,
}: {
  n: number;
  title: string;
  body: ReactNode;
  accent: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[18px] border border-line bg-glass px-5 py-4">
      <div className="absolute inset-y-0 left-0 w-[3px]" style={{ background: accent }} />
      <div className="flex items-center gap-2.5">
        <span
          className="inline-grid h-6 w-6 flex-none place-items-center rounded-full font-mono text-[12px] font-bold text-ink"
          style={{ background: accent }}
        >
          {n}
        </span>
        <div className="font-display text-[15px] font-semibold text-text">{title}</div>
      </div>
      <p className="mt-2.5 text-[13px] leading-[1.6] text-muted">{body}</p>
    </div>
  );
}

// -- halaman ---------------------------------------------------------------

const SEGMENT_META = [
  { note: "Peminjam paling aman: skor kredit tinggi dan bunga rendah.", accent: "text-lime", dot: "#c3f400" },
  { note: "Risiko menengah: perlu pemantauan wajar.", accent: "text-amber", dot: "#ffd479" },
  { note: "Risiko tertinggi: bunga tinggi dan skor kredit rendah.", accent: "text-error", dot: "#ffb4ab" },
];

export default function InsightBisnis({ data }: { data: DashboardData }) {
  const kpi = data.summary.kpi;

  // Segmen (Fase 2), diurut dari risiko terendah ke tertinggi.
  const segments = useMemo(
    () => [...data.clusters].sort((a, b) => a.default_rate - b.default_rate),
    [data.clusters]
  );
  const totalBorrowers = useMemo(
    () => segments.reduce((s, c) => s + c.n_anggota, 0),
    [segments]
  );

  // Verdict anomali (Fase 4), total per jenis.
  const verdicts = useMemo(() => {
    const agg = new Map<string, number>();
    for (const v of data.verdicts) agg.set(v.auto_verdict, (agg.get(v.auto_verdict) ?? 0) + v.count);
    return agg;
  }, [data.verdicts]);

  // Total anomali bukti-kuat pada dataset ditolak (Fase 4).
  const rejectedFlagged = useMemo(
    () => data.tiers.filter((t) => t.dataset === "rejected").reduce((s, t) => s + t.count, 0),
    [data.tiers]
  );
  // Jumlah pola aturan per dataset (Fase 3).
  const rulesAcc = useMemo(() => data.rules.filter((r) => r.dataset === "Accepted").length, [data.rules]);
  const rulesRej = useMemo(() => data.rules.filter((r) => r.dataset === "Rejected").length, [data.rules]);

  const vLangka = verdicts.get("Kasus Langka (Sah)") ?? 0;
  const vRisiko = verdicts.get("Sinyal Risiko") ?? 0;
  const vError = verdicts.get("Kesalahan Data") ?? 0;
  const totalAnomali = kpi.total_anomali_acc || vLangka + vRisiko + vError;

  const prime = segments[0];
  const highest = segments[segments.length - 1];
  const riskGap = prime && highest ? highest.default_rate / prime.default_rate : 0;
  const anomaliPct = totalBorrowers ? (totalAnomali / totalBorrowers) * 100 : 0;

  return (
    <>
      <PageHead
        eyebrow="Insight Bisnis · Rangkuman Fase 1-4"
        title="Apa Artinya Semua Ini untuk Bisnis?"
        sub={
          <>
            Halaman ini merangkum temuan dari seluruh proses, mulai penyiapan data sampai deteksi
            anomali, ke dalam bahasa yang mudah dipahami siapa saja. Intinya: siapa yang aman,
            siapa yang berisiko, dan di mana bank perlu bertindak.
          </>
        }
        pills={[
          { label: "Pinjaman diterima", value: idNum(totalBorrowers) },
          { label: "Sumber data", value: "2 dataset", kind: "accent" },
        ]}
      />

      <Callout eyebrow="Ringkasan eksekutif">
        Rangkuman ini menggabungkan dua sisi cerita: pinjaman yang <b>diterima</b> dan pengajuan yang{" "}
        <b>ditolak</b>. Dari <b>{idNum(totalBorrowers)}</b> pinjaman diterima, analisis memisahkan
        peminjam ke <b>{segments.length} tingkat risiko</b>, menemukan <b>{kpi.n_rules} pola</b>{" "}
        keputusan kredit (mencakup pola penerimaan maupun penolakan), lalu menandai kasus tidak biasa
        di <b>kedua dataset</b> untuk ditinjau. Semuanya bermuara pada satu tujuan: keputusan kredit
        yang lebih tajam, adil, dan cepat.
      </Callout>

      {/* FASE 1 */}
      <Card
        title={
          <span className="inline-flex items-center gap-2.5">
            <PhaseTag color="#7df4ff">Fase 1</PhaseTag> Data yang Bisa Dipercaya
          </span>
        }
        sub="Fondasi: sebelum ada kesimpulan, datanya dibereskan lebih dulu."
      >
        <p className="text-[13.5px] leading-[1.6] text-muted">
          Kedua dataset dibereskan lebih dulu. Pinjaman <b className="text-text">diterima</b> melewati
          pipeline penuh: pembersihan, pembuangan kolom yang &ldquo;membocorkan masa depan&rdquo;
          (informasi yang baru ada setelah pinjaman berjalan), lalu pemilihan 14 fitur inti. Pengajuan{" "}
          <b className="text-text">ditolak</b> dirapikan dengan pipeline lebih sederhana menjadi 8 kolom,
          karena tidak memiliki label hasil pinjaman.
        </p>
        <div className="mt-3.5 grid grid-cols-2 gap-2.5 min-[560px]:grid-cols-4">
          <Tile value={idNum(totalBorrowers)} label="Pinjaman diterima, siap dianalisis" accent="text-cyan" />
          <Tile value="8 kolom" label="Pengajuan ditolak, siap dianalisis" accent="text-violet" />
          <Tile value="80 : 20" label="Lunas dibanding gagal bayar (diterima)" accent="text-amber" />
          <Tile value="0 bocor" label="Tanpa informasi masa depan" accent="text-lime" />
        </div>
        <Meaning>
          Angka-angka yang muncul di seluruh dashboard sah dipakai pada saat pengajuan kredit, bukan
          hasil &ldquo;mengintip&rdquo; masa depan. Jadi setiap keputusan yang diambil dari sini bisa
          dipertanggungjawabkan.
        </Meaning>
      </Card>

      <div className="h-[18px]" />

      {/* FASE 2 */}
      <Card
        title={
          <span className="inline-flex items-center gap-2.5">
            <PhaseTag color="#c3f400">Fase 2</PhaseTag> Tiga Segmen Peminjam
          </span>
        }
        sub="Peminjam dikelompokkan berdasarkan tingkat risiko gagal bayar."
      >
        <div className="grid grid-cols-1 gap-2.5 min-[720px]:grid-cols-3">
          {segments.map((s, i) => {
            const meta = SEGMENT_META[i] ?? SEGMENT_META[SEGMENT_META.length - 1];
            const share = totalBorrowers ? (s.n_anggota / totalBorrowers) * 100 : 0;
            return (
              <div key={s.cluster} className="rounded-[16px] border border-line bg-glass2 px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: meta.dot }} />
                  <span className="font-display text-[15px] font-semibold text-text">{s.nama_profil}</span>
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <div className={`font-display text-[26px] font-bold leading-none ${meta.accent}`}>
                      {idPct(s.default_rate * 100)}
                    </div>
                    <div className="mt-1 text-[11px] text-muted">tingkat gagal bayar</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[15px] font-semibold text-text">{idNum(s.n_anggota)}</div>
                    <div className="text-[11px] text-muted">{idPct(share, 0)} peminjam</div>
                  </div>
                </div>
                <p className="mt-3 text-[12.5px] leading-[1.5] text-muted">{meta.note}</p>
              </div>
            );
          })}
        </div>
        <Meaning>
          Risiko kelompok tertinggi kira-kira <b>{riskGap.toFixed(1)} kali lipat</b> kelompok paling
          aman ({idPct(highest.default_rate * 100)} berbanding {idPct(prime.default_rate * 100)}). Bank
          bisa menyesuaikan bunga, limit, dan penawaran per segmen, bukan memperlakukan semua peminjam
          dengan aturan yang sama.
        </Meaning>
        <p className="mt-3 text-[12.5px] leading-[1.55] text-muted">
          Catatan: segmentasi risiko ini berlaku untuk pinjaman <b className="text-text">diterima</b>,
          karena hanya di sana tersedia hasil akhir (lunas atau gagal bayar). Sisi{" "}
          <b className="text-text">ditolak</b> tetap tercakup di dashboard, yaitu lewat pola penolakan
          (Fase 3) dan deteksi anomali (Fase 4) di bawah.
        </p>
      </Card>

      <div className="h-[18px]" />

      {/* FASE 3 */}
      <Card
        title={
          <span className="inline-flex items-center gap-2.5">
            <PhaseTag color="#d0bcff">Fase 3</PhaseTag> Pola di Balik Keputusan Kredit
          </span>
        }
        sub="Aturan asosiasi memperlihatkan kombinasi ciri yang sering muncul bersama."
      >
        <div className="grid grid-cols-1 gap-2.5 min-[720px]:grid-cols-2">
          <div className="rounded-[16px] border border-line bg-glass2 px-4 py-3.5">
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-lime">
              Pinjaman diterima
            </div>
            <p className="mt-2 text-[13.5px] leading-[1.6] text-text">
              Peminjam <b>Grade A</b> dengan pinjaman menengah dan tenor 36 bulan hampir selalu
              mendapat bunga sangat rendah dan berakhir lunas (keyakinan 84 persen, {kpi.max_lift.toFixed(1)} kali
              lebih sering dari kebetulan).
            </p>
          </div>
          <div className="rounded-[16px] border border-line bg-glass2 px-4 py-3.5">
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-violet">
              Pengajuan ditolak
            </div>
            <p className="mt-2 text-[13.5px] leading-[1.6] text-text">
              Penolakan berkumpul pada rasio utang sangat tinggi (di atas 40 persen), sering digabung
              masa kerja yang masih baru (di bawah 1 tahun) dan permintaan pinjaman berukuran besar.
            </p>
          </div>
        </div>
        <div className="mt-2.5 grid grid-cols-3 gap-2.5">
          <Tile value={idNum(rulesAcc)} label="Pola pada pinjaman diterima" accent="text-lime" />
          <Tile value={idNum(rulesRej)} label="Pola pada pengajuan ditolak" accent="text-violet" />
          <Tile value={`${kpi.max_lift.toFixed(1)}x`} label="Kekuatan pola terkuat (lift)" accent="text-cyan" />
        </div>
        <Meaning>
          Sistem penilaian grade dan penetapan bunga sudah selaras dengan hasil nyata: peminjam
          berkualitas baik memang cenderung lunas. Sementara itu, kombinasi utang tinggi, masa kerja
          pendek, dan pinjaman besar dapat dijadikan kriteria peninjauan yang eksplisit dan konsisten.
        </Meaning>
      </Card>

      <div className="h-[18px]" />

      {/* FASE 4 */}
      <Card
        title={
          <span className="inline-flex items-center gap-2.5">
            <PhaseTag color="#ffd479">Fase 4</PhaseTag> Sistem Peringatan Dini
          </span>
        }
        sub="Deteksi anomali menyaring kasus tidak biasa dan memilahnya menurut tindakan."
      >
        <p className="text-[13.5px] leading-[1.6] text-muted">
          Deteksi anomali dijalankan pada <b className="text-text">kedua dataset</b>. Tujuannya menyaring
          kasus tidak biasa lebih dulu, agar tim tidak perlu memeriksa jutaan pinjaman satu per satu.
        </p>
        <div className="mt-3.5 grid grid-cols-1 gap-2.5 min-[720px]:grid-cols-2">
          <div className="rounded-[16px] border border-line bg-glass2 px-4 py-3.5">
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-lime">
              Pinjaman diterima
            </div>
            <div className="mt-2 flex items-end justify-between">
              <div>
                <div className="font-display text-[26px] font-bold leading-none text-cyan">
                  {idNum(totalAnomali)}
                </div>
                <div className="mt-1 text-[11px] text-muted">kasus tidak biasa (~{idPct(anomaliPct, 0)})</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-[15px] font-semibold text-error">{idNum(kpi.kritis_acc)}</div>
                <div className="text-[11px] text-muted">kasus kritis</div>
              </div>
            </div>
          </div>
          <div className="rounded-[16px] border border-line bg-glass2 px-4 py-3.5">
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-violet">
              Pengajuan ditolak
            </div>
            <div className="mt-2 flex items-end justify-between">
              <div>
                <div className="font-display text-[26px] font-bold leading-none text-violet">
                  {idNum(rejectedFlagged)}
                </div>
                <div className="mt-1 text-[11px] text-muted">anomali bukti kuat</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-[15px] font-semibold text-error">{idNum(kpi.kritis_rej)}</div>
                <div className="text-[11px] text-muted">kasus kritis</div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-3.5 mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          Rincian jenis pada pinjaman diterima
        </div>
        <div className="grid grid-cols-1 gap-2.5 min-[560px]:grid-cols-3">
          <Tile value={idNum(vLangka)} label="Kasus Langka tetapi sah (tanpa tindakan)" accent="text-cyan" />
          <Tile value={idNum(vRisiko)} label="Sinyal Risiko (eskalasi ke tim risiko)" accent="text-amber" />
          <Tile value={idNum(vError)} label="Kesalahan Data (perlu diverifikasi)" accent="text-error" />
        </div>
        <Meaning>
          Alih-alih memeriksa semua pinjaman satu per satu, tim cukup fokus pada yang benar-benar
          penting: {idNum(kpi.kritis_acc)} kasus kritis pada pinjaman diterima dan {idNum(kpi.kritis_rej)}{" "}
          pada pengajuan ditolak, ditambah {idNum(vRisiko)} sinyal risiko. Sementara itu {idNum(vError)}{" "}
          kasus kesalahan data menandai titik yang perlu dibenahi pada mutu input.
        </Meaning>
      </Card>

      <div className="h-[18px]" />

      {/* CTA */}
      <Card
        title="Rekomendasi untuk Bank dan Pemberi Pinjaman"
        sub="Empat langkah nyata yang bisa langsung dijalankan dari temuan di atas."
      >
        <div className="grid grid-cols-1 gap-3 min-[820px]:grid-cols-2">
          <ActionCard
            n={1}
            accent="#c3f400"
            title="Rawat segmen paling aman"
            body={
              <>
                Segmen Prime mencakup {idPct((prime.n_anggota / totalBorrowers) * 100, 0)} peminjam
                dengan risiko terendah. Tawarkan limit lebih tinggi atau bunga kompetitif agar mereka
                tetap loyal dan tidak pindah ke pesaing.
              </>
            }
          />
          <ActionCard
            n={2}
            accent="#ffb4ab"
            title="Sesuaikan harga, jangan menolak semua"
            body={
              <>
                Segmen risiko tertinggi memiliki gagal bayar {idPct(highest.default_rate * 100)}. Naikkan
                bunga sesuai risiko atau perketat limit, sehingga kelompok ini tetap bisa dilayani tanpa
                merugikan bank.
              </>
            }
          />
          <ActionCard
            n={3}
            accent="#d0bcff"
            title="Bakukan kriteria penolakan"
            body={
              <>
                Jadikan kombinasi rasio utang di atas 40 persen, masa kerja di bawah 1 tahun, dan
                permintaan pinjaman besar sebagai kriteria tinjau atau tolak otomatis, agar keputusan
                konsisten dan transparan.
              </>
            }
          />
          <ActionCard
            n={4}
            accent="#ffd479"
            title="Jalankan peringatan dini"
            body={
              <>
                Prioritaskan {idNum(kpi.kritis_acc)} kasus kritis dan {idNum(vRisiko)} sinyal risiko
                untuk ditinjau tim, lalu audit {idNum(vError)} kesalahan data untuk menjaga mutu input
                di masa depan.
              </>
            }
          />
        </div>

        <div className="mt-4 overflow-hidden rounded-[18px] border border-lime/30 bg-[linear-gradient(110deg,rgba(195,244,0,0.14),rgba(19,19,24,0.5)_70%)] px-5 py-5">
          <div className="font-display text-[17px] font-semibold text-text min-[640px]:text-[19px]">
            Ubah data menjadi keputusan.
          </div>
          <p className="mt-1.5 max-w-[70ch] text-[13.5px] leading-[1.6] text-muted">
            Gunakan segmen risiko, pola keputusan, dan peringatan dini di atas sebagai dasar kebijakan
            kredit yang lebih tajam, adil, dan cepat. Mulai dari satu segmen atau satu aturan, ukur
            dampaknya, lalu perluas.
          </p>
          <div className="mt-3.5 inline-flex items-center gap-2 rounded-full bg-lime px-4 py-2 font-mono text-[12px] font-bold text-ink">
            Terapkan pada kebijakan kredit →
          </div>
        </div>
      </Card>
    </>
  );
}
