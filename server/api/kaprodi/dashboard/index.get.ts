// FILE: server/api/kaprodi/dashboard/index.get.ts
// Endpoint untuk mengambil statistik pengajuan proposal milik Ormawa binaan Kaprodi
// Mengikuti pola server/api/ppk/dashboard/index.get.ts dengan adaptasi relasi prodiId

import { eq, sql, ne, and, inArray, desc } from "drizzle-orm";
import {
  pengajuanRabTable,
  usersTable,
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
      };
    }

    // Step 1: Cari semua ormawa yang terikat pada prodiId Kaprodi
    const ormawaRows = await db
      .select({ id: ormawaTable.id })
      .from(ormawaTable)
      .where(eq(ormawaTable.prodiId, prodiId));

    const ormawaIds = ormawaRows.map((o) => o.id);

    if (ormawaIds.length === 0) {
      return {
        success: true,
        total: 0,
        menunggu: 0,
        disetujui: 0,
        revisi: 0,
        ditolak: 0,
        data: { total: 0, menunggu: 0, disetujui: 0, revisi: 0, ditolak: 0 },
      };
    }

    // Step 2: Cari all users_id (varchar) yang terikat pada ormawa tersebut
    const ormawaUsers = await db
      .select({ usersId: usersTable.users_id })
      .from(usersTable)
      .where(inArray(usersTable.ormawaId, ormawaIds));

    const ormawaUserIds = ormawaUsers.map((u) => u.usersId);
    const userMap = new Map(ormawaUsers.map((u) => [u.usersId, u]));
    const ormawaDetails = await db
      .select({ id: ormawaTable.id, nama: ormawaTable.nama, kode: ormawaTable.kode })
      .from(ormawaTable)
      .where(inArray(ormawaTable.id, ormawaIds));
    const ormawaMap = new Map(ormawaDetails.map((o) => [o.id, o]));

    if (ormawaUserIds.length === 0) {
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

    // Step 3: Hitung jumlah pengajuan berdasarkan status
    // waiting_kaprodi -> Menunggu review
    // revisi_kaprodi  -> Diminta revisi
    // Selain draft, waiting_kaprodi, dan revisi_kaprodi -> Disetujui/dilanjutkan Kaprodi
    // ditolak_spi      -> Ditolak
    const [total, menunggu, revisi, disetujui, ditolak] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(pengajuanRabTable)
        .where(
          and(
            ne(pengajuanRabTable.status, "draft"),
            inArray(pengajuanRabTable.usersId, ormawaUserIds)
          )
        ),
      db
        .select({ count: sql<number>`count(*)` })
        .from(pengajuanRabTable)
        .where(
          and(
            eq(pengajuanRabTable.status, "waiting_kaprodi"),
            inArray(pengajuanRabTable.usersId, ormawaUserIds)
          )
        ),
      db
        .select({ count: sql<number>`count(*)` })
        .from(pengajuanRabTable)
        .where(
          and(
            eq(pengajuanRabTable.status, "revisi_kaprodi"),
            inArray(pengajuanRabTable.usersId, ormawaUserIds)
          )
        ),
      db
        .select({ count: sql<number>`count(*)` })
        .from(pengajuanRabTable)
        .where(
          and(
            inArray(pengajuanRabTable.status, [
              "waiting_ppk",
              "revisi_ppk",
              "waiting_spi",
              "disetujui",
              "selesai_spi",
            ]),
            inArray(pengajuanRabTable.usersId, ormawaUserIds)
          )
        ),
      db
        .select({ count: sql<number>`count(*)` })
        .from(pengajuanRabTable)
        .where(
          and(
            eq(pengajuanRabTable.status, "ditolak_spi"),
            inArray(pengajuanRabTable.usersId, ormawaUserIds)
          )
        ),
    ]);

    const stats = {
      total: Number(total[0]?.count ?? 0),
      menunggu: Number(menunggu[0]?.count ?? 0),
      disetujui: Number(disetujui[0]?.count ?? 0),
      revisi: Number(revisi[0]?.count ?? 0),
      ditolak: Number(ditolak[0]?.count ?? 0),
    };

    const pengajuanRows = await db
      .select({
        id: pengajuanRabTable.id,
        nomorPengajuan: pengajuanRabTable.nomorPengajuan,
        usersId: pengajuanRabTable.usersId,
        judulKegiatan: pengajuanRabTable.judulKegiatan,
        status: pengajuanRabTable.status,
        totalAnggaran: pengajuanRabTable.totalAnggaran,
        tanggalMulai: pengajuanRabTable.tanggalMulai,
        tanggalSelesai: pengajuanRabTable.tanggalSelesai,
        fileRabUrl: pengajuanRabTable.fileRabUrl,
        fileTorUrl: pengajuanRabTable.fileTorUrl,
        createdAt: pengajuanRabTable.createdAt,
        updatedAt: pengajuanRabTable.updatedAt,
      })
      .from(pengajuanRabTable)
      .where(inArray(pengajuanRabTable.usersId, ormawaUserIds))
      .orderBy(desc(pengajuanRabTable.createdAt));

    const pengajuanIds = pengajuanRows.map((item) => item.id);
    const kegiatanRows = pengajuanIds.length
      ? await db
          .select({
            id: kegiatanTable.id,
            pengajuanRabId: kegiatanTable.pengajuanRabId,
            statusKegiatan: kegiatanTable.statusKegiatan,
          })
          .from(kegiatanTable)
          .where(inArray(kegiatanTable.pengajuanRabId, pengajuanIds))
      : [];

    const kegiatanMap = new Map(
      kegiatanRows.map((row) => [row.pengajuanRabId, row]),
    );

    const kegiatanIds = kegiatanRows.map((row) => row.id);
    const tagihanRows = kegiatanIds.length
      ? await db
          .select({
            kegiatanId: tagihanPencairanTable.kegiatanId,
            statusTagihan: tagihanPencairanTable.statusTagihan,
            nominal: tagihanPencairanTable.nominal,
          })
          .from(tagihanPencairanTable)
          .where(inArray(tagihanPencairanTable.kegiatanId, kegiatanIds))
      : [];

    const tagihanMap = new Map<number, {
      total: number;
      selesai: number;
      nominalSelesai: number;
      statuses: Set<string>;
    }>();

    for (const item of tagihanRows) {
      const current = tagihanMap.get(item.kegiatanId) ?? {
        total: 0,
        selesai: 0,
        nominalSelesai: 0,
        statuses: new Set<string>(),
      };
      if (item.statusTagihan) {
        current.total += 1;
        current.statuses.add(item.statusTagihan);
        if (item.statusTagihan === "SELESAI") {
          current.selesai += 1;
          current.nominalSelesai += Number(item.nominal ?? 0);
        }
      }
      tagihanMap.set(item.kegiatanId, current);
    }

    const activityList = pengajuanRows.map((row) => {
      const ormawa = userMap.get(row.usersId)?.ormawaId
        ? ormawaMap.get(userMap.get(row.usersId)!.ormawaId)
        : null;
      const kegiatan = kegiatanMap.get(row.id);
      const tagihan = kegiatan ? tagihanMap.get(kegiatan.id) : undefined;

      return {
        id: row.id,
        nomorPengajuan: row.nomorPengajuan,
        judulKegiatan: row.judulKegiatan,
        status: row.status,
        statusKegiatan: kegiatan?.statusKegiatan ?? null,
        ormawa: {
          id: ormawa?.id ?? null,
          nama: ormawa?.nama ?? "",
          kode: ormawa?.kode ?? "",
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
