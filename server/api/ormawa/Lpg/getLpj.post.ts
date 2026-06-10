import { defineEventHandler, readBody, createError } from "h3";
import { useDrizzle } from "../../../db/index";
import { eq, and } from "drizzle-orm";
import { lpgTable } from "../../../db/schema/lpgSchema";
import { kegiatanTable } from "../../../db/schema/KegiatanSchema";
import { pengajuanRabTable } from "../../../db/schema/pengajuanRabSchema";

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  try {
    const body = await readBody(event);
    const { rabId } = body;

    if (!rabId) {
      throw createError({ statusCode: 400, message: "RAB ID wajib diisi" });
    }

    const db = useDrizzle();

    // Get LPG data and check access
    const result = await db
      .select({
        lpg: lpgTable,
        ormawaId: pengajuanRabTable.ormawaId,
        usersId: pengajuanRabTable.usersId,
      })
      .from(pengajuanRabTable)
      .innerJoin(kegiatanTable, eq(pengajuanRabTable.id, kegiatanTable.pengajuanRabId))
      .innerJoin(lpgTable, eq(kegiatanTable.id, lpgTable.kegiatanId))
      .where(eq(pengajuanRabTable.id, Number(rabId)))
      .limit(1);

    if (result.length === 0) {
      return { success: true, data: null };
    }

    const { lpg, ormawaId, usersId } = result[0];
    const isOwner = user.role === "ormawa" && (String(usersId) === String(user.id) || String(ormawaId) === String(user.ormawaId));
    const isStaff = ["spi", "ppk", "kaprodi"].includes(user.role);

    if (!isOwner && !isStaff) {
      throw createError({ statusCode: 403, message: "Forbidden" });
    }

    return {
      success: true,
      data: lpg,
    };
  } catch (error: any) {
    console.error("Error fetching LPJ:", error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: "Terjadi kesalahan server: " + error.message,
    });
  }
});
