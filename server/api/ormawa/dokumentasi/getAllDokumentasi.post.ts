import { useDrizzle } from "~~/server/db";
import { eq } from "drizzle-orm";
import { dokumentasiKegiatanTable } from "~~/server/db/schema/dokumentasiSchema";
import { tagihanPencairanTable } from "~~/server/db/schema/TagihanPencairanSchema";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { kegiatanId, page, row } = body;
    if (!kegiatanId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        message: "kegiatanId wajib disertakan",
      });
    }

    const db = useDrizzle();

    // Ambil data Dokumentasi
    const rawDokumen = await db
      .select()
      .from(dokumentasiKegiatanTable)
      .where(eq(dokumentasiKegiatanTable.kegiatanId, kegiatanId));

    // Ambil data Tagihan Pencairan (Barang & Jasa)
    const rawTagihan = await db
      .select()
      .from(tagihanPencairanTable)
      .where(eq(tagihanPencairanTable.kegiatanId, kegiatanId));

    // Gabungkan data
    const combined = [
      ...rawDokumen.map((d) => ({
        id: `doc_${d.id}`,
        realId: d.id,
        tipeData: "DOKUMENTASI",
        deskripsi: d.deskripsi,
        tipeDokumen: d.tipeDokumen,
        fileUrl: d.fileUrl,
        createdAt: d.createdAt,
      })),
      ...rawTagihan.map((t) => ({
        id: `tagihan_${t.id}`,
        realId: t.id,
        tipeData: "TAGIHAN",
        tipeDokumen: t.tipeTagihan, // 'BARANG' atau 'JASA'
        deskripsi:
          t.tipeTagihan === "BARANG"
            ? `Pembelian Barang: ${t.tokoNama || "-"}`
            : `Pembayaran Jasa: ${t.namaPenerima || "-"}`,
        nominal: t.nominal,
        namaPenerima: t.namaPenerima,
        rekeningPenerima: t.rekeningPenerima,
        bankPenerima: t.bankPenerima,
        tokoNama: t.tokoNama,
        tokoAlamat: t.tokoAlamat,
        strukFileUrl: t.strukFileUrl,
        skNomor: t.skNomor,
        skFileUrl: t.skFileUrl,
        statusTagihan: t.statusTagihan,
        createdAt: t.createdAt,
      })),
    ];

    // Urutkan dari yang terbaru
    combined.sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime(),
    );

    const total = combined.length;
    const currentPage = Number(page) || 1;
    const itemsPerPage = Number(row) || 5;
    const offset = (currentPage - 1) * itemsPerPage;

    const paginated = combined.slice(offset, offset + itemsPerPage);

    return {
      success: true,
      data: paginated,
      total: total,
      page: currentPage,
      row: itemsPerPage,
      totalPages: Math.ceil(total / itemsPerPage),
    };
  } catch (error: any) {
    console.error("Error fetching dokumentasi:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      message: "Gagal mengambil data dokumentasi",
    });
  }
});
