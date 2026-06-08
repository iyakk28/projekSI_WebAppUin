import { useDrizzle } from "~~/server/db/index";
import {
  pengajuanRabTable,
  usersTable,
  ormawaTable,
  fakultasTable,
  programStudiTable,
} from "~~/server/db/schema/index";
import { eq, or, and, sql, gte, lte, like, count, desc } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  try {
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

    const filters = [];

    if (status && status !== "all") {
      filters.push(eq(pengajuanRabTable.status, status as any));
    }

    if (fakultasId) {
      filters.push(eq(pengajuanRabTable.fakultasId, fakultasId));
    }

    if (prodiId) {
      filters.push(eq(pengajuanRabTable.prodiId, prodiId));
    }

    if (ormawaId) {
      filters.push(eq(pengajuanRabTable.ormawaId, ormawaId));
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
    const [totalCountResult] = await db
      .select({ count: count() })
      .from(pengajuanRabTable)
      .where(whereClause);

    const total = totalCountResult.count;

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
        pengaju: usersTable.fullName,
        ormawa: ormawaTable.nama,
        fakultas: fakultasTable.nama,
        prodi: programStudiTable.nama,
      })
      .from(pengajuanRabTable)
      .leftJoin(usersTable, eq(sql`CAST(${pengajuanRabTable.usersId} AS UNSIGNED)`, usersTable.id))
      .leftJoin(ormawaTable, eq(sql`CAST(${pengajuanRabTable.ormawaId} AS UNSIGNED)`, ormawaTable.id))
      .leftJoin(
        fakultasTable,
        eq(sql`CAST(${pengajuanRabTable.fakultasId} AS UNSIGNED)`, fakultasTable.id),
      )
      .leftJoin(
        programStudiTable,
        eq(sql`CAST(${pengajuanRabTable.prodiId} AS UNSIGNED)`, programStudiTable.id),
      )
      .where(whereClause)
      .orderBy(desc(pengajuanRabTable.createdAt))
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
      message: error.message || "Gagal mengambil data RAB",
    };
  }
});
