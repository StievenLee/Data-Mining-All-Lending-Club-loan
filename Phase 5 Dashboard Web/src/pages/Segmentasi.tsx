import { useMemo } from "react";
import type { DashboardData } from "../types";
import { useDashboard } from "../store/useDashboard";
import { clusterProfilesForYears } from "../data/filters";
import { clusterOption } from "../components/charts/options";
import { RISK_SCALE } from "../theme/colors";
import EChart from "../components/EChart";
import Card from "../components/Card";
import PageHead from "../components/PageHead";
import YearRangeSlider from "../components/filters/YearRangeSlider";
import { fmt2 } from "../lib/format";

export default function Segmentasi({ data }: { data: DashboardData }) {
  const dataset = useDashboard((s) => s.dataset);
  const years = useDashboard((s) => s.years) ?? data.summary.year_bounds!;

  // Klasterisasi K-Means Fase 2 hanya dijalankan atas dataset accepted;
  // hasil rejected belum diekspor -> array kosong memicu pesan "belum tersedia".
  const clusters = useMemo(() => {
    if (dataset !== "accepted") return [];
    return data.clustersByYear.length
      ? clusterProfilesForYears(data.clustersByYear, years)
      : data.clusters;
  }, [dataset, data.clustersByYear, data.clusters, years]);

  const option = useMemo(() => clusterOption(clusters), [clusters]);
  const totalAnggota = clusters.reduce((s, c) => s + c.n_anggota, 0);
  const worst = clusters.length
    ? [...clusters].sort((a, b) => b.default_rate - a.default_rate)[0]
    : null;

  return (
    <>
      <PageHead
        eyebrow="Fase 2 K-Means Clustering"
        title="Segmentasi Peminjam"
        sub={
          dataset === "accepted" ? (
            <>
              <b>{clusters.length}</b> segmen peminjam dari{" "}
              <b>{totalAnggota.toLocaleString("id-ID")}</b> pinjaman ({years[0]}–{years[1]}).
              Ukuran gelembung = jumlah anggota, warna = tingkat gagal bayar.
            </>
          ) : (
            "Klasterisasi K-Means Fase 2 saat ini hanya dijalankan pada dataset Accepted. Hasil untuk Rejected belum diekspor."
          )
        }
        pills={
          dataset === "accepted"
            ? [
                { label: "Segmen", value: String(clusters.length) },
                {
                  label: "Default tertinggi",
                  value: worst ? `${fmt2(worst.default_rate * 100)}%` : "–",
                  kind: "accent",
                },
              ]
            : undefined
        }
      />
      <YearRangeSlider bounds={data.summary.year_bounds!} recordCount={totalAnggota} />
      <div className="mb-[18px] grid min-w-0 grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-[18px] max-[1080px]:grid-cols-1">
        <Card title="Peta Segmen" note="bubble = n anggota">
          <EChart option={option} height={470} />
        </Card>
        <Card title="Profil Segmen" sub="Diurutkan dari risiko terendah.">
          {clusters.length === 0 ? (
            <p className="font-mono text-[13px] leading-[1.6] text-muted">
              Belum ada data segmen untuk Rejected.
            </p>
          ) : (
            <div className="flex flex-col gap-3.5">
              {[...clusters]
                .sort((a, b) => a.default_rate - b.default_rate)
                .map((c, i) => (
                  <div
                    key={c.cluster}
                    className="flex items-center gap-3 rounded-[14px] border border-line bg-glass px-3.5 py-3"
                  >
                    <span
                      className="h-3.5 w-3.5 rounded"
                      style={{ background: RISK_SCALE[Math.min(i, RISK_SCALE.length - 1)] }}
                    />
                    <div className="flex-1">
                      <div className="font-display font-semibold">{c.nama_profil}</div>
                      <div className="font-mono text-[11px] text-muted">
                        {c.n_anggota.toLocaleString("id-ID")} anggota · default{" "}
                        {fmt2(c.default_rate * 100)}%
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
