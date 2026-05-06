import { eq } from "drizzle-orm";
import { useDrizzle } from "~~/server/db";
import {
  tagihanPencairanTable,
  kegiatanTable,
  pengajuanRabTable,
  usersTable,
  ormawaTable,
} from "~~/server/db/schema";

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
    const { keputusan, catatan } = body ?? {};

    if (!keputusan || !["terverifikasi", "dikembalikan"].includes(keputusan)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Keputusan tidak valid. Pilihan: terverifikasi | dikembalikan",
      });
    }

    if (keputusan === "dikembalikan" && !catatan?.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: "Catatan wajib diisi jika dokumen dikembalikan",
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

    // ✅ Query tagihan + join ke ormawa untuk validasi fakultas
    const [tagihan] = await db
      .select({
        id: tagihanPencairanTable.id,
        nominal: tagihanPencairanTable.nominal,
        statusTagihan: tagihanPencairanTable.statusTagihan,
        tipeTagihan: tagihanPencairanTable.tipeTagihan,
        totalAnggaranRab: pengajuanRabTable.totalAnggaran,
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
        statusMessage: "Anda tidak memiliki akses untuk memverifikasi tagihan ini",
      });
    }

    if (tagihan.statusTagihan !== "WAITING_PEMBAYARAN") {
      throw createError({
        statusCode: 422,
        statusMessage: `Tagihan tidak bisa diverifikasi. Status saat ini: ${tagihan.statusTagihan}`,
      });
    }

    // Cek nominal tidak melebihi RAB
    const nominalTagihan = Number(tagihan.nominal);
    const totalRab = Number(tagihan.totalAnggaranRab);
    if (keputusan === "terverifikasi" && nominalTagihan > totalRab) {
      throw createError({
        statusCode: 422,
        statusMessage: `Nominal tagihan (${nominalTagihan}) melebihi total anggaran RAB (${totalRab}). Tidak bisa diverifikasi.`,
      });
    }

    const statusBaru =
      keputusan === "terverifikasi" ? "TERVERIFIKASI" : "DIKEMBALIKAN";

    await db
      .update(tagihanPencairanTable)
      .set({
        statusTagihan: statusBaru,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(tagihanPencairanTable.id, id));

    return {
      success: true,
      message:
        keputusan === "terverifikasi"
          ? "Dokumen terverifikasi, tagihan siap dibayarkan"
          : "Tagihan dikembalikan ke ormawa untuk diperbaiki",
      data: {
        tagihanId: id,
        statusBaru,
        catatan: catatan?.trim() ?? null,
      },
    };
  } catch (error: any) {
    console.error("Error POST /api/ppk/pencairan/[id]/verifikasi:", error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Gagal memverifikasi tagihan",
      data: error,
    });
  }
});