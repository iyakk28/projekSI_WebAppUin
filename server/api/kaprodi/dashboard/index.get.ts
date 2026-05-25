// FILE: server/api/kaprodi/dashboard/index.get.ts
// Endpoint untuk mengambil statistik pengajuan proposal milik Ormawa binaan Kaprodi
// Mengikuti pola server/api/ppk/dashboard/index.get.ts dengan adaptasi relasi prodiId

import { eq, sql, ne, and, inArray } from "drizzle-orm";
import { pengajuanRabTable, usersTable, ormawaTable } from "~~/server/db/schema";
import { useDrizzle } from "~~/server/db";

export default defineEventHandler(async (event) => {
  try {
    const db = useDrizzle();
    const { user } = event.context;

    // Pastikan user terautentikasi dan memiliki prodiId
    if (!user || user.role !== "kaprodi") {
      throw createError({
        statusCode: 403,
        statusMessage: "Akses ditolak. Peran Kaprodi diperlukan.",
      });
    }

    const prodiId = user.prodiId;

    if (!prodiId) {
      return {
        success: true,
        total: 0,
        menunggu: 0,
        disetujui: 0,
        revisi: 0,
        ditolak: 0,
        data: { total: 0, menunggu: 0, disetujui: 0, revisi: 0, ditolak: 0 },
      };
    }

    // Step 1: Cari semua ormawa yang terikat pada prodiId Kaprodi
    const ormawaRows = await db
      .select({ id: ormawaTable.id })
      .from(ormawaTable)
      .where(eq(ormawaTable.prodiId, prodiId));

    const ormawaIds = ormawaRows.map((o) => o.id);

    if (ormawaIds.length === 0) {
      return {
        success: true,
        total: 0,
        menunggu: 0,
        disetujui: 0,
        revisi: 0,
        ditolak: 0,
        data: { total: 0, menunggu: 0, disetujui: 0, revisi: 0, ditolak: 0 },
      };
    }

    // Step 2: Cari all users_id (varchar) yang terikat pada ormawa tersebut
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
        data: { total: 0, menunggu: 0, disetujui: 0, revisi: 0, ditolak: 0 },
      };
    }

    // Step 3: Hitung jumlah pengajuan berdasarkan status
    // waiting_kaprodi -> Menunggu review
    // revisi_kaprodi  -> Diminta revisi
    // Selain draft, waiting_kaprodi, dan revisi_kaprodi -> Disetujui/dilanjutkan Kaprodi
    // ditolak_spi      -> Ditolak
    const [total, menunggu, revisi, disetujui, ditolak] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(pengajuanRabTable)
        .where(
          and(
            ne(pengajuanRabTable.status, "draft"),
            inArray(pengajuanRabTable.usersId, ormawaUserIds)
          )
        ),
      db
        .select({ count: sql<number>`count(*)` })
        .from(pengajuanRabTable)
        .where(
          and(
            eq(pengajuanRabTable.status, "waiting_kaprodi"),
            inArray(pengajuanRabTable.usersId, ormawaUserIds)
          )
        ),
      db
        .select({ count: sql<number>`count(*)` })
        .from(pengajuanRabTable)
        .where(
          and(
            eq(pengajuanRabTable.status, "revisi_kaprodi"),
            inArray(pengajuanRabTable.usersId, ormawaUserIds)
          )
        ),
      db
        .select({ count: sql<number>`count(*)` })
        .from(pengajuanRabTable)
        .where(
          and(
            inArray(pengajuanRabTable.status, [
              "waiting_ppk",
              "revisi_ppk",
              "waiting_spi",
              "disetujui",
              "selesai_spi",
            ]),
            inArray(pengajuanRabTable.usersId, ormawaUserIds)
          )
        ),
      db
        .select({ count: sql<number>`count(*)` })
        .from(pengajuanRabTable)
        .where(
          and(
            eq(pengajuanRabTable.status, "ditolak_spi"),
            inArray(pengajuanRabTable.usersId, ormawaUserIds)
          )
        ),
    ]);

    const stats = {
      total: Number(total[0]?.count ?? 0),
      menunggu: Number(menunggu[0]?.count ?? 0),
      disetujui: Number(disetujui[0]?.count ?? 0),
      revisi: Number(revisi[0]?.count ?? 0),
      ditolak: Number(ditolak[0]?.count ?? 0),
    };

    return {
      success: true,
      ...stats,
      data: stats,
    };
  } catch (error: any) {
    console.error("Error GET /api/kaprodi/dashboard:", error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Gagal mengambil data dashboard Kaprodi",
      data: error,
    });
  }
});
