// FILE: server/api/kaprodi/kegiatan/index.get.ts
// Endpoint untuk mengambil seluruh daftar pengajuan proposal milik Ormawa binaan Kaprodi
// Mengikuti pola server/api/ppk/kegiatan/index.get.ts dengan adaptasi prodiId Kaprodi

import { eq, inArray, desc, and, ne } from "drizzle-orm";
import { useDrizzle } from "~~/server/db";
import {
  pengajuanRabTable,
  usersTable,
  ormawaTable,
} from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
  console.log("=== START GET /api/kaprodi/kegiatan ===");

  try {
    const db = useDrizzle();
    const { user } = event.context;

    console.log("Step 0: User context:", {
      userId: user?.usersId,
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
        summary: {
          totalMasuk: 0,
          totalWaitingKaprodi: 0,
          totalRevisiKaprodi: 0,
        },
        data: [],
      };
    }

    // Step 1: Cari Ormawa yang terikat pada prodiId Kaprodi
    console.log("Step 4: Fetching ormawa with prodiId:", prodiId);
    const ormawaRows = await db
      .select({
        id: ormawaTable.id,
        nama: ormawaTable.nama,
        kode: ormawaTable.kode,
      })
      .from(ormawaTable)
      .where(eq(ormawaTable.prodiId, prodiId));

    console.log("Step 5: Ormawa rows found:", {
      count: ormawaRows.length,
      data: ormawaRows.map((o) => ({ id: o.id, nama: o.nama, kode: o.kode })),
    });

    const ormawaIds = ormawaRows.map((o) => o.id);
    console.log("Step 6: Ormawa IDs:", ormawaIds);

    if (ormawaIds.length === 0) {
      console.log("Step 7: No ormawa found, returning empty result");
      return {
        success: true,
        summary: {
          totalMasuk: 0,
          totalWaitingKaprodi: 0,
          totalRevisiKaprodi: 0,
        },
        data: [],
      };
    }

    // Step 2: Cari all users dari Ormawa tersebut
    console.log("Step 8: Fetching users with ormawaIds:", ormawaIds);
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

    console.log("Step 9: Users found:", {
      count: ormawaUsers.length,
      data: ormawaUsers.map((u) => ({
        usersId: u.usersId,
        ormawaId: u.ormawaId,
        fullName: u.fullName,
        email: u.email,
        intId: u.intId,
      })),
    });

    const ormawaUserIds = ormawaUsers.map((u) => u.usersId);
    console.log("Step 10: User IDs:", ormawaUserIds);

    if (ormawaUserIds.length === 0) {
      console.log("Step 11: No users found, returning empty result");
      return {
        success: true,
        summary: {
          totalMasuk: 0,
          totalWaitingKaprodi: 0,
          totalRevisiKaprodi: 0,
        },
        data: [],
      };
    }

    // Step 3: Ambil data pengajuan proposal (selain draft) milik Ormawa tersebut
    console.log("Step 12: Fetching pengajuan with userIds:", ormawaUserIds);
    const data = await db
      .select({ pengajuanRabTable })
      .from(pengajuanRabTable)
      .where(
        and(
          ne(pengajuanRabTable.status, "draft"),
          inArray(pengajuanRabTable.usersId, ormawaUserIds),
        ),
      )
      .orderBy(desc(pengajuanRabTable.createdAt));

    console.log("Step 13: Pengajuan found:", {
      count: data.length,
      statuses: data.map((d) => d.pengajuanRabTable.status),
      data: data.map((d) => ({
        id: d.pengajuanRabTable.id,
        nomorPengajuan: d.pengajuanRabTable.nomorPengajuan,
        judulKegiatan: d.pengajuanRabTable.judulKegiatan,
        status: d.pengajuanRabTable.status,
        usersId: d.pengajuanRabTable.usersId,
      })),
    });

    // Buat map untuk mempercepat lookup pengaju dan ormawa (seperti di PPK)
    const userMap = new Map(ormawaUsers.map((u) => [u.usersId, u]));
    const ormawaMap = new Map(ormawaRows.map((o) => [o.id, o]));

    console.log("Step 14: Maps created:", {
      userMapSize: userMap.size,
      ormawaMapSize: ormawaMap.size,
      userMapKeys: Array.from(userMap.keys()),
      ormawaMapKeys: Array.from(ormawaMap.keys()),
    });

    // Hitung summary
    const totalMasuk = data.length;
    const totalWaitingKaprodi = data.filter(
      (d) => d.pengajuanRabTable.status === "waiting_kaprodi",
    ).length;
    const totalRevisiKaprodi = data.filter(
      (d) => d.pengajuanRabTable.status === "revisi_kaprodi",
    ).length;

    console.log("Step 15: Summary stats:", {
      totalMasuk,
      totalWaitingKaprodi,
      totalRevisiKaprodi,
    });

    // Transform data untuk response
    const transformedData = data.map((row) => {
      const r = row.pengajuanRabTable;
      const userInfo = userMap.get(r.usersId);
      const ormawaInfo = userInfo?.ormawaId
        ? ormawaMap.get(userInfo.ormawaId)
        : null;

      console.log(`Step 16: Transforming item ${r.id}:`, {
        usersId: r.usersId,
        foundUser: !!userInfo,
        ormawaId: userInfo?.ormawaId,
        foundOrmawa: !!ormawaInfo,
      });

      return {
        id: r.id,
        nomorPengajuan: r.nomorPengajuan,
        judulKegiatan: r.judulKegiatan,
        deskripsi: r.deskripsi,
        totalAnggaran: r.totalAnggaran,
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
      };
    });

    console.log("Step 17: Final response prepared:", {
      success: true,
      summary: { totalMasuk, totalWaitingKaprodi, totalRevisiKaprodi },
      dataCount: transformedData.length,
    });

    console.log("=== END GET /api/kaprodi/kegiatan (SUCCESS) ===");

    return {
      success: true,
      summary: {
        totalMasuk,
        totalWaitingKaprodi,
        totalRevisiKaprodi,
      },
      data: transformedData,
    };
  } catch (error: any) {
    console.error("=== ERROR GET /api/kaprodi/kegiatan ===");
    console.error("Error details:", {
      message: error.message,
      statusCode: error.statusCode,
      stack: error.stack,
      data: error.data,
    });

    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Gagal mengambil data pengajuan kegiatan",
      data: error,
    });
  }
});
