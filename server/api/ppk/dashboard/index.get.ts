import { eq, sql, ne, and } from "drizzle-orm";
import { pengajuanRabTable } from "~/server/db/schema";
import { useDrizzle } from "~/server/db";

export default defineEventHandler(async (event) => {
  try {
    const db = useDrizzle();

    const user = event.context.user;
    const fakultasId = user.fakultasId; // ambil fakultas dari PPK yang login

    const [total, menunggu, disetujui, revisi, ditolak] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(pengajuanRabTable)
        .where(
          and(
            ne(pengajuanRabTable.status, "draft"),
            eq(pengajuanRabTable.fakultasId, fakultasId),
          ),
        ),

      db
        .select({ count: sql<number>`count(*)` })
        .from(pengajuanRabTable)
        .where(
          and(
            eq(pengajuanRabTable.status, "waiting_ppk"),
            eq(pengajuanRabTable.fakultasId, fakultasId),
          ),
        ),

      db
        .select({ count: sql<number>`count(*)` })
        .from(pengajuanRabTable)
        .where(
          and(
            eq(pengajuanRabTable.status, "waiting_spi"),
            eq(pengajuanRabTable.fakultasId, fakultasId),
          ),
        ),

      db
        .select({ count: sql<number>`count(*)` })
        .from(pengajuanRabTable)
        .where(
          and(
            eq(pengajuanRabTable.status, "revisi_ppk"),
            eq(pengajuanRabTable.fakultasId, fakultasId),
          ),
        ),

      db
        .select({ count: sql<number>`count(*)` })
        .from(pengajuanRabTable)
        .where(
          and(
            eq(pengajuanRabTable.status, "ditolak_spi"),
            eq(pengajuanRabTable.fakultasId, fakultasId),
          ),
        ),
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