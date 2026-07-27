// AnomalyControls.tsx — panel kontrol peta anomali: sumbu, jumlah titik, dan
// isolasi lapisan. Semua kontrol dikumpulkan di satu tempat supaya user tidak
// perlu menebak bahwa legenda chart juga bisa diklik.

import type { ReactNode } from "react";
import { COLORS } from "../../theme/colors";
import type { AnomalyLayer } from "../../data/filters";

/** null = tanpa batas ("Semua"). */
export const POINT_LIMITS: { label: string; value: number | null }[] = [
  { label: "5.000", value: 5000 },
  { label: "10.000", value: 10000 },
  { label: "50.000", value: 50000 },
  { label: "Semua", value: null },
];

type LayerDef = { key: AnomalyLayer; label: string; color: string; swatch: string };

/** Bentuk swatch meniru simbol di chart: bulat penuh, kotak, belah ketupat, cincin. */
const LAYERS: LayerDef[] = [
  { key: "main", label: "Anomali", color: COLORS.violet, swatch: "rounded-full" },
  { key: "collective", label: "Kolektif", color: COLORS.violet, swatch: "border-[1.8px]" },
  { key: "contextual", label: "Kontekstual", color: COLORS.amber, swatch: "rotate-45 border-[1.8px]" },
  { key: "highTier", label: "Tier tinggi", color: COLORS.lime, swatch: "rounded-full" },
  { key: "noise", label: "Noise DBSCAN", color: COLORS.cyan, swatch: "rounded-full border-[1.8px]" },
];

const num = (n: number) => n.toLocaleString("id-ID");

interface Props {
  feats: string[];
  xKey: string;
  yKey: string;
  onX: (v: string) => void;
  onY: (v: string) => void;
  limit: number | null;
  onLimit: (v: number | null) => void;
  layer: AnomalyLayer | null;
  onLayer: (v: AnomalyLayer | null) => void;
  counts: Record<AnomalyLayer, number>;
  /** Titik yang lolos filter tahun sebelum dibatasi — untuk teks "x dari y". */
  available: number;
  drawn: number;
}

function Chip({
  active,
  color,
  onClick,
  title,
  children,
}: {
  active: boolean;
  color?: string;
  onClick: () => void;
  title?: string;
  children: ReactNode;
}) {
  const accent = color ?? COLORS.violet;
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className="flex cursor-pointer items-center gap-2 rounded-full border px-3 py-[6px] font-mono text-[11px] transition-all duration-150"
      style={{
        borderColor: active ? accent : COLORS.line,
        background: active ? accent + "1f" : "transparent",
        color: active ? COLORS.text : COLORS.muted,
      }}
    >
      {children}
    </button>
  );
}

export default function AnomalyControls({
  feats,
  xKey,
  yKey,
  onX,
  onY,
  limit,
  onLimit,
  layer,
  onLayer,
  counts,
  available,
  drawn,
}: Props) {
  // min-w-0 + flex-1: lebar bawaan <select> mengikuti opsi terpanjang (nama fitur
  // bisa sangat panjang). Tanpa ini, di layar sempit ia menolak menyusut dan
  // mendorong seluruh panel melewati tepi kanan viewport.
  const selCls =
    "min-w-0 max-w-full flex-1 basis-[calc(50%-0.25rem)] cursor-pointer truncate rounded-lg border border-line bg-bg-deep px-2.5 py-1.5 font-mono text-xs text-text min-[640px]:flex-none min-[640px]:basis-auto";
  // Lapisan yang memang tidak ada di dataset ini (rejected: kolektif/kontekstual)
  // disembunyikan, bukan ditampilkan sebagai chip mati yang membingungkan.
  const layers = LAYERS.filter((l) => l.key === "main" || counts[l.key] > 0);

  return (
    <div className="mb-[18px] rounded-2xl border border-line bg-glass px-4 py-3.5 min-[640px]:rounded-[20px] min-[640px]:px-5">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <div className="flex w-full flex-wrap items-center gap-2 min-[640px]:w-auto">
          <span className="w-full font-mono text-[10px] uppercase tracking-[0.12em] text-muted min-[640px]:w-auto">
            Sumbu
          </span>
          <select className={selCls} value={xKey} onChange={(e) => onX(e.target.value)}>
            {feats.map((f) => (
              <option key={f} value={f}>
                X: {f}
              </option>
            ))}
          </select>
          <select className={selCls} value={yKey} onChange={(e) => onY(e.target.value)}>
            {feats.map((f) => (
              <option key={f} value={f}>
                Y: {f}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
            Jumlah titik
          </span>
          {POINT_LIMITS.map((p) => (
            <Chip
              key={p.label}
              active={limit === p.value}
              onClick={() => onLimit(p.value)}
              title={
                p.value == null
                  ? "Gambar semua titik — bisa terasa berat di dataset besar"
                  : `Ambil ${p.label} titik merata dari seluruh rentang`
              }
            >
              {p.label}
              {p.value == null && available > 50000 && (
                <span className="text-amber" title="berpotensi lambat">
                  ⚠
                </span>
              )}
            </Chip>
          ))}
          <span className="font-mono text-[10.5px] text-muted">
            {num(drawn)} dari {num(available)} titik
          </span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
          Tampilkan
        </span>
        <Chip active={layer == null} onClick={() => onLayer(null)} title="Tampilkan semua lapisan">
          Semua lapisan
        </Chip>
        {layers.map((l) => (
          <Chip
            key={l.key}
            active={layer === l.key}
            color={l.color}
            // Klik ulang chip aktif = kembali ke tampilan penuh.
            onClick={() => onLayer(layer === l.key ? null : l.key)}
            title={`Hanya tampilkan ${l.label} (${num(counts[l.key])} titik)`}
          >
            <span
              className={`h-[9px] w-[9px] flex-none ${l.swatch}`}
              style={
                l.swatch.includes("border")
                  ? { borderColor: l.color }
                  : { background: l.color }
              }
            />
            {l.label}
            <span className="text-[10px] opacity-70">{num(counts[l.key])}</span>
          </Chip>
        ))}
      </div>
    </div>
  );
}
