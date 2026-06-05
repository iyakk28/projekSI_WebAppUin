import { eq } from "drizzle-orm";
import { useDrizzle } from "~~/server/db";
import {
  dokumentasiKegiatanTable,
  tagihanPencairanTable,
  logDokumentasiTagihanTable,
} from "~~/server/db/schema";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createFilePath } from "~~/server/utils/CreateFilePath";

export default defineEventHandler(async (event) => {
  try {
    const db = useDrizzle();
    const user = event.context.user;
    if (!user)
      throw createError({ statusCode: 401, statusMessage: "Unauthorized" });

    const formData = await readMultipartFormData(event);
    if (!formData)
      throw createError({ statusCode: 400, statusMessage: "No data provided" });

    const getField = (name: string) => {
      const field = formData.find((f) => f.name === name);
      return field ? field.data.toString() : null;
    };

    const docId = Number(getField("id"));
    const type = getField("type"); // 'foto' or 'tagihan'
    const action = getField("action"); // 'revisi', 'terima', 'bayar'
    const komentar = getField("komentar") || "";

    if (isNaN(docId) || !type || !action) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid parameters",
      });
    }

    let statusToUpdate: any = "";
    let actionLog: "review" | "approve" | "reject" | "pay" | "revisi" =
      "review";
    let buktiUrl = null;

    if (action === "revisi") {
      statusToUpdate = type === "foto" ? "REVISI" : "DIKEMBALIKAN";
      actionLog = "revisi";
    } else if (action === "terima") {
      statusToUpdate = type === "foto" ? "DITERIMA" : "TERVERIFIKASI";
      actionLog = "approve";
    } else if (action === "bayar") {
      if (type !== "tagihan")
        throw createError({
          statusCode: 400,
          statusMessage: "Hanya tagihan yang bisa dibayar",
        });
      statusToUpdate = "SELESAI";
      actionLog = "pay";

      // Save payment proof
      const fileField = formData.find((f) => f.name === "fotoBukti");
      if (!fileField)
        throw createError({
          statusCode: 400,
          statusMessage: "Foto bukti pembayaran wajib diunggah",
        });

      const targetPath = await createFilePath("PPK", "Pembayaran", "");
      const fileName = `${Date.now()}_bukti_${fileField.filename}`;
      const fullPath = join(targetPath, fileName);
      await writeFile(fullPath, fileField.data);
      buktiUrl = fullPath;
    }

    // Hasil: "2026-06-05 12:34:56"
    // Update table
    if (type === "foto") {
      await db
        .update(dokumentasiKegiatanTable)
        .set({ status: statusToUpdate })
        .where(eq(dokumentasiKegiatanTable.id, docId));
    } else {
      await db
        .update(tagihanPencairanTable)
        .set({
          statusTagihan: statusToUpdate,
          buktiPembayaranUrl: buktiUrl || undefined,
          updatedAt: new Date().toISOString().slice(0, 19).replace("T", " "),
        })
        .where(eq(tagihanPencairanTable.id, docId));
    }

    // Insert Log
    await db.insert(logDokumentasiTagihanTable).values({
      dokumentasiId: type === "foto" ? docId : null,
      tagihanId: type === "tagihan" ? docId : null,
      action: actionLog,
      komentar: komentar,
      userId: Number(user.id),
    });

    return {
      success: true,
      message: `Berhasil melakukan aksi ${action}`,
    };
  } catch (error: any) {
    console.error("Error POST /api/ppk/pencairan/doc-action:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage:
        error.statusMessage || "Gagal melakukan aksi pada dokumentasi",
    });
  }
});
