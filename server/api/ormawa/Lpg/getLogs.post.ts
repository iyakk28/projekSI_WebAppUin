import { defineEventHandler, readBody, createError } from "h3";
import { useDrizzle } from "~~/server/db/index";
import { eq, desc, sql, and } from "drizzle-orm";
import { lpgTable } from "~~/server/db/schema/lpgSchema";
import { kegiatanTable } from "~~/server/db/schema/KegiatanSchema";
import { revisiLpgLogTable } from "~~/server/db/schema/revisiLpgLogSchema";
import { usersTable } from "~~/server/db/schema/usersSchema";
import { pengajuanRabTable } from "~~/server/db/schema/pengajuanRabSchema";

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  try {
    const body = await readBody(event);
    const { rabId, limit = 5, offset = 0 } = body;

    if (!rabId) {
      throw createError({ statusCode: 400, message: "RAB ID wajib diisi" });
    }

    const db = useDrizzle();

    // Verify ownership and get LPG ID
    const accessCheck = await db
      .select({
        lpgId: lpgTable.id,
        ormawaId: pengajuanRabTable.ormawaId,
        usersId: pengajuanRabTable.usersId,
      })
      .from(pengajuanRabTable)
      .innerJoin(kegiatanTable, eq(pengajuanRabTable.id, kegiatanTable.pengajuanRabId))
      .innerJoin(lpgTable, eq(kegiatanTable.id, lpgTable.kegiatanId))
      .where(eq(pengajuanRabTable.id, Number(rabId)))
      .limit(1);

    if (accessCheck.length === 0) {
      return { success: true, data: [], total: 0, hasMore: false };
    }

    const data = accessCheck[0];
    const isOwner = user.role === "ormawa" && (String(data.usersId) === String(user.id) || String(data.ormawaId) === String(user.ormawaId));
    const isStaff = ["spi", "ppk", "kaprodi"].includes(user.role);

    if (!isOwner && !isStaff) {
      throw createError({ statusCode: 403, message: "Forbidden" });
    }

    const lpgId = data.lpgId;

    // Hitung total log
    const [totalCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(revisiLpgLogTable)
      .where(eq(revisiLpgLogTable.lpgId, lpgId));

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
      .where(eq(revisiLpgLogTable.lpgId, lpgId))
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
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: "Terjadi kesalahan server: " + error.message,
    });
  }
});
