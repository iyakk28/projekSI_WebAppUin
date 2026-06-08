import { eq } from "drizzle-orm";
import { useDrizzle } from "~~/server/db";
import {
  dokumentasiKegiatanTable,
  tagihanPencairanTable,
  pembayaranTable,
} from "~~/server/db/schema";
import { showDekripsi } from "~~/server/utils/enkripsiData";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const docId = Number(body.id);
    const type = body.type as string; // 'foto' or 'tagihan'

    if (isNaN(docId)) {
      throw createError({ statusCode: 400, statusMessage: "ID Dokumentasi tidak valid" });
    }

    const db = useDrizzle();

    // Secure URL helper
    const getSecureUrl = (path: string | null) => {
        if (!path) return null;
        return `/api/ppk/file/serve?path=${encodeURIComponent(path)}`;
    };

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
          fileUrl: getSecureUrl(doc.fileUrl),
          type: "foto",
        },
      };
    } else if (type === "tagihan") {
      // Ambil tagihan beserta data pembayaran (jika ada)
      const result = await db
        .select({
            tagihan: tagihanPencairanTable,
            pembayaran: pembayaranTable
        })
        .from(tagihanPencairanTable)
        .leftJoin(pembayaranTable, eq(tagihanPencairanTable.id, pembayaranTable.tagihanId))
        .where(eq(tagihanPencairanTable.id, docId));

      if (result.length === 0) throw createError({ statusCode: 404, statusMessage: "Tagihan tidak ditemukan" });
      
      const { tagihan, pembayaran } = result[0];

      return {
        success: true,
        data: {
          ...tagihan,
          // Dekripsi data sensitif (semua tipe)
          namaPenerima: showDekripsi(tagihan.namaPenerima),
          rekeningPenerima: showDekripsi(tagihan.rekeningPenerima),
          bankPenerima: showDekripsi(tagihan.bankPenerima),
          
          // Dekripsi data khusus JASA
          skNomor: tagihan.skNomor ? showDekripsi(tagihan.skNomor) : null,
          spmtNomor: tagihan.spmtNomor ? showDekripsi(tagihan.spmtNomor) : null,
          amprahNomor: tagihan.amprahNomor ? showDekripsi(tagihan.amprahNomor) : null,
          npwpNomor: tagihan.npwpNomor ? showDekripsi(tagihan.npwpNomor) : null,
          ktpNomor: tagihan.ktpNomor ? showDekripsi(tagihan.ktpNomor) : null,

          // Secure URLs untuk lampiran ormawa
          skFileUrl: getSecureUrl(tagihan.skFileUrl),
          spmtFileUrl: getSecureUrl(tagihan.spmtFileUrl),
          amprahFileUrl: getSecureUrl(tagihan.amprahFileUrl),
          npwpFileUrl: getSecureUrl(tagihan.npwpFileUrl),
          ktpFileUrl: getSecureUrl(tagihan.ktpFileUrl),
          bukuRekeningFileUrl: getSecureUrl(tagihan.bukuRekeningFileUrl),
          strukFileUrl: getSecureUrl(tagihan.strukFileUrl),
          fotoBarangUrl: getSecureUrl(tagihan.fotoBarangUrl),
          
          // Info Pembayaran dari PPK
          infoPembayaran: pembayaran ? {
              id: pembayaran.id,
              tanggal: pembayaran.tanggalPembayaran,
              buktiUrl: getSecureUrl(pembayaran.buktiTransferUrl),
              catatan: pembayaran.catatanPembayaran
          } : null,
          
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
