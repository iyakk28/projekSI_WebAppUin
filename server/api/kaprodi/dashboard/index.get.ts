// FILE: server/api/kaprodi/dashboard/index.get.ts
// Endpoint untuk mengambil statistik pengajuan proposal milik Ormawa binaan Kaprodi
// Dioptimalkan sesuai skema relasi ormawaId langsung

import { eq, sql, ne, and, inArray, desc } from "drizzle-orm";
import {
  pengajuanRabTable,
  ormawaTable,
  kegiatanTable,
  tagihanPencairanTable,
} from "~~/server/db/schema";
import { useDrizzle } from "~~/server/db";

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
        total: 0,
        menunggu: 0,
        disetujui: 0,
        revisi: 0,
        ditolak: 0,
        data: { total: 0, menunggu: 0, disetujui: 0, revisi: 0, ditolak: 0 },
        activities: [],
      };
    }

    // Step 1: Cari semua ormawaId yang terikat pada prodiId Kaprodi
    const ormawaRows = await db
      .select({ id: ormawaTable.id })
      .from(ormawaTable)
      .where(eq(ormawaTable.prodiId, Number(prodiId)));

    const ormawaIdsArray = ormawaRows.map((o) => String(o.id));

    if (ormawaIdsArray.length === 0) {
      return {
        success: true,
        total: 0,
        menunggu: 0,
        disetujui: 0,
        revisi: 0,
        ditolak: 0,
        data: { total: 0, menunggu: 0, disetujui: 0, revisi: 0, ditolak: 0 },
        activities: [],
      };
    }

    // Step 2: Hitung statistik pengajuan berdasarkan ormawaId (Sekali jalan dengan SQL Case)
    const statsResult = await db
      .select({
        total: sql<number>`count(case when status != 'draft' then 1 end)`,
        menunggu: sql<number>`count(case when status = 'waiting_kaprodi' then 1 end)`,
        revisi: sql<number>`count(case when status = 'revisi_kaprodi' then 1 end)`,
        disetujui: sql<number>`count(case when status IN ('waiting_ppk', 'revisi_ppk', 'waiting_spi', 'disetujui', 'selesai_spi') then 1 end)`,
        ditolak: sql<number>`count(case when status = 'ditolak_spi' then 1 end)`,
      })
      .from(pengajuanRabTable)
      .where(inArray(pengajuanRabTable.ormawaId, ormawaIdsArray));

    const stats = {
      total: Number(statsResult[0]?.total ?? 0),
      menunggu: Number(statsResult[0]?.menunggu ?? 0),
      disetujui: Number(statsResult[0]?.disetujui ?? 0),
      revisi: Number(statsResult[0]?.revisi ?? 0),
      ditolak: Number(statsResult[0]?.ditolak ?? 0),
    };

    // Step 3: Ambil daftar pengajuan (activities) dengan Join Ormawa & Kegiatan
    const pengajuanRows = await db
      .select({
        id: pengajuanRabTable.id,
        nomorPengajuan: pengajuanRabTable.nomorPengajuan,
        judulKegiatan: pengajuanRabTable.judulKegiatan,
        status: pengajuanRabTable.status,
        totalAnggaran: pengajuanRabTable.totalAnggaran,
        tanggalMulai: pengajuanRabTable.tanggalMulai,
        tanggalSelesai: pengajuanRabTable.tanggalSelesai,
        createdAt: pengajuanRabTable.createdAt,
        ormawaName: ormawaTable.nama,
        ormawaKode: ormawaTable.kode,
        ormawaId: ormawaTable.id,
        statusKegiatan: kegiatanTable.statusKegiatan,
        kegiatanId: kegiatanTable.id,
      })
      .from(pengajuanRabTable)
      .innerJoin(ormawaTable, eq(pengajuanRabTable.ormawaId, ormawaTable.id))
      .leftJoin(
        kegiatanTable,
        eq(pengajuanRabTable.id, kegiatanTable.pengajuanRabId),
      )
      .where(
        and(
          ne(pengajuanRabTable.status, "draft"),
          inArray(pengajuanRabTable.ormawaId, ormawaIdsArray),
        ),
      )
      .orderBy(desc(pengajuanRabTable.createdAt))
      .limit(50);

    const activityIds = pengajuanRows
      .map((p) => p.kegiatanId)
      .filter((id): id is number => id !== null);

    // Step 4: Ambil data tagihan pencairan jika ada kegiatan
    const tagihanRows = activityIds.length
      ? await db
          .select({
            kegiatanId: tagihanPencairanTable.kegiatanId,
            statusTagihan: tagihanPencairanTable.statusTagihan,
            nominal: tagihanPencairanTable.nominal,
          })
          .from(tagihanPencairanTable)
          .where(inArray(tagihanPencairanTable.kegiatanId, activityIds))
      : [];

    const tagihanMap = new Map<
      number,
      {
        total: number;
        selesai: number;
        nominalSelesai: number;
        statuses: Set<string>;
      }
    >();
    tagihanRows.forEach((t) => {
      const current = tagihanMap.get(t.kegiatanId) ?? {
        total: 0,
        selesai: 0,
        nominalSelesai: 0,
        statuses: new Set<string>(),
      };
      current.total++;
      if (t.statusTagihan) current.statuses.add(t.statusTagihan);
      if (t.statusTagihan === "SELESAI") {
        current.selesai++;
        current.nominalSelesai += Number(t.nominal ?? 0);
      }
      tagihanMap.set(t.kegiatanId, current);
    });

    // Step 5: Mapping hasil akhir
    const activityList = pengajuanRows.map((row) => {
      const tagihan = row.kegiatanId ? tagihanMap.get(row.kegiatanId) : null;
      return {
        id: row.id,
        nomorPengajuan: row.nomorPengajuan,
        judulKegiatan: row.judulKegiatan,
        status: row.status,
        statusKegiatan: row.statusKegiatan,
        ormawa: {
          id: row.ormawaId,
          nama: row.ormawaName,
          kode: row.ormawaKode,
        },
        totalAnggaran: Number(row.totalAnggaran ?? 0),
        tanggalMulai: row.tanggalMulai,
        tanggalSelesai: row.tanggalSelesai,
        pencairan: {
          totalTagihan: tagihan?.total ?? 0,
          selesaiTagihan: tagihan?.selesai ?? 0,
          nominalSelesai: tagihan?.nominalSelesai ?? 0,
          statuses: Array.from(tagihan?.statuses ?? []),
        },
      };
    });

    return {
      success: true,
      ...stats,
      data: stats,
      activities: activityList,
    };
  } catch (error: any) {
    console.error("Error GET /api/kaprodi/dashboard:", error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Gagal mengambil data dashboard Kaprodi",
      data: error,
    });
  }
});
