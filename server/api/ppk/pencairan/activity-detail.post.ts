// FILE: server/api/ppk/pencairan/activity-detail.post.ts
// Mengambil detail kegiatan dan dokumentasi untuk pencairan PPK dengan Integrasi Pembayaran

import { and, eq, sql } from "drizzle-orm";
import { useDrizzle } from "~~/server/db";
import {
  dokumentasiKegiatanTable,
  kegiatanTable,
  ormawaTable,
  pengajuanRabTable,
  tagihanPencairanTable,
  usersTable,
  pembayaranTable,
} from "~~/server/db/schema";
import { showDekripsi } from "~~/server/utils/enkripsiData";

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

    // 2. Ambil info kegiatan & RAB (Pastikan PPK hanya akses fakultasnya sendiri)
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
      .innerJoin(
        usersTable,
        sql`BINARY ${pengajuanRabTable.usersId} = BINARY ${usersTable.id}`,
      )
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
        statusMessage: "Kegiatan tidak ditemukan atau akses ditolak",
      });
    }

    // 3. Ambil data dokumentasi foto
    const docsFoto = await db
      .select()
      .from(dokumentasiKegiatanTable)
      .where(eq(dokumentasiKegiatanTable.kegiatanId, kegiatanId));

    // 4. Ambil data tagihan beserta informasi pembayaran (Jika sudah dibayar)
    const tagihans = await db
      .select({
        tagihan: tagihanPencairanTable,
        pembayaran: {
          id: pembayaranTable.id,
          tanggal: pembayaranTable.tanggalPembayaran,
          buktiUrl: pembayaranTable.buktiTransferUrl,
          catatan: pembayaranTable.catatanPembayaran,
        },
      })
      .from(tagihanPencairanTable)
      .leftJoin(
        pembayaranTable,
        eq(tagihanPencairanTable.id, pembayaranTable.tagihanId),
      )
      .where(eq(tagihanPencairanTable.kegiatanId, kegiatanId));

    // 5. Transform & Secure URLs
    const getSecureUrl = (path: string | null) => {
      if (!path) return null;
      return `/api/ppk/file/serve?path=${encodeURIComponent(path)}`;
    };

    const combinedDocs = [
      // Map Foto Lapangan
      ...docsFoto.map((f) => ({
        id: f.id,
        type: "foto",
        tipeDokumen: f.tipeDokumen,
        deskripsi: f.deskripsi,
        status: f.status,
        createdAt: f.createdAt,
        nominal: 0,
        fileUrl: getSecureUrl(f.fileUrl),
        pembayaran: null,
      })),
      // Map Tagihan & Pembayaran
      ...tagihans.map((t) => ({
        id: t.tagihan.id,
        type: "tagihan",
        tipeDokumen: t.tagihan.tipeTagihan,
        deskripsi: showDekripsi(t.tagihan.namaPenerima),
        status: t.tagihan.statusTagihan,
        createdAt: t.tagihan.createdAt,
        nominal: Number(t.tagihan.nominal),
        fileUrl: null,
        // FIX: Cek apakah t.pembayaran ada sebelum mengakses .id
        pembayaran:
          t.pembayaran && t.pembayaran.id
            ? {
                ...t.pembayaran,
                buktiUrl: getSecureUrl(t.pembayaran.buktiUrl),
              }
            : null,
      })),
    ];

    const totalDibayar = tagihans
      .filter((t) => t.tagihan.statusTagihan === "SELESAI")
      .reduce((sum, t) => sum + Number(t.tagihan.nominal), 0);

    return {
      success: true,
      data: {
        kegiatan: {
          ...dataKegiatan,
          fileRabUrl: getSecureUrl(dataKegiatan.fileRabUrl),
          fileTorUrl: getSecureUrl(dataKegiatan.fileTorUrl),
        },
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
      data: error?.message || error,
    });
  }
});
