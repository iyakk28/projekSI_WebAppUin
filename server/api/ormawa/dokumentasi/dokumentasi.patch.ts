import { useDrizzle } from "~~/server/db";
import { eq } from "drizzle-orm";
import { dokumentasiKegiatanTable } from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
  const db = useDrizzle();
  const body = await readBody(event);
  const { id, deskripsi, tipeDokumen } = body;

  if (!id) {
    throw createError({ statusCode: 400, message: "ID wajib disertakan" });
  }

  await db
    .update(dokumentasiKegiatanTable)
    .set({
      deskripsi,
      tipeDokumen,
    })
    .where(eq(dokumentasiKegiatanTable.id, Number(id)));

  return {
    success: true,
    message: "Dokumentasi berhasil diperbarui",
  };
});
