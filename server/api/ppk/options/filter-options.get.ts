// FILE: server/api/ppk/options/filter-options.get.ts
// Mengambil opsi filter untuk PPK (Daftar Ormawa, Daftar Kaprodi, Daftar Prodi)

import { eq, and } from "drizzle-orm";
import { useDrizzle } from "~~/server/db";
import {
  ormawaTable,
  usersTable,
  programStudiTable,
} from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
  try {
    const db = useDrizzle();
    const { user } = event.context;

    if (!user || user.role !== "ppk") {
      throw createError({
        statusCode: 403,
        statusMessage: "Akses ditolak.",
      });
    }

    const fakultasId = user.fakultasId;
    if (!fakultasId) return { success: true, ormawa: [], kaprodi: [], prodi: [] };

    // 1. Ambil Prodi di Fakultas
    const prodi = await db.select().from(programStudiTable).where(eq(programStudiTable.fakultasId, Number(fakultasId)));

    // 2. Ambil Ormawa di Fakultas
    const ormawa = await db.select().from(ormawaTable).where(eq(ormawaTable.fakultasId, Number(fakultasId)));

    // 3. Ambil Kaprodi di Fakultas
    const kaprodi = await db.select({
      id: usersTable.id,
      fullName: usersTable.fullName,
      prodiId: usersTable.prodiId
    }).from(usersTable).where(and(
      eq(usersTable.fakultasId, Number(fakultasId)),
      eq(usersTable.role, "kaprodi")
    ));

    return {
      success: true,
      data: {
        prodi,
        ormawa,
        kaprodi
      }
    };
  } catch (error: any) {
    console.error("Error GET /api/ppk/options/filter-options:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Gagal mengambil opsi filter",
    });
  }
});
