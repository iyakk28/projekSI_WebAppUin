// FILE: server/api/ppk/dashboard/ormawa-anggaran.get.ts
// Optimized PPK Ormawa Budget API with Status Breakdown
// Memperbaiki relasi subquery menggunakan ormawa_id langsung dari pengajuan_rab

import { eq, sql } from "drizzle-orm";
import { useDrizzle } from "~~/server/db";
import { ormawaTable, fakultasTable } from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
  try {
    const db = useDrizzle();
    const { user } = event.context;

    // ========== VALIDASI USER ==========
    if (!user || user.role !== "ppk") {
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
      .where(eq(fakultasTable.id, Number(fakultasId)))
      .limit(1);

    const namaFakultas = fakultasInfo[0]?.nama || "Fakultas";

    // ========== QUERY UTAMA (OPTIMIZED WITH SUBQUERIES) ==========
    // Mengambil data ormawa di fakultas terkait beserta agregasi pengajuannya via ormawa_id
    const ormawaList = await db
      .select({
        ormawaId: ormawaTable.id,
        ormawaName: ormawaTable.nama,
        ormawaKode: ormawaTable.kode,
        totalAnggaranOrmawa: ormawaTable.totalAnggaran,
        totalTerpakai: sql<number>`
          COALESCE((
            SELECT SUM(total_anggaran)
            FROM pengajuan_rab
            WHERE ormawa_id = ${ormawaTable.id}
            AND status IN ('disetujui', 'selesai_spi', 'lunas_ppk')
          ), 0)
        `,
        totalKegiatan: sql<number>`
          COALESCE((
            SELECT COUNT(*)
            FROM pengajuan_rab
            WHERE ormawa_id = ${ormawaTable.id}
            AND status != 'draft'
          ), 0)
        `,
        countWaiting: sql<number>`
          COALESCE((
            SELECT COUNT(*)
            FROM pengajuan_rab
            WHERE ormawa_id = ${ormawaTable.id}
            AND status = 'waiting_ppk'
          ), 0)
        `,
        countRevisi: sql<number>`
          COALESCE((
            SELECT COUNT(*)
            FROM pengajuan_rab
            WHERE ormawa_id = ${ormawaTable.id}
            AND status = 'revisi_ppk'
          ), 0)
        `,
        countDisetujui: sql<number>`
          COALESCE((
            SELECT COUNT(*)
            FROM pengajuan_rab
            WHERE ormawa_id = ${ormawaTable.id}
            AND status IN ('lunas_ppk', 'waiting_spi', 'disetujui', 'selesai_spi')
          ), 0)
        `,
        countDitolak: sql<number>`
          COALESCE((
            SELECT COUNT(*)
            FROM pengajuan_rab
            WHERE ormawa_id = ${ormawaTable.id}
            AND status = 'ditolak_spi'
          ), 0)
        `,
      })
      .from(ormawaTable)
      .where(eq(ormawaTable.fakultasId, Number(fakultasId)))
      .orderBy(ormawaTable.nama);

    // Hitung ringkasan (summary)
    const totalAnggaranKeseluruhan = ormawaList.reduce(
      (sum, o) => sum + Number(o.totalAnggaranOrmawa),
      0,
    );

    const totalTerpakaiKeseluruhan = ormawaList.reduce(
      (sum, o) => sum + Number(o.totalTerpakai),
      0,
    );

    return {
      success: true,
      summary: {
        totalAnggaranKeseluruhan,
        totalTerpakaiKeseluruhan,
        totalSisaKeseluruhan:
          totalAnggaranKeseluruhan - totalTerpakaiKeseluruhan,
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
            },
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
