import { and, eq, sql } from "drizzle-orm";
import { useDrizzle } from "~~/server/db";
import {
  dokumentasiKegiatanTable,
  kegiatanTable,
  ormawaTable,
  pengajuanRabTable,
  tagihanPencairanTable,
  usersTable,
} from "~~/server/db/schema";
import { showDekripsi } from "~~/server/utils/enkripsiData";
import { toPublicUploadUrl } from "~~/server/utils/pencairanHelpers";

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

    // 1. Ambil info kegiatan
    const [kegiatan] = await db
      .select({
        id: kegiatanTable.id,
        statusKegiatan: kegiatanTable.statusKegiatan,
        judulKegiatan: pengajuanRabTable.judulKegiatan,
        totalAnggaran: pengajuanRabTable.totalAnggaran,
        ormawaName: ormawaTable.nama,
        ormawaKode: ormawaTable.kode,
        pengajuNama: usersTable.fullName,
      })
      .from(kegiatanTable)
      .innerJoin(
        pengajuanRabTable,
        eq(kegiatanTable.pengajuanRabId, pengajuanRabTable.id),
      )
      .innerJoin(usersTable, eq(pengajuanRabTable.usersId, usersTable.id))
      .innerJoin(ormawaTable, eq(usersTable.ormawaId, ormawaTable.id))
      .where(eq(kegiatanTable.id, kegiatanId));

    if (!kegiatan) {
      throw createError({
        statusCode: 404,
        statusMessage: "Kegiatan tidak ditemukan",
      });
    }

    // 2. Ambil semua dokumentasi foto kegiatan
    const docsFoto = await db
      .select({
        id: dokumentasiKegiatanTable.id,
        tipeDokumen: dokumentasiKegiatanTable.tipeDokumen,
        deskripsi: dokumentasiKegiatanTable.deskripsi,
        status: dokumentasiKegiatanTable.status,
        fileUrl: dokumentasiKegiatanTable.fileUrl,
        createdAt: dokumentasiKegiatanTable.createdAt,
      })
      .from(dokumentasiKegiatanTable)
      .where(eq(dokumentasiKegiatanTable.kegiatanId, kegiatanId));

    // 3. Ambil semua tagihan (barang/jasa)
    const tagihans = await db
      .select({
        id: tagihanPencairanTable.id,
        tipeTagihan: tagihanPencairanTable.tipeTagihan,
        namaPenerima: tagihanPencairanTable.namaPenerima,
        rekeningPenerima: tagihanPencairanTable.rekeningPenerima,
        bankPenerima: tagihanPencairanTable.bankPenerima,
        nominal: tagihanPencairanTable.nominal,
        statusTagihan: tagihanPencairanTable.statusTagihan,
        createdAt: tagihanPencairanTable.createdAt,
      })
      .from(tagihanPencairanTable)
      .where(eq(tagihanPencairanTable.kegiatanId, kegiatanId));

    // Combine and normalize
    const combinedDocs = [
      ...docsFoto.map((f) => ({
        id: f.id,
        type: "foto",
        tipeDokumen: f.tipeDokumen,
        deskripsi: f.deskripsi,
        status: f.status,
        createdAt: f.createdAt,
        nominal: 0,
        fileUrl: toPublicUploadUrl(f.fileUrl),
      })),
      ...tagihans.map((t) => ({
        id: t.id,
        type: "tagihan",
        tipeDokumen: t.tipeTagihan,
        deskripsi: showDekripsi(t.namaPenerima),
        status: t.statusTagihan,
        createdAt: t.createdAt,
        nominal: Number(t.nominal),
        fileUrl: null,
      })),
    ];

    // Total cost calculation
    const totalTagihan = tagihans.reduce(
      (sum, t) => sum + Number(t.nominal),
      0,
    );
    const totalDibayar = tagihans
      .filter((t) => t.statusTagihan === "SELESAI")
      .reduce((sum, t) => sum + Number(t.nominal), 0);

    return {
      success: true,
      data: {
        kegiatan,
        dokumentasi: combinedDocs,
        totalBiaya: totalTagihan,
        totalDibayar: totalDibayar,
        isReadyForLunas: totalDibayar >= Number(kegiatan.totalAnggaran),
      },
    };
  } catch (error: any) {
    console.error("Error POST /api/ppk/pencairan/activity-detail:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Gagal mengambil detail pencairan",
    });
  }
});
