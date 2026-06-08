import { useDrizzle } from "~~/server/db/index";
import {
  pengajuanRabTable,
  kegiatanTable,
  dokumentasiKegiatanTable,
} from "~~/server/db/schema/index";
import { eq, and, sql, count } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  try {
    const db = useDrizzle();

    // 1. Total RAB yang sudah disetujui (Status 'disetujui' atau 'lunas_ppk' atau 'selesai_spi')
    // Sesuai dengan statusEnum di pengajuanRabSchema
    const [totalApprovedRabResult] = await db
      .select({ value: count() })
      .from(pengajuanRabTable)
      .where(eq(pengajuanRabTable.status, "disetujui"));

    // 2. Kegiatan yang akan dilaksanakan (BELUM_DILAKSANAKAN)
    const upcomingActivities = await db
      .select({
        id: kegiatanTable.id,
        statusKegiatan: kegiatanTable.statusKegiatan,
        tanggalMulai: pengajuanRabTable.tanggalMulai,
        tanggalSelesai: pengajuanRabTable.tanggalSelesai,
        judulKegiatan: pengajuanRabTable.judulKegiatan,
        deskripsi: pengajuanRabTable.deskripsi,
        totalAnggaran: pengajuanRabTable.totalAnggaran,
        fileTorUrl: pengajuanRabTable.fileTorUrl,
      })
      .from(kegiatanTable)
      .innerJoin(
        pengajuanRabTable,
        eq(kegiatanTable.pengajuanRabId, pengajuanRabTable.id),
      )
      .where(eq(kegiatanTable.statusKegiatan, "BELUM_DILAKSANAKAN"))
      .limit(10);

    const [totalUpcomingResult] = await db
      .select({ value: count() })
      .from(kegiatanTable)
      .where(eq(kegiatanTable.statusKegiatan, "BELUM_DILAKSANAKAN"));

    // 3. Total kegiatan sedang berjalan
    const [totalOngoingResult] = await db
      .select({ value: count() })
      .from(kegiatanTable)
      .where(eq(kegiatanTable.statusKegiatan, "SEDANG_DILAKSANAKAN"));

    // 4. Total kegiatan selesai
    const [totalCompletedResult] = await db
      .select({ value: count() })
      .from(kegiatanTable)
      .where(eq(kegiatanTable.statusKegiatan, "SELESAI"));

    // 5. Total dokumentasi
    const [totalDocumentationResult] = await db
      .select({ value: count() })
      .from(dokumentasiKegiatanTable);

    // Ambil beberapa data untuk detail di dashboard
    const ongoingActivities = await db
      .select({
        id: kegiatanTable.id,
        judulKegiatan: pengajuanRabTable.judulKegiatan,
        statusKegiatan: kegiatanTable.statusKegiatan,
      })
      .from(kegiatanTable)
      .innerJoin(
        pengajuanRabTable,
        eq(kegiatanTable.pengajuanRabId, pengajuanRabTable.id),
      )
      .where(eq(kegiatanTable.statusKegiatan, "SEDANG_DILAKSANAKAN"))
      .limit(5);

    const completedActivities = await db
      .select({
        id: kegiatanTable.id,
        judulKegiatan: pengajuanRabTable.judulKegiatan,
        statusKegiatan: kegiatanTable.statusKegiatan,
      })
      .from(kegiatanTable)
      .innerJoin(
        pengajuanRabTable,
        eq(kegiatanTable.pengajuanRabId, pengajuanRabTable.id),
      )
      .where(eq(kegiatanTable.statusKegiatan, "SELESAI"))
      .limit(5);

    return {
      success: true,
      summary: {
        totalApprovedRab: totalApprovedRabResult.value,
        upcomingActivities: totalUpcomingResult.value,
        ongoingActivities: totalOngoingResult.value,
        completedActivities: totalCompletedResult.value,
        totalDocumentation: totalDocumentationResult.value,
      },
      upcomingActivities,
      ongoingActivities,
      completedActivities,
    };
  } catch (error: any) {
    console.error("SPI Dashboard Error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Gagal mengambil data dashboard SPI",
      data: error?.message || error,
    });
  }
});
