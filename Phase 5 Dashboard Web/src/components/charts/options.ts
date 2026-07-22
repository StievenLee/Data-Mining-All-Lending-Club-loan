// options.ts — builder opsi ECharts yang mereplika grafik Plotly dashboard lama.
// Semua fungsi MURNI: (data) -> EChartsOption. Dipanggil di useMemo.

import type { EChartsOption } from "echarts";
import {
  COLORS,
  FONT_MONO,
  ISO_SCALE,
  RISK_SCALE,
  TIER_COLORS,
  VERDICT_COLORS,
  tooltipStyle,
} from "../../theme/colors";
import type { ClusterProfile, Dataset, SampleColumnar } from "../../types";
import { fmt2 } from "../../lib/format";
import { CLUSTER_AXES, RISK_LEGEND, riskText, riskValue } from "../../lib/cluster";
import type { AnomalyLayer } from "../../data/filters";

const axisCommon = {
  axisLine: { lineStyle: { color: COLORS.line } },
  axisLabel: { color: COLORS.muted, fontFamily: FONT_MONO, fontSize: 11 },
  splitLine: { lineStyle: { color: COLORS.line } },
  nameTextStyle: { color: COLORS.muted, fontFamily: FONT_MONO, fontSize: 11 },
};

/** Gauge persen anomali kuat. */
export function gaugeOption(pct: number): EChartsOption {
  return {
    series: [
      {
        type: "gauge",
        radius: "92%",
        center: ["50%", "58%"],
        startAngle: 210,
        endAngle: -30,
        min: 0,
        max: 100,
        progress: { show: true, width: 14, itemStyle: { color: COLORS.lime } },
        axisLine: {
          lineStyle: {
            width: 14,
            color: [
              [0.4, "rgba(255,255,255,.06)"],
              [1, "rgba(195,244,0,.12)"],
            ],
          },
        },
        pointer: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: {
          color: COLORS.muted,
          fontFamily: FONT_MONO,
          fontSize: 9,
          distance: -2,
        },
        anchor: { show: false },
        title: { show: false },
        detail: {
          valueAnimation: true,
          formatter: (v: number) => fmt2(v) + "%",
          color: COLORS.text,
          fontFamily: FONT_MONO,
          fontSize: 38,
          offsetCenter: [0, "5%"],
        },
        data: [{ value: pct }],
      },
    ],
  };
}

/** Bar horizontal tier (skala log). */
export function tierBarOption(
  counts: { tier: string; count: number }[]
): EChartsOption {
  const data = [...counts].reverse(); // ECharts y-axis dari bawah
  return {
    grid: { left: 8, right: 46, top: 14, bottom: 30, containLabel: true },
    tooltip: {
      ...tooltipStyle,
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (p: any) =>
        `${p[0].name}<br/>${Number(p[0].value).toLocaleString("id-ID")} record`,
    },
    xAxis: {
      type: "log",
      name: "jumlah record (skala log)",
      nameLocation: "middle",
      nameGap: 30,
      ...axisCommon,
    },
    yAxis: {
      type: "category",
      data: data.map((d) => d.tier),
      ...axisCommon,
      axisLabel: { ...axisCommon.axisLabel, fontSize: 10, width: 130, overflow: "truncate" },
    },
    series: [
      {
        type: "bar",
        data: data.map((d) => ({
          value: d.count,
          itemStyle: { color: TIER_COLORS[d.tier] ?? COLORS.muted, borderRadius: [0, 4, 4, 0] },
        })),
        barWidth: "56%",
        label: {
          show: true,
          position: "right",
          color: COLORS.text,
          fontFamily: FONT_MONO,
          fontSize: 11,
          formatter: (p: any) => Number(p.value).toLocaleString("id-ID"),
        },
      },
    ],
  };
}

