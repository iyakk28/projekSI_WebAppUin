import { eq, sql } from "drizzle-orm";
import { useDrizzle } from "~~/server/db";
import {
  dokumentasiKegiatanTable,
  tagihanPencairanTable,
  logDokumentasiTagihanTable,
  pembayaranTable,
} from "~~/server/db/schema";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createFilePath } from "~~/server/utils/CreateFilePath";

export default defineEventHandler(async (event) => {
  try {
    const db = useDrizzle();
    const user = event.context.user;
    if (!user || user.role !== "ppk")
      throw createError({ statusCode: 401, statusMessage: "Akses ditolak. Peran PPK diperlukan." });

    const formData = await readMultipartFormData(event);
    if (!formData)
      throw createError({ statusCode: 400, statusMessage: "Data tidak ditemukan." });

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
        statusMessage: "Parameter tidak valid.",
      });
    }

    let statusToUpdate: any = "";
    let actionLog: "review" | "approve" | "reject" | "pay" | "revisi" = "review";

    if (action === "revisi") {
      statusToUpdate = type === "foto" ? "REVISI" : "DIKEMBALIKAN";
      actionLog = "revisi";
    } else if (action === "terima") {
      statusToUpdate = type === "foto" ? "DITERIMA" : "TERVERIFIKASI";
      actionLog = "approve";
    } else if (action === "bayar") {
      if (type !== "tagihan")
        throw createError({ statusCode: 400, statusMessage: "Hanya tagihan yang bisa dibayar." });
      
      statusToUpdate = "SELESAI";
      actionLog = "pay";

      // 1. Simpan Bukti Transfer secara Fisik
      const fileField = formData.find((f) => f.name === "fotoBukti");
      if (!fileField)
        throw createError({ statusCode: 400, statusMessage: "Foto bukti pembayaran wajib diunggah." });

      const targetPath = await createFilePath("PPK", "Pembayaran", "Selesai");
      const fileName = `${Date.now()}_bukti_${fileField.filename}`;
      const fullPath = join(targetPath, fileName);
      await writeFile(fullPath, fileField.data);

      // Relative path untuk DB agar konsisten dengan schema lain
      const relativePath = fullPath.replace(process.cwd(), '').replace(/\\/g, '/').replace(/^\//, '');

      // 2. Gunakan Transaction untuk update status dan simpan data pembayaran
      await db.transaction(async (tx) => {
          // Update status tagihan
          await tx.update(tagihanPencairanTable)
            .set({ statusTagihan: "SELESAI", updatedAt: sql`NOW()` })
            .where(eq(tagihanPencairanTable.id, docId));

          // Insert ke table pembayaran
          await tx.insert(pembayaranTable).values({
              tagihanId: docId,
              ppkId: Number(user.id),
              fakultasId: Number(user.fakultasId),
              buktiTransferUrl: relativePath,
              catatanPembayaran: komentar || "Pembayaran dikonfirmasi oleh PPK",
          });

          // Insert Log
          await tx.insert(logDokumentasiTagihanTable).values({
            tagihanId: docId,
            action: "pay",
            komentar: komentar,
            userId: Number(user.id),
          });
      });

      return { success: true, message: "Pembayaran berhasil dicatat." };
    }

    // Aksi selain 'bayar' (revisi atau terima dokumentasi/verifikasi tagihan)
    if (type === "foto") {
      await db.update(dokumentasiKegiatanTable)
        .set({ status: statusToUpdate })
        .where(eq(dokumentasiKegiatanTable.id, docId));
    } else {
      await db.update(tagihanPencairanTable)
        .set({ statusTagihan: statusToUpdate, updatedAt: sql`NOW()` })
        .where(eq(tagihanPencairanTable.id, docId));
    }

    // Insert Log untuk non-bayar
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
      statusMessage: error.statusMessage || "Gagal melakukan aksi.",
    });
  }
});
