import { eq, sum, and, sql } from "drizzle-orm";
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
    if (totalDibayar < totalAnggaran) {
      throw createError({
        statusCode: 400,
        statusMessage: `Gagal Melunasi: Total dibayar (${totalDibayar.toLocaleString("id-ID")}) masih kurang dari total anggaran (${totalAnggaran.toLocaleString("id-ID")}).`,
      });
    }

    // 4. Update status kegiatan menjadi LUNAS dan update pengajuan_rab menjadi lunas_ppk
    // Menggunakan transaction untuk memastikan kedua update berhasil
    await db.transaction(async (tx) => {
      // Update di tabel kegiatan
      await tx
        .update(kegiatanTable)
        .set({
          statusKegiatan: "LUNAS",
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(kegiatanTable.id, kegiatanId));

      // Update di tabel pengajuan_rab sesuai dengan StatusEnum (lunas_ppk)
      if (kegiatan.pengajuanRabId) {
        await tx
          .update(pengajuanRabTable)
          .set({
            status: "lunas_ppk",
            updatedAt: sql`CURRENT_TIMESTAMP`,
          })
          .where(eq(pengajuanRabTable.id, kegiatan.pengajuanRabId));
      }
    });

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

