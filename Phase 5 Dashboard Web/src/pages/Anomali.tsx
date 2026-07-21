import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { DashboardData } from "../types";
import { useDashboard } from "../store/useDashboard";
import { filterSampleRows, totalRecords } from "../data/filters";
import { anomalyScatterOption } from "../components/charts/options";
import { COLORS } from "../theme/colors";
import EChart from "../components/EChart";
import Card from "../components/Card";
import PageHead from "../components/PageHead";
import YearRangeSlider from "../components/filters/YearRangeSlider";
import AnomalyGlossary from "../components/AnomalyGlossary";

type CaseCard = {
  tag: string;
  title: string;
  color: string;
  body: ReactNode;
  action: { label: string; text: string };
};

const CASES: CaseCard[] = [
  {
    tag: "Kasus 1 · idx 526595",
    title: "Sinyal Risiko",
    color: COLORS.error,
    body: (
      <>
        Membuka banyak akun kredit baru (<b>num_tl_op z +5,50</b>) + FICO rendah + bunga
        tinggi. Ini profil credit-hungry.
      </>
    ),
    action: {
      label: "Eskalasi",
      text: "Teruskan ke tim risiko dan tahan pencairan sampai ditinjau manual. Pola loan-stacking seperti ini paling sering berakhir gagal bayar.",
    },
  },
  {
    tag: "Kasus 2 · idx 1067675",
    title: "Kasus Langka (Sah)",
    color: COLORS.cyan,
    body: (
      <>
        Skor kredit sangat baik (<b>FICO z +2,80</b>) + cicilan besar, bunga normal. Ini
        nasabah premium yang aman.
      </>
    ),
    action: {
      label: "Tanpa tindakan",
      text: "Lolos tinjauan dan catat sebagai whitelist, supaya profil serupa tidak berulang kali memicu alert dan membuang waktu tim.",
    },
  },
  {
    tag: "Kasus 3 · idx 536084",
    title: "Kesalahan Data",
    color: COLORS.amber,
    body: (
      <>
        Nilai mustahil (<b>num_tl_op z +9,90</b>). Kemungkinan kesalahan input, bukan
        perilaku nasabah.
      </>
    ),
    action: {
      label: "Verifikasi",
      text: "Cek ulang ke sumber data dan perbaiki validasi input di hulu, agar nilai mustahil tidak lagi masuk ke model.",
    },
  },
];

/** CTA generik untuk dataset rejected — auto-verdict hanya dihitung di Accepted. */
const REJECTED_ACTION = {
  label: "Audit sampel",
  text: "Tipologi bisnis tidak tersedia di sini, jadi pakai tier sebagai prioritas: ambil sampel dari tier Kritis dan Sangat Kuat, lalu telusuri keputusan penolakannya untuk mendeteksi potensi salah tolak (nasabah layak yang ikut tersaring).",
};

/** Kotak rekomendasi tindakan — pola sama dengan CTA pada RuleCard (tab Rules). */
function ActionBox({ color, label, text }: { color: string; label: string; text: string }) {
  return (
    // mt-auto: CTA rata bawah walau panjang deskripsi tiap kartu berbeda
    <div
      className="mt-auto rounded-[14px] border px-4 py-3"
      style={{ borderColor: color + "44", background: color + "12" }}
    >
      <div
        className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em]"
        style={{ color }}
      >
        Rekomendasi untuk bank · {label}
      </div>
      <p className="text-[13px] leading-[1.6] text-text">{text}</p>
    </div>
  );
}

