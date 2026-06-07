// FILE: server/api/ppk/kegiatan/[id]/file.post.ts
// Endpoint sederhana untuk serve file RAB/TOR ke PPK dengan validasi fakultasId

import fs from "node:fs";
import path from "node:path";
import { eq, and } from "drizzle-orm";
import { useDrizzle } from "~~/server/db";
import { pengajuanRabTable } from "~~/server/db/schema";

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

    const rabId = Number(getRouterParam(event, "id"));
    const body = await readBody(event);
    const { documentType = "rab" } = body;

    if (isNaN(rabId)) {
      throw createError({ statusCode: 400, statusMessage: "ID pengajuan tidak valid" });
    }

    const db = useDrizzle();

    // 2. Validasi Akses melalui fakultasId yang ada di tabel pengajuan_rab
    const rab = await db.query.pengajuanRabTable.findFirst({
      where: and(
        eq(pengajuanRabTable.id, rabId),
        eq(pengajuanRabTable.fakultasId, String(user.fakultasId))
      ),
    });

    if (!rab) {
      throw createError({
        statusCode: 403,
        statusMessage: "Anda tidak memiliki akses ke berkas ini atau data tidak ditemukan",
      });
    }

    const fileUrl = documentType === "tor" ? rab.fileTorUrl : rab.fileRabUrl;

    if (!fileUrl) {
      throw createError({
        statusCode: 404,
        statusMessage: `File ${documentType.toUpperCase()} belum diunggah`,
      });
    }

    const filePath = path.resolve(process.cwd(), fileUrl.trim());

    if (!fs.existsSync(filePath)) {
      throw createError({
        statusCode: 404,
        statusMessage: "File fisik tidak ditemukan di server",
      });
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

  } catch (error: any) {
    console.error("Error serving file for PPK:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Gagal memproses permintaan file",
    });
  }
});
