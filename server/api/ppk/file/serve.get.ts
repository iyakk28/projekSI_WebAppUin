// FILE: server/api/ppk/file/serve.get.ts
// Secure file server for PPK - Validates access to files in the uploads folder

import fs from "node:fs";
import path from "node:path";
import { eq, or, and } from "drizzle-orm";
import { useDrizzle } from "~~/server/db";
import {
  pengajuanRabTable,
  dokumentasiKegiatanTable,
  tagihanPencairanTable,
} from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const fileUrl = query.path as string;

  if (!fileUrl) {
    throw createError({ statusCode: 400, message: "Path file tidak ditemukan" });
  }

  const db = useDrizzle();
  const { user } = event.context;

  if (!user || user.role !== "ppk") {
    throw createError({ statusCode: 403, message: "Akses ditolak" });
  }

  const fakultasId = user.fakultasId;
  if (!fakultasId) {
     throw createError({ statusCode: 403, message: "PPK tidak memiliki fakultas" });
  }

  // Validasi: Apakah file ini milik pengajuan di fakultas ini?
  // Kita cek di pengajuan_rab (RAB/TOR), dokumentasi_kegiatan, atau tagihan_pencairan.
  // Ini mungkin agak berat jika datanya sangat besar, tapi paling aman.
  
  // Untuk efisiensi, kita bisa asumsikan file yang diminta valid jika fakultasId cocok 
  // di record yang memegang URL tersebut.

  const isAuthorized = await db.transaction(async (tx) => {
    // Cek di pengajuan_rab
    const rab = await tx.query.pengajuanRabTable.findFirst({
        where: and(
            eq(pengajuanRabTable.fakultasId, String(fakultasId)),
            or(
                eq(pengajuanRabTable.fileRabUrl, fileUrl),
                eq(pengajuanRabTable.fileTorUrl, fileUrl)
            )
        )
    });
    if (rab) return true;

    // Cek di dokumentasi_kegiatan
    const doc = await tx.query.dokumentasiKegiatanTable.findFirst({
        where: and(
            eq(dokumentasiKegiatanTable.fakultasId, String(fakultasId)),
            eq(dokumentasiKegiatanTable.fileUrl, fileUrl)
        )
    });
    if (doc) return true;

    // Cek di tagihan_pencairan (banyak kolom file)
    const tagihan = await tx.query.tagihanPencairanTable.findFirst({
        where: and(
            eq(tagihanPencairanTable.fakultasId, String(fakultasId)),
            or(
                eq(tagihanPencairanTable.skFileUrl, fileUrl),
                eq(tagihanPencairanTable.spmtFileUrl, fileUrl),
                eq(tagihanPencairanTable.amprahFileUrl, fileUrl),
                eq(tagihanPencairanTable.npwpFileUrl, fileUrl),
                eq(tagihanPencairanTable.ktpFileUrl, fileUrl),
                eq(tagihanPencairanTable.bukuRekeningFileUrl, fileUrl),
                eq(tagihanPencairanTable.strukFileUrl, fileUrl),
                eq(tagihanPencairanTable.fotoBarangUrl, fileUrl),
                eq(tagihanPencairanTable.buktiPembayaranUrl, fileUrl)
            )
        )
    });
    if (tagihan) return true;

    return false;
  });

  if (!isAuthorized) {
    throw createError({ statusCode: 403, message: "Anda tidak memiliki akses ke file ini" });
  }

  const filePath = path.resolve(process.cwd(), fileUrl.trim());
  if (!fs.existsSync(filePath)) {
    throw createError({ statusCode: 404, message: "File tidak ditemukan secara fisik" });
  }

  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
  };
  const contentType = mimeTypes[ext] || "application/octet-stream";

  setHeader(event, "Content-Type", contentType);
  return sendStream(event, fs.createReadStream(filePath));
});
