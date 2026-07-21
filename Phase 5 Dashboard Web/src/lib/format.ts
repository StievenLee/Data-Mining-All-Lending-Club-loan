// format.ts — util format angka seragam untuk SELURUH dashboard.
// Aturan konsisten: bilangan pecahan tampil 2 angka di belakang koma;
// bilangan bulat tampil tanpa desimal. Pemisah desimal memakai koma (id-ID).

/** 2 desimal (koma) bila ada pecahan; tanpa desimal bila bulat.
 *  Contoh: 84 -> "84", 89,1 -> "89,10", 5,772 -> "5,77". */
export function fmt2(x: number): string {
  const s = (Number.isFinite(x) ? x : 0).toFixed(2);
  return s.endsWith(".00") ? s.slice(0, -3) : s.replace(".", ",");
}

/** Persen mengikuti aturan fmt2. Contoh: 84 -> "84%", 89,1 -> "89,10%". */
export function pct2(x: number): string {
  return fmt2(x) + "%";
}

/** Bilangan bulat dengan pemisah ribuan Indonesia (mis. 1.348.099). */
export function intId(n: number): string {
  return Math.round(Number.isFinite(n) ? n : 0).toLocaleString("id-ID");
}
