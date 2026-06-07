// FILE: server/api/ppk/dashboard/index.get.ts
// Endpoint untuk mengambil statistik dashboard PPK

import { eq, sql, ne, and } from "drizzle-orm";
import {
  pengajuanRabTable,
  usersTable,
  ormawaTable,
} from "~~/server/db/schema";
import { useDrizzle } from "~~/server/db";

export default defineEventHandler(async (event) => {
  try {
    const db = useDrizzle();
    const { user } = event.context;

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: "User tidak terautentikasi",
      });
    }

    if (user.role !== "ppk") {
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
        message: "PPK tidak memiliki fakultasId",
      };
    }

    // ========== QUERY STATISTIK (SINGLE OPTIMIZED QUERY) ==========

    const statsQuery = await db
      .select({
        total: sql<number>`COUNT(*)`,
        menunggu: sql<number>`SUM(CASE WHEN ${pengajuanRabTable.status} = 'waiting_ppk' THEN 1 ELSE 0 END)`,
        revisi: sql<number>`SUM(CASE WHEN ${pengajuanRabTable.status} = 'revisi_ppk' THEN 1 ELSE 0 END)`,
        // Note: 'disetujui_ppk' diubah ke 'lunas_ppk' agar sesuai dengan statusEnum di schema dan penggunaan di API lain.
        disetujui: sql<number>`SUM(CASE WHEN ${pengajuanRabTable.status} IN ('lunas_ppk', 'waiting_spi', 'disetujui', 'selesai_spi') THEN 1 ELSE 0 END)`,
        ditolak: sql<number>`SUM(CASE WHEN ${pengajuanRabTable.status} = 'ditolak_spi' THEN 1 ELSE 0 END)`,
      })
      .from(pengajuanRabTable)
      .innerJoin(usersTable, eq(pengajuanRabTable.usersId, usersTable.id))
      .innerJoin(ormawaTable, eq(usersTable.ormawaId, ormawaTable.id))
      .where(
        and(
          ne(pengajuanRabTable.status, "draft"),
          eq(ormawaTable.fakultasId, fakultasId),
        ),
      );

    const result = statsQuery[0] || {
      total: 0,
      menunggu: 0,
      revisi: 0,
      disetujui: 0,
      ditolak: 0,
    };

    const finalResult = {
      success: true,
      total: Number(result.total ?? 0),
      menunggu: Number(result.menunggu ?? 0),
      revisi: Number(result.revisi ?? 0),
      disetujui: Number(result.disetujui ?? 0),
      ditolak: Number(result.ditolak ?? 0),
    };

    return finalResult;
  } catch (error: any) {
    console.error("Error timestamp:", new Date().toISOString());
    console.error("Error object:", error);
    console.error("Error message:", error?.message);
    console.error("Error statusCode:", error?.statusCode);
    console.error("Error stack:", error?.stack);

    // Log specific error types
    if (error?.code) {
      console.error("Database error code:", error.code);
    }

    if (error?.meta) {
      console.error("Database error meta:", error.meta);
    }

    console.error("=== END ERROR ===");

    // Jika error sudah memiliki statusCode, lempar ulang
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Gagal mengambil data dashboard PPK",
      data: error?.message || "Unknown error",
    });
  }
});
