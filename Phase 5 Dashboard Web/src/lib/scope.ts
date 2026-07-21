import type { Dataset } from "../types";

/** Cakupan data per dataset.
 *
 *  Untuk rejected, scripts/build_data.py hanya mengekspor anomali tier "Kuat" ke atas
 *  (REJECTED_MIN_TIER_RANK) — tier Sedang & Lemah dibuang karena volumenya jutaan baris.
 *  Jadi angka rejected di dashboard BUKAN total anomali rejected seperti di notebook
 *  Fase 4, dan gauge "% bukti kuat" rejected otomatis 100% (bukan bug, tapi konsekuensi
 *  filter). Helper di bawah dipakai supaya semua label memberi tahu hal ini secara
 *  eksplisit, bukan menyisakan angka yang tampak tidak sinkron. */
export const isStrongOnly = (dataset: Dataset): boolean => dataset === "rejected";

/** Satuan angka record, mis. "547.100 record bukti kuat". */
export const recordUnit = (dataset: Dataset): string =>
  isStrongOnly(dataset) ? "record bukti kuat" : "record";

/** Frasa untuk kalimat, mis. "... record anomali bukti kuat rejected". */
export const recordPhrase = (dataset: Dataset): string =>
  isStrongOnly(dataset)
    ? `record anomali bukti kuat ${dataset}`
    : `record anomali ${dataset}`;

/** Penjelasan satu kalimat kenapa angka rejected lebih kecil dari laporan Fase 4. */
export const REJECTED_SCOPE_TEXT =
  "Dashboard hanya memuat anomali rejected bertier Kuat (3 metode), Sangat Kuat, dan " +
  "Kritis. Tier Sedang & Lemah tidak diekspor, jadi angka di sini adalah jumlah anomali " +
  "bukti kuat — bukan total anomali rejected pada laporan Fase 4.";
