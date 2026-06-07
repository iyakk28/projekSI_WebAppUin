// FILE: server/api/ppk/pengajuan/index.get.ts
// Mengambil semua pengajuan kegiatan di fakultas PPK
import { eq, desc, and, ne, inArray } from "drizzle-orm";
import { useDrizzle } from "~~/server/db";
import {
  pengajuanRabTable,
  usersTable,
  ormawaTable,
  kegiatanTable,
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

    // 2. Query langsung menggunakan fakultasId yang ada di pengajuan_rab
    const pengajuan = await db
      .select({
        id: pengajuanRabTable.id,
        nomorPengajuan: pengajuanRabTable.nomorPengajuan,
        usersId: pengajuanRabTable.usersId,
        judulKegiatan: pengajuanRabTable.judulKegiatan,
        deskripsi: pengajuanRabTable.deskripsi,
        totalAnggaran: pengajuanRabTable.totalAnggaran,
        tanggalMulai: pengajuanRabTable.tanggalMulai,
        status: pengajuanRabTable.status,
        createdAt: pengajuanRabTable.createdAt,
      })
      .from(pengajuanRabTable)
      .where(
        and(
          eq(pengajuanRabTable.fakultasId, String(fakultasId)),
          ne(pengajuanRabTable.status, "draft"),
        ),
      )
      .orderBy(desc(pengajuanRabTable.createdAt));

    if (pengajuan.length === 0) {
      return { success: true, data: [] };
    }

    // 3. Ambil data pendukung secara efisien
    const userIdsStrings = [...new Set(pengajuan.map((p) => p.usersId).filter(Boolean))];
    const pengajuanIds = pengajuan.map((p) => p.id);

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

    const kegiatanData = pengajuanIds.length
      ? await db
          .select({
            pengajuanRabId: kegiatanTable.pengajuanRabId,
            statusKegiatan: kegiatanTable.statusKegiatan,
          })
          .from(kegiatanTable)
          .where(inArray(kegiatanTable.pengajuanRabId, pengajuanIds))
      : [];

    const userMap = new Map(usersData.map((u) => [u.usersId, u]));
    const ormawaMap = new Map(ormawaData.map((o) => [o.id, o]));
    const kegiatanMap = new Map(kegiatanData.map((k) => [k.pengajuanRabId, k]));

    const result = pengajuan.map((p) => {
      const u = userMap.get(p.usersId);
      const o = u?.ormawaId ? ormawaMap.get(u.ormawaId) : null;
      const k = kegiatanMap.get(p.id);

      return {
        id: p.id,
        nomorPengajuan: p.nomorPengajuan,
        judulKegiatan: p.judulKegiatan,
        totalAnggaran: Number(p.totalAnggaran),
        status: p.status,
        createdAt: p.createdAt,
        pengaju: u?.fullName || "Tidak diketahui",
        ormawa: o?.nama || "Tidak diketahui",
        ormawaKode: o?.kode || "",
        statusKegiatan: k?.statusKegiatan || null,
      };
    });

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    console.error("Error GET /api/ppk/pengajuan:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Gagal mengambil data pengajuan",
    });
  }
});
