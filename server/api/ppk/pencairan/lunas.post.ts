import { eq, sum, and, inArray } from "drizzle-orm";
import { useDrizzle } from "~~/server/db";
import {
  kegiatanTable,
  tagihanPencairanTable,
  pengajuanRabTable,
} from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const kegiatanId = Number(body.id);

    if (isNaN(kegiatanId)) {
      throw createError({
        statusCode: 400,
        statusMessage: "ID Kegiatan tidak valid",
      });
    }

    const db = useDrizzle();

    // 1. Ambil info kegiatan dan total anggaran awal dari RAB
    const [kegiatan] = await db
      .select({
        id: kegiatanTable.id,
        pengajuanRabId: kegiatanTable.pengajuanRabId,
        totalAnggaran: pengajuanRabTable.totalAnggaran,
      })
      .from(kegiatanTable)
      .innerJoin(
        pengajuanRabTable,
        eq(kegiatanTable.pengajuanRabId, pengajuanRabTable.id),
      )
      .where(eq(kegiatanTable.id, kegiatanId));

    if (!kegiatan) {
      throw createError({
        statusCode: 404,
        statusMessage: "Kegiatan tidak ditemukan",
      });
    }

    // 2. Hitung total nominal tagihan yang statusnya SELESAI (sudah dibayar)
    const [tagihanTotal] = await db
      .select({
        totalDibayar: sum(tagihanPencairanTable.nominal),
      })
      .from(tagihanPencairanTable)
      .where(
        and(
          eq(tagihanPencairanTable.kegiatanId, kegiatanId),
          eq(tagihanPencairanTable.statusTagihan, "SELESAI"),
        ),
      );

    const totalDibayar = Number(tagihanTotal?.totalDibayar || 0);
    const totalAnggaran = Number(kegiatan.totalAnggaran || 0);

    // 3. Validasi: Total yang dibayar harus sama dengan Total Anggaran
    // Kita gunakan pembulatan atau toleransi kecil jika perlu, tapi biasanya desimal presisi
    if (totalDibayar < totalAnggaran) {
      throw createError({
        statusCode: 400,
        statusMessage: `Gagal Melunasi: Total dibayar (${totalDibayar}) masih kurang dari total anggaran (${totalAnggaran}).`,
      });
    }

    // 4. Update status kegiatan menjadi LUNAS dengan format MySQL datetime
    await db
      .update(kegiatanTable)
      .set({
        statusKegiatan: "LUNAS",
        updatedAt: new Date(), // Langsung kirim Date object, Drizzle akan mengkonversinya
      })
      .where(eq(kegiatanTable.id, kegiatanId));

    return {
      success: true,
      message: "Kegiatan berhasil ditandai LUNAS.",
      data: {
        totalDibayar,
        totalAnggaran,
      },
    };
  } catch (error: any) {
    console.error("Error POST /api/ppk/pencairan/lunas:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage:
        error.statusMessage || "Gagal mengonfirmasi lunas kegiatan",
    });
  }
});
