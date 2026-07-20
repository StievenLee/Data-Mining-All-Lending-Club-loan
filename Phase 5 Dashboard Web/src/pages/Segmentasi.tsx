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
      <div className="grid g-21">
        <Card title="Peta Segmen" note="bubble = n anggota">
          <EChart option={option} height={470} />
        </Card>
        <Card title="Profil Segmen" sub="Diurutkan dari risiko terendah.">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[...data.clusters]
              .sort((a, b) => a.default_rate - b.default_rate)
              .map((c, i) => (
                <div
                  key={c.cluster}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 14px",
                    borderRadius: 14,
                    background: "var(--glass)",
                    border: "1px solid var(--line)",
                  }}
                >
                  <span
                    className="swatch"
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 4,
                      background: RISK_SCALE[Math.min(i, RISK_SCALE.length - 1)],
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "var(--display)", fontWeight: 600 }}>
                      {c.nama_profil}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--mono)",
                        fontSize: 11,
                        color: "var(--muted)",
                      }}
                    >
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
