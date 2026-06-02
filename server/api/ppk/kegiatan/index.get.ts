// FILE: server/api/ppk/kegiatan/index.get.ts
// VERSI DEBUG — tambah console.log di setiap step untuk cari step mana yang gagal
// Setelah ketemu masalahnya, hapus semua console.log debug

import { eq, inArray, desc, and, ne } from "drizzle-orm";
import { useDrizzle } from "~~/server/db";
import {
  pengajuanRabTable,
  usersTable,
  ormawaTable,
  kegiatanTable,
  tagihanPencairanTable,
} from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
  try {
    const db = useDrizzle();
    const { user } = event.context;

    // DEBUG: lihat isi user dari context
    console.log("=== DEBUG PPK KEGIATAN ===");
    console.log("user dari context:", JSON.stringify(user));
    console.log("user.id:", user?.id);
    console.log("user.fakultasId:", user?.fakultasId);
    console.log("user.role:", user?.role);

    const fakultasId = user.fakultasId;

    if (!fakultasId) {
      console.log("STOP: fakultasId tidak ada di context user");
      return {
        success: true,
        summary: { totalMasuk: 0, totalWaitingPPK: 0, totalRevisiPPK: 0 },
        data: [],
      };
    }

    // Step 1: Cari kaprodi se-fakultas
    const kaprodiList = await db
      .select({ prodiId: usersTable.prodiId, nama: usersTable.fullName })
      .from(usersTable)
      .where(
        and(
          eq(usersTable.role, "kaprodi"),
          eq(usersTable.fakultasId, fakultasId),
        ),
      );

    console.log("Step 1 - kaprodiList:", JSON.stringify(kaprodiList));

    const prodiIds = kaprodiList
      .map((k) => k.prodiId)
      .filter((id): id is number => id !== null);

    console.log("Step 1 - prodiIds:", prodiIds);

    if (prodiIds.length === 0) {
      console.log("STOP: tidak ada kaprodi se-fakultas ditemukan");
      return {
        success: true,
        summary: { totalMasuk: 0, totalWaitingPPK: 0, totalRevisiPPK: 0 },
        data: [],
      };
    }

    // Step 2: Cari ormawa yang prodi_id-nya masuk list
    const ormawaRows = await db
      .select({
        id: ormawaTable.id,
        nama: ormawaTable.nama,
        prodiId: ormawaTable.prodiId,
      })
      .from(ormawaTable)
      .where(inArray(ormawaTable.prodiId, prodiIds));

    console.log("Step 2 - ormawaRows:", JSON.stringify(ormawaRows));

    const ormawaIds = ormawaRows.map((o) => o.id);

    if (ormawaIds.length === 0) {
      console.log("STOP: tidak ada ormawa dengan prodi_id yang cocok");
      return {
        success: true,
        summary: { totalMasuk: 0, totalWaitingPPK: 0, totalRevisiPPK: 0 },
        data: [],
      };
    }

    // Step 3: Cari users_id dari user ormawa
    const ormawaUsers = await db
      .select({
        usersId: usersTable.users_id,
        ormawaId: usersTable.ormawaId,
        fullName: usersTable.fullName,
        email: usersTable.email,
        intId: usersTable.id,
      })
      .from(usersTable)
      .where(inArray(usersTable.ormawaId, ormawaIds));

    console.log("Step 3 - ormawaUsers:", JSON.stringify(ormawaUsers));

    const ormawaUserIds = ormawaUsers.map((u) => u.usersId);

    const userMap = new Map(ormawaUsers.map((u) => [u.usersId, u]));
    const ormawaDetailRows = await db
      .select({
        id: ormawaTable.id,
        nama: ormawaTable.nama,
        kode: ormawaTable.kode,
      })
      .from(ormawaTable)
      .where(inArray(ormawaTable.id, ormawaIds));
    const ormawaMap = new Map(ormawaDetailRows.map((o) => [o.id, o]));

    console.log("Step 3 - ormawaUserIds:", ormawaUserIds);

    if (ormawaUserIds.length === 0) {
      console.log("STOP: tidak ada user dengan ormawa_id yang cocok");
      return {
        success: true,
        summary: { totalMasuk: 0, totalWaitingPPK: 0, totalRevisiPPK: 0 },
        data: [],
      };
    }

    // Step 4: Ambil semua pengajuan RAB/TOR yang tidak berstatus draft
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
      })
      .from(pengajuanRabTable)
      .where(
        and(
          ne(pengajuanRabTable.status, "draft"),
          inArray(pengajuanRabTable.usersId, ormawaUserIds),
        ),
      )
      .orderBy(desc(pengajuanRabTable.createdAt));

    const pengajuanIds = pengajuan.map((item) => item.id);
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

    const tagihanMap = new Map<
      number,
      {
        total: number;
        selesai: number;
        nominalSelesai: number;
        statuses: Set<string>;
      }
    >();

    for (const item of tagihanRows) {
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

    const activityData = pengajuan.map((r) => {
      const userInfo = userMap.get(r.usersId);
      const ormawaInfo = userInfo?.ormawaId
        ? ormawaMap.get(userInfo.ormawaId)
        : null;
      const kegiatanInfo = kegiatanMap.get(r.id);
      const tagihanInfo = kegiatanInfo
        ? tagihanMap.get(kegiatanInfo.id)
        : undefined;

      return {
        id: r.id,
        nomorPengajuan: r.nomorPengajuan,
        judulKegiatan: r.judulKegiatan,
        deskripsi: r.deskripsi,
        totalAnggaran: Number(r.totalAnggaran ?? 0),
        tanggalMulai: r.tanggalMulai,
        tanggalSelesai: r.tanggalSelesai,
        status: r.status,
        fileRabUrl: r.fileRabUrl,
        fileTorUrl: r.fileTorUrl,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        pengaju: {
          id: userInfo?.intId ?? null,
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

    return {
      success: true,
      summary: {
        totalMasuk: activityData.length,
        totalWaitingPPK: activityData.filter((d) => d.status === "waiting_ppk")
          .length,
        totalRevisiPPK: activityData.filter((d) => d.status === "revisi_ppk")
          .length,
        totalWaitingSPI: activityData.filter((d) => d.status === "waiting_spi")
          .length,
        totalSelesaiSPI: activityData.filter((d) => d.status === "selesai_spi")
          .length,
      },
      data: activityData,
    };
  } catch (error: any) {
    console.error("Error GET /api/ppk/kegiatan:", error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Gagal mengambil data pengajuan kegiatan",
      data: error,
    });
  }
});
