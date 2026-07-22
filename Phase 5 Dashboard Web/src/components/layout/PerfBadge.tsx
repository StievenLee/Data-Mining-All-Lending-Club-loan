// PerfBadge.tsx — penampil latensi filter hasil ukur (lib/perf).
//
// Ditaruh di TopNav supaya angkanya terlihat sambil dashboard dipakai, bukan
// tersembunyi di console. Sebelum ada aksi filter, badge menampilkan tanda "–"
// dengan ajakan mencoba, bukan angka 0: menampilkan 0 ms sebelum ada pengukuran
// akan terbaca sebagai klaim performa, padahal belum ada sampel sama sekali.

import { usePerf } from "../../lib/perf";

/** Ambang warna. 100 ms adalah batas yang dipakai sebagai target di PLAN.md. */
function toneOf(ms: number): { text: string; dot: string } {
  if (ms < 100) return { text: "text-lime", dot: "bg-lime" };
  if (ms < 300) return { text: "text-amber", dot: "bg-amber" };
  return { text: "text-error", dot: "bg-error" };
}

export default function PerfBadge() {
  const totalMs = usePerf((s) => s.totalMs);
  const paintMs = usePerf((s) => s.paintMs);
  const worstMs = usePerf((s) => s.worstMs);
  const samples = usePerf((s) => s.samples);
  const label = usePerf((s) => s.label);

  if (totalMs == null) {
    return (
      <div
        className="hidden items-center gap-2 rounded-full border border-line bg-glass px-3 py-1.5 min-[820px]:flex"
        title="Ubah filter apa pun (tahun, dataset, lift) untuk mulai mengukur latensi."
      >
        <span className="h-1.5 w-1.5 rounded-full bg-muted/50" />
        <span className="font-mono text-[10.5px] tracking-[0.08em] text-muted">
          LATENSI –
        </span>
      </div>
    );
  }

  const tone = toneOf(totalMs);
  const detail = [
    `Aksi terakhir: ${label ?? "-"}`,
    `Total (aksi → chart selesai): ${totalMs.toFixed(1)} ms`,
    `Porsi menggambar (setOption): ${(paintMs ?? 0).toFixed(1)} ms`,
    `Terburuk sesi ini: ${(worstMs ?? 0).toFixed(1)} ms dari ${samples} pengukuran`,
  ].join("\n");

  return (
    <div
      className="hidden items-center gap-2 rounded-full border border-line bg-glass px-3 py-1.5 min-[820px]:flex"
      title={detail}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
      <span className="font-mono text-[10.5px] tracking-[0.08em] text-muted">
        LATENSI
      </span>
      <span className={`font-mono text-[12px] font-bold ${tone.text}`}>
        {Math.round(totalMs)} ms
      </span>
      {worstMs != null && worstMs > totalMs && (
        <span className="font-mono text-[10px] text-muted">
          maks {Math.round(worstMs)}
        </span>
      )}
    </div>
  );
}
