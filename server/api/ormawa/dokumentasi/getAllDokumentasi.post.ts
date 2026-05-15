import { useDrizzle } from "~~/server/db";
import { eq } from "drizzle-orm";
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

    const allDokumentasi = await db
      .select({
        deskripsi: dokumentasiKegiatanTable.deskripsi,
        tipeDokumen: dokumentasiKegiatanTable.tipeDokumen,
        createAt: dokumentasiKegiatanTable.createdAt,
      })
      .from(dokumentasiKegiatanTable)
      .where(eq(dokumentasiKegiatanTable.kegiatanId, kegiatanId))
      .limit(row)
      .offset(page);

    return {
      success: true,
      data: allDokumentasi,
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
