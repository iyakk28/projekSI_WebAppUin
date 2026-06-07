// FILE: server/api/ppk/pengajuan/waiting.get.ts
// Mengambil pengajuan yang menunggu persetujuan PPK (status: waiting_ppk)
import { eq, desc, and, inArray } from "drizzle-orm";
import { useDrizzle } from "~~/server/db";
import {
  pengajuanRabTable,
  usersTable,
  ormawaTable,
} from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
  try {
    const db = useDrizzle();
    const { user } = event.context;

    // 1. Validasi Role PPK
    if (!user || user.role !== "ppk") {
      throw createError({
        statusCode: 403,
        statusMessage: "Akses ditolak. Peran PPK diperlukan.",
      });
    }

    const fakultasId = user.fakultasId;
    if (!fakultasId) {
      return { success: true, data: [] };
    }

    // 2. Query pengajuan dengan status waiting_ppk di fakultas PPK
    const pengajuan = await db
      .select({
        id: pengajuanRabTable.id,
        nomorPengajuan: pengajuanRabTable.nomorPengajuan,
        usersId: pengajuanRabTable.usersId,
        judulKegiatan: pengajuanRabTable.judulKegiatan,
        totalAnggaran: pengajuanRabTable.totalAnggaran,
        status: pengajuanRabTable.status,
        createdAt: pengajuanRabTable.createdAt,
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
      return { success: true, data: [] };
    }

    // 3. Ambil data pendukung (User & Ormawa)
    const userIdsStrings = [...new Set(pengajuan.map((p) => p.usersId).filter(Boolean))];

    const usersData = userIdsStrings.length
      ? await db
          .select({
            usersId: usersTable.users_id,
            fullName: usersTable.fullName,
            ormawaId: usersTable.ormawaId,
          })
          .from(usersTable)
          .where(inArray(usersTable.users_id, userIdsStrings))
      : [];

    const ormawaIds = [...new Set(usersData.map((u) => u.ormawaId).filter(Boolean))] as number[];

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

    const userMap = new Map(usersData.map((u) => [u.usersId, u]));
    const ormawaMap = new Map(ormawaData.map((o) => [o.id, o]));

    const result = pengajuan.map((p) => {
      const userInfo = userMap.get(p.usersId);
      const ormawaInfo = userInfo?.ormawaId ? ormawaMap.get(userInfo.ormawaId) : null;

      return {
        id: p.id,
        nomorPengajuan: p.nomorPengajuan,
        judulKegiatan: p.judulKegiatan,
        totalAnggaran: Number(p.totalAnggaran ?? 0),
        status: p.status,
        createdAt: p.createdAt,
        pengaju: userInfo?.fullName || "Tidak diketahui",
        ormawa: ormawaInfo?.nama || "Tidak diketahui",
        ormawaKode: ormawaInfo?.kode || "",
      };
    });

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    console.error("Error GET /api/ppk/pengajuan/waiting:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Gagal mengambil data pengajuan menunggu",
    });
  }
});
