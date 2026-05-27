import { useDrizzle } from "~~/server/db/index";
import { ormawaTable } from "~~/server/db/schema/ormawaSchema";

export default defineEventHandler(async (event) => {
  try {
    const db = useDrizzle();
    const body = await readBody(event);
    const { nama, kode, totalAnggaran, fakultasId, prodiId } = body;

    if (!nama?.trim() || !kode?.trim() || !fakultasId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Nama, kode, dan Fakultas wajib diisi",
      });
    }

    await db.insert(ormawaTable).values({
      nama: nama.trim(),
      kode: kode.trim().toUpperCase(),
      totalAnggaran: totalAnggaran ? Number(totalAnggaran) : 0,
      fakultasId: Number(fakultasId),
      prodiId: prodiId ? Number(prodiId) : null,
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
