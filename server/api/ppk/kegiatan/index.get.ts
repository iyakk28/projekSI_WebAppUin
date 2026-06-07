// FILE: server/api/ppk/kegiatan/index.get.ts
// VERSI FINAL - Query langsung ke pengajuan_rab berdasarkan fakultasId

import { eq, desc, and, ne, inArray } from "drizzle-orm";
import { useDrizzle } from "~~/server/db";
import {
  pengajuanRabTable,
  usersTable,
  ormawaTable,
  kegiatanTable,
  tagihanPencairanTable,
  programStudiTable,
} from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
  try {
    const db = useDrizzle();
    const { user } = event.context;

    // Validasi user
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
          totalMasuk: 0,
          totalWaitingPPK: 0,
          totalRevisiPPK: 0,
          totalWaitingSPI: 0,
          totalSelesaiSPI: 0,
        },
        data: [],
      };
    }

    // ========== QUERY LANGSUNG KE PENGAJUAN_RAB ==========
    // Step 1: Ambil semua pengajuan berdasarkan fakultasId yang berstatus 'waiting_ppk'
    const pengajuan = await db
      .select({
        id: pengajuanRabTable.id,
        nomorPengajuan: pengajuanRabTable.nomorPengajuan,
        usersId: pengajuanRabTable.usersId,
        judulKegiatan: pengajuanRabTable.judulKegiatan,
        deskripsi: pengajuanRabTable.deskripsi,
        totalAnggaran: pengajuanRabTable.totalAnggaran,
        tanggalMulai: pengajuanRabTable.tanggalMulai,
        tanggalSelesai: pengajuanRabTable.tanggalSelesai,
        status: pengajuanRabTable.status,
        fileRabUrl: pengajuanRabTable.fileRabUrl,
        fileTorUrl: pengajuanRabTable.fileTorUrl,
        createdAt: pengajuanRabTable.createdAt,
        updatedAt: pengajuanRabTable.updatedAt,
        prodiId: pengajuanRabTable.prodiId,
        fakultasId: pengajuanRabTable.fakultasId,
      })
      .from(pengajuanRabTable)
      .where(
        and(
          eq(pengajuanRabTable.fakultasId, String(fakultasId)),
          eq(pengajuanRabTable.status, "waiting_ppk"),
        ),
      )
      .orderBy(desc(pengajuanRabTable.createdAt));

    if (pengajuan.length === 0) {
      return {
        success: true,
        summary: {
          totalMasuk: 0,
          totalWaitingPPK: 0,
          totalRevisiPPK: 0,
          totalWaitingSPI: 0,
          totalSelesaiSPI: 0,
        },
        data: [],
      };
    }

    // ========== AMBIL DATA PENDUKUNG ==========
    const userIdsStrings = [
      ...new Set(pengajuan.map((p) => p.usersId).filter(Boolean)),
    ];
    const pengajuanIds = pengajuan.map((p) => p.id);

    // Ambil data users (untuk nama pengaju dan ormawaId)
    const usersData = userIdsStrings.length
      ? await db
          .select({
            id: usersTable.id,
            usersId: usersTable.users_id,
            fullName: usersTable.fullName,
            email: usersTable.email,
            ormawaId: usersTable.ormawaId,
          })
          .from(usersTable)
          .where(inArray(usersTable.users_id, userIdsStrings))
      : [];

    const ormawaIds = [
      ...new Set(usersData.map((u) => u.ormawaId).filter(Boolean)),
    ] as number[];

    // Ambil data ormawa
    const ormawaData = ormawaIds.length
      ? await db
          .select({
            id: ormawaTable.id,
            nama: ormawaTable.nama,
            kode: ormawaTable.kode,
          })
          .from(ormawaTable)
          .where(inArray(ormawaTable.id, ormawaIds))
      : [];

    // Ambil data kegiatan
    const kegiatanData = pengajuanIds.length
      ? await db
          .select({
            id: kegiatanTable.id,
            pengajuanRabId: kegiatanTable.pengajuanRabId,
            statusKegiatan: kegiatanTable.statusKegiatan,
          })
          .from(kegiatanTable)
          .where(inArray(kegiatanTable.pengajuanRabId, pengajuanIds))
      : [];

    // Ambil data tagihan
    const kegiatanIds = kegiatanData.map((k) => k.id);
    const tagihanData = kegiatanIds.length
      ? await db
          .select({
            kegiatanId: tagihanPencairanTable.kegiatanId,
            statusTagihan: tagihanPencairanTable.statusTagihan,
            nominal: tagihanPencairanTable.nominal,
          })
          .from(tagihanPencairanTable)
          .where(inArray(tagihanPencairanTable.kegiatanId, kegiatanIds))
      : [];

    // ========== BUILD MAPS ==========
    const userMap = new Map(usersData.map((u) => [u.usersId, u]));
    const ormawaMap = new Map(ormawaData.map((o) => [o.id, o]));
    const kegiatanMap = new Map(kegiatanData.map((k) => [k.pengajuanRabId, k]));

    // Build tagihan map per kegiatan
    const tagihanMap = new Map();
    for (const item of tagihanData) {
      const current = tagihanMap.get(item.kegiatanId) ?? {
        total: 0,
        selesai: 0,
        nominalSelesai: 0,
        statuses: new Set<string>(),
      };
      current.total += 1;
      if (item.statusTagihan) {
        current.statuses.add(item.statusTagihan);
        if (item.statusTagihan === "SELESAI") {
          current.selesai += 1;
          current.nominalSelesai += Number(item.nominal ?? 0);
        }
      }
      tagihanMap.set(item.kegiatanId, current);
    }

    // ========== BUILD RESPONSE DATA ==========
    const activityData = pengajuan.map((p) => {
      const userInfo = userMap.get(p.usersId);
      const ormawaInfo = userInfo?.ormawaId
        ? ormawaMap.get(userInfo.ormawaId)
        : null;
      const kegiatanInfo = kegiatanMap.get(p.id);
      const tagihanInfo = kegiatanInfo
        ? tagihanMap.get(kegiatanInfo.id)
        : undefined;

      return {
        id: p.id,
        nomorPengajuan: p.nomorPengajuan,
        judulKegiatan: p.judulKegiatan,
        deskripsi: p.deskripsi,
        totalAnggaran: Number(p.totalAnggaran ?? 0),
        tanggalMulai: p.tanggalMulai,
        tanggalSelesai: p.tanggalSelesai,
        status: p.status,
        fileRabUrl: p.fileRabUrl,
        fileTorUrl: p.fileTorUrl,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        pengaju: {
          id: userInfo?.id ?? null,
          nama: userInfo?.fullName ?? "",
          email: userInfo?.email ?? "",
        },
        ormawa: {
          id: ormawaInfo?.id ?? null,
          nama: ormawaInfo?.nama ?? "",
          kode: ormawaInfo?.kode ?? "",
        },
        statusKegiatan: kegiatanInfo?.statusKegiatan ?? null,
        pencairan: {
          totalTagihan: tagihanInfo?.total ?? 0,
          selesaiTagihan: tagihanInfo?.selesai ?? 0,
          nominalSelesai: tagihanInfo?.nominalSelesai ?? 0,
          statuses: Array.from(tagihanInfo?.statuses ?? []),
        },
      };
    });
    console.log(activityData);
    // ========== SUMMARY ==========
    const summary = {
      totalMasuk: activityData.length,
      totalWaitingPPK: activityData.filter((d) => d.status === "waiting_ppk")
        .length,
      totalRevisiPPK: activityData.filter((d) => d.status === "revisi_ppk")
        .length,
      totalWaitingSPI: activityData.filter((d) => d.status === "waiting_spi")
        .length,
      totalSelesaiSPI: activityData.filter((d) => d.status === "selesai_spi")
        .length,
    };

    return {
      success: true,
      summary,
      data: activityData,
    };
  } catch (error: any) {
    console.error("Error GET /api/ppk/kegiatan:", error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Gagal mengambil data pengajuan kegiatan",
      data: error?.message || error,
    });
  }
});
