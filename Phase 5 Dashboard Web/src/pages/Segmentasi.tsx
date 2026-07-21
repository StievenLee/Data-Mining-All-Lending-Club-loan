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
import {
  REJECTED_RISK_NOTE,
  clustersFor,
  riskPillLabel,
  riskText,
  riskValue,
} from "../lib/cluster";

export default function Segmentasi({ data }: { data: DashboardData }) {
  const dataset = useDashboard((s) => s.dataset);
  const years = useDashboard((s) => s.years) ?? data.summary.year_bounds!;

  // Agregasi per tahun hanya tersedia untuk accepted (clusters_by_year.json dibangun
  // dari populasi accepted). Rejected memakai profil keseluruhan, jadi filter tahun
  // TIDAK berlaku di sana -- dinyatakan eksplisit di UI agar tak terbaca sebagai bug.
  const isRejected = dataset === "rejected";
  const clusters = useMemo(() => {
    if (isRejected) return clustersFor(data.clusters, "rejected");
    return data.clustersByYear.length
      ? clusterProfilesForYears(data.clustersByYear, years)
      : clustersFor(data.clusters, "accepted");
  }, [isRejected, data.clustersByYear, data.clusters, years]);

  const option = useMemo(() => clusterOption(clusters, dataset), [clusters, dataset]);
  const totalAnggota = clusters.reduce((s, c) => s + c.n_anggota, 0);
  const worst = clusters.length
    ? [...clusters].sort((a, b) => riskValue(b) - riskValue(a))[0]
    : null;

  return (
    <>
      <PageHead
        eyebrow="Fase 2 K-Means Clustering"
        title="Segmentasi Peminjam"
        sub={
          isRejected ? (
            <>
              <b>{clusters.length}</b> segmen pengajuan ditolak dari{" "}
              <b>{totalAnggota.toLocaleString("id-ID")}</b> pengajuan. Ukuran gelembung =
              jumlah anggota, warna = DTI sebagai proksi risiko. {REJECTED_RISK_NOTE}
            </>
          ) : (
            <>
              <b>{clusters.length}</b> segmen peminjam dari{" "}
              <b>{totalAnggota.toLocaleString("id-ID")}</b> pinjaman ({years[0]}–{years[1]}).
              Ukuran gelembung = jumlah anggota, warna = tingkat gagal bayar.
            </>
          )
        }
        pills={[
          { label: "Segmen", value: String(clusters.length) },
          {
            label: riskPillLabel(dataset),
            value: worst ? riskText(worst) : "–",
            kind: "accent",
          },
        ]}
      />
      <YearRangeSlider bounds={data.summary.year_bounds!} recordCount={totalAnggota} />
      <div className="mb-[18px] grid min-w-0 grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-[18px] max-[1080px]:grid-cols-1">
        <Card
          title="Peta Segmen"
          note="bubble = n anggota"
          sub={
            isRejected
              ? "Profil rejected dihitung atas seluruh periode, sehingga filter tahun di atas tidak mengubah kartu ini."
              : undefined
          }
        >
          <EChart option={option} height={470} />
        </Card>
        <Card title="Profil Segmen" sub="Diurutkan dari risiko terendah.">
          {clusters.length === 0 ? (
            <p className="font-mono text-[13px] leading-[1.6] text-muted">
              Profil klaster belum tersedia untuk dataset ini.
            </p>
          ) : (
            <div className="flex flex-col gap-3.5">
              {[...clusters]
                .sort((a, b) => riskValue(a) - riskValue(b))
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
                        {c.n_anggota.toLocaleString("id-ID")} anggota ·{" "}
                        {isRejected ? "DTI" : "default"} {riskText(c)}
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
