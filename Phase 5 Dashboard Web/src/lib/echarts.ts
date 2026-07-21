// echarts.ts — impor MODULAR agar bundle kecil (hanya chart & komponen yang dipakai).
// Menggantikan `import * as echarts from "echarts"` yang menarik seluruh pustaka.

import * as echarts from "echarts/core";
import {
  BarChart,
  PieChart,
  ScatterChart,
  GaugeChart,
} from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  VisualMapComponent,
  GraphicComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  BarChart,
  PieChart,
  ScatterChart,
  GaugeChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  VisualMapComponent,
  GraphicComponent,
  CanvasRenderer,
]);

export default echarts;
export type { EChartsOption } from "echarts";
