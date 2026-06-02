// FILE: server/api/kaprodi/ormawa-anggaran/index.get.ts
// Endpoint untuk mengambil detail anggaran dan kegiatan Ormawa binaan Kaprodi
// Mengikuti pola server/api/ppk/dashboard/ormawa-anggaran.get.ts dengan adaptasi relasi prodiId Kaprodi

import { eq, sql, inArray, and } from "drizzle-orm";
import { useDrizzle } from "~~/server/db";
import { ormawaTable, usersTable, programStudiTable } from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
  try {
    const db = useDrizzle();
    const { user } = event.context;

    // Pastikan user terautentikasi dan memiliki prodiId
    if (!user || user.role !== "kaprodi") {
      throw createError({
        statusCode: 403,
        statusMessage: "Akses ditolak. Peran Kaprodi diperlukan.",
      });
    }

    const prodiId = user.prodiId;

    if (!prodiId) {
      return {
        success: true,
        summary: { totalAnggaranKeseluruhan: 0, totalTerpakaiKeseluruhan: 0, totalSisaKeseluruhan: 0 },
        data: [],
        prodi: null,
      };
    }

    // Ambil detail program studi
    const prodiRow = await db.query.programStudiTable.findFirst({
      where: eq(programStudiTable.id, prodiId),
    });

    // Query data Ormawa beserta kalkulasi anggaran terpakai & kegiatan via subquery SQL
    // Menggunakan pola yang sama persis dengan ormawa-anggaran.get.ts PPK
    const ormawaList = await db
      .select({
        ormawaId: ormawaTable.id,
        ormawaName: ormawaTable.nama,
        ormawaKode: ormawaTable.kode,
        totalAnggaranOrmawa: ormawaTable.totalAnggaran,
        totalTerpakai: sql<number>`
          COALESCE((
            SELECT SUM(pr.total_anggaran)
            FROM pengajuan_rab pr
            INNER JOIN users u ON pr.users_id = u.users_id
            WHERE u.ormawa_id = ${ormawaTable.id}
            AND pr.status IN ('disetujui', 'selesai_spi')
          ), 0)
        `,
        totalKegiatan: sql<number>`
          COALESCE((
            SELECT COUNT(*)
            FROM pengajuan_rab pr
            INNER JOIN users u ON pr.users_id = u.users_id
            WHERE u.ormawa_id = ${ormawaTable.id}
            AND pr.status != 'draft'
          ), 0)
        `,
        totalDisetujui: sql<number>`
          COALESCE((
            SELECT COUNT(*)
            FROM pengajuan_rab pr
            INNER JOIN users u ON pr.users_id = u.users_id
            WHERE u.ormawa_id = ${ormawaTable.id}
            AND pr.status IN ('disetujui', 'selesai_spi')
          ), 0)
        `,
      })
      .from(ormawaTable)
      .where(eq(ormawaTable.prodiId, prodiId))
      .orderBy(ormawaTable.nama);

    const totalAnggaranKeseluruhan = ormawaList.reduce(
      (sum, o) => sum + Number(o.totalAnggaranOrmawa),
      0
    );
    const totalTerpakaiKeseluruhan = ormawaList.reduce(
      (sum, o) => sum + Number(o.totalTerpakai),
      0
    );

    const formattedData = ormawaList.map((o) => ({
      id: o.ormawaId,
      nama: o.ormawaName,
      kode: o.ormawaKode,
      anggaran: {
        total: Number(o.totalAnggaranOrmawa),
        terpakai: Number(o.totalTerpakai),
        sisa: Number(o.totalAnggaranOrmawa) - Number(o.totalTerpakai),
      },
      totalKegiatan: Number(o.totalKegiatan),
      disetujuiCount: Number(o.totalDisetujui),
    }));

    const response = {
      success: true,
      summary: {
        totalAnggaranKeseluruhan,
        totalTerpakaiKeseluruhan,
        totalSisaKeseluruhan: totalAnggaranKeseluruhan - totalTerpakaiKeseluruhan,
      },
      data: formattedData,
      prodi: prodiRow
        ? {
            id: prodiRow.id,
            nama: prodiRow.nama,
            fakultasId: prodiRow.fakultasId,
            ormawa: formattedData,
          }
        : null,
    };

    return response;
  } catch (error: any) {
    console.error("Error GET /api/kaprodi/ormawa-anggaran:", error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Gagal mengambil data anggaran ormawa",
      data: error,
    });
  }
});