export default function Anomali({ data }: { data: DashboardData }) {
  const dataset = useDashboard((s) => s.dataset);
  const years = useDashboard((s) => s.years) ?? data.summary.year_bounds!;
  const sample = data.samples[dataset];
  const feats = data.summary.features[dataset];

  const [xKey, setXKey] = useState(feats[0]);
  const [yKey, setYKey] = useState(feats[1] ?? feats[0]);
  // pastikan sumbu valid saat ganti dataset
  const safeX = feats.includes(xKey) ? xKey : feats[0];
  const safeY = feats.includes(yKey) ? yKey : feats[1] ?? feats[0];

  const rows = useMemo(() => filterSampleRows(sample, years), [sample, years]);
  const option = useMemo(
    () => anomalyScatterOption(sample, rows, safeX, safeY, data.summary.tier_order),
    [sample, rows, safeX, safeY, data.summary.tier_order]
  );
  const total = totalRecords(data.tiers, dataset, years);

  const selCls =
    "cursor-pointer rounded-lg border border-line bg-bg-deep px-2.5 py-1.5 font-mono text-xs text-text";

  return (
    <>
      <PageHead
        eyebrow="Fase 4 Isolation Forest + DBSCAN"
        title="Peta Anomali"
        sub={
          <>
            Sample <b>{rows.length.toLocaleString("id-ID")}</b> titik dari{" "}
            {total.toLocaleString("id-ID")} record {dataset}. Warna = iso_score. Titik
            lime besar = tier tinggi; lingkaran cyan = noise DBSCAN (Fase 2); belah
            ketupat amber = anomali kontekstual; kotak violet = anomali kolektif. Klik
            legenda untuk toggle jenis.
          </>
        }
        pills={[
          { label: "Titik tampil", value: rows.length.toLocaleString("id-ID") },
          { label: "Dataset", value: dataset, kind: "ai" },
        ]}
      />
      <div className="flex flex-wrap items-center justify-end gap-3 mb-3.5">
        <select className={selCls} value={safeX} onChange={(e) => setXKey(e.target.value)}>
          {feats.map((f) => (
            <option key={f} value={f}>
              X: {f}
            </option>
          ))}
        </select>
        <select className={selCls} value={safeY} onChange={(e) => setYKey(e.target.value)}>
          {feats.map((f) => (
            <option key={f} value={f}>
              Y: {f}
            </option>
          ))}
        </select>
      </div>
      <YearRangeSlider bounds={data.summary.year_bounds!} recordCount={total} />
      <Card title="Scatter Anomali" note={`${safeX} × ${safeY}`}>
        <EChart option={option} height={480} />
      </Card>
      <div className="h-[18px]" />
      <AnomalyGlossary dataset={dataset} />
      <div className="h-[18px]" />
      {dataset === "accepted" ? (
        <div className="grid grid-cols-3 gap-[18px] max-[1080px]:grid-cols-1">
          {CASES.map((c) => (
            <div
              key={c.tag}
              className="relative flex flex-col overflow-hidden rounded-[20px] border border-line bg-glass px-5 py-[18px]"
            >
              <div
                className="absolute inset-y-0 left-0 w-[3px]"
                style={{ background: c.color }}
              />
              <div className="mb-2.5 font-mono text-[11px] tracking-[0.05em] text-muted">
                {c.tag}
              </div>
              <div
                className="mb-2.5 font-display text-base font-semibold"
                style={{ color: c.color }}
              >
                {c.title}
              </div>
              <div className="mb-4 text-[13.5px] leading-[1.6] text-text [&_b]:font-mono [&_b]:text-[12.5px]">
                {c.body}
              </div>
              <ActionBox color={c.color} label={c.action.label} text={c.action.text} />
            </div>
          ))}
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-[20px] border border-line bg-glass px-5 py-[18px]">
          <div
            className="absolute inset-y-0 left-0 w-[3px]"
            style={{ background: COLORS.violet }}
          />
          <div className="mb-2.5 font-mono text-[11px] tracking-[0.05em] text-muted">
            Pengajuan ditolak · tanpa auto-verdict
          </div>
          <div
            className="mb-2.5 font-display text-base font-semibold"
            style={{ color: COLORS.violet }}
          >
            Anomali bukti kuat
          </div>
          <div className="mb-4 text-[13.5px] leading-[1.6] text-text">
            Dataset rejected hanya punya fitur pengajuan, sehingga tipologi bisnis
            (Sinyal Risiko / Kasus Langka / Kesalahan Data) tidak bisa dihitung. Prioritas
            dibaca dari tier keyakinan pada peta di atas.
          </div>
          <ActionBox
            color={COLORS.violet}
            label={REJECTED_ACTION.label}
            text={REJECTED_ACTION.text}
          />
        </div>
      )}
    </>
  );
}
