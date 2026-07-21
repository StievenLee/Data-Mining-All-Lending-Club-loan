import type { ClusterProfile, Dataset } from "../types";

/** Semantik klaster per dataset.
 *
 *  Accepted punya ground truth gagal bayar (default_rate), rejected tidak — pengajuan
 *  yang ditolak tidak pernah punya riwayat pembayaran. Jadi untuk rejected dipakai
 *  avg_dti (z-score) sebagai PROKSI risiko, mengikuti cluster_labels_meta_rejected.json:
 *  "proksi risiko = klaster dengan median DTI (z-score) tertinggi".
 *
 *  Semua kode UI harus lewat helper di sini, jangan membaca c.default_rate langsung —
 *  pada baris rejected field itu undefined dan diam-diam jadi NaN saat diurutkan. */

export const datasetOf = (c: ClusterProfile): Dataset => c.dataset ?? "accepted";

export const clustersFor = (list: ClusterProfile[], dataset: Dataset): ClusterProfile[] =>
  list.filter((c) => datasetOf(c) === dataset);

/** Nilai risiko untuk pengurutan & skala warna. Makin besar = makin berisiko. */
export const riskValue = (c: ClusterProfile): number =>
  datasetOf(c) === "rejected" ? c.avg_dti ?? 0 : c.default_rate ?? 0;

/** Risiko siap tampil, mis. "33,37%" (accepted) atau "DTI z +7,45" (rejected). */
export function riskText(c: ClusterProfile): string {
  const v = riskValue(c);
  if (datasetOf(c) === "rejected") {
    return `DTI z ${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(2).replace(".", ",")}`;
  }
  return `${(v * 100).toFixed(2).replace(".", ",")}%`;
}

/** Label sumbu, legenda, dan pill — beda fitur, jadi beda kalimat. */
export const CLUSTER_AXES: Record<
  Dataset,
  { x: keyof ClusterProfile; y: keyof ClusterProfile; xName: string; yName: string }
> = {
  accepted: {
    x: "avg_int_rate",
    y: "avg_fico",
    xName: "rata-rata bunga (z-score)",
    yName: "rata-rata FICO (z-score)",
  },
  rejected: {
    // avg_amount_requested nyaris identik di ketiga klaster (-0,209) sehingga tak
    // memisahkan apa pun sebagai sumbu; lama kerja x DTI yang benar-benar membedakan.
    x: "avg_employment_length",
    y: "avg_dti",
    xName: "rata-rata lama kerja (z-score)",
    yName: "rata-rata DTI (z-score)",
  },
};

export const RISK_LEGEND: Record<Dataset, [string, string]> = {
  accepted: ["default\ntinggi", "rendah"],
  rejected: ["DTI\ntinggi", "rendah"],
};

export const riskPillLabel = (dataset: Dataset): string =>
  dataset === "rejected" ? "DTI tertinggi" : "Default tertinggi";

/** Catatan yang wajib menyertai angka rejected agar proksi tidak dibaca sebagai fakta. */
export const REJECTED_RISK_NOTE =
  "Rejected tidak punya label gagal bayar, jadi tingkat risiko didekati dari median DTI " +
  "(rasio utang terhadap pendapatan) sesuai Fase 2 — bukan angka gagal bayar sebenarnya.";

/** Rentang >1 tahun pada rejected memakai rata-rata tertimbang median tiap tahun.
 *  Untuk accepted metriknya mean, sehingga penggabungan lintas tahun eksak; median
 *  tidak bisa digabung seperti itu, jadi nilainya hampiran — dinyatakan di UI. */
export const REJECTED_MULTIYEAR_NOTE =
  "Untuk rentang lebih dari satu tahun, DTI dihitung sebagai rata-rata tertimbang " +
  "median tiap tahun (median tidak bisa digabung secara eksak).";
