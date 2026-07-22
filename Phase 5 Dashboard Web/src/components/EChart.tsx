// EChart.tsx — wrapper tipis ECharts (canvas). Re-render saat `option` berubah,
// resize otomatis, dan selalu melaporkan latensi ke lib/perf.
//
// Pelaporan sengaja dilakukan DI SINI, bukan lewat prop opsional di tiap call
// site: instrumentasi yang harus diingat untuk dipasang manual akan terlewat,
// dan sebelumnya memang begitu — prop `onRenderMs` ada tetapi tidak pernah
// dipanggil siapa pun, sehingga klaim latensi tidak punya dasar ukur sama sekali.

import { useEffect, useRef } from "react";
import echarts from "../lib/echarts";
import type { EChartsOption } from "../lib/echarts";
import { reportRender } from "../lib/perf";

interface Props {
  option: EChartsOption;
  height?: number | string;
}

export default function EChart({ option, height = 340 }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  // init + dispose sekali
  useEffect(() => {
    if (!hostRef.current) return;
    const chart = echarts.init(hostRef.current, undefined, {
      renderer: "canvas",
    });
    chartRef.current = chart;
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(hostRef.current);
    return () => {
      ro.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  // set option tiap perubahan; ukur waktu
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const t0 = performance.now();
    chart.setOption(option, { notMerge: true, lazyUpdate: false });
    reportRender(performance.now() - t0);
  }, [option]);

  return (
    <div
      ref={hostRef}
      className="w-full"
      style={{ height: typeof height === "number" ? `${height}px` : height }}
    />
  );
}
