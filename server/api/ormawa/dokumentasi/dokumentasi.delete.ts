import { useDrizzle } from "~~/server/db";
import { eq } from "drizzle-orm";
import { dokumentasiKegiatanTable } from "~~/server/db/schema";
import { unlink } from "node:fs/promises";

export default defineEventHandler(async (event) => {
  const db = useDrizzle();
  const body = await readBody(event);
  const { id } = body;

  if (!id) {
    throw createError({ statusCode: 400, message: "ID wajib disertakan" });
  }

  // 1. Cari data untuk hapus file fisik
  const results = await db
    .select()
    .from(dokumentasiKegiatanTable)
    .where(eq(dokumentasiKegiatanTable.id, Number(id)))
    .limit(1);

  const doc = results[0];

  if (!doc) {
    throw createError({
      statusCode: 404,
      message: "Dokumentasi tidak ditemukan",
    });
  }

  // 2. Hapus semua file fisik yang mungkin ada
  const fileFields = [
    "fileUrl",
    "fotoBarangUrl",
    "strukBelanjaUrl",
    "skUrl",
    "spmtUrl",
    "amprahUrl",
    "npwpUrl",
    "ktpUrl",
  ];

  for (const field of fileFields) {
    const value = (doc as any)[field];
    if (value) {
      // Menangani kemungkinan multiple paths yang dipisah titik koma
      const paths = value.split(";").filter((p: string) => p.trim() !== "");
      for (const filePath of paths) {
        try {
          await unlink(filePath);
        } catch (e) {
          console.error(`Gagal menghapus file ${filePath}:`, e);
        }
      }
    }
  }

  // 3. Hapus record dari database
  await db
    .delete(dokumentasiKegiatanTable)
    .where(eq(dokumentasiKegiatanTable.id, Number(id)));

  return {
    success: true,
    message: "Dokumentasi berhasil dihapus",
  };
});