/** Donut verdict. */
export function verdictOption(
  counts: { verdict: string; count: number }[]
): EChartsOption {
  if (counts.length === 0) {
    return {
      graphic: {
        type: "text",
        left: "center",
        top: "middle",
        style: {
          text: "Tipologi hanya tersedia untuk Accepted",
          fill: COLORS.muted,
          font: `12px ${FONT_MONO}`,
        },
      },
    };
  }
  return {
    tooltip: {
      ...tooltipStyle,
      trigger: "item",
      formatter: (p: any) =>
        `${p.name}<br/>${Number(p.value).toLocaleString("id-ID")} (${fmt2(p.percent)}%)`,
    },
    legend: {
      bottom: 0,
      textStyle: { color: COLORS.muted, fontFamily: FONT_MONO, fontSize: 11 },
      icon: "roundRect",
    },
    series: [
      {
        type: "pie",
        radius: ["58%", "80%"],
        center: ["50%", "44%"],
        avoidLabelOverlap: false,
        itemStyle: { borderColor: COLORS.bgDeep, borderWidth: 3 },
        label: {
          show: true,
          formatter: (p: any) => fmt2(p.percent) + "%",
          color: COLORS.bgDeep,
          fontFamily: FONT_MONO,
          fontSize: 12,
          fontWeight: "bold",
        },
        labelLine: { show: false },
        data: counts.map((c) => ({
          name: c.verdict,
          value: c.count,
          itemStyle: { color: VERDICT_COLORS[c.verdict] ?? COLORS.muted },
        })),
      },
    ],
  };
}

/** Bubble klaster: x=avg_int_rate, y=avg_fico, size=n_anggota, color=default_rate. */
export function clusterOption(
  clusters: ClusterProfile[],
  dataset: Dataset = "accepted"
): EChartsOption {
  if (clusters.length === 0) {
    return {
      graphic: {
        type: "text",
        left: "center",
        top: "middle",
        style: {
          text: "Profil klaster belum tersedia",
          fill: COLORS.muted,
          font: `12px ${FONT_MONO}`,
        },
      },
    };
  }
  const axes = CLUSTER_AXES[dataset];
  const maxN = Math.max(...clusters.map((c) => c.n_anggota), 1);
  const rates = clusters.map(riskValue);
  return {
    // containLabel hanya menyediakan ruang untuk ANGKA sumbu, bukan nama sumbu:
    // nama digambar sejauh nameGap di luar garis sumbu, jadi left/bottom harus
    // menampungnya sendiri (left 8 + nameGap 40 = nama terpotong di tepi kanvas).
    // Sisi kanan tetap lapang untuk visualMap; atas untuk label nama profil yang
    // ditaruh di atas gelembung.
    grid: { left: 46, right: 74, top: 48, bottom: 52, containLabel: true },
    tooltip: {
      ...tooltipStyle,
      trigger: "item",
      formatter: (p: any) => {
        const c = p.data.raw as ClusterProfile;
        const metrik = dataset === "rejected" ? "DTI" : "default";
        return `${c.nama_profil}<br/>anggota=${c.n_anggota.toLocaleString(
          "id-ID"
        )}<br/>${metrik}=${riskText(c)}`;
      },
    },
    visualMap: {
      min: Math.min(...rates),
      max: Math.max(...rates),
      dimension: 2,
      calculable: false,
      show: true,
      right: 0,
      top: "center",
      itemHeight: 120,
      text: RISK_LEGEND[dataset],
      textStyle: { color: COLORS.muted, fontFamily: FONT_MONO, fontSize: 10 },
      inRange: { color: RISK_SCALE },
    },
    // boundaryGap melebarkan rentang sumbu di luar nilai data, supaya gelembung
    // tak pernah menempel tepi. Tanpa ini titik teratas (Prime: gelembung terbesar
    // DAN FICO tertinggi) duduk persis di batas grid, lalu label di atasnya --
    // sejauh radius gelembung, sampai ~41px -- terpotong. Sisi atas diberi jatah
    // paling besar karena hanya di situ label digambar.
    xAxis: {
      type: "value",
      name: axes.xName,
      nameLocation: "middle",
      nameGap: 30,
      scale: true,
      boundaryGap: ["14%", "14%"],
      ...axisCommon,
    },
    yAxis: {
      type: "value",
      name: axes.yName,
      nameLocation: "middle",
      nameGap: 40,
      scale: true,
      boundaryGap: ["12%", "40%"],
      ...axisCommon,
    },
    series: [
      {
        type: "scatter",
        // Diameter maksimum ditahan di 56px (bukan 82px): label diletakkan sejauh
        // radius gelembung, dan pada kartu Ringkasan yang cuma 320px ruang atas
        // tidak cukup untuk radius 41px + tinggi teks. Proporsi antar gelembung tetap.
        symbolSize: (val: any) => (val[3] / maxN) * 40 + 16,
        data: clusters.map((c) => ({
          value: [c[axes.x] ?? 0, c[axes.y] ?? 0, riskValue(c), c.n_anggota],
          raw: c,
          itemStyle: { borderColor: COLORS.bgDeep, borderWidth: 2, opacity: 0.92 },
          label: {
            show: true,
            position: "top",
            formatter: c.nama_profil,
            color: COLORS.text,
            fontFamily: FONT_MONO,
            fontSize: 11,
          },
        })),
      },
    ],
  };
}

