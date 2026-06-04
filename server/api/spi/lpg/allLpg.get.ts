import { defineEventHandler, getQuery, createError } from "h3";
import { useDrizzle } from "../../../db/index";
import { eq, desc, or, and, sql, gte, lte, like } from "drizzle-orm";
import { lpgTable } from "../../../db/schema/lpgSchema";
import { kegiatanTable } from "../../../db/schema/KegiatanSchema";
import { pengajuanRabTable } from "../../../db/schema/pengajuanRabSchema";
import { usersTable } from "../../../db/schema/usersSchema";
import { fakultasTable } from "../../../db/schema/fakultasSchema";
import { programStudiTable } from "../../../db/schema/programStudiSchema";
import { ormawaTable } from "../../../db/schema/ormawaSchema";

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user || user.role !== "spi") {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const db = useDrizzle();
  const query = getQuery(event);

  const status = query.status as string;
  const fakultasId = query.fakultasId as string;
  const prodiId = query.prodiId as string;
  const ormawaId = query.ormawaId as string;
  const startDate = query.startDate as string;
  const endDate = query.endDate as string;
  const search = query.search as string;

  const page = parseInt(query.page as string) || 1;
  const limit = parseInt(query.limit as string) || 10;
  const offset = (page - 1) * limit;

  try {
    const filters = [];

    // Basic eligibility for LPG
    filters.push(
      or(
        eq(kegiatanTable.statusKegiatan, "LUNAS"),
        eq(pengajuanRabTable.status, "selesai_spi")
      )
    );

    if (status && status !== "all") {
      if (status === "BELUM_UPLOAD") {
        filters.push(sql`${lpgTable.id} IS NULL`);
      } else {
        filters.push(eq(lpgTable.statusLpg, status as any));
      }
    }

    if (fakultasId) {
      filters.push(eq(pengajuanRabTable.fakultasId, fakultasId));
    }

    if (prodiId) {
      filters.push(eq(pengajuanRabTable.prodiId, prodiId));
    }

    if (ormawaId) {
      filters.push(eq(ormawaTable.id, parseInt(ormawaId)));
    }

    if (startDate) {
      filters.push(gte(lpgTable.submittedAt, startDate));
    }

    if (endDate) {
      filters.push(lte(lpgTable.submittedAt, endDate));
    }

    if (search) {
      filters.push(
        or(
          like(pengajuanRabTable.judulKegiatan, `%${search}%`),
          like(pengajuanRabTable.nomorPengajuan, `%${search}%`)
        )
      );
    }

    const whereClause = and(...filters);

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(pengajuanRabTable)
      .innerJoin(kegiatanTable, eq(pengajuanRabTable.id, kegiatanTable.pengajuanRabId))
      .innerJoin(usersTable, eq(pengajuanRabTable.usersId, usersTable.users_id))
      .leftJoin(ormawaTable, eq(usersTable.ormawaId, ormawaTable.id))
      .leftJoin(lpgTable, eq(kegiatanTable.id, lpgTable.kegiatanId))
      .where(whereClause);

    const total = countResult[0].count;

    const data = await db
      .select({
        rabId: pengajuanRabTable.id,
        nomorPengajuan: pengajuanRabTable.nomorPengajuan,
        judulKegiatan: pengajuanRabTable.judulKegiatan,
        totalAnggaran: pengajuanRabTable.totalAnggaran,
        rabStatus: pengajuanRabTable.status,
        ormawaName: usersTable.fullName,
        ormawaLabel: ormawaTable.nama,
        fakultasName: fakultasTable.nama,
        prodiName: programStudiTable.nama,
        lpgId: lpgTable.id,
        statusLpg: lpgTable.statusLpg,
        submittedAt: lpgTable.submittedAt,
        createdAt: lpgTable.createdAt,
      })
      .from(pengajuanRabTable)
      .innerJoin(kegiatanTable, eq(pengajuanRabTable.id, kegiatanTable.pengajuanRabId))
      .innerJoin(usersTable, eq(pengajuanRabTable.usersId, usersTable.users_id))
      .leftJoin(ormawaTable, eq(usersTable.ormawaId, ormawaTable.id))
      .leftJoin(fakultasTable, eq(pengajuanRabTable.fakultasId, fakultasTable.id))
      .leftJoin(programStudiTable, eq(pengajuanRabTable.prodiId, programStudiTable.id))
      .leftJoin(lpgTable, eq(kegiatanTable.id, lpgTable.kegiatanId))
      .where(whereClause)
      .orderBy(desc(lpgTable.submittedAt), desc(pengajuanRabTable.updatedAt))
      .limit(limit)
      .offset(offset);

    return {
      success: true,
      data,
      total,
      page,
      limit,
    };
  } catch (error: any) {
    console.error("Error fetching SPI all LPG:", error);
    throw createError({
      statusCode: 500,
      message: "Terjadi kesalahan server saat mengambil data LPG: " + error.message,
    });
  }
});
