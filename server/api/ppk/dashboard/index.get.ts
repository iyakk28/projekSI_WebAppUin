// FILE: server/api/ppk/dashboard/index.get.ts
// Endpoint untuk mengambil statistik dashboard PPK

import { eq, sql, ne, and, inArray } from "drizzle-orm";
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

    // ========== VALIDASI USER ==========
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

    // ========== STEP 1: Ambil semua Kaprodi dalam fakultas PPK ==========
    const kaprodiList = await db
      .select({ prodiId: usersTable.prodiId })
      .from(usersTable)
      .where(
        and(
          eq(usersTable.role, "kaprodi"),
          eq(usersTable.fakultasId, fakultasId),
        ),
      );

    const prodiIds = kaprodiList
      .map((k) => k.prodiId)
      .filter((id): id is number => id !== null);

    if (prodiIds.length === 0) {
      return {
        success: true,
        total: 0,
        menunggu: 0,
        disetujui: 0,
        revisi: 0,
        ditolak: 0,
        message: "Tidak ada prodi dalam fakultas ini",
      };
    }

    // ========== STEP 2: Ambil semua Ormawa dari prodi-prodi tersebut ==========
    const ormawaList = await db
      .select({ id: ormawaTable.id })
      .from(ormawaTable)
      .where(inArray(ormawaTable.prodiId, prodiIds));

    const ormawaIds = ormawaList.map((o) => o.id);

    if (ormawaIds.length === 0) {
      return {
        success: true,
        total: 0,
        menunggu: 0,
        disetujui: 0,
        revisi: 0,
        ditolak: 0,
        message: "Tidak ada Ormawa dalam prodi-prodi tersebut",
      };
    }

    // ========== STEP 3: Ambil semua users yang terkait dengan Ormawa ==========
    const ormawaUsers = await db
      .select({ usersId: usersTable.users_id })
      .from(usersTable)
      .where(inArray(usersTable.ormawaId, ormawaIds));

    const ormawaUserIds = ormawaUsers.map((u) => u.usersId);

    if (ormawaUserIds.length === 0) {
      return {
        success: true,
        total: 0,
        menunggu: 0,
        disetujui: 0,
        revisi: 0,
        ditolak: 0,
        message: "Tidak ada user yang terhubung dengan Ormawa",
      };
    }

    // ========== STEP 4: Hitung statistik dengan 1 query (optimized) ==========
    const statsQuery = await db
      .select({
        total: sql<number>`COUNT(*)`,
        menunggu: sql<number>`SUM(CASE WHEN ${pengajuanRabTable.status} = 'waiting_ppk' THEN 1 ELSE 0 END)`,
        revisi: sql<number>`SUM(CASE WHEN ${pengajuanRabTable.status} = 'revisi_ppk' THEN 1 ELSE 0 END)`,
        disetujui: sql<number>`SUM(CASE WHEN ${pengajuanRabTable.status} IN ('disetujui_ppk', 'waiting_spi', 'disetujui', 'selesai_spi') THEN 1 ELSE 0 END)`,
        ditolak: sql<number>`SUM(CASE WHEN ${pengajuanRabTable.status} = 'ditolak_spi' THEN 1 ELSE 0 END)`,
      })
      .from(pengajuanRabTable)
      .where(
        and(
          ne(pengajuanRabTable.status, "draft"),
          inArray(pengajuanRabTable.usersId, ormawaUserIds),
        ),
      );

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
    };
  } catch (error: any) {
    console.error("Error GET /api/ppk/dashboard:", error);

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
