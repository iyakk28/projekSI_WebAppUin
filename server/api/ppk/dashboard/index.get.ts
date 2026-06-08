// FILE: server/api/ppk/dashboard/index.get.ts
// Endpoint untuk mengambil statistik dashboard PPK
// Dioptimalkan dengan filter fakultasId langsung dari pengajuan_rab

import { eq, sql, ne, and } from "drizzle-orm";
import { pengajuanRabTable } from "~~/server/db/schema";
import { useDrizzle } from "~~/server/db";

export default defineEventHandler(async (event) => {
  try {
    const db = useDrizzle();
    const { user } = event.context;

    if (!user || user.role !== "ppk") {
      throw createError({
        statusCode: 403,
        statusMessage: "Akses ditolak. Peran PPK diperlukan.",
      });
    }

    const fakultasId = user.fakultasId;

    if (!fakultasId) {
      return {
        success: true,
        total: 0,
        menunggu: 0,
        disetujui: 0,
        revisi: 0,
        ditolak: 0,
        message: "PPK tidak memiliki fakultasId yang valid",
      };
    }

    // ========== QUERY STATISTIK (SINGLE OPTIMIZED QUERY) ==========
    // Menggunakan filter fakultasId langsung dari pengajuan_rab untuk efisiensi maksimal
    const statsQuery = await db
      .select({
        total: sql<number>`count(case when status != 'draft' then 1 end)`,
        menunggu: sql<number>`count(case when status = 'waiting_ppk' then 1 end)`,
        revisi: sql<number>`count(case when status = 'revisi_ppk' then 1 end)`,
        disetujui: sql<number>`count(case when status IN ('lunas_ppk', 'waiting_spi', 'disetujui', 'selesai_spi') then 1 end)`,
        ditolak: sql<number>`count(case when status = 'ditolak_spi' then 1 end)`,
      })
      .from(pengajuanRabTable)
      .where(eq(pengajuanRabTable.fakultasId, String(fakultasId)));

    const result = statsQuery[0] || {
      total: 0,
      menunggu: 0,
      revisi: 0,
      disetujui: 0,
      ditolak: 0,
    };

    return {
      success: true,
      total: Number(result.total ?? 0),
      menunggu: Number(result.menunggu ?? 0),
      revisi: Number(result.revisi ?? 0),
      disetujui: Number(result.disetujui ?? 0),
      ditolak: Number(result.ditolak ?? 0),
      data: {
        total: Number(result.total ?? 0),
        menunggu: Number(result.menunggu ?? 0),
        revisi: Number(result.revisi ?? 0),
        disetujui: Number(result.disetujui ?? 0),
        ditolak: Number(result.ditolak ?? 0),
      },
    };
  } catch (error: any) {
    console.error("Error GET /api/ppk/dashboard:", error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Gagal mengambil data statistik dashboard PPK",
      data: error.message,
    });
  }
});
