import { defineEventHandler, getQuery, createError } from "h3";
import { useDrizzle } from "../../../db/index";
import {
  pengajuanRabTable,
  usersTable,
  ormawaTable,
  fakultasTable,
  programStudiTable,
} from "../../../db/schema/index";
import { eq, or, and, sql, gte, lte, like } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user || user.role !== "spi") {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  try {
    const db = useDrizzle();
    const query = getQuery(event);
    
    // We only show finished or advanced stage RABs for comprehensive reports
    const finishedStatuses = ["selesai_spi", "disetujui", "lunas_ppk"];
    
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

    const filters = [];

    // Filter by finished status if 'all' is selected among finished ones
    if (!status || status === "all") {
      filters.push(or(...finishedStatuses.map(s => eq(pengajuanRabTable.status, s as any))));
    } else if (finishedStatuses.includes(status)) {
      filters.push(eq(pengajuanRabTable.status, status as any));
    } else {
        // If they ask for a status that isn't "finished", but we are in report mode, 
        // we still restrict to finished ones.
        filters.push(or(...finishedStatuses.map(s => eq(pengajuanRabTable.status, s as any))));
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
      filters.push(gte(pengajuanRabTable.tanggalMulai, startDate));
    }

    if (endDate) {
      filters.push(lte(pengajuanRabTable.tanggalSelesai, endDate));
    }

    if (search) {
      filters.push(
        or(
          like(pengajuanRabTable.judulKegiatan, `%${search}%`),
          like(pengajuanRabTable.nomorPengajuan, `%${search}%`),
        ),
      );
    }

    const whereClause = filters.length > 0 ? and(...filters) : undefined;

    // Get total count
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(pengajuanRabTable)
      .leftJoin(usersTable, eq(pengajuanRabTable.usersId, usersTable.users_id))
      .leftJoin(ormawaTable, eq(usersTable.ormawaId, ormawaTable.id))
      .where(whereClause);

    const total = totalCountResult[0].count;

    const data = await db
      .select({
        id: pengajuanRabTable.id,
        nomorPengajuan: pengajuanRabTable.nomorPengajuan,
        judulKegiatan: pengajuanRabTable.judulKegiatan,
        totalAnggaran: pengajuanRabTable.totalAnggaran,
        status: pengajuanRabTable.status,
        createdAt: pengajuanRabTable.createdAt,
        tanggalMulai: pengajuanRabTable.tanggalMulai,
        tanggalSelesai: pengajuanRabTable.tanggalSelesai,
        ormawa: ormawaTable.nama,
        fakultas: fakultasTable.nama,
        prodi: programStudiTable.nama,
      })
      .from(pengajuanRabTable)
      .leftJoin(usersTable, eq(pengajuanRabTable.usersId, usersTable.users_id))
      .leftJoin(ormawaTable, eq(ormawaTable.id, usersTable.ormawaId))
      .leftJoin(
        fakultasTable,
        eq(pengajuanRabTable.fakultasId, fakultasTable.id),
      )
      .leftJoin(
        programStudiTable,
        eq(pengajuanRabTable.prodiId, programStudiTable.id),
      )
      .where(whereClause)
      .orderBy(sql`${pengajuanRabTable.createdAt} DESC`)
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
    return {
      success: false,
      message: error.message || "Gagal mengambil data laporan",
    };
  }
});
