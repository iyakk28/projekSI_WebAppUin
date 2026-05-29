import { eq } from "drizzle-orm";
import { useDrizzle } from "~~/server/db";
import {
  tagihanPencairanTable,
  kegiatanTable,
  pengajuanRabTable,
  usersTable,
  ormawaTable,
  logDokumentasiTagihanTable,
} from "~~/server/db/schema";

// Status yang boleh dikembalikan
const STATUS_BISA_DIKEMBALIKAN = ["WAITING_PEMBAYARAN", "TERVERIFIKASI"];

export default defineEventHandler(async (event) => {
  try {
    const id = Number(getRouterParam(event, "id"));
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "ID tagihan tidak valid",
      });
    }

    const body = await readBody(event);
    const { catatan } = body ?? {};

    if (!catatan?.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: "Catatan alasan pengembalian wajib diisi",
      });
    }

    const user = event.context.user;
    const db = useDrizzle();

    // ✅ Ambil fakultasId PPK yang sedang login
    const [ppkData] = await db
      .select({ fakultasId: usersTable.fakultasId })
      .from(usersTable)
      .where(eq(usersTable.users_id, user.id));

    if (!ppkData?.fakultasId) {
      throw createError({
        statusCode: 403,
        statusMessage: "PPK tidak memiliki data fakultas",
      });
    }

    // ✅ Query tagihan sekaligus join ke ormawa untuk validasi fakultas
    const [tagihan] = await db
      .select({
        id: tagihanPencairanTable.id,
        statusTagihan: tagihanPencairanTable.statusTagihan,
        namaPenerima: tagihanPencairanTable.namaPenerima,
        ormawaFakultasId: ormawaTable.fakultasId, // ✅ untuk validasi akses
      })
      .from(tagihanPencairanTable)
      .innerJoin(
        kegiatanTable,
        eq(tagihanPencairanTable.kegiatanId, kegiatanTable.id),
      )
      .innerJoin(
        pengajuanRabTable,
        eq(kegiatanTable.pengajuanRabId, pengajuanRabTable.id),
      )
      .innerJoin(
        usersTable,
        eq(pengajuanRabTable.usersId, usersTable.users_id),
      )
      .leftJoin(ormawaTable, eq(usersTable.ormawaId, ormawaTable.id))
      .where(eq(tagihanPencairanTable.id, id));

    if (!tagihan) {
      throw createError({
        statusCode: 404,
        statusMessage: "Tagihan pencairan tidak ditemukan",
      });
    }

    // ✅ Validasi: ormawa harus se-fakultas dengan PPK
    if (tagihan.ormawaFakultasId !== ppkData.fakultasId) {
      throw createError({
        statusCode: 403,
        statusMessage: "Anda tidak memiliki akses untuk mengembalikan tagihan ini",
      });
    }

    if (!STATUS_BISA_DIKEMBALIKAN.includes(tagihan.statusTagihan ?? "")) {
      throw createError({
        statusCode: 422,
        statusMessage: `Tagihan tidak bisa dikembalikan. Status saat ini: ${tagihan.statusTagihan}`,
      });
    }

    await db.transaction(async (tx) => {
      await tx
        .update(tagihanPencairanTable)
        .set({
          statusTagihan: "DIKEMBALIKAN",
          updatedAt: new Date().toISOString(),
        })
        .where(eq(tagihanPencairanTable.id, id));

      await tx.insert(logDokumentasiTagihanTable).values({
        tagihanId: id,
        action: "revisi",
        komentar: catatan.trim(),
        userId: Number(user.id),
      });
    });

    return {
      success: true,
      message: "Tagihan berhasil dikembalikan ke ormawa",
      data: {
        tagihanId: id,
        statusBaru: "DIKEMBALIKAN",
        catatan: catatan.trim(),
      },
    };
  } catch (error: any) {
    console.error("Error POST /api/ppk/pencairan/[id]/kembalikan:", error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Gagal mengembalikan tagihan",
      data: error,
    });
  }
});