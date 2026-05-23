import fs from "node:fs";
import path from "node:path";
import { useDrizzle } from "~~/server/db";
import { eq } from "drizzle-orm";
import { dokumentasiKegiatanTable } from "~~/server/db/schema/dokumentasiSchema";
import { tagihanPencairanTable } from "~~/server/db/schema/TagihanPencairanSchema";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { id, field = "fileUrl" } = body;

  if (!id) {
    throw createError({ statusCode: 400, message: "ID tidak valid" });
  }

  const idStr = String(id);
  const isTagihan = idStr.startsWith("tagihan_");
  const realId = Number(idStr.replace("doc_", "").replace("tagihan_", ""));

  const db = useDrizzle();
  let fileUrl = "";

  if (isTagihan) {
    const doc = await db.query.tagihanPencairanTable.findFirst({
      where: eq(tagihanPencairanTable.id, realId),
    });
    if (!doc)
      throw createError({
        statusCode: 404,
        message: "Tagihan tidak ditemukan",
      });
    fileUrl = (doc as any)[field];
  } else {
    const doc = await db.query.dokumentasiKegiatanTable.findFirst({
      where: eq(dokumentasiKegiatanTable.id, realId),
    });
    if (!doc)
      throw createError({
        statusCode: 404,
        message: "Dokumentasi tidak ditemukan",
      });
    fileUrl = (doc as any)[field];
  }

  if (!fileUrl) {
    throw createError({ statusCode: 404, message: "File tidak ditemukan" });
  }

  const filePath = path.resolve(process.cwd(), fileUrl.split(";")[0].trim());

  if (!fs.existsSync(filePath)) {
    throw createError({
      statusCode: 404,
      message: "File fisik tidak ditemukan",
    });
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
  setHeader(
    event,
    "Content-Disposition",
    `inline; filename="${path.basename(filePath)}"`,
  );

  return sendStream(event, fs.createReadStream(filePath));
});
