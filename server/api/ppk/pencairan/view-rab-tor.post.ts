import fs from "node:fs";
import path from "node:path";
import { useDrizzle } from "~~/server/db";
import { eq, and } from "drizzle-orm";
import { pengajuanRabTable, kegiatanTable } from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
  try {
    const { user } = event.context;
    if (!user || user.role !== "ppk") {
      throw createError({
        statusCode: 403,
        statusMessage: "Akses ditolak. Peran PPK diperlukan.",
      });
    }

    const body = await readBody(event);
    const { kegiatanId, fileType } = body; // fileType: 'fileRabUrl' atau 'fileTorUrl'

    if (!kegiatanId || !fileType) {
      throw createError({
        statusCode: 400,
        statusMessage: "kegiatanId dan fileType wajib diisi",
      });
    }

    if (!["fileRabUrl", "fileTorUrl"].includes(fileType)) {
      throw createError({
        statusCode: 400,
        statusMessage: "fileType tidak valid",
      });
    }

    const db = useDrizzle();

    // Pastikan kegiatan tersebut milik fakultas PPK
    const [data] = await db
      .select({
        filePath: pengajuanRabTable[fileType as "fileRabUrl" | "fileTorUrl"],
      })
      .from(kegiatanTable)
      .innerJoin(
        pengajuanRabTable,
        eq(kegiatanTable.pengajuanRabId, pengajuanRabTable.id),
      )
      .where(
        and(
          eq(kegiatanTable.id, Number(kegiatanId)),
          eq(pengajuanRabTable.fakultasId, String(user.fakultasId))
        )
      );

    if (!data || !data.filePath) {
      throw createError({
        statusCode: 404,
        statusMessage: "File tidak ditemukan",
      });
    }

    const filePath = path.isAbsolute(data.filePath)
      ? data.filePath
      : path.resolve(process.cwd(), data.filePath);

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
    console.error("Error in ppk/pencairan/view-rab-tor:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Gagal memuat file",
    });
  }
});
