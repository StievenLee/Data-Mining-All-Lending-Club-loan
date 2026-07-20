import { useMemo } from "react";
import type { DashboardData } from "../types";
import { clusterOption } from "../components/charts/options";
import { RISK_SCALE } from "../theme/colors";
import EChart from "../components/EChart";
import Card from "../components/Card";
import PageHead from "../components/PageHead";

export default function Segmentasi({ data }: { data: DashboardData }) {
  const option = useMemo(() => clusterOption(data.clusters), [data.clusters]);
  const totalAnggota = data.clusters.reduce((s, c) => s + c.n_anggota, 0);
  const worst = [...data.clusters].sort((a, b) => b.default_rate - a.default_rate)[0];

  return (
    <>
      <PageHead
        eyebrow="Fase 2 · K-Means Clustering"
        title="Segmentasi Peminjam"
        sub={
          <>
            <b>{data.clusters.length}</b> segmen peminjam dari{" "}
            <b>{totalAnggota.toLocaleString("id-ID")}</b> pinjaman. Ukuran
            gelembung = jumlah anggota, warna = tingkat gagal bayar.
          </>
        }
        pills={[
          { label: "Segmen", value: String(data.clusters.length) },
          {
            label: "Default tertinggi",
            value: `${(worst.default_rate * 100).toFixed(1)}%`,
            kind: "accent",
          },
        ]}
      />
      <div className="mb-[18px] grid min-w-0 grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-[18px] max-[1080px]:grid-cols-1">
        <Card title="Peta Segmen" note="bubble = n anggota">
          <EChart option={option} height={470} />
        </Card>
        <Card title="Profil Segmen" sub="Diurutkan dari risiko terendah.">
          <div className="flex flex-col gap-3.5">
            {[...data.clusters]
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
                      {(c.default_rate * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      </div>
    </>
  );
}
