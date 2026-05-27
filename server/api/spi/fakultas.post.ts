import { useDrizzle } from "~~/server/db/index";
import { fakultasTable } from "~~/server/db/schema/fakultasSchema";

export default defineEventHandler(async (event) => {
  try {
    const db = useDrizzle();
    const body = await readBody(event);
    const { nama, kode } = body;

    if (!nama?.trim() || !kode?.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: "Nama dan kode fakultas wajib diisi",
      });
    }

    await db.insert(fakultasTable).values({
      nama: nama.trim(),
      kode: kode.trim().toUpperCase(),
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
