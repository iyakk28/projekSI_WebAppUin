// FILE: server/api/kaprodi/kegiatan/index.get.ts
// Endpoint untuk mengambil seluruh daftar pengajuan proposal milik Ormawa binaan Kaprodi
// Mengikuti pola server/api/ppk/kegiatan/index.get.ts dengan adaptasi prodiId Kaprodi

import { eq, inArray, desc, and, ne } from "drizzle-orm";
import { useDrizzle } from "~~/server/db";
import { pengajuanRabTable, usersTable, ormawaTable } from "~~/server/db/schema";

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
        summary: { totalMasuk: 0, totalWaitingKaprodi: 0, totalRevisiKaprodi: 0 },
        data: [],
      };
    }

    // Step 1: Cari Ormawa yang terikat pada prodiId Kaprodi
    const ormawaRows = await db
      .select({ id: ormawaTable.id, nama: ormawaTable.nama, kode: ormawaTable.kode })
      .from(ormawaTable)
      .where(eq(ormawaTable.prodiId, prodiId));

    const ormawaIds = ormawaRows.map((o) => o.id);

    if (ormawaIds.length === 0) {
      return {
        success: true,
        summary: { totalMasuk: 0, totalWaitingKaprodi: 0, totalRevisiKaprodi: 0 },
        data: [],
      };
    }

    // Step 2: Cari all users dari Ormawa tersebut
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

    const ormawaUserIds = ormawaUsers.map((u) => u.usersId);

    if (ormawaUserIds.length === 0) {
      return {
        success: true,
        summary: { totalMasuk: 0, totalWaitingKaprodi: 0, totalRevisiKaprodi: 0 },
        data: [],
      };
    }

    // Step 3: Ambil data pengajuan proposal (selain draft) milik Ormawa tersebut
    const data = await db
      .select({ pengajuanRabTable })
      .from(pengajuanRabTable)
      .where(
        and(
          ne(pengajuanRabTable.status, "draft"),
          inArray(pengajuanRabTable.usersId, ormawaUserIds)
        )
      )
      .orderBy(desc(pengajuanRabTable.createdAt));

    // Buat map untuk mempercepat lookup pengaju dan ormawa (seperti di PPK)
    const userMap = new Map(ormawaUsers.map((u) => [u.usersId, u]));
    const ormawaMap = new Map(ormawaRows.map((o) => [o.id, o]));

    return {
      success: true,
      summary: {
        totalMasuk: data.length,
        totalWaitingKaprodi: data.filter((d) => d.pengajuanRabTable.status === "waiting_kaprodi").length,
        totalRevisiKaprodi: data.filter((d) => d.pengajuanRabTable.status === "revisi_kaprodi").length,
      },
      data: data.map((row) => {
        const r = row.pengajuanRabTable;
        const userInfo = userMap.get(r.usersId);
        const ormawaInfo = userInfo?.ormawaId ? ormawaMap.get(userInfo.ormawaId) : null;
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
      }),
    };
  } catch (error: any) {
    console.error("Error GET /api/kaprodi/kegiatan:", error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Gagal mengambil data pengajuan kegiatan",
      data: error,
    });
  }
});