/** Scatter anomali: x,y = fitur terpilih, warna = iso_score, overlay noise DBSCAN
 *  + jenis anomali Fase 4 (kontekstual/kolektif) + tier tinggi. Overlay hanya muncul
 *  bila kolomnya ada di sample (accepted saja — rejected tak punya kolom ini).
 *  `layer` != null → isolasi satu lapisan: lapisan itu digambar penuh, sisanya jadi
 *  titik abu redup sebagai konteks posisi (bukan dihilangkan, agar sebaran tetap terbaca). */
export function anomalyScatterOption(
  sample: SampleColumnar,
  rows: number[],
  xKey: string,
  yKey: string,
  tierOrder: string[] = [],
  layer: AnomalyLayer | null = null
): EChartsOption {
  const cx = sample.columns[xKey] as number[] | undefined;
  const cy = sample.columns[yKey] as number[] | undefined;
  const iso = sample.columns["iso_score"] as number[] | undefined;
  const noise = sample.columns["is_dbscan_noise"] as number[] | undefined;
  const tier = sample.columns["anomaly_tier"] as string[] | undefined;
  const contextual = sample.columns["is_contextual_outlier"] as number[] | undefined;
  const collective = sample.columns["is_collective_outlier"] as number[] | undefined;
  const highTiers = new Set(tierOrder.slice(0, 2));

  const main: any[] = [];
  const noisePts: any[] = [];
  const collectivePts: any[] = [];
  const contextualPts: any[] = [];
  const highTierPts: any[] = [];
  if (cx && cy) {
    for (const i of rows) {
      const x = cx[i];
      const y = cy[i];
      if (x == null || y == null) continue;
      const isoV = iso ? iso[i] : 0.5;
      const t = tier ? tier[i] : "";
      main.push({ value: [x, y, isoV], name: t });
      if (noise && noise[i]) noisePts.push([x, y]);
      if (collective && collective[i]) collectivePts.push([x, y]);
      if (contextual && contextual[i]) contextualPts.push([x, y]);
      if (t && highTiers.has(t)) highTierPts.push({ value: [x, y], name: t });
    }
  }
  // Loop manual, BUKAN Math.min(...isoVals): spread ke apply() meledakkan call
  // stack begitu titik > ~100rb (scatter sekarang tanpa sampling, bisa ratusan ribu).
  let isoMin = Infinity;
  let isoMax = -Infinity;
  for (const m of main) {
    const v = m.value[2];
    if (v < isoMin) isoMin = v;
    if (v > isoMax) isoMax = v;
  }
  if (!Number.isFinite(isoMin)) isoMin = 0;
  if (!Number.isFinite(isoMax)) isoMax = 1;

  // Isolasi lapisan overlay (kolektif/kontekstual/tier/noise): titik dasar tetap
  // digambar, tapi netral & tidak diwarnai iso_score supaya lapisan aktif menonjol.
  const dimBase = layer != null && layer !== "main";
  const shows = (l: AnomalyLayer) => layer == null || layer === l;

  const series: any[] = [
    {
      type: "scatter",
      name: dimBase ? "Titik lain (konteks)" : "Anomali",
      large: true,
      largeThreshold: 2000,
      symbolSize: dimBase ? 5 : 7,
      itemStyle: dimBase
        ? { color: COLORS.muted, opacity: 0.16 }
        : { opacity: 0.72 },
      silent: dimBase,
      data: main,
    },
  ];
  if (collectivePts.length && shows("collective")) {
    series.push({
      type: "scatter",
      name: "Kolektif",
      symbol: "rect",
      symbolSize: layer ? 9 : 7,
      itemStyle: {
        color: "transparent",
        borderColor: COLORS.violet,
        borderWidth: layer ? 1.6 : 1.1,
        opacity: layer ? 0.95 : 0.5,
      },
      data: collectivePts,
      tooltip: { formatter: "Kolektif" },
    });
  }
  if (contextualPts.length && shows("contextual")) {
    series.push({
      type: "scatter",
      name: "Kontekstual",
      symbol: "diamond",
      symbolSize: layer ? 11 : 9,
      itemStyle: { color: "transparent", borderColor: COLORS.amber, borderWidth: 1.4, opacity: 0.9 },
      data: contextualPts,
      tooltip: { formatter: "Kontekstual" },
    });
  }
  if (highTierPts.length && shows("highTier")) {
    series.push({
      type: "scatter",
      name: "Tier tinggi (Kritis / Sangat Kuat)",
      symbolSize: layer ? 14 : 12,
      itemStyle: { color: COLORS.lime, opacity: 0.95, borderColor: COLORS.bgDeep, borderWidth: 1.2 },
      data: highTierPts,
      tooltip: { formatter: (p: any) => p.name || "Tier tinggi" },
    });
  }
  if (shows("noise")) {
    series.push({
      type: "scatter",
      name: "Noise DBSCAN (Fase 2)",
      symbolSize: 15,
      itemStyle: {
        color: "rgba(0,0,0,0)",
        borderColor: COLORS.cyan,
        borderWidth: 1.6,
      },
      data: noisePts,
      tooltip: { formatter: "Noise DBSCAN" },
    });
  }

  return {
    grid: { left: 8, right: 66, top: 44, bottom: 44, containLabel: true },
    legend: {
      top: 4,
      icon: "circle",
      itemWidth: 9,
      itemHeight: 9,
      textStyle: { color: COLORS.muted, fontFamily: FONT_MONO, fontSize: 10.5 },
      inactiveColor: COLORS.line,
    },
    tooltip: {
      ...tooltipStyle,
      trigger: "item",
      formatter: (p: any) =>
        `${xKey}=${fmt2(+p.value[0])}<br/>${yKey}=${fmt2(+p.value[1])}<br/>${p.name || ""}`,
    },
    // visualMap mewarnai seri 0 dari iso_score. Saat lapisan diisolasi seri 0 sengaja
    // diredupkan jadi konteks, jadi skalanya dibuang agar tidak menimpa warna itu.
    visualMap: dimBase
      ? undefined
      : {
          min: isoMin,
          max: isoMax,
          dimension: 2,
          seriesIndex: 0,
          calculable: false,
          show: true,
          right: 0,
          top: "center",
          itemHeight: 130,
          text: ["iso\ntinggi", "rendah"],
          textStyle: { color: COLORS.muted, fontFamily: FONT_MONO, fontSize: 10 },
          inRange: { color: ISO_SCALE },
        },
    xAxis: { type: "value", name: xKey, nameLocation: "middle", nameGap: 30, scale: true, ...axisCommon },
    yAxis: { type: "value", name: yKey, nameLocation: "middle", nameGap: 40, scale: true, ...axisCommon },
    series,
  };
}
