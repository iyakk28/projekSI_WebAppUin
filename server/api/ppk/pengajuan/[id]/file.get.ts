// FILE: server/api/ppk/pengajuan/[id]/file.get.ts
// API Khusus untuk membaca dan mengirimkan file stream berdasarkan ID Pengajuan
// Memvalidasi apakah path file yang diminta benar-benar milik pengajuan tersebut

import fs from "node:fs";
import path from "node:path";
import { eq, or, and, inArray } from "drizzle-orm";
import { useDrizzle } from "~~/server/db";
import {
  pengajuanRabTable,
  kegiatanTable,
  dokumentasiKegiatanTable,
  tagihanPencairanTable,
  pembayaranTable,
} from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
  console.log("[API PPK File] ========== MULAI ==========");
  try {
    const db = useDrizzle();
    const { user } = event.context;
    const pengajuanId = Number(getRouterParam(event, "id"));
    const query = getQuery(event);
    const requestedPath = query.path as string;

    if (!user || user.role !== "ppk") {
      console.error("[API PPK File] ❌ Unauthorized: User bukan PPK");
      throw createError({ statusCode: 403, statusMessage: "Akses ditolak." });
    }

    if (!pengajuanId || !requestedPath) {
      console.error("[API PPK File] ❌ Parameter tidak lengkap", { pengajuanId, requestedPath });
      throw createError({ statusCode: 400, statusMessage: "ID Pengajuan dan Path File wajib diisi." });
    }

    // Helper untuk normalisasi path ke bentuk absolute untuk perbandingan yang adil
    const normalize = (p: string | null | undefined) => {
        if (!p) return "";
        // Hilangkan semicolon jika ada (kasus multiple paths)
        const cleanP = p.split(";")[0].trim();
        // Resolve ke absolute path
        return path.resolve(process.cwd(), cleanP.replace(/\\/g, '/')).toLowerCase();
    };

    const targetPathNormalized = normalize(requestedPath);
    console.log("[API PPK File] Requested Path (Normalized):", targetPathNormalized);

    // ========== VALIDASI KEPEMILIKAN FILE ==========
    // Kita ambil semua path file yang VALID untuk pengajuan ini dan bandingkan di tingkat aplikasi (JS)
    // agar lebih toleran terhadap perbedaan penulisan path (slash/backslash/absolute/relative)
    
    const isOwner = await db.transaction(async (tx) => {
      // 1. Ambil data Pengajuan (RAB/TOR)
      const rab = await tx.query.pengajuanRabTable.findFirst({
        where: and(
          eq(pengajuanRabTable.id, pengajuanId),
          eq(pengajuanRabTable.fakultasId, String(user.fakultasId))
        )
      });

      if (!rab) {
        console.error("[API PPK File] ❌ Pengajuan tidak ditemukan atau beda fakultas", { pengajuanId, userFakultasId: user.fakultasId });
        return false;
      }

      const validPaths = new Set<string>();
      validPaths.add(normalize(rab.fileRabUrl));
      validPaths.add(normalize(rab.fileTorUrl));

      // 2. Ambil Kegiatan
      const kegiatan = await tx.query.kegiatanTable.findFirst({
        where: eq(kegiatanTable.pengajuanRabId, pengajuanId)
      });

      if (kegiatan) {
        // 3. Ambil semua Dokumentasi Lapangan
        const docs = await tx.select({ fileUrl: dokumentasiKegiatanTable.fileUrl })
            .from(dokumentasiKegiatanTable)
            .where(eq(dokumentasiKegiatanTable.kegiatanId, kegiatan.id));
        
        docs.forEach(d => validPaths.add(normalize(d.fileUrl)));

        // 4. Ambil semua Tagihan (termasuk strukFileUrl untuk keamanan sementara)
        const tagihans = await tx.select()
            .from(tagihanPencairanTable)
            .where(eq(tagihanPencairanTable.kegiatanId, kegiatan.id));
        
        tagihans.forEach(t => {
            validPaths.add(normalize(t.skFileUrl));
            validPaths.add(normalize(t.spmtFileUrl));
            validPaths.add(normalize(t.amprahFileUrl));
            validPaths.add(normalize(t.npwpFileUrl));
            validPaths.add(normalize(t.ktpFileUrl));
            validPaths.add(normalize(t.bukuRekeningFileUrl));
            validPaths.add(normalize(t.strukFileUrl)); // Masukkan kembali untuk support data lama
            validPaths.add(normalize(t.fotoBarangUrl));
        });

        // 5. Ambil semua Pembayaran
        const tIds = tagihans.map(t => t.id);
        if (tIds.length > 0) {
            const payments = await tx.select({ bukti: pembayaranTable.buktiTransferUrl })
                .from(pembayaranTable)
                .where(inArray(pembayaranTable.tagihanId, tIds.map(id => BigInt(id))));
            
            payments.forEach(p => validPaths.add(normalize(p.bukti)));
        }
      }

      // Cek apakah target path ada di kumpulan path yang valid
      return validPaths.has(targetPathNormalized);
    });

    if (!isOwner) {
      console.error("[API PPK File] ❌ Akses ditolak: Path tidak terdaftar untuk pengajuan ini");
      throw createError({ statusCode: 403, statusMessage: "Anda tidak memiliki izin untuk mengakses file ini." });
    }

    // ========== PENGIRIMAN FILE STREAM ==========
    const filePath = path.resolve(process.cwd(), requestedPath.trim());
    
    if (!fs.existsSync(filePath)) {
      console.error("[API PPK File] ❌ File fisik tidak ditemukan", filePath);
      throw createError({ statusCode: 404, statusMessage: "File fisik tidak ditemukan di server." });
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

    console.log("[API PPK File] ✅ Mengirim file:", path.basename(filePath));
    console.log("[API PPK File] ========== SELESAI ==========");

    setHeader(event, "Content-Type", contentType);
    setHeader(event, "Content-Disposition", `inline; filename="${path.basename(filePath)}"`);

    return sendStream(event, fs.createReadStream(filePath));

  } catch (error: any) {
    console.error("[API PPK File] ❌ Gagal:", error.statusMessage || error.message);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Gagal memproses permintaan file.",
      data: error?.message || error
    });
  }
});
