// FILE: server/api/ppk/pencairan/file-view.post.ts
// Mengambil file stream secara aman untuk detail pencairan PPK
// Prioritas: Mengambil bukti transfer dari tabel pembayaran untuk tipe tagihan

import fs from "node:fs";
import path from "node:path";
import { useDrizzle } from "~~/server/db";
import { eq, and } from "drizzle-orm";
import { 
  dokumentasiKegiatanTable, 
  tagihanPencairanTable, 
  pembayaranTable,
  pengajuanRabTable,
  kegiatanTable
} from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
  const { user } = event.context;
  if (!user || user.role !== "ppk") {
    throw createError({ statusCode: 403, message: "Akses ditolak." });
  }

  const body = await readBody(event);
  const { id, type, field } = body; // id: ID Tagihan atau ID Dokumentasi

  if (!id || !type) {
    throw createError({ statusCode: 400, message: "ID dan Tipe wajib diisi" });
  }

  const db = useDrizzle();
  let fileUrl = "";

  if (type === "tagihan") {
    // 1. Ambil info tagihan dan validasi fakultas
    const tagihan = await db.query.tagihanPencairanTable.findFirst({
      where: eq(tagihanPencairanTable.id, Number(id)),
    });

    if (!tagihan || String(tagihan.fakultasId) !== String(user.fakultasId)) {
        throw createError({ statusCode: 404, message: "Tagihan tidak ditemukan atau akses ditolak" });
    }

    // 2. Tentukan file yang akan diambil
    if (field && (tagihan as any)[field]) {
        fileUrl = (tagihan as any)[field];
    } else {
        // Jika tidak ada field spesifik, coba ambil bukti pembayaran
        const pembayaran = await db.query.pembayaranTable.findFirst({
            where: eq(pembayaranTable.tagihanId, Number(id))
        });
        if (pembayaran) {
            fileUrl = pembayaran.buktiTransferUrl;
        } else {
            throw createError({ statusCode: 404, message: "File atau bukti pembayaran tidak ditemukan" });
        }
    }

  } else if (type === "foto") {
    // Validasi dokumentasi foto (lampiran kegiatan)
    const doc = await db.query.dokumentasiKegiatanTable.findFirst({
      where: eq(dokumentasiKegiatanTable.id, Number(id)),
    });
    
    if (!doc || String(doc.fakultasId) !== String(user.fakultasId)) {
        throw createError({ statusCode: 404, message: "Dokumentasi tidak ditemukan atau akses ditolak" });
    }
    
    fileUrl = doc.fileUrl;
  }

  if (!fileUrl) {
    throw createError({ statusCode: 404, message: "File tidak ditemukan di database" });
  }

  // Handle pathing
  const firstPath = fileUrl.split(";")[0].trim();
  const filePath = path.resolve(process.cwd(), firstPath);

  if (!fs.existsSync(filePath)) {
    throw createError({ statusCode: 404, message: "File fisik tidak ditemukan di server" });
  }

  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
  };
  const contentType = mimeTypes[ext] || "application/octet-stream";

  setHeader(event, "Content-Type", contentType);
  setHeader(event, "Content-Disposition", `inline; filename="${path.basename(filePath)}"`);

  return sendStream(event, fs.createReadStream(filePath));
});
