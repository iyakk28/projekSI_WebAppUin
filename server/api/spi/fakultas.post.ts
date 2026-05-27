import { useDrizzle } from "~~/server/db/index";
import { fakultasTable } from "~~/server/db/schema/fakultasSchema";

export default defineEventHandler(async (event) => {
  try {
    const db = useDrizzle();
    const body = await readBody(event);
    const { nama, kode } = body;

    if (!nama || !kode) {
      throw createError({
        statusCode: 400,
        statusMessage: "Nama dan kode fakultas wajib diisi",
      });
    }

    await db.insert(fakultasTable).values({
      nama,
      kode,
    });

    return {
      success: true,
      message: "Fakultas berhasil ditambahkan",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Gagal menambahkan fakultas",
    };
  }
});
