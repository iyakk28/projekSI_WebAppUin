import { defineEventHandler, readBody, createError } from "h3";
import { useDrizzle } from "~~/server/db/index";
import { eq, desc, sql } from "drizzle-orm";
import { lpgTable } from "~~/server/db/schema/lpgSchema";
import { kegiatanTable } from "~~/server/db/schema/KegiatanSchema";
import { revisiLpgLogTable } from "~~/server/db/schema/revisiLpgLogSchema";
import { usersTable } from "~~/server/db/schema/usersSchema";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { rabId, limit = 5, offset = 0 } = body;

    if (!rabId) {
      throw createError({ statusCode: 400, message: "RAB ID wajib diisi" });
    }

    const db = useDrizzle();

    // Get kegiatanId
    const kegiatan = await db.query.kegiatanTable.findFirst({
      where: eq(kegiatanTable.pengajuanRabId, Number(rabId)),
    });

    if (!kegiatan) {
      return { success: true, data: [], total: 0, hasMore: false };
    }

    // Get LPG
    const lpg = await db.query.lpgTable.findFirst({
      where: eq(lpgTable.kegiatanId, kegiatan.id),
    });

    if (!lpg) {
      return { success: true, data: [], total: 0, hasMore: false };
    }

    // Hitung total log
    const [totalCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(revisiLpgLogTable)
      .where(eq(revisiLpgLogTable.lpgId, lpg.id));

    const total = Number(totalCount?.count || 0);

    // Get Logs with pagination
    const logsData = await db
      .select({
        id: revisiLpgLogTable.id,
        catatanRevisi: revisiLpgLogTable.catatanRevisi,
        createdAt: revisiLpgLogTable.createdAt,
        actor: {
          fullname: usersTable.fullName,
          role: usersTable.role,
        },
      })
      .from(revisiLpgLogTable)
      .innerJoin(usersTable, eq(revisiLpgLogTable.requesterId, usersTable.id))
      .where(eq(revisiLpgLogTable.lpgId, lpg.id))
      .orderBy(desc(revisiLpgLogTable.createdAt))
      .limit(Number(limit))
      .offset(Number(offset));

    return {
      success: true,
      data: logsData,
      total,
      limit: Number(limit),
      offset: Number(offset),
      hasMore: Number(offset) + logsData.length < total,
    };
  } catch (error: any) {
    console.error("Error fetching LPJ logs:", error);
    throw createError({
      statusCode: 500,
      message: "Terjadi kesalahan server: " + error.message,
    });
  }
});
