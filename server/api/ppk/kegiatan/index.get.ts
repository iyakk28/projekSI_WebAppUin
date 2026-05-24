// FILE: server/api/ppk/kegiatan/index.get.ts
// VERSI DEBUG — tambah console.log di setiap step untuk cari step mana yang gagal
// Setelah ketemu masalahnya, hapus semua console.log debug

import { eq, inArray, desc, and } from "drizzle-orm";
import { useDrizzle } from "~~/server/db";
import { pengajuanRabTable, usersTable, ormawaTable } from "~~/server/db/schema";

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
      .select({ id: ormawaTable.id, nama: ormawaTable.nama, prodiId: ormawaTable.prodiId })
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

    console.log("Step 3 - ormawaUserIds:", ormawaUserIds);

    if (ormawaUserIds.length === 0) {
      console.log("STOP: tidak ada user dengan ormawa_id yang cocok");
      return {
        success: true,
        summary: { totalMasuk: 0, totalWaitingPPK: 0, totalRevisiPPK: 0 },
        data: [],
      };
    }

    // Step 4: Cek pengajuan dengan status apapun dulu (tanpa filter status) untuk debug
    const semuaPengajuan = await db
      .select({
        id: pengajuanRabTable.id,
        usersId: pengajuanRabTable.usersId,
        status: pengajuanRabTable.status,
        judul: pengajuanRabTable.judulKegiatan,
      })
      .from(pengajuanRabTable)
      .where(inArray(pengajuanRabTable.usersId, ormawaUserIds));

    console.log("Step 4 - semua pengajuan tanpa filter status:", JSON.stringify(semuaPengajuan));

    // Step 5: Filter dengan status waiting_ppk dan revisi_ppk
    const data = await db
      .select({ pengajuanRabTable })
      .from(pengajuanRabTable)
      .where(
        and(
          inArray(pengajuanRabTable.status, ["waiting_ppk", "revisi_ppk"]),
          inArray(pengajuanRabTable.usersId, ormawaUserIds),
        ),
      )
      .orderBy(desc(pengajuanRabTable.createdAt));

    console.log("Step 5 - data dengan filter waiting_ppk/revisi_ppk:", JSON.stringify(data));
    console.log("=== END DEBUG ===");

    // Buat map untuk lookup
    const userMap = new Map(ormawaUsers.map((u) => [u.usersId, u]));
    const ormawaDetailRows = await db
      .select({ id: ormawaTable.id, nama: ormawaTable.nama, kode: ormawaTable.kode })
      .from(ormawaTable)
      .where(inArray(ormawaTable.id, ormawaIds));
    const ormawaMap = new Map(ormawaDetailRows.map((o) => [o.id, o]));

    return {
      success: true,
      summary: {
        totalMasuk: data.length,
        totalWaitingPPK: data.filter((d) => d.pengajuanRabTable.status === "waiting_ppk").length,
        totalRevisiPPK: data.filter((d) => d.pengajuanRabTable.status === "revisi_ppk").length,
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
    console.error("Error GET /api/ppk/kegiatan:", error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Gagal mengambil data pengajuan kegiatan",
      data: error,
    });
  }
});