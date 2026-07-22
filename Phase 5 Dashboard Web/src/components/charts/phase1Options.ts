// phase1Options.ts — chart untuk halaman Preprocessing (Fase 1).
//
// Beda dari options.ts: builder di sini TIDAK bergantung pada data dashboard,
// karena Fase 1 adalah laporan atas satu kali eksekusi pipeline. Angkanya statis
// dan disalin dari output notebook Fase 1 (preprocessing_final_for_clustering.ipynb),
// sumber per angka ditulis di komentar masing-masing konstanta.

import type { EChartsOption } from "echarts";
import { COLORS, FONT_MONO, tooltipStyle } from "../../theme/colors";
import { fmt2 } from "../../lib/format";

const axisCommon = {
  axisLine: { lineStyle: { color: COLORS.line } },
  axisLabel: { color: COLORS.muted, fontFamily: FONT_MONO, fontSize: 11 },
  splitLine: { lineStyle: { color: COLORS.line } },
  nameTextStyle: { color: COLORS.muted, fontFamily: FONT_MONO, fontSize: 11 },
};

// ---------------------------------------------------------------------------
// 1. Distribusi status pinjaman (accepted)
// ---------------------------------------------------------------------------

// Sumber: notebook Fase 1, sel "Distribusi Target Variable (loan_status)".
const STATUS_DIST: { name: string; value: number; color: string }[] = [
  { name: "Fully Paid (lunas)", value: 47.63, color: COLORS.lime },
  { name: "Current (masih berjalan)", value: 38.85, color: COLORS.amber },
  { name: "Charged Off (gagal bayar)", value: 11.88, color: COLORS.error },
  { name: "Lainnya (Late, Grace Period, dll)", value: 1.64, color: COLORS.muted },
];

/** Donut komposisi status pinjaman mentah. Dua irisan berwarna terang (lunas &
 *  gagal bayar) adalah yang dipertahankan; sisanya dibuang karena hasilnya
 *  belum final. */
