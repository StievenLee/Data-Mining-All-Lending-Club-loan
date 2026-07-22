// useRafCommit.ts — gabungkan panggilan beruntun jadi satu per frame.

import { useCallback, useEffect, useRef } from "react";

/** Bungkus sebuah setter agar dipanggil paling banyak SEKALI per frame.
 *
 *  `<input type="range">` menembakkan onChange puluhan kali per detik selama
 *  thumb-nya digeser. Tanpa peredam, tiap tembakan menjalankan seluruh rantai
 *  filter — memindai ratusan ribu baris lalu menyusun ulang chart — sehingga
 *  pekerjaan menumpuk lebih cepat daripada browser sempat menyelesaikannya, dan
 *  geseran terasa tersendat meski satu lintasannya sendiri tergolong cepat.
 *
 *  Nilai TERAKHIR yang menang, jadi tidak ada input user yang hilang: yang
 *  dilewati hanya nilai antara yang toh tak akan sempat terlihat. Nilai akhir
 *  selalu ter-commit karena setiap panggilan memperbarui `latest`.
 */
export function useRafCommit<T>(commit: (value: T) => void): (value: T) => void {
  const latest = useRef<T | null>(null);
  const frame = useRef<number | null>(null);

  // Simpan commit terbaru di ref supaya fungsi yang dikembalikan tetap stabil
  // identitasnya; kalau tidak, tiap render menghasilkan handler baru dan efek
  // di bawahnya ikut berjalan ulang tanpa alasan.
  const commitRef = useRef(commit);
  commitRef.current = commit;

  useEffect(
    () => () => {
      if (frame.current != null) cancelAnimationFrame(frame.current);
    },
    []
  );

  return useCallback((value: T) => {
    latest.current = value;
    if (frame.current != null) return; // sudah ada frame terjadwal — cukup perbarui nilainya
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      commitRef.current(latest.current as T);
    });
  }, []);
}
