// FILE: server/api/ppk/dashboard/ormawa-anggaran.get.ts
// Optimized PPK Ormawa Budget API with Status Breakdown

import { eq, sql, and, ne } from "drizzle-orm";
import { useDrizzle } from "~~/server/db";
import { ormawaTable, pengajuanRabTable, usersTable, fakultasTable } from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
  try {
    const db = useDrizzle();
    const { user } = event.context;

    // ========== VALIDASI USER ==========
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: "User tidak terautentikasi",
      });
    }

    if (user.role !== "ppk") {
      throw createError({
        statusCode: 403,
        statusMessage: "Akses ditolak. Peran PPK diperlukan.",
      });
    }

    const fakultasId = user.fakultasId;

    if (!fakultasId) {
      return {
        success: true,
        summary: {
          totalAnggaranKeseluruhan: 0,
          totalTerpakaiKeseluruhan: 0,
          totalSisaKeseluruhan: 0,
        },
        data: [],
      };
    }

    // Ambil info fakultas
    const fakultasInfo = await db
      .select({ nama: fakultasTable.nama })
      .from(fakultasTable)
      .where(eq(fakultasTable.id, fakultasId))
      .limit(1);
    
    const namaFakultas = fakultasInfo[0]?.nama || "Fakultas";

    // ========== QUERY UTAMA (OPTIMIZED WITH JOINS & SUBQUERIES) ==========
    // Mengambil data ormawa di fakultas terkait beserta agregasi pengajuannya.
    // Gunakan ormawa.id (qualified name) untuk menghindari ambiguitas di dalam subquery.
    const ormawaList = await db
      .select({
        ormawaId: ormawaTable.id,
        ormawaName: ormawaTable.nama,
        ormawaKode: ormawaTable.kode,
        totalAnggaranOrmawa: ormawaTable.totalAnggaran,
        prodiId: ormawaTable.prodiId,
        totalTerpakai: sql<number>`
          COALESCE((
            SELECT SUM(pr.total_anggaran)
            FROM pengajuan_rab pr
            INNER JOIN users u ON pr.users_id = u.users_id
            WHERE u.ormawa_id = ormawa.id
            AND pr.status IN ('disetujui', 'selesai_spi', 'lunas_ppk')
          ), 0)
        `,
        totalKegiatan: sql<number>`
          COALESCE((
            SELECT COUNT(*)
            FROM pengajuan_rab pr
            INNER JOIN users u ON pr.users_id = u.users_id
            WHERE u.ormawa_id = ormawa.id
            AND pr.status != 'draft'
          ), 0)
        `,
        countWaiting: sql<number>`
          COALESCE((
            SELECT COUNT(*)
            FROM pengajuan_rab pr
            INNER JOIN users u ON pr.users_id = u.users_id
            WHERE u.ormawa_id = ormawa.id
            AND pr.status = 'waiting_ppk'
          ), 0)
        `,
        countRevisi: sql<number>`
          COALESCE((
            SELECT COUNT(*)
            FROM pengajuan_rab pr
            INNER JOIN users u ON pr.users_id = u.users_id
            WHERE u.ormawa_id = ormawa.id
            AND pr.status = 'revisi_ppk'
          ), 0)
        `,
        countDisetujui: sql<number>`
          COALESCE((
            SELECT COUNT(*)
            FROM pengajuan_rab pr
            INNER JOIN users u ON pr.users_id = u.users_id
            WHERE u.ormawa_id = ormawa.id
            AND pr.status IN ('lunas_ppk', 'waiting_spi', 'disetujui', 'selesai_spi')
          ), 0)
        `,
        countDitolak: sql<number>`
          COALESCE((
            SELECT COUNT(*)
            FROM pengajuan_rab pr
            INNER JOIN users u ON pr.users_id = u.users_id
            WHERE u.ormawa_id = ormawa.id
            AND pr.status = 'ditolak_spi'
          ), 0)
        `,
      })
      .from(ormawaTable)
      .where(eq(ormawaTable.fakultasId, fakultasId))
      .orderBy(ormawaTable.nama);

    // Hitung ringkasan (summary)
    const totalAnggaranKeseluruhan = ormawaList.reduce(
      (sum, o) => sum + Number(o.totalAnggaranOrmawa),
      0
    );

    const totalTerpakaiKeseluruhan = ormawaList.reduce(
      (sum, o) => sum + Number(o.totalTerpakai),
      0
    );

    return {
      success: true,
      summary: {
        totalAnggaranKeseluruhan,
        totalTerpakaiKeseluruhan,
        totalSisaKeseluruhan: totalAnggaranKeseluruhan - totalTerpakaiKeseluruhan,
      },
      data: [
        {
          fakultas: { id: fakultasId, nama: namaFakultas },
          ormawa: ormawaList.map((o) => ({
            id: o.ormawaId,
            nama: o.ormawaName,
            kode: o.ormawaKode,
            anggaran: {
              total: Number(o.totalAnggaranOrmawa),
              terpakai: Number(o.totalTerpakai),
              sisa: Number(o.totalAnggaranOrmawa) - Number(o.totalTerpakai),
            },
            totalKegiatan: Number(o.totalKegiatan),
            stats: {
              menunggu: Number(o.countWaiting),
              revisi: Number(o.countRevisi),
              disetujui: Number(o.countDisetujui),
              ditolak: Number(o.countDitolak),
            }
          })),
        },
      ],
    };
  } catch (error: any) {
    console.error("Error GET /api/ppk/dashboard/ormawa-anggaran:", error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Gagal mengambil data anggaran ormawa",
      data: error?.message || "Unknown error",
    });
  }
});
