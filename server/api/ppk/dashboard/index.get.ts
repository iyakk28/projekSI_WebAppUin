import { eq, sql, ne, inArray, notInArray } from "drizzle-orm";
import { pengajuanRabTable } from "~~/server/db/schema";
import { useDrizzle } from "~~/server/db";

export default defineEventHandler(async (event) => {
  try {
    const db = useDrizzle();

    const [total, menunggu, disetujui, revisi, ditolak] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(pengajuanRabTable)
        .where(ne(pengajuanRabTable.status, "draft")),

      db
        .select({ count: sql<number>`count(*)` })
        .from(pengajuanRabTable)
        .where(eq(pengajuanRabTable.status, "waiting_ppk")),

      db
        .select({ count: sql<number>`count(*)` })
        .from(pengajuanRabTable)
        .where(eq(pengajuanRabTable.status, "waiting_spi")),

      db
        .select({ count: sql<number>`count(*)` })
        .from(pengajuanRabTable)
        .where(eq(pengajuanRabTable.status, "revisi_ppk")),

      db
        .select({ count: sql<number>`count(*)` })
        .from(pengajuanRabTable)
        .where(eq(pengajuanRabTable.status, "ditolak_spi")),
    ]);

    return {
      total: total[0]?.count ?? 0,
      menunggu: menunggu[0]?.count ?? 0,
      disetujui: disetujui[0]?.count ?? 0,
      revisi: revisi[0]?.count ?? 0,
      ditolak: ditolak[0]?.count ?? 0,
    };
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Gagal mengambil data dashboard",
      data: error,
    });
  }
});