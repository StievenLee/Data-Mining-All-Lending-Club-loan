// EChart.tsx — wrapper tipis ECharts (canvas). Re-render saat `option` berubah,
// resize otomatis, dan (opsional) lapor latensi render ke callback perf.

import { useEffect, useRef } from "react";
import echarts from "../lib/echarts";
import type { EChartsOption } from "../lib/echarts";

interface Props {
  option: EChartsOption;
  height?: number | string;
  onRenderMs?: (ms: number) => void;
}

export default function EChart({ option, height = 340, onRenderMs }: Props) {
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
    const ms = performance.now() - t0;
    if (onRenderMs) onRenderMs(ms);
  }, [option, onRenderMs]);

  return (
    <div
      ref={hostRef}
      className="echart"
      style={{ height: typeof height === "number" ? `${height}px` : height }}
    />
  );
}
