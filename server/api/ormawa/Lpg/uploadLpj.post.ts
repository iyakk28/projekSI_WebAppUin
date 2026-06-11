import { defineEventHandler, readMultipartFormData, createError } from "h3";
import { writeFile, unlink } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { existsSync } from "node:fs";
import { useDrizzle } from "../../../db/index";
import { eq, sql, and, or } from "drizzle-orm";
import { lpgTable } from "../../../db/schema/lpgSchema";
import { kegiatanTable } from "../../../db/schema/KegiatanSchema";
import { pengajuanRabTable } from "../../../db/schema/pengajuanRabSchema";
import { createFilePath } from "#imports";

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user;
    if (!user || user.role !== "ormawa") {
      throw createError({
        statusCode: 401,
        message: "User tidak terautentikasi atau bukan Ormawa",
      });
    }

    const formData = await readMultipartFormData(event);
    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        message: "Tidak ada data yang dikirim",
      });
    }

    const getField = (name: string): string => {
      const field = formData.find((f) => f.name === name);
      return field && field.data
        ? Buffer.from(field.data).toString("utf-8")
        : "";
    };

    const rabIdStr = getField("rabId");
    if (!rabIdStr) {
      throw createError({ statusCode: 400, message: "RAB ID wajib diisi" });
    }
    const rabId = Number(rabIdStr);

    const fileLpjField = formData.find((f) => f.name === "fileLpj");
    if (!fileLpjField || !fileLpjField.data || fileLpjField.data.length === 0) {
      throw createError({
        statusCode: 400,
        message: "File LPJ wajib diupload",
      });
    }

    if (fileLpjField.type !== "application/pdf") {
      throw createError({
        statusCode: 400,
        message: "File LPJ wajib berformat PDF",
      });
    }

    if (fileLpjField.data.length > 10 * 1024 * 1024) {
      throw createError({
        statusCode: 400,
        message: "Ukuran file LPJ maksimal 10MB",
      });
    }

    const db = useDrizzle();

    // Verify ownership and get activity
    const rabCheck = await db
      .select({
        kegiatanId: kegiatanTable.id,
        ormawaId: pengajuanRabTable.ormawaId,
        usersId: pengajuanRabTable.usersId,
      })
      .from(pengajuanRabTable)
      .innerJoin(kegiatanTable, eq(pengajuanRabTable.id, kegiatanTable.pengajuanRabId))
      .where(eq(pengajuanRabTable.id, rabId))
      .limit(1);

    if (rabCheck.length === 0) {
      throw createError({
        statusCode: 404,
        message: "RAB atau Kegiatan tidak ditemukan",
      });
    }

    const targetRab = rabCheck[0];
    const isOwner = String(targetRab.usersId) === String(user.id) || String(targetRab.ormawaId) === String(user.ormawaId);

    if (!isOwner) {
      throw createError({
        statusCode: 403,
        message: "Anda tidak memiliki akses untuk mengunggah LPJ untuk RAB ini",
      });
    }

    const kegiatanId = targetRab.kegiatanId;

    const uploadBaseDirLpj = await createFilePath(
      "file",
      "Lpg",
      "SedangBerlangsung",
    );
    const timestamp = Date.now();
    const originalNameLpj = fileLpjField.filename || "file_lpj.pdf";
    const safeNameLpj = originalNameLpj.replace(/[^a-zA-Z0-9.\-]/g, "_");
    const uniqueFilenameLpj = `${timestamp}_${safeNameLpj}`;
    const absolutePathLpj = join(uploadBaseDirLpj, uniqueFilenameLpj);
    
    await writeFile(absolutePathLpj, fileLpjField.data);

    const relativePathLpj = relative(process.cwd(), absolutePathLpj).replace(
      /\\/g,
      "/",
    );

    const existingLpg = await db.query.lpgTable.findFirst({
      where: eq(lpgTable.kegiatanId, kegiatanId),
    });

    let resultId;
    if (existingLpg) {
      // Delete old file if exists
      if (existingLpg.fileLpgUrl) {
        const oldFilePath = resolve(process.cwd(), existingLpg.fileLpgUrl);
        if (existsSync(oldFilePath)) {
          await unlink(oldFilePath).catch(err => console.error("Failed to delete old LPG file:", err));
        }
      }

      await db
        .update(lpgTable)
        .set({
          fileLpgUrl: relativePathLpj,
          statusLpg: "WAITING_SPI",
          uploadedBy: Number(user.id),
          updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '), // Format for MySQL timestamp if using string mode
        })
        .where(eq(lpgTable.id, existingLpg.id));
      resultId = existingLpg.id;
    } else {
      const result = await db
        .insert(lpgTable)
        .values({
          kegiatanId: kegiatanId,
          rabId: rabId,
          fileLpgUrl: relativePathLpj,
          statusLpg: "WAITING_SPI",
          uploadedBy: Number(user.id),
          submittedAt: sql`CURRENT_TIMESTAMP`,
          createdAt: sql`CURRENT_TIMESTAMP`,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        });
      
      resultId = result[0].insertId;
    }

    return {
      success: true,
      message: "LPJ berhasil diupload",
      data: {
        id: resultId,
      },
    };
  } catch (error: any) {
    console.error("Error upload LPJ:", error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: "Terjadi kesalahan server: " + error.message,
    });
  }
});

