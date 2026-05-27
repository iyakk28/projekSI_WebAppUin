import { useDrizzle } from "~~/server/db/index";
import { programStudiTable } from "~~/server/db/schema/programStudiSchema";

export default defineEventHandler(async (event) => {
  try {
    const db = useDrizzle();
    const body = await readBody(event);
    const { nama, kode, fakultasId } = body;

    if (!nama || !kode || !fakultasId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Nama, kode, dan fakultas wajib diisi",
      });
    }

    await db.insert(programStudiTable).values({
      nama,
      kode,
      fakultasId: Number(fakultasId),
    });

    return {
      success: true,
      message: "Program Studi berhasil ditambahkan",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Gagal menambahkan program studi",
    };
  }
});
