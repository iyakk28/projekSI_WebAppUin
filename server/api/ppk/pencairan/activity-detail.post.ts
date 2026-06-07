// FILE: server/api/ppk/pencairan/activity-detail.post.ts
// Mengambil detail kegiatan dan dokumentasi untuk pencairan PPK
// Input: body.id (ini adalah id dari kegiatanTable)
// Alur: kegiatan -> pengajuan_rab -> users -> ormawa

import { and, eq } from "drizzle-orm";
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
    const { user } = event.context;

    // 1. Validasi Role PPK
    if (!user || user.role !== "ppk") {
      throw createError({
        statusCode: 403,
        statusMessage: "Akses ditolak. Peran PPK diperlukan.",
      });
    }

    const body = await readBody(event);
    const kegiatanId = Number(body.id);

    if (isNaN(kegiatanId)) {
      throw createError({
        statusCode: 400,
        statusMessage: "ID Kegiatan tidak valid",
      });
    }

    const db = useDrizzle();

    // 2. Ambil info kegiatan & RAB dengan validasi akses fakultas
    const [dataKegiatan] = await db
      .select({
        id: kegiatanTable.id,
        statusKegiatan: kegiatanTable.statusKegiatan,
        pengajuanRabId: pengajuanRabTable.id,
        judulKegiatan: pengajuanRabTable.judulKegiatan,
        totalAnggaran: pengajuanRabTable.totalAnggaran,
        fileRabUrl: pengajuanRabTable.fileRabUrl,
        fileTorUrl: pengajuanRabTable.fileTorUrl,
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
      .where(
        and(
          eq(kegiatanTable.id, kegiatanId),
          eq(pengajuanRabTable.fakultasId, String(user.fakultasId)),
        ),
      );

    if (!dataKegiatan) {
      throw createError({
        statusCode: 404,
        statusMessage:
          "Kegiatan tidak ditemukan atau Anda tidak memiliki akses",
      });
    }

    // 3. Ambil data dokumentasi & tagihan menggunakan kegiatanId
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

    const tagihans = await db
      .select({
        id: tagihanPencairanTable.id,
        tipeTagihan: tagihanPencairanTable.tipeTagihan,
        namaPenerima: tagihanPencairanTable.namaPenerima,
        nominal: tagihanPencairanTable.nominal,
        statusTagihan: tagihanPencairanTable.statusTagihan,
        createdAt: tagihanPencairanTable.createdAt,
      })
      .from(tagihanPencairanTable)
      .where(eq(tagihanPencairanTable.kegiatanId, kegiatanId));

    // 4. Transform & Normalisasi Data
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

    const totalDibayar = tagihans
      .filter((t) => t.statusTagihan === "SELESAI")
      .reduce((sum, t) => sum + Number(t.nominal), 0);

    return {
      success: true,
      data: {
        kegiatan: dataKegiatan,
        dokumentasi: combinedDocs,
        totalDibayar,
        isReadyForLunas: totalDibayar >= Number(dataKegiatan.totalAnggaran),
      },
    };
  } catch (error: any) {
    console.error("Error in activity-detail PPK:", error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Gagal mengambil detail pencairan",
    });
  }
});
