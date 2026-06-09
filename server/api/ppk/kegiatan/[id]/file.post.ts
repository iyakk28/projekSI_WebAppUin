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
  programStudiTable,
} from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
  console.log("=== START /api/ppk/kegiatan/[id]/file.post.ts ===");

  const rabId = Number(getRouterParam(event, "id"));
  console.log("RabId dari parameter:", rabId);

  if (isNaN(rabId) || rabId <= 0) {
    console.error("RabId tidak valid:", rabId);
    throw createError({ statusCode: 400, message: "ID pengajuan tidak valid" });
  }

  const body = await readBody(event);
  const { documentType = "rab" } = body;
  console.log("Document type yang diminta:", documentType);

  if (!["rab", "tor"].includes(documentType)) {
    console.error("Document type tidak valid:", documentType);
    throw createError({
      statusCode: 400,
      message: "Tipe dokumen tidak valid. Gunakan 'rab' atau 'tor'.",
    });
  }

  const db = useDrizzle();
  const { user } = event.context;
  if (!user || user.role !== "ppk") {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }
  console.log("User context:", {
    userId: user?.id,
    role: user?.role,
    fakultasId: user?.fakultasId,
    email: user?.email,
  });

  const fakultasId = user.fakultasId;
  console.log("Fakultas ID PPK:", fakultasId);

  if (!fakultasId) {
    console.error("Fakultas ID tidak ditemukan di user context");
    throw createError({
      statusCode: 403,
      message: "PPK tidak memiliki fakultas yang valid",
    });
  }

  console.log("Mencari daftar Kaprodi dengan fakultasId:", fakultasId);
  const kaprodiList = await db
    .select({ prodiId: programStudiTable.id })
    .from(programStudiTable)
    .where(eq(programStudiTable.fakultasId, fakultasId));

  console.log("Jumlah Kaprodi ditemukan:", kaprodiList.length);
  console.log(
    "Daftar Kaprodi (prodiId):",
    kaprodiList.map((k) => k.prodiId),
  );

  const prodiIds = kaprodiList
    .map((k) => k.prodiId)
    .filter((id): id is number => id !== null);

  console.log("ProdiIds setelah filter:", prodiIds);
  console.log("Jumlah ProdiIds:", prodiIds.length);

  let ormawaIds: number[] = [];
  if (prodiIds.length > 0) {
    console.log("Mencari ORMAWA dengan prodiIds:", prodiIds);
    const ormawaRows = await db
      .select({ id: ormawaTable.id })
      .from(ormawaTable)
      .where(inArray(ormawaTable.prodiId, prodiIds));

    console.log("Jumlah ORMAWA ditemukan:", ormawaRows.length);
    console.log(
      "Daftar ORMAWA IDs:",
      ormawaRows.map((o) => o.id),
    );

    ormawaIds = ormawaRows.map((o) => o.id);
    console.log("ORMawaIds:", ormawaIds);

    if (ormawaIds.length > 0) {
      console.log("Mencari users yang terkait dengan ORMAWA IDs:", ormawaIds);
      const ormawaUsers = await db
        .select({ usersId: usersTable.id })
        .from(usersTable)
        .where(inArray(usersTable.ormawaId, ormawaIds));

      console.log("Jumlah ORMAWA Users ditemukan:", ormawaUsers.length);
      console.log(
        "Daftar ORMAWA User IDs:",
        ormawaUsers.map((u) => u.usersId),
      );

      const ormawaUserIds = ormawaUsers.map((u) => String(u.usersId));
      console.log("ORMawa UserIds:", ormawaUserIds);
      console.log("Mengecek akses untuk rabId:", rabId);

      const aksesValid = await db.query.pengajuanRabTable.findFirst({
        where: and(
          eq(pengajuanRabTable.id, rabId),
          inArray(pengajuanRabTable.usersId, ormawaUserIds),
        ),
      });
      console.log("Apakah akses valid?", !!aksesValid);
      if (aksesValid) {
        console.log("Data akses valid:", {
          id: aksesValid.id,
          usersId: aksesValid.usersId,
          status: aksesValid.status,
        });
      }

      if (!aksesValid) {
        console.error(
          "Akses ditolak - user tidak memiliki akses ke pengajuan ini",
        );
        throw createError({
          statusCode: 403,
          message: "Anda tidak memiliki akses ke file pengajuan ini",
        });
      }
    } else {
      console.log("Tidak ada ORMAWA ditemukan untuk prodiIds yang diberikan");
    }
  } else {
    console.log("Tidak ada prodiIds yang valid dari Kaprodi");
  }

  console.log("Mengambil data pengajuan RAB dengan id:", rabId);
  const rab = await db.query.pengajuanRabTable.findFirst({
    where: eq(pengajuanRabTable.id, rabId),
  });

  if (!rab) {
    console.error("Data pengajuan tidak ditemukan untuk id:", rabId);
    throw createError({
      statusCode: 404,
      message: "Data pengajuan tidak ditemukan",
    });
  }

  console.log("Data RAB ditemukan:", {
    id: rab.id,
    usersId: rab.usersId,
    status: rab.status,
    hasFileRab: !!rab.fileRabUrl,
    hasFileTor: !!rab.fileTorUrl,
    fileRabUrl: rab.fileRabUrl,
    fileTorUrl: rab.fileTorUrl,
    createdAt: rab.createdAt,
    updatedAt: rab.updatedAt,
  });

  // Tentukan path URL berdasarkan file yang diminta
  const fileUrl = documentType === "tor" ? rab.fileTorUrl : rab.fileRabUrl;
  console.log(`File URL untuk tipe ${documentType}:`, fileUrl);

  if (!fileUrl) {
    console.error(`File ${documentType.toUpperCase()} URL tidak ditemukan`);
    throw createError({
      statusCode: 404,
      message: `File ${documentType.toUpperCase()} belum diunggah untuk pengajuan ini`,
    });
  }

  const filePath = path.resolve(process.cwd(), fileUrl.trim());
  console.log("Resolved file path:", filePath);
  console.log("Current working directory:", process.cwd());
  console.log("Apakah file exists?", fs.existsSync(filePath));

  if (!fs.existsSync(filePath)) {
    console.error("File tidak ditemukan secara fisik di path:", filePath);
    // Coba list directory untuk debugging
    const dirPath = path.dirname(filePath);
    console.log("Directory path:", dirPath);
    if (fs.existsSync(dirPath)) {
      console.log("Directory exists, listing files:");
      try {
        const files = fs.readdirSync(dirPath);
        console.log("Files in directory:", files);
      } catch (err) {
        console.error("Gagal membaca directory:", err);
      }
    } else {
      console.error("Directory tidak ditemukan:", dirPath);
    }

    throw createError({
      statusCode: 404,
      message: `File tidak ditemukan secara fisik: ${filePath}`,
    });
  }

  const ext = path.extname(filePath).toLowerCase();
  console.log("File extension:", ext);

  const mimeTypes: Record<string, string> = {
    ".pdf": "application/pdf",
  };
  const contentType = mimeTypes[ext] || "application/octet-stream";
  console.log("Content-Type:", contentType);

  setHeader(event, "Content-Type", contentType);
  setHeader(
    event,
    "Content-Disposition",
    `inline; filename="${path.basename(filePath)}"`,
  );
  console.log("Headers set: Content-Type dan Content-Disposition");

  console.log("Mengirim file stream...");
  console.log("=== END /api/ppk/kegiatan/[id]/file.post.ts ===");

  return sendStream(event, fs.createReadStream(filePath));
});
