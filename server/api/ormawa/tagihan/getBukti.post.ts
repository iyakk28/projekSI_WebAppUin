import { useDrizzle } from "~~/server/db";
import { eq } from "drizzle-orm";
import { pembayaranTable } from "~~/server/db/schema/PembayaranSchema";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { tagihanId } = body;

  if (!tagihanId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      message: "tagihanId wajib disertakan",
    });
  }

  const db = useDrizzle();

  try {
    const pembayaran = await db.query.pembayaranTable.findFirst({
      where: eq(pembayaranTable.tagihanId, tagihanId),
    });

    if (!pembayaran) {
      return {
        success: false,
        message: "Bukti pembayaran belum tersedia",
      };
    }

    return {
      success: true,
      data: pembayaran,
    };
  } catch (error: any) {
    console.error("Error fetching bukti pembayaran:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      message: "Gagal mengambil data bukti pembayaran",
    });
  }
});
