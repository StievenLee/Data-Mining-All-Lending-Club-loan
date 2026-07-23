import { useMemo } from "react";
import type { ReactNode } from "react";
import type { DashboardData } from "../types";
import { useDashboard } from "../store/useDashboard";
import PageHead from "../components/PageHead";
import Card from "../components/Card";
import Callout from "../components/Callout";
import YearRangeSlider from "../components/filters/YearRangeSlider";
import { fmt2 } from "../lib/format";
import { clusterProfilesForYears, strongPct, tierCounts, verdictCounts } from "../data/filters";

/* ============================================================================
   Insight Bisnis — versi HIDUP dari temuan. Berbeda dari tab "Laporan KDD"
   (dokumen tetap yang ditandatangani pada satu titik waktu), di sini setiap
   angka BERGERAK mengikuti rentang tahun: gunanya untuk menjelajah "bagaimana
   cerita bisnis berubah antar-periode", lalu bertindak. Metodologi lengkap,
   lima temuan utuh, dan keterbatasan sengaja TIDAK diulang di sini — semua itu
   milik tab Laporan KDD. Halaman ini fokus: angka per tahun + tindakan.
   ========================================================================== */

// -- helper presentasional -------------------------------------------------

function idNum(n: number): string {
  return n.toLocaleString("id-ID");
}
function idPct(x: number, _dp?: number): string {
  return fmt2(x) + "%";
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
  const years = useDashboard((s) => s.years) ?? data.summary.year_bounds!;

  // Segmen (Fase 2) untuk rentang tahun terpilih, diurut risiko terendah -> tertinggi.
  // Halaman bercerita dengan tingkat gagal bayar, yang hanya dimiliki accepted.
  const segments = useMemo(
    () =>
      clusterProfilesForYears(data.clustersByYear, years, "accepted")
        .map((c) => ({ ...c, default_rate: c.default_rate ?? 0 }))
        .sort((a, b) => a.default_rate - b.default_rate),
    [data.clustersByYear, years]
  );
  const totalBorrowers = useMemo(
    () => segments.reduce((s, c) => s + c.n_anggota, 0),
    [segments]
  );

  // Anomali (Fase 4) untuk rentang tahun terpilih.
  const verdicts = useMemo(() => {
    const agg = new Map<string, number>();
    for (const v of verdictCounts(data.verdicts, years)) agg.set(v.verdict, v.count);
    return agg;
  }, [data.verdicts, years]);
  const kritisAcc = useMemo(
    () => strongPct(tierCounts(data.tiers, "accepted", years)).kritis,
    [data.tiers, years]
  );
  const kritisRej = useMemo(
    () => strongPct(tierCounts(data.tiers, "rejected", years)).kritis,
    [data.tiers, years]
  );
  const rejectedFlagged = useMemo(
    () => tierCounts(data.tiers, "rejected", years).reduce((s, t) => s + t.count, 0),
    [data.tiers, years]
  );

  // Pola aturan (Fase 3) TIDAK berlabel tahun -> tetap keseluruhan, ditandai jelas.
  const rulesAcc = useMemo(() => data.rules.filter((r) => r.dataset === "Accepted").length, [data.rules]);
  const rulesRej = useMemo(() => data.rules.filter((r) => r.dataset === "Rejected").length, [data.rules]);

  const vLangka = verdicts.get("Kasus Langka (Sah)") ?? 0;
  const vRisiko = verdicts.get("Sinyal Risiko") ?? 0;
  const vError = verdicts.get("Kesalahan Data") ?? 0;
  const totalAnomali = vLangka + vRisiko + vError;

  const prime = segments[0];
  const highest = segments[segments.length - 1];
  const riskGap = prime && highest && prime.default_rate ? highest.default_rate / prime.default_rate : 0;
  const anomaliPct = totalBorrowers ? (totalAnomali / totalBorrowers) * 100 : 0;

  return (
    <>
      <PageHead
        eyebrow="Insight Bisnis · Interaktif per Tahun"
        title="Apa Artinya untuk Bisnis?"
        sub={
          <>
            Versi <b>hidup</b> dari temuan: setiap angka di bawah bergerak mengikuti rentang
            tahun yang dipilih, supaya bisa dilihat bagaimana cerita bisnis berubah antar-periode.
            Untuk laporan lengkap yang <b>tetap</b> (lima temuan utuh, metodologi, dan
            keterbatasan), buka tab Laporan KDD.
          </>
        }
        pills={[
          { label: "Rentang", value: years[0] === years[1] ? String(years[0]) : `${years[0]}–${years[1]}` },
          { label: "Pinjaman diterima", value: idNum(totalBorrowers), kind: "accent" },
          { label: "Anomali kritis", value: idNum(kritisAcc), kind: "ai" },
        ]}
      />

      <Callout eyebrow="Cara membaca halaman ini">
        Geser rentang tahun di bawah, lalu perhatikan tiga hal yang ikut berubah: <b>komposisi
        segmen risiko</b>, <b>berapa kasus perlu ditinjau</b>, dan <b>seberapa lebar jurang</b>{" "}
        antara peminjam paling aman dan paling berisiko. Tiap bagian diakhiri langkah yang bisa
        langsung dijalankan bank.
      </Callout>

      <YearRangeSlider
        bounds={data.summary.year_bounds!}
        recordCount={totalBorrowers}
        recordUnit="pinjaman diterima"
      />

      {/* FASE 2 — segmen risiko (reaktif tahun) */}
      <Card
        title={
          <span className="inline-flex items-center gap-2.5">
            <PhaseTag color="#c3f400">Fase 2</PhaseTag> Tiga Segmen Peminjam
          </span>
        }
        sub={`Komposisi & tingkat gagal bayar untuk ${
          years[0] === years[1] ? years[0] : `${years[0]}–${years[1]}`
        }.`}
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
        {prime && highest && (
          <Meaning>
            Pada rentang ini, risiko kelompok tertinggi kira-kira <b>{fmt2(riskGap)} kali lipat</b>{" "}
            kelompok paling aman ({idPct(highest.default_rate * 100)} berbanding{" "}
            {idPct(prime.default_rate * 100)}). Makin lebar jurangnya, makin besar peluang bank
            menyesuaikan bunga dan limit per segmen alih-alih menyamaratakan semua peminjam.
          </Meaning>
        )}
      </Card>

      <div className="h-[18px]" />

      {/* FASE 4 — sistem peringatan dini (reaktif tahun) */}
      <Card
        title={
          <span className="inline-flex items-center gap-2.5">
            <PhaseTag color="#ffd479">Fase 4</PhaseTag> Berapa yang Perlu Ditinjau
          </span>
        }
        sub={`Kasus tidak biasa yang tersaring pada ${
          years[0] === years[1] ? years[0] : `${years[0]}–${years[1]}`
        }, dipilah menurut tindakan.`}
      >
        <div className="grid grid-cols-1 gap-2.5 min-[720px]:grid-cols-2">
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
                <div className="font-mono text-[15px] font-semibold text-error">{idNum(kritisAcc)}</div>
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
                <div className="font-mono text-[15px] font-semibold text-error">{idNum(kritisRej)}</div>
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
          Alih-alih memeriksa semua pinjaman satu per satu, tim cukup fokus pada yang penting:{" "}
          {idNum(kritisAcc)} kasus kritis (diterima) dan {idNum(kritisRej)} (ditolak), ditambah{" "}
          {idNum(vRisiko)} sinyal risiko. Sementara {idNum(vError)} dugaan kesalahan data menandai
          titik yang perlu dibenahi pada mutu input.
        </Meaning>
      </Card>

      <div className="h-[18px]" />

      {/* FASE 3 — pola keputusan (keseluruhan, tak difilter tahun) */}
      <Card
        title={
          <span className="inline-flex items-center gap-2.5">
            <PhaseTag color="#d0bcff">Fase 3</PhaseTag> Pola di Balik Keputusan Kredit
          </span>
        }
        note="keseluruhan periode"
        sub="Pola aturan asosiasi dihitung atas seluruh periode (bukan per tahun), jadi angka di sini tetap saat slider digeser."
      >
        <div className="grid grid-cols-3 gap-2.5">
          <Tile value={idNum(rulesAcc)} label="Pola pada pinjaman diterima" accent="text-lime" />
          <Tile value={idNum(rulesRej)} label="Pola pada pengajuan ditolak" accent="text-violet" />
          <Tile value={`${fmt2(data.summary.kpi.max_lift)}x`} label="Kekuatan pola terkuat (lift)" accent="text-cyan" />
        </div>
        <Meaning>
          Sinyal gagal bayar terkuat melekat pada <b>struktur kontrak</b>, bukan ciri peminjam:
          tenor 60 bulan menarik bunga tinggi, grade rendah, dan nominal besar sekaligus. Tenor dan
          plafon justru dikendalikan sendiri oleh pemberi pinjaman, jadi bisa langsung diatur.
        </Meaning>
      </Card>

      <div className="h-[18px]" />

      {/* CTA */}
      <Card
        title="Rekomendasi untuk Bank dan Pemberi Pinjaman"
        sub="Empat langkah nyata yang bisa langsung dijalankan dari angka di atas."
      >
        <div className="grid grid-cols-1 gap-3 min-[820px]:grid-cols-2">
          <ActionCard
            n={1}
            accent="#c3f400"
            title="Rawat segmen paling aman"
            body={
              prime ? (
                <>
                  Segmen {prime.nama_profil} mencakup {idPct((prime.n_anggota / totalBorrowers) * 100, 0)}{" "}
                  peminjam dengan risiko terendah. Tawarkan limit lebih tinggi atau bunga kompetitif
                  agar mereka tetap loyal dan tidak pindah ke pesaing.
                </>
              ) : (
                "Pilih rentang tahun yang memuat data untuk melihat segmen."
              )
            }
          />
          <ActionCard
            n={2}
            accent="#ffb4ab"
            title="Sesuaikan harga, jangan menolak semua"
            body={
              highest ? (
                <>
                  Segmen risiko tertinggi memiliki gagal bayar {idPct(highest.default_rate * 100)}.
                  Naikkan bunga sesuai risiko atau perketat limit, sehingga kelompok ini tetap bisa
                  dilayani tanpa merugikan bank.
                </>
              ) : (
                "Pilih rentang tahun yang memuat data untuk melihat segmen."
              )
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
                Prioritaskan {idNum(kritisAcc)} kasus kritis dan {idNum(vRisiko)} sinyal risiko untuk
                ditinjau tim, lalu audit {idNum(vError)} kesalahan data untuk menjaga mutu input di
                masa depan.
              </>
            }
          />
        </div>

        <p className="mt-4 text-[12.5px] leading-[1.6] text-muted">
          Catatan: angka di halaman ini adalah potret untuk rentang tahun yang sedang dipilih dan
          ikut berubah saat slider digeser. Versi final yang tetap — lengkap dengan lima temuan,
          jawaban pertanyaan sentral, batasan, dan lampiran — ada di tab <b className="text-text">Laporan KDD</b>.
        </p>
      </Card>
    </>
  );
}
