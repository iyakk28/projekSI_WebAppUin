// FILE: server/api/ppk/pengajuan/lunas.get.ts
// Mengambil daftar RAB yang sudah LUNAS kegiatannya dengan Pagination
// Dioptimalkan dengan join langsung dan filter fakultasId

import { eq, and, sql, desc, like, count } from "drizzle-orm";
import { useDrizzle } from "~~/server/db";
import {
  pengajuanRabTable,
  kegiatanTable,
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
        statusMessage: "Akses ditolak. Peran PPK diperlukan.",
      });
    }

    const fakultasId = user.fakultasId;
    if (!fakultasId) {
      return { success: true, data: [], total: 0 };
    }

    const query = getQuery(event);
    const { ormawaId, prodiId, search, startDate, endDate } = query;

    // Pagination params
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    const offset = (page - 1) * limit;

    // Base filters
    const filters = [
      eq(pengajuanRabTable.fakultasId, String(fakultasId)),
      eq(kegiatanTable.statusKegiatan, "LUNAS"),
    ];

    if (ormawaId) {
      filters.push(eq(pengajuanRabTable.ormawaId, String(ormawaId)));
    }

    if (prodiId) {
      filters.push(eq(pengajuanRabTable.prodiId, String(prodiId)));
    }

    if (search) {
      filters.push(like(pengajuanRabTable.judulKegiatan, `%${search}%`));
    }

    if (startDate && endDate) {
      filters.push(
        and(
          sql`${pengajuanRabTable.createdAt} >= ${startDate}`,
          sql`${pengajuanRabTable.createdAt} <= ${endDate}`,
        ),
      );
    }

    // 1. Hitung Total Data
    const totalQuery = await db
      .select({ value: count() })
      .from(pengajuanRabTable)
      .innerJoin(
        kegiatanTable,
        eq(pengajuanRabTable.id, kegiatanTable.pengajuanRabId),
      )
      .where(and(...filters));

    const total = totalQuery[0]?.value || 0;

    // 2. Ambil Data Detail dengan Join
    const data = await db
      .select({
        id: pengajuanRabTable.id,
        nomorPengajuan: pengajuanRabTable.nomorPengajuan,
        judulKegiatan: pengajuanRabTable.judulKegiatan,
        totalAnggaran: pengajuanRabTable.totalAnggaran,
        status: pengajuanRabTable.status,
        createdAt: pengajuanRabTable.createdAt,
        ormawaNama: ormawaTable.nama,
        ormawaKode: ormawaTable.kode,
        prodiNama: programStudiTable.nama,
        statusKegiatan: kegiatanTable.statusKegiatan,
        pengajuNama: usersTable.fullName,
      })
      .from(pengajuanRabTable)
      .innerJoin(
        kegiatanTable,
        eq(pengajuanRabTable.id, kegiatanTable.pengajuanRabId),
      )
      .innerJoin(usersTable, eq(pengajuanRabTable.usersId, usersTable.id))
      .innerJoin(ormawaTable, eq(pengajuanRabTable.ormawaId, ormawaTable.id))
      .leftJoin(
        programStudiTable,
        eq(
          sql`CAST(${pengajuanRabTable.prodiId} AS UNSIGNED)`,
          programStudiTable.id,
        ),
      )
      .where(and(...filters))
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
    console.error("Error GET /api/ppk/pengajuan/lunas:", error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Gagal mengambil data pengajuan lunas",
    });
  }
});
