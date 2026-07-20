import type { ReactNode } from "react";
import { COLORS } from "../theme/colors";
import Card from "./Card";

type SwatchKind = "dot" | "dot-hi" | "ring" | "sq-open" | "dia-open";

const SWATCH_CLASS: Record<SwatchKind, string> = {
  dot: "h-[13px] w-[13px] rounded-full bg-violet",
  "dot-hi": "h-[13px] w-[13px] rounded-full bg-lime shadow-[0_0_7px_rgba(195,244,0,0.5)]",
  ring: "h-[13px] w-[13px] rounded-full border-[1.8px] border-cyan bg-transparent",
  "sq-open": "h-[13px] w-[13px] border-[1.8px] border-violet bg-transparent",
  "dia-open": "h-[11px] w-[11px] rotate-45 border-[1.8px] border-amber bg-transparent",
};

function GlossItem({
  swatch,
  chipColor,
  term,
  children,
}: {
  swatch?: SwatchKind;
  chipColor?: string;
  term: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-3.5 flex items-start gap-3">
      <div className="mt-0.5 grid h-4 w-4 flex-none place-items-center">
        {swatch ? (
          <span className={SWATCH_CLASS[swatch]} />
        ) : (
          <span className="h-3.5 w-3.5 rounded" style={{ background: chipColor }} />
        )}
      </div>
      <div className="min-w-0">
        <div className="font-display text-[13.5px] font-semibold leading-[1.3]">{term}</div>
        <div className="mt-0.5 text-[12.5px] leading-[1.5] text-muted [&_b]:font-mono [&_b]:text-[11.5px] [&_b]:font-medium [&_b]:text-text">
          {children}
        </div>
      </div>
    </div>
  );
}

/** "Panduan membaca peta anomali" — glosarium visual, selaras Dash lama.
 *  Kolektif/kontekstual & tipologi bisnis (auto-verdict) cuma ada untuk Accepted. */
export default function AnomalyGlossary({ dataset }: { dataset: "accepted" | "rejected" }) {
  const isAcc = dataset === "accepted";

  return (
    <Card
      title="Panduan membaca peta anomali"
      note="glosarium"
      sub="Arti tiap warna, bentuk, dan istilah pada tab ini — agar temuan mudah dibaca tanpa latar teknis."
    >
      <div className="grid grid-cols-2 gap-x-[30px] gap-y-[22px] max-[820px]:grid-cols-1">
        <div>
          <div className="mb-3 border-b border-line pb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            Sinyal pada peta
          </div>
          <GlossItem swatch="dot" term="Anomali">
            Tiap titik = satu record anomali. Warna = skor <b>Isolation Forest</b> (makin
            lime, makin terisolasi dari populasi).
          </GlossItem>
          {isAcc && (
            <GlossItem swatch="sq-open" term="Kolektif">
              Anggota klaster <b>Highest-Risk</b> (Fase 2). Individu belum tentu ekstrem,
              tapi kelompoknya menyimpang bersama (FICO rendah, bunga tinggi, gagal bayar
              tinggi).
            </GlossItem>
          )}
          {isAcc && (
            <GlossItem swatch="dia-open" term="Kontekstual">
              Bunga ekstrem <b>relatif kelompok skor FICO-nya</b> (|z| &gt; 3 dalam
              bucket), meski terlihat normal secara global.
            </GlossItem>
          )}
          <GlossItem swatch="dot-hi" term="Tier tinggi">
            Keyakinan tertinggi: <b>Kritis</b> (DBSCAN + 3 metode) atau <b>Sangat Kuat</b>{" "}
            (DBSCAN + metode). Bukti statistik &amp; struktural bertemu.
          </GlossItem>
          <GlossItem swatch="ring" term="Noise DBSCAN">
            Ditandai noise oleh DBSCAN Fase 2: tak masuk klaster kepadatan mana pun →
            terisolasi secara struktural.
          </GlossItem>
        </div>

        {isAcc ? (
          <div>
            <div className="mb-3 border-b border-line pb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              Tipologi bisnis (auto-verdict)
            </div>
            <GlossItem chipColor={COLORS.error} term="Sinyal Risiko">
              Pola risiko kredit nyata: FICO rendah + bunga tinggi, atau buka sangat
              banyak akun (loan-stacking), atau gagal bayar + multi-metode. →{" "}
              <b>eskalasi ke tim risiko</b>.
            </GlossItem>
            <GlossItem chipColor={COLORS.cyan} term="Kasus Langka (Sah)">
              Ekstrem lintas fitur tapi konsisten, tanpa pola risiko/error. Nasabah tak
              biasa namun sah → <b>tanpa tindakan</b>.
            </GlossItem>
            <GlossItem chipColor={COLORS.amber} term="Kesalahan Data">
              Nilai tak wajar (|z| &gt; 8) → indikasi kesalahan input. →{" "}
              <b>verifikasi ke sumber</b>.
            </GlossItem>
            <p className="mt-1 text-[12px] italic leading-[1.5] text-muted">
              Prioritas berjenjang: Kesalahan Data mengunci, lalu Sinyal Risiko, lalu
              Kasus Langka (Sah).
            </p>
          </div>
        ) : (
          <p className="text-[12px] italic leading-[1.5] text-muted">
            Catatan: anomali Kolektif/Kontekstual dan tipologi bisnis (auto-verdict) hanya
            dihitung untuk dataset Accepted.
          </p>
        )}
      </div>
    </Card>
  );
}