export function statusDonutOption(): EChartsOption {
  return {
    tooltip: {
      ...tooltipStyle,
      trigger: "item",
      formatter: (p: any) => `${p.name}<br/>${fmt2(p.value)}% dari 2,26 juta pinjaman`,
    },
    legend: {
      bottom: 0,
      icon: "roundRect",
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: COLORS.muted, fontFamily: FONT_MONO, fontSize: 10.5 },
    },
    series: [
      {
        type: "pie",
        radius: ["56%", "78%"],
        center: ["50%", "40%"],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: COLORS.bgDeep, borderWidth: 3 },
        label: {
          show: true,
          formatter: (p: any) => fmt2(p.value) + "%",
          color: COLORS.bgDeep,
          fontFamily: FONT_MONO,
          fontSize: 11,
          fontWeight: "bold",
        },
        labelLine: { show: false },
        data: STATUS_DIST.map((s) => ({
          name: s.name,
          value: s.value,
          itemStyle: {
            color: s.color,
            // Status yang dibuang digambar transparan: komposisinya tetap jujur
            // terlihat, tetapi mata langsung tertuju ke dua status yang dipakai.
            opacity: s.name.startsWith("Fully") || s.name.startsWith("Charged") ? 1 : 0.34,
          },
        })),
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// 2. Penyusutan kolom saat cleaning (accepted)
// ---------------------------------------------------------------------------

// Sumber: notebook Fase 1, output berurutan "Shape setelah drop" pada Langkah 2.1.
const COLUMN_FUNNEL: { name: string; value: number; note: string; color: string }[] = [
  { name: "151 kolom mentah", value: 151, note: "kondisi awal", color: COLORS.cyan },
  { name: "107 kolom", value: 107, note: "setelah buang 44 kolom >50% kosong", color: COLORS.violet },
  { name: "102 kolom", value: 102, note: "setelah buang 5 kolom identitas", color: COLORS.amber },
  { name: "87 kolom", value: 87, note: "setelah buang 15 kolom bocor (leakage)", color: COLORS.lime },
];

/** Funnel penyusutan kolom pada tahap cleaning. Berhenti di 87 karena setelah itu
 *  jumlah kolom justru NAIK dulu (One-Hot Encoding) sebelum diseleksi — perjalanan
 *  sisanya diceritakan chart feature selection. */
export function columnFunnelOption(): EChartsOption {
  return {
    tooltip: {
      ...tooltipStyle,
      trigger: "item",
      formatter: (p: any) => `${p.name}<br/>${p.data.note}`,
    },
    series: [
      {
        type: "funnel",
        left: "6%",
        right: "6%",
        top: 10,
        bottom: 10,
        min: 0,
        max: 151,
        minSize: "34%",
        sort: "descending",
        gap: 4,
        label: {
          show: true,
          position: "inside",
          color: COLORS.bgDeep,
          fontFamily: FONT_MONO,
          fontSize: 12,
          fontWeight: "bold",
        },
        itemStyle: { borderColor: COLORS.bgDeep, borderWidth: 2 },
        data: COLUMN_FUNNEL.map((d) => ({
          name: d.name,
          value: d.value,
          note: d.note,
          itemStyle: { color: d.color, opacity: 0.88 },
        })),
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// 3. Skor feature selection (accepted)
// ---------------------------------------------------------------------------

// Sumber: notebook Fase 1, sel "16 fitur terpilih untuk dataset final (sesuai elbow)".
// corr = |korelasi Pearson| terhadap target; mi = mutual information.
// dropped = dibuang di langkah dedup karena berkorelasi >0,90 dengan fitur lain.
const FEATURE_SCORES: { label: string; corr: number; mi: number; dropped?: string }[] = [
  { label: "Grade kredit (A–G)", corr: 0.2613, mi: 0.0514 },
  { label: "Sub-grade", corr: 0.267, mi: 0.0396, dropped: "grade" },
  { label: "Suku bunga", corr: 0.2586, mi: 0.0395 },
  { label: "Tenor (36 / 60 bln)", corr: 0.1757, mi: 0.0681 },
  { label: "Rumah: KPR", corr: 0.0681, mi: 0.0899 },
  { label: "Tujuan: konsolidasi utang", corr: 0.0345, mi: 0.0953 },
  { label: "Status listing awal (w)", corr: 0.0068, mi: 0.0967 },
  { label: "Rumah: sewa", corr: 0.066, mi: 0.0514 },
  { label: "Skor FICO (batas bawah)", corr: 0.1307, mi: 0.0135 },
  { label: "Skor FICO (batas atas)", corr: 0.1307, mi: 0.0133, dropped: "FICO batas bawah" },
  { label: "Inquiry kredit 6 bln", corr: 0.0668, mi: 0.0322 },
  { label: "Verifikasi: source verified", corr: 0.0195, mi: 0.0484 },
  { label: "Verifikasi: verified", corr: 0.0652, mi: 0.031 },
  { label: "Cicilan bulanan", corr: 0.0514, mi: 0.0293 },
  { label: "Akun dibuka 24 bln", corr: 0.0992, mi: 0.011 },
  { label: "Trade line dibuka 12 bln", corr: 0.0842, mi: 0.0148 },
];

/** Bar bertumpuk 16 fitur hasil elbow: tiap batang = Combined Score, dipecah
 *  menurut metode yang menyumbangnya. Persis rumus notebook:
 *  Combined = (corr/max(corr) + mi/max(mi)) / 2, jadi tiap tumpukan = separuhnya.
 *  Dua fitur redundan digambar redup + diberi keterangan penggantinya. */
export function featureScoreOption(): EChartsOption {
  const corrMax = Math.max(...FEATURE_SCORES.map((f) => f.corr));
  const miMax = Math.max(...FEATURE_SCORES.map((f) => f.mi));
  // ECharts menggambar kategori sumbu-y dari bawah, jadi dibalik agar rank 1 di atas.
  const rows = [...FEATURE_SCORES].reverse();
  const dim = (f: (typeof rows)[number]) => (f.dropped ? 0.3 : 1);

  return {
    grid: { left: 8, right: 58, top: 30, bottom: 34, containLabel: true },
    tooltip: {
      ...tooltipStyle,
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (p: any) => {
        const f = rows.find((r) => r.label === p[0].name);
        if (!f) return "";
        const total = f.corr / corrMax / 2 + f.mi / miMax / 2;
        const head = `<b>${f.label}</b><br/>Combined Score ${fmt2(total)}`;
        const body = `<br/>korelasi ${fmt2(f.corr)} · mutual info ${fmt2(f.mi)}`;
        const tail = f.dropped ? `<br/>dibuang, diwakili oleh ${f.dropped}` : "";
        return head + body + tail;
      },
    },
    legend: {
      top: 0,
      icon: "roundRect",
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: COLORS.muted, fontFamily: FONT_MONO, fontSize: 10.5 },
    },
    xAxis: {
      type: "value",
      name: "Combined Score",
      nameLocation: "middle",
      nameGap: 26,
      max: 1,
      ...axisCommon,
    },
    yAxis: {
      type: "category",
      data: rows.map((f) => f.label),
      ...axisCommon,
      axisLabel: { ...axisCommon.axisLabel, fontSize: 10, width: 150, overflow: "truncate" },
    },
    series: [
      {
        name: "Korelasi Pearson",
        type: "bar",
        stack: "score",
        barWidth: "62%",
        data: rows.map((f) => ({
          value: f.corr / corrMax / 2,
          itemStyle: { color: COLORS.cyan, opacity: dim(f) },
        })),
      },
      {
        name: "Mutual Information",
        type: "bar",
        stack: "score",
        data: rows.map((f) => ({
          value: f.mi / miMax / 2,
          itemStyle: { color: COLORS.violet, opacity: dim(f), borderRadius: [0, 4, 4, 0] },
        })),
        label: {
          show: true,
          position: "right",
          color: COLORS.muted,
          fontFamily: FONT_MONO,
          fontSize: 10,
          formatter: (p: any) => {
            const f = rows[p.dataIndex];
            return f.dropped ? "redundan" : "";
          },
        },
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// 4. Missing value dataset rejected
// ---------------------------------------------------------------------------

// Sumber: notebook Fase 1, sel "Missing Value Report: df_rej".
const REJECTED_MISSING: { col: string; pct: number }[] = [
  { col: "Risk_Score", pct: 66.9 },
  { col: "Employment Length", pct: 3.44 },
  { col: "Loan Title", pct: 0.005 },
  { col: "Policy Code", pct: 0.003 },
  { col: "Zip Code", pct: 0.001 },
  { col: "State", pct: 0.0001 },
];

/** Bar nilai kosong per kolom rejected + garis ambang 50%. Menjawab sekali lihat
 *  kenapa hanya Risk_Score yang dibuang dan kolom lain cukup diimputasi. */
export function rejectedMissingOption(): EChartsOption {
  const rows = [...REJECTED_MISSING].reverse();
  return {
    grid: { left: 8, right: 54, top: 16, bottom: 38, containLabel: true },
    tooltip: {
      ...tooltipStyle,
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (p: any) =>
        `${p[0].name}<br/>${fmt2(p[0].value)}% nilai kosong` +
        (p[0].value > 50 ? "<br/>dibuang (>50%)" : "<br/>diimputasi median / modus"),
    },
    xAxis: {
      type: "value",
      name: "% nilai kosong",
      nameLocation: "middle",
      nameGap: 26,
      max: 100,
      ...axisCommon,
    },
    yAxis: {
      type: "category",
      data: rows.map((r) => r.col),
      ...axisCommon,
      axisLabel: { ...axisCommon.axisLabel, fontSize: 10.5 },
    },
    series: [
      {
        type: "bar",
        barWidth: "58%",
        data: rows.map((r) => ({
          value: r.pct,
          itemStyle: {
            color: r.pct > 50 ? COLORS.error : COLORS.cyan,
            opacity: r.pct > 50 ? 1 : 0.75,
            borderRadius: [0, 4, 4, 0],
          },
        })),
        label: {
          show: true,
          position: "right",
          color: COLORS.text,
          fontFamily: FONT_MONO,
          fontSize: 10.5,
          formatter: (p: any) => (p.value < 0.01 ? "~0%" : fmt2(p.value) + "%"),
        },
        markLine: {
          silent: true,
          symbol: "none",
          label: {
            formatter: "ambang 50%",
            color: COLORS.amber,
            fontFamily: FONT_MONO,
            fontSize: 10,
            position: "insideEndTop",
          },
          lineStyle: { color: COLORS.amber, type: "dashed", width: 1.2 },
          data: [{ xAxis: 50 }],
        },
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// 5. Kepadatan matriks sparse (rejected, persiapan Apriori)
// ---------------------------------------------------------------------------

/** Donut kepadatan matriks One-Hot rejected: hanya 25% sel bernilai 1, sehingga
 *  75% sisanya tak perlu disimpan sama sekali — itulah alasan format sparse. */
export function sparseDensityOption(): EChartsOption {
  return {
    tooltip: {
      ...tooltipStyle,
      trigger: "item",
      formatter: (p: any) => `${p.name}<br/>${fmt2(p.value)}% dari seluruh sel matriks`,
    },
    legend: {
      bottom: 0,
      icon: "roundRect",
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: COLORS.muted, fontFamily: FONT_MONO, fontSize: 10.5 },
    },
    series: [
      {
        type: "pie",
        radius: ["58%", "80%"],
        center: ["50%", "42%"],
        itemStyle: { borderColor: COLORS.bgDeep, borderWidth: 3 },
        label: {
          show: true,
          formatter: (p: any) => fmt2(p.value) + "%",
          color: COLORS.bgDeep,
          fontFamily: FONT_MONO,
          fontSize: 12,
          fontWeight: "bold",
        },
        labelLine: { show: false },
        data: [
          {
            name: "Sel bernilai 1 (disimpan)",
            value: 25,
            itemStyle: { color: COLORS.lime },
          },
          {
            name: "Sel bernilai 0 (tidak disimpan)",
            value: 75,
            itemStyle: { color: COLORS.muted, opacity: 0.3 },
          },
        ],
      },
    ],
  };
}
