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
  console.log("=== START GET /api/kaprodi/dashboard ===");

  try {
    const db = useDrizzle();
    const { user } = event.context;

    console.log("Step 0: User context:", {
      userId: user?.id,
      role: user?.role,
      prodiId: user?.prodiId,
      hasUser: !!user,
    });

    // Pastikan user terautentikasi dan memiliki prodiId
    if (!user || user.role !== "kaprodi") {
      console.log("Step 1: Auth failed - user:", !!user, "role:", user?.role);
      throw createError({
        statusCode: 403,
        statusMessage: "Akses ditolak. Peran Kaprodi diperlukan.",
      });
    }

    const prodiId = user.prodiId;
    console.log("Step 2: prodiId from user:", prodiId);

    if (!prodiId) {
      console.log("Step 3: No prodiId found, returning empty result");
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
    console.log("Step 4: Fetching ormawa with prodiId:", prodiId);
    const ormawaRows = await db
      .select({ id: ormawaTable.id })
      .from(ormawaTable)
      .where(eq(ormawaTable.prodiId, prodiId));

    console.log("Step 5: Ormawa rows found:", {
      count: ormawaRows.length,
      ids: ormawaRows.map((o) => o.id),
    });

    const ormawaIds = ormawaRows.map((o) => o.id);

    if (ormawaIds.length === 0) {
      console.log("Step 6: No ormawa found, returning empty result");
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

    // Step 2: Cari all IDs (Primary Key) yang terikat pada ormawa tersebut
    console.log("Step 7: Fetching user IDs with ormawaIds:", ormawaIds);
    const ormawaUsers = await db
      .select({ id: usersTable.id, ormawaId: usersTable.ormawaId })
      .from(usersTable)
      .where(inArray(usersTable.ormawaId, ormawaIds));

    console.log("Step 8: Users found:", {
      count: ormawaUsers.length,
      ids: ormawaUsers.map((u) => u.id),
    });

    const ormawaUserIds = ormawaUsers.map((u) => u.id);
    const userMap = new Map(ormawaUsers.map((u) => [u.id, u]));

    console.log("Step 9: Fetching ormawa details for IDs:", ormawaIds);
    const ormawaDetails = await db
      .select({
        id: ormawaTable.id,
        nama: ormawaTable.nama,
        kode: ormawaTable.kode,
      })
      .from(ormawaTable)
      .where(inArray(ormawaTable.id, ormawaIds));

    console.log("Step 10: Ormawa details:", {
      count: ormawaDetails.length,
      data: ormawaDetails.map((o) => ({
        id: o.id,
        nama: o.nama,
        kode: o.kode,
      })),
    });

    const ormawaMap = new Map(ormawaDetails.map((o) => [o.id, o]));

    if (ormawaUserIds.length === 0) {
      console.log("Step 11: No users found, returning empty result");
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
    console.log(
      "Step 12: Counting pengajuan by status for userIds:",
      ormawaUserIds,
    );

    const stringUserIds = ormawaUserIds.map(String);

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
            inArray(pengajuanRabTable.usersId, stringUserIds),
          ),
        ),
      db
        .select({ count: sql<number>`count(*)` })
        .from(pengajuanRabTable)
        .where(
          and(
            eq(pengajuanRabTable.status, "waiting_kaprodi"),
            inArray(pengajuanRabTable.usersId, stringUserIds),
          ),
        ),
      db
        .select({ count: sql<number>`count(*)` })
        .from(pengajuanRabTable)
        .where(
          and(
            eq(pengajuanRabTable.status, "revisi_kaprodi"),
            inArray(pengajuanRabTable.usersId, stringUserIds),
          ),
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
            inArray(pengajuanRabTable.usersId, stringUserIds),
          ),
        ),
      db
        .select({ count: sql<number>`count(*)` })
        .from(pengajuanRabTable)
        .where(
          and(
            eq(pengajuanRabTable.status, "ditolak_spi"),
            inArray(pengajuanRabTable.usersId, stringUserIds),
          ),
        ),
    ]);

    console.log("Step 13: Count results:", {
      total: total[0]?.count,
      menunggu: menunggu[0]?.count,
      revisi: revisi[0]?.count,
      disetujui: disetujui[0]?.count,
      ditolak: ditolak[0]?.count,
    });

    const stats = {
      total: Number(total[0]?.count ?? 0),
      menunggu: Number(menunggu[0]?.count ?? 0),
      disetujui: Number(disetujui[0]?.count ?? 0),
      revisi: Number(revisi[0]?.count ?? 0),
      ditolak: Number(ditolak[0]?.count ?? 0),
    };

    console.log("Step 14: Stats object:", stats);

    console.log("Step 15: Fetching detailed pengajuan data");
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
      .where(inArray(pengajuanRabTable.usersId, stringUserIds))
      .orderBy(desc(pengajuanRabTable.createdAt));

    console.log("Step 16: Pengajuan rows found:", {
      count: pengajuanRows.length,
      sample: pengajuanRows.slice(0, 3).map((p) => ({
        id: p.id,
        nomorPengajuan: p.nomorPengajuan,
        status: p.status,
        usersId: p.usersId,
      })),
    });

    const pengajuanIds = pengajuanRows.map((item) => item.id);
    console.log("Step 17: Pengajuan IDs:", pengajuanIds);

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

    console.log("Step 18: Kegiatan rows found:", {
      count: kegiatanRows.length,
      data: kegiatanRows.map((k) => ({
        id: k.id,
        pengajuanRabId: k.pengajuanRabId,
        statusKegiatan: k.statusKegiatan,
      })),
    });

    const kegiatanMap = new Map(
      kegiatanRows.map((row) => [row.pengajuanRabId, row]),
    );

    const kegiatanIds = kegiatanRows.map((row) => row.id);
    console.log("Step 19: Kegiatan IDs:", kegiatanIds);

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

    console.log("Step 20: Tagihan rows found:", {
      count: tagihanRows.length,
      sample: tagihanRows.slice(0, 3).map((t) => ({
        kegiatanId: t.kegiatanId,
        statusTagihan: t.statusTagihan,
        nominal: t.nominal,
      })),
    });

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

    console.log("Step 21: Tagihan map created:", {
      size: tagihanMap.size,
      entries: Array.from(tagihanMap.entries()).map(([k, v]) => ({
        kegiatanId: k,
        total: v.total,
        selesai: v.selesai,
        nominalSelesai: v.nominalSelesai,
        statuses: Array.from(v.statuses),
      })),
    });

    console.log("Step 22: Building activity list");
    const activityList = pengajuanRows.map((row) => {
      // row.usersId di pengajuan_rab adalah PK (id) dari usersTable
      const userPk = Number(row.usersId);
      const userObj = userMap.get(userPk);
      const ormawaId = userObj?.ormawaId;
      const ormawa = ormawaId ? ormawaMap.get(ormawaId) : null;
      const kegiatan = kegiatanMap.get(row.id);
      const tagihan = kegiatan ? tagihanMap.get(kegiatan.id) : undefined;

      console.log(`  Processing pengajuan ${row.id}:`, {
        userPk: userPk,
        userFound: !!userObj,
        ormawaFound: !!ormawa,
        kegiatanFound: !!kegiatan,
        tagihanFound: !!tagihan,
      });

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

    console.log("Step 23: Final response prepared:", {
      success: true,
      stats: stats,
      activitiesCount: activityList.length,
      sampleActivity: activityList[0]
        ? {
            id: activityList[0].id,
            judulKegiatan: activityList[0].judulKegiatan,
            status: activityList[0].status,
            ormawa: activityList[0].ormawa,
          }
        : null,
    });

    console.log("=== END GET /api/kaprodi/dashboard (SUCCESS) ===");

    return {
      success: true,
      ...stats,
      data: stats,
      activities: activityList,
    };
  } catch (error: any) {
    console.error("=== ERROR GET /api/kaprodi/dashboard ===");
    console.error("Error details:", {
      message: error.message,
      statusCode: error.statusCode,
      stack: error.stack,
      data: error.data,
    });

    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Gagal mengambil data dashboard Kaprodi",
      data: error,
    });
  }
});
