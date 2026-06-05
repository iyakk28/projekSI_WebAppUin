import { eq } from "drizzle-orm";
import { useDrizzle } from "~~/server/db";
import {
  dokumentasiKegiatanTable,
  tagihanPencairanTable,
} from "~~/server/db/schema";
import { showDekripsi } from "~~/server/utils/enkripsiData";
import { toPublicUploadUrl } from "~~/server/utils/pencairanHelpers";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const docId = Number(body.id);
    const type = body.type as string; // 'foto' or 'tagihan'

    if (isNaN(docId)) {
      throw createError({ statusCode: 400, statusMessage: "ID Dokumentasi tidak valid" });
    }

    const db = useDrizzle();

    if (type === "foto") {
      const [doc] = await db
        .select()
        .from(dokumentasiKegiatanTable)
        .where(eq(dokumentasiKegiatanTable.id, docId));

      if (!doc) throw createError({ statusCode: 404, statusMessage: "Dokumentasi tidak ditemukan" });

      return {
        success: true,
        data: {
          ...doc,
          fileUrl: toPublicUploadUrl(doc.fileUrl),
          type: "foto",
        },
      };
    } else if (type === "tagihan") {
      const [tagihan] = await db
        .select()
        .from(tagihanPencairanTable)
        .where(eq(tagihanPencairanTable.id, docId));

      if (!tagihan) throw createError({ statusCode: 404, statusMessage: "Tagihan tidak ditemukan" });

      return {
        success: true,
        data: {
          ...tagihan,
          namaPenerima: showDekripsi(tagihan.namaPenerima),
          rekeningPenerima: showDekripsi(tagihan.rekeningPenerima),
          bankPenerima: showDekripsi(tagihan.bankPenerima),
          skNomor: showDekripsi(tagihan.skNomor),
          npwpNomor: showDekripsi(tagihan.npwpNomor),
          ktpNomor: showDekripsi(tagihan.ktpNomor),
          spmtNomor: showDekripsi(tagihan.spmtNomor),
          amprahNomor: showDekripsi(tagihan.amprahNomor),
          skFileUrl: toPublicUploadUrl(tagihan.skFileUrl),
          spmtFileUrl: toPublicUploadUrl(tagihan.spmtFileUrl),
          amprahFileUrl: toPublicUploadUrl(tagihan.amprahFileUrl),
          npwpFileUrl: toPublicUploadUrl(tagihan.npwpFileUrl),
          ktpFileUrl: toPublicUploadUrl(tagihan.ktpFileUrl),
          bukuRekeningFileUrl: toPublicUploadUrl(tagihan.bukuRekeningFileUrl),
          strukFileUrl: toPublicUploadUrl(tagihan.strukFileUrl),
          fotoBarangUrl: toPublicUploadUrl(tagihan.fotoBarangUrl),
          buktiPembayaranUrl: toPublicUploadUrl(tagihan.buktiPembayaranUrl),
          type: "tagihan",
        },
      };
    } else {
      throw createError({ statusCode: 400, statusMessage: "Tipe dokumentasi tidak valid" });
    }
  } catch (error: any) {
    console.error("Error POST documentation detail:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Gagal mengambil detail dokumentasi",
    });
  }
});
