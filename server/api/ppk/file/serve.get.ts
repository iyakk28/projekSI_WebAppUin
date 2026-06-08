// FILE: server/api/ppk/file/serve.get.ts
// Secure file server for PPK - Validates access to files in the uploads folder
// Termasuk validasi untuk bukti pembayaran dari tabel pembayaran

import fs from "node:fs";
import path from "node:path";
import { eq, or, and } from "drizzle-orm";
import { useDrizzle } from "~~/server/db";
import {
  pengajuanRabTable,
  dokumentasiKegiatanTable,
  tagihanPencairanTable,
  pembayaranTable,
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

  // Validasi: Apakah file ini milik pengajuan/pencairan di fakultas ini?
  const isAuthorized = await db.transaction(async (tx) => {
    // 1. Cek di pengajuan_rab (RAB/TOR)
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

    // 2. Cek di dokumentasi_kegiatan (Foto Lapangan)
    const doc = await tx.query.dokumentasiKegiatanTable.findFirst({
        where: and(
            eq(dokumentasiKegiatanTable.fakultasId, String(fakultasId)),
            eq(dokumentasiKegiatanTable.fileUrl, fileUrl)
        )
    });
    if (doc) return true;

    // 3. Cek di tagihan_pencairan (Lampiran Ormawa)
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
                eq(tagihanPencairanTable.fotoBarangUrl, fileUrl)
            )
        )
    });
    if (tagihan) return true;

    // 4. Cek di tabel PEMBAYARAN (Bukti Transfer PPK)
    // Kita join ke tagihan_pencairan untuk memastikan fakultasId cocok
    const buktiBayar = await tx
        .select({ id: pembayaranTable.id })
        .from(pembayaranTable)
        .innerJoin(tagihanPencairanTable, eq(pembayaranTable.tagihanId, tagihanPencairanTable.id))
        .where(
            and(
                eq(tagihanPencairanTable.fakultasId, String(fakultasId)),
                eq(pembayaranTable.buktiTransferUrl, fileUrl)
            )
        )
        .limit(1);
    
    if (buktiBayar.length > 0) return true;

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
  setHeader(event, "Content-Disposition", `inline; filename="${path.basename(filePath)}"`);
  
  return sendStream(event, fs.createReadStream(filePath));
});
