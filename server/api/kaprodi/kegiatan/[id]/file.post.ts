// FILE: server/api/kaprodi/kegiatan/[id]/file.post.ts
// Endpoint untuk mengalirkan file RAB/TOR fisik ke browser Kaprodi
// Dioptimalkan dengan filter ormawaId langsung dan Join satu kali jalan

import fs from "node:fs";
import path from "node:path";
import { eq, and } from "drizzle-orm";
import { useDrizzle } from "~~/server/db";
import {
  pengajuanRabTable,
  ormawaTable,
} from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
  try {
    const rabId = Number(getRouterParam(event, "id"));
    if (isNaN(rabId) || rabId <= 0) {
      throw createError({ statusCode: 400, message: "ID pengajuan tidak valid" });
    }

    const body = await readBody(event);
    const { documentType = "rab" } = body;

    if (!["rab", "tor"].includes(documentType)) {
      throw createError({
        statusCode: 400,
        message: "Tipe dokumen tidak valid. Gunakan 'rab' atau 'tor'.",
      });
    }

    const db = useDrizzle();
    const { user } = event.context;

    // Pastikan user terautentikasi dan memiliki prodiId
    if (!user || user.role !== "kaprodi") {
      throw createError({
        statusCode: 403,
        message: "Akses ditolak. Peran Kaprodi diperlukan.",
      });
    }

    const prodiId = user.prodiId;

    if (!prodiId) {
      throw createError({
        statusCode: 403,
        message: "Anda tidak memiliki program studi yang valid",
      });
    }

    // Step 1: Validasi akses sekaligus ambil path file
    const result = await db
      .select({
        fileRabUrl: pengajuanRabTable.fileRabUrl,
        fileTorUrl: pengajuanRabTable.fileTorUrl,
      })
      .from(pengajuanRabTable)
      .innerJoin(ormawaTable, eq(pengajuanRabTable.ormawaId, ormawaTable.id))
      .where(
        and(
          eq(pengajuanRabTable.id, rabId),
          eq(ormawaTable.prodiId, Number(prodiId))
        )
      )
      .limit(1);

    const rab = result[0];

    if (!rab) {
      throw createError({
        statusCode: 403,
        message: "Anda tidak memiliki akses ke file pengajuan ini atau pengajuan tidak ditemukan",
      });
    }

    // Tentukan path URL berdasarkan file yang diminta
    const fileUrl = documentType === "tor" ? rab.fileTorUrl : rab.fileRabUrl;

    if (!fileUrl) {
      throw createError({
        statusCode: 404,
        message: `File ${documentType.toUpperCase()} belum diunggah untuk pengajuan ini`,
      });
    }

    const filePath = path.resolve(process.cwd(), fileUrl.trim());

    if (!fs.existsSync(filePath)) {
      throw createError({
        statusCode: 404,
        message: `File tidak ditemukan secara fisik di server`,
      });
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".pdf": "application/pdf",
    };
    const contentType = mimeTypes[ext] || "application/octet-stream";

    setHeader(event, "Content-Type", contentType);
    setHeader(
      event,
      "Content-Disposition",
      `inline; filename="${path.basename(filePath)}"`
    );

    return sendStream(event, fs.createReadStream(filePath));
  } catch (error: any) {
    console.error("Error POST /api/kaprodi/kegiatan/[id]/file:", error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: "Gagal mengalirkan dokumen",
      data: error,
    });
  }
});
