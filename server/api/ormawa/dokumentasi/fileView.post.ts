import fs from "node:fs";
import path from "node:path";
import { useDrizzle } from "~~/server/db";
import { eq } from "drizzle-orm";
import { dokumentasiKegiatanTable } from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { id, field = "fileUrl" } = body;

  if (!id) {
    throw createError({ statusCode: 400, message: "ID dokumentasi tidak valid" });
  }

  const allowedFields = [
    "fileUrl",
    "fotoBarangUrl",
    "strukBelanjaUrl",
    "skUrl",
    "spmtUrl",
    "amprahUrl",
    "npwpUrl",
    "ktpUrl",
  ];

  if (!allowedFields.includes(field)) {
    throw createError({ statusCode: 400, message: "Field file tidak valid" });
  }

  const db = useDrizzle();
  const doc = await db.query.dokumentasiKegiatanTable.findFirst({
    where: eq(dokumentasiKegiatanTable.id, Number(id)),
  });

  if (!doc) {
    throw createError({ statusCode: 404, message: "Data dokumentasi tidak ditemukan" });
  }

  const fileUrl = (doc as any)[field];

  if (!fileUrl) {
    throw createError({ statusCode: 404, message: "File tidak ditemukan untuk dokumentasi ini" });
  }

  // FileUrl bisa berisi multiple paths dipisah ; (untuk legacy atau tipe tertentu)
  // Kita ambil yang pertama atau sesuai kebutuhan. Untuk detail, biasanya spesifik field.
  const filePath = path.resolve(process.cwd(), fileUrl.split(';')[0].trim());

  if (!fs.existsSync(filePath)) {
    throw createError({ statusCode: 404, message: "File fisik tidak ditemukan" });
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
    `inline; filename="${path.basename(filePath)}"`
  );

  return sendStream(event, fs.createReadStream(filePath));
});
