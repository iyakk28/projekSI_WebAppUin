// FILE: server/api/ppk/kegiatan/[id]/file.post.ts
// Endpoint untuk serve file RAB/TOR ke PPK
// Pola sama seperti /api/ormawa/Rab/fileSend.post.ts, tapi dengan validasi akses PPK

import fs from "node:fs";
import path from "node:path";
import { eq, and, inArray } from "drizzle-orm";
import { useDrizzle } from "~~/server/db";
import {
  pengajuanRabTable,
  usersTable,
  ormawaTable,
} from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
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
  const fakultasId = user.fakultasId;

  if (!fakultasId) {
    throw createError({
      statusCode: 403,
      message: "PPK tidak memiliki fakultas yang valid",
    });
  }

  // Validasi akses PPK — sama seperti di index.get.ts
  const kaprodiList = await db
    .select({ prodiId: usersTable.prodiId })
    .from(usersTable)
    .where(
      and(
        eq(usersTable.role, "kaprodi"),
        eq(usersTable.fakultasId, fakultasId),
      ),
    );

  const prodiIds = kaprodiList
    .map((k) => k.prodiId)
    .filter((id): id is number => id !== null);

  if (prodiIds.length > 0) {
    const ormawaRows = await db
      .select({ id: ormawaTable.id })
      .from(ormawaTable)
      .where(inArray(ormawaTable.prodiId, prodiIds));

    const ormawaIds = ormawaRows.map((o) => o.id);

    if (ormawaIds.length > 0) {
      const ormawaUsers = await db
        .select({ usersId: usersTable.users_id })
        .from(usersTable)
        .where(inArray(usersTable.ormawaId, ormawaIds));

      const ormawaUserIds = ormawaUsers.map((u) => u.usersId);

      const aksesValid = await db.query.pengajuanRabTable.findFirst({
        where: and(
          eq(pengajuanRabTable.id, rabId),
          inArray(pengajuanRabTable.usersId, ormawaUserIds),
        ),
      });

      if (!aksesValid) {
        throw createError({
          statusCode: 403,
          message: "Anda tidak memiliki akses ke file pengajuan ini",
        });
      }
    }
  }

  // Ambil data pengajuan
  const rab = await db.query.pengajuanRabTable.findFirst({
    where: eq(pengajuanRabTable.id, rabId),
  });

  if (!rab) {
    throw createError({
      statusCode: 404,
      message: "Data pengajuan tidak ditemukan",
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
      message: `File tidak ditemukan secara fisik: ${filePath}`,
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
    `inline; filename="${path.basename(filePath)}"`,
  );

  return sendStream(event, fs.createReadStream(filePath));
});
