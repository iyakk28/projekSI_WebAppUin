import fs from "node:fs";
import path from "node:path";
import { useDrizzle } from "~~/server/db";
import { eq, and, or } from "drizzle-orm";
import { lpgTable } from "../../../db/schema/lpgSchema";
import { kegiatanTable } from "../../../db/schema/KegiatanSchema";
import { pengajuanRabTable } from "../../../db/schema/pengajuanRabSchema";

export default defineEventHandler(async (event) => {
  const { user } = event.context;
  if (!user) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const body = await readBody(event);
  const { rabId } = body;

  if (!rabId) {
    throw createError({ statusCode: 400, message: "ID RAB tidak valid" });
  }

  const db = useDrizzle();

  // Validate access and get the file URL
  // Ormawa can only access their own RAB's LPG
  // SPI and PPK can access any LPG
  const result = await db
    .select({
      fileLpgUrl: lpgTable.fileLpgUrl,
      ormawaId: pengajuanRabTable.ormawaId,
      usersId: pengajuanRabTable.usersId,
    })
    .from(lpgTable)
    .innerJoin(kegiatanTable, eq(lpgTable.kegiatanId, kegiatanTable.id))
    .innerJoin(
      pengajuanRabTable,
      eq(kegiatanTable.pengajuanRabId, pengajuanRabTable.id),
    )
    .where(eq(pengajuanRabTable.id, Number(rabId)))
    .limit(1);

  if (result.length === 0) {
    throw createError({
      statusCode: 404,
      message: "Data LPG tidak ditemukan",
    });
  }

  const lpgData = result[0];

  // Access control
  const isOwner = user.role === "ormawa" && (String(lpgData.usersId) === String(user.id) || String(lpgData.ormawaId) === String(user.ormawaId));
  const isStaff = ["spi", "ppk", "kaprodi"].includes(user.role);

  if (!isOwner && !isStaff) {
    throw createError({
      statusCode: 403,
      message: "Anda tidak memiliki akses ke file ini",
    });
  }

  if (!lpgData.fileLpgUrl) {
    throw createError({
      statusCode: 404,
      message: `File LPJ belum diunggah`,
    });
  }

  const filePath = path.resolve(process.cwd(), lpgData.fileLpgUrl.trim());
  
  if (!fs.existsSync(filePath)) {
    throw createError({
      statusCode: 404,
      message: `File tidak ditemukan secara fisik`,
    });
  }

  const contentType = "application/pdf";

  setHeader(event, "Content-Type", contentType);
  setHeader(
    event,
    "Content-Disposition",
    `inline; filename="${path.basename(filePath)}"`,
  );

  return sendStream(event, fs.createReadStream(filePath));
});
