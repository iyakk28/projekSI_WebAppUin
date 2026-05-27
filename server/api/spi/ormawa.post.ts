import { useDrizzle } from "~~/server/db/index";
import { ormawaTable } from "~~/server/db/schema/ormawaSchema";

export default defineEventHandler(async (event) => {
  try {
    const db = useDrizzle();
    const body = await readBody(event);
    const { nama, kode, totalAnggaran, prodiId } = body;

    if (!nama || !kode || !prodiId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Nama, kode, dan Program Studi wajib diisi",
      });
    }

    await db.insert(ormawaTable).values({
      nama,
      kode,
      totalAnggaran: totalAnggaran ? Number(totalAnggaran) : 0,
      prodiId: Number(prodiId),
    });

    return {
      success: true,
      message: "Ormawa berhasil ditambahkan",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Gagal menambahkan ormawa",
    };
  }
});
