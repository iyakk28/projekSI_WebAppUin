import { defineEventHandler, createError } from "h3";
import { useDrizzle } from "../../../db/index";
import { eq, and, or } from "drizzle-orm";
import { pengajuanRabTable } from "../../../db/schema/pengajuanRabSchema";
import { kegiatanTable } from "../../../db/schema/KegiatanSchema";
import { lpgTable } from "../../../db/schema/lpgSchema";

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user || user.role !== "ormawa") {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const db = useDrizzle();

  try {
    // Mencari RAB yang statusnya 'lunas_ppk' dan kegiatannya sudah 'SELESAI'
    const results = await db
      .select({
        rabId: pengajuanRabTable.id,
        nomorPengajuan: pengajuanRabTable.nomorPengajuan,
        judulKegiatan: pengajuanRabTable.judulKegiatan,
        totalAnggaran: pengajuanRabTable.totalAnggaran,
        tanggalMulai: pengajuanRabTable.tanggalMulai,
        tanggalSelesai: pengajuanRabTable.tanggalSelesai,
        statusRab: pengajuanRabTable.status,
        statusKegiatan: kegiatanTable.statusKegiatan,
        kegiatanId: kegiatanTable.id,
        lpgStatus: lpgTable.statusLpg,
        lpgId: lpgTable.id,
      })
      .from(pengajuanRabTable)
      .innerJoin(
        kegiatanTable,
        eq(pengajuanRabTable.id, kegiatanTable.pengajuanRabId),
      )
      .leftJoin(lpgTable, eq(kegiatanTable.id, lpgTable.kegiatanId))
      .where(
        and(
          eq(pengajuanRabTable.usersId, user.users_id),
          eq(pengajuanRabTable.status, "lunas_ppk"),
        ),
      );

    return {
      success: true,
      data: results,
    };
  } catch (error: any) {
    console.error("Error fetching ready for LPG list:", error);
    throw createError({
      statusCode: 500,
      message: "Terjadi kesalahan server saat mengambil daftar RAB untuk LPG",
    });
  }
});
