import {
  pengajuanRabTable,
  usersTable,
  fakultasTable,
  programStudiTable,
  ormawaTable,
} from "~~/server/db/schema";
import { useDrizzle } from "~~/server/db";
import { eq, sql } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { rabId } = body;

    if (!rabId) {
      throw createError({ statusCode: 400, message: "rabId wajib dikirim" });
    }

    const { user } = event.context;

    const db = useDrizzle();

    const data = await db
      .select({
        id: pengajuanRabTable.id,
        nomorPengajuan: pengajuanRabTable.nomorPengajuan,
        judulKegiatan: pengajuanRabTable.judulKegiatan,
        deskripsi: pengajuanRabTable.deskripsi,
        totalAnggaran: pengajuanRabTable.totalAnggaran,
        status: pengajuanRabTable.status,
        tanggalMulai: pengajuanRabTable.tanggalMulai,
        tanggalSelesai: pengajuanRabTable.tanggalSelesai,
        createdAt: pengajuanRabTable.createdAt,
        updatedAt: pengajuanRabTable.updatedAt,
        pengaju: usersTable.fullName,
        ormawa: ormawaTable.nama,
        fakultas: fakultasTable.nama,
        prodi: programStudiTable.nama,
        ormawaId: pengajuanRabTable.ormawaId,
      })
      .from(pengajuanRabTable)
      .leftJoin(
        usersTable,
        eq(sql`CAST(${pengajuanRabTable.usersId} AS UNSIGNED)`, usersTable.id),
      )
      .leftJoin(
        fakultasTable,
        eq(
          sql`CAST(${pengajuanRabTable.fakultasId} AS UNSIGNED)`,
          fakultasTable.id,
        ),
      )
      .leftJoin(
        programStudiTable,
        eq(
          sql`CAST(${pengajuanRabTable.prodiId} AS UNSIGNED)`,
          programStudiTable.id,
        ),
      )
      .leftJoin(
        ormawaTable,
        eq(sql`CAST(${pengajuanRabTable.ormawaId} AS UNSIGNED)`, ormawaTable.id),
      )
      .where(eq(pengajuanRabTable.id, Number(rabId)))
      .limit(1);

    if (data.length === 0) {
      throw createError({ statusCode: 404, message: "RAB tidak ditemukan" });
    }

    return {
      success: true,
      data: data[0],
    };
  } catch (error: any) {
    console.log(error);
    return {
      success: false,
      message: error.message || "Terjadi kesalahan saat mengambil detail RAB",
    };
  }
});
