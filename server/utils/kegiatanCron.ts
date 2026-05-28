import { useDrizzle } from "~~/server/db";
import { kegiatanTable, pengajuanRabTable } from "~~/server/db/schema";
import { eq, and, lte, gte, lt, gt, ne, or } from "drizzle-orm";

/**
 * Fungsi untuk mengupdate status kegiatan secara otomatis berdasarkan tanggal.
 * BELUM_DILAKSANAKAN -> SEDANG_DILAKSANAKAN (Jika hari ini di antara tgl mulai & selesai)
 * SEDANG_DILAKSANAKAN -> SELESAI (Jika hari ini sudah melewati tgl selesai)
 */
export async function updateStatusKegiatanOtomatis() {
  const db = useDrizzle();
  const today = new Date().toISOString().split("T")[0]; // format YYYY-MM-DD
  const todayDate = new Date(today);

  console.log(
    `[Cron Job] Menjalankan update status kegiatan: ${new Date().toLocaleString()}`,
  );

  try {
    // 1. Update ke SEDANG_DILAKSANAKAN
    // Kondisi: status BELUM_DILAKSANAKAN DAN today >= tanggalMulai DAN today <= tanggalSelesai
    const kegiatanToOngoing = await db
      .select({ id: kegiatanTable.id })
      .from(kegiatanTable)
      .innerJoin(
        pengajuanRabTable,
        eq(kegiatanTable.pengajuanRabId, pengajuanRabTable.id),
      )
      .where(
        and(
          eq(kegiatanTable.statusKegiatan, "BELUM_DILAKSANAKAN"),
          lte(pengajuanRabTable.tanggalMulai, todayDate),
          gte(pengajuanRabTable.tanggalSelesai, todayDate),
        ),
      );

    if (kegiatanToOngoing.length > 0) {
      for (const k of kegiatanToOngoing) {
        await db
          .update(kegiatanTable)
          .set({
            statusKegiatan: "SEDANG_DILAKSANAKAN",
            updatedAt: new Date().toISOString().slice(0, 19).replace("T", " "),
          })
          .where(eq(kegiatanTable.id, k.id));
      }
      console.log(
        `[Cron Job] ${kegiatanToOngoing.length} kegiatan diubah ke SEDANG_DILAKSANAKAN`,
      );
    }

    // 2. Update ke SELESAI
    // Kondisi: status != SELESAI DAN today > tanggalSelesai
    const kegiatanToDone = await db
      .select({ id: kegiatanTable.id })
      .from(kegiatanTable)
      .innerJoin(
        pengajuanRabTable,
        eq(kegiatanTable.pengajuanRabId, pengajuanRabTable.id),
      )
      .where(
        and(
          ne(kegiatanTable.statusKegiatan, "SELESAI"),
          lt(pengajuanRabTable.tanggalSelesai, todayDate),
        ),
      );

    if (kegiatanToDone.length > 0) {
      for (const k of kegiatanToDone) {
        await db
          .update(kegiatanTable)
          .set({
            statusKegiatan: "SELESAI",
            updatedAt: new Date().toISOString().slice(0, 19).replace("T", " "),
          })
          .where(eq(kegiatanTable.id, k.id));
      }
      console.log(
        `[Cron Job] ${kegiatanToDone.length} kegiatan diubah ke SELESAI`,
      );
    }
  } catch (error) {
    console.error("[Cron Job] Gagal melakukan update status kegiatan:", error);
  }
}
