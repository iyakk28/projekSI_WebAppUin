import fs from "node:fs";
import path from "node:path";
import { useDrizzle } from "~~/server/db";
import { eq } from "drizzle-orm";
import { dokumentasiKegiatanTable, tagihanPencairanTable } from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { id, type, field = "fileUrl" } = body;

  if (!id || !type) {
    throw createError({ statusCode: 400, message: "ID dan Tipe wajib diisi" });
  }

  const db = useDrizzle();
  let fileUrl = "";

  if (type === "tagihan") {
    const data = await db.query.tagihanPencairanTable.findFirst({
      where: eq(tagihanPencairanTable.id, Number(id)),
    });
    if (!data) throw createError({ statusCode: 404, message: "Tagihan tidak ditemukan" });
    fileUrl = (data as any)[field];
  } else if (type === "foto") {
    const data = await db.query.dokumentasiKegiatanTable.findFirst({
      where: eq(dokumentasiKegiatanTable.id, Number(id)),
    });
    if (!data) throw createError({ statusCode: 404, message: "Dokumentasi tidak ditemukan" });
    fileUrl = (data as any)[field];
  }

  if (!fileUrl) {
    throw createError({ statusCode: 404, message: "File tidak ditemukan di database" });
  }

  // Handle multiple paths if separated by semicolon
  const firstPath = fileUrl.split(";")[0].trim();
  const filePath = path.isAbsolute(firstPath) 
    ? firstPath 
    : path.resolve(process.cwd(), firstPath);

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
