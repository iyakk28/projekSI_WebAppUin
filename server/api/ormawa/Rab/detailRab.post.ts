import {
  pengajuanRabTable,
  usersTable,
  ormawaTable,
} from "~~/server/db/schema";
import { useDrizzle } from "~~/server/db";
import { eq, and } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { rabId } = body;

    if (!rabId) {
      throw createError({ statusCode: 400, message: "rabId wajib dikirim" });
    }

    const { user } = event.context;
    const db = useDrizzle();

    const result = await db
      .select({
        id: pengajuanRabTable.id,
        nomorPengajuan: pengajuanRabTable.nomorPengajuan,
        judulKegiatan: pengajuanRabTable.judulKegiatan,
        deskripsi: pengajuanRabTable.deskripsi,
        fileRabUrl: pengajuanRabTable.fileRabUrl,
        fileTorUrl: pengajuanRabTable.fileTorUrl,
        totalAnggaran: pengajuanRabTable.totalAnggaran,
        status: pengajuanRabTable.status,
        tanggalMulai: pengajuanRabTable.tanggalMulai,
        tanggalSelesai: pengajuanRabTable.tanggalSelesai,
        createdAt: pengajuanRabTable.createdAt,
        updatedAt: pengajuanRabTable.updatedAt,
        userName: usersTable.fullName,
        userEmail: usersTable.email,
        ormawaName: ormawaTable.nama,
        ormawaKode: ormawaTable.kode,
      })
      .from(pengajuanRabTable)
      .innerJoin(usersTable, eq(pengajuanRabTable.usersId, usersTable.id))
      .innerJoin(ormawaTable, eq(pengajuanRabTable.ormawaId, ormawaTable.id))
      .where(
        and(
          eq(pengajuanRabTable.id, Number(rabId)),
          eq(pengajuanRabTable.ormawaId, String(user.ormawaId)),
        ),
      )
      .limit(1);

    const data = result[0];

    if (!data) {
      throw createError({ statusCode: 404, message: "RAB tidak ditemukan" });
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }

    console.error("Error pada detailRab:", error);

    throw createError({
      statusCode: 500,
      message: "Terjadi kesalahan internal pada server",
    });
  }
});
