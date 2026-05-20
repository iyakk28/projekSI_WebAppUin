import { useDrizzle } from "~~/server/db";
import { eq, sql } from "drizzle-orm";
import { dokumentasiKegiatanTable } from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { kegiatanId, page, row } = body;
    console.log(page, row);
    if (!kegiatanId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        message: "kegiatanId wajib disertakan",
      });
    }

    const db = useDrizzle();

    // 1. Hitung total data untuk pagination
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(dokumentasiKegiatanTable)
      .where(eq(dokumentasiKegiatanTable.kegiatanId, kegiatanId));
    
    const total = Number(totalResult[0]?.count || 0);

    // 2. Ambil data dengan limit dan offset yang benar
    const currentPage = Number(page) || 1;
    const itemsPerPage = Number(row) || 5;
    const offset = (currentPage - 1) * itemsPerPage;

    const allDokumentasi = await db
      .select()
      .from(dokumentasiKegiatanTable)
      .where(eq(dokumentasiKegiatanTable.kegiatanId, kegiatanId))
      .limit(itemsPerPage)
      .offset(offset);

    return {
      success: true,
      data: allDokumentasi,
      total: total,
      page: currentPage,
      row: itemsPerPage,
      totalPages: Math.ceil(total / itemsPerPage)
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
