import fs from "node:fs";
import path from "node:path";
import { useDrizzle } from "~~/server/db";
import { eq } from "drizzle-orm";
import { lpgTable } from "~~/server/db/schema/lpgSchema";

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user || user.role !== "spi") {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const body = await readBody(event);
  const { lpgId } = body;

  if (!lpgId) {
    throw createError({ statusCode: 400, message: "LPG ID tidak valid" });
  }

  const db = useDrizzle();
  const record = await db.query.lpgTable.findFirst({
    where: eq(lpgTable.id, Number(lpgId)),
  });

  if (!record) {
    throw createError({ statusCode: 404, message: "Data LPG tidak ditemukan" });
  }

  if (!record.fileLpgUrl) {
    throw createError({ statusCode: 404, message: "File LPG tidak ditemukan" });
  }

  const results = [];
  const fileUrl = record.fileLpgUrl;
  
  // fileUrl might contain multiple paths separated by semicolon
  const paths = fileUrl.split(";").map((p: string) => p.trim()).filter((p: string) => p);
  
  for (const p of paths) {
    const filePath = path.resolve(process.cwd(), p);
    if (fs.existsSync(filePath)) {
      const fileBuffer = fs.readFileSync(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes: Record<string, string> = {
        ".pdf": "application/pdf",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
      };
      const contentType = mimeTypes[ext] || "application/octet-stream";
      const base64 = fileBuffer.toString("base64");
      
      results.push({
        label: "File LPG",
        url: `data:${contentType};base64,${base64}`,
        type: contentType,
        name: path.basename(filePath)
      });
    }
  }

  return {
    success: true,
    data: results,
  };
});
