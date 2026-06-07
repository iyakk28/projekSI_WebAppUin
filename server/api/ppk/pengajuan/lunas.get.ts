// FILE: server/api/ppk/pengajuan/lunas.get.ts
// Mengambil daftar RAB yang sudah LUNAS kegiatannya dengan Pagination

import { eq, and, sql, desc, inArray, like, count } from "drizzle-orm";
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
    const { ormawaId, prodiId, kaprodiId, search, startDate, endDate } = query;
    
    // Pagination params
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    const offset = (page - 1) * limit;

    // Base query: Pengajuan RAB yang sudah punya Kegiatan dan status kegiatannya LUNAS
    const filters = [
      eq(pengajuanRabTable.fakultasId, String(fakultasId)),
      eq(kegiatanTable.statusKegiatan, "LUNAS"),
    ];

    if (ormawaId) {
      filters.push(eq(usersTable.ormawaId, Number(ormawaId)));
    }

    if (prodiId) {
      filters.push(eq(pengajuanRabTable.prodiId, String(prodiId)));
    }

    if (kaprodiId) {
      const kaprodiUser = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, Number(kaprodiId))
      });
      if (kaprodiUser && kaprodiUser.prodiId) {
        filters.push(eq(pengajuanRabTable.prodiId, String(kaprodiUser.prodiId)));
      }
    }

    if (search) {
      filters.push(like(pengajuanRabTable.judulKegiatan, `%${search}%`));
    }

    if (startDate && endDate) {
      filters.push(
        and(
          sql`${pengajuanRabTable.createdAt} >= ${startDate}`,
          sql`${pengajuanRabTable.createdAt} <= ${endDate}`
        )
      );
    }

    // 1. Hitung Total Data (untuk pagination frontend)
    const totalQuery = await db
      .select({ value: count() })
      .from(pengajuanRabTable)
      .innerJoin(kegiatanTable, eq(pengajuanRabTable.id, kegiatanTable.pengajuanRabId))
      .innerJoin(usersTable, sql`${pengajuanRabTable.usersId} = ${usersTable.users_id} COLLATE utf8mb4_unicode_ci`)
      .where(and(...filters));
    
    const total = totalQuery[0]?.value || 0;

    // 2. Ambil Data dengan Limit & Offset
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
        kaprodiNama: sql<string>`(
          SELECT full_name FROM users 
          WHERE role = 'kaprodi' 
          AND prodi_id = CAST(${pengajuanRabTable.prodiId} AS UNSIGNED)
          LIMIT 1
        )`
      })
      .from(pengajuanRabTable)
      .innerJoin(kegiatanTable, eq(pengajuanRabTable.id, kegiatanTable.pengajuanRabId))
      .innerJoin(usersTable, sql`${pengajuanRabTable.usersId} = ${usersTable.users_id} COLLATE utf8mb4_unicode_ci`)
      .leftJoin(ormawaTable, eq(usersTable.ormawaId, ormawaTable.id))
      .leftJoin(programStudiTable, sql`CAST(${pengajuanRabTable.prodiId} AS UNSIGNED) = ${programStudiTable.id}`)
      .where(and(...filters))
      .orderBy(desc(pengajuanRabTable.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      success: true,
      data,
      total,
      page,
      limit
    };
  } catch (error: any) {
    console.error("Error GET /api/ppk/pengajuan/lunas:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Gagal mengambil data pengajuan lunas",
    });
  }
});
