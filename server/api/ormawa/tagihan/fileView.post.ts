import fs from "node:fs";
import path from "node:path";
import { useDrizzle } from "~~/server/db";
import { eq } from "drizzle-orm";
import { pembayaranTable } from "~~/server/db/schema/PembayaranSchema";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { id } = body;

  if (!id) {
    throw createError({ statusCode: 400, message: "ID tidak valid" });
  }

  const db = useDrizzle();

  const pay = await db.query.pembayaranTable.findFirst({
    where: eq(pembayaranTable.id, id),
  });

  if (!pay) {
    throw createError({
      statusCode: 404,
      message: "Bukti pembayaran tidak ditemukan",
    });
  }

  const fileUrl = pay.buktiTransferUrl;

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
