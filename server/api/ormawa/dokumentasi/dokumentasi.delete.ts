import { useDrizzle } from "~~/server/db";
import { eq } from "drizzle-orm";
import { dokumentasiKegiatanTable } from "~~/server/db/schema/dokumentasiSchema";
import { tagihanPencairanTable } from "~~/server/db/schema/TagihanPencairanSchema";
import { unlink } from "node:fs/promises";

export default defineEventHandler(async (event) => {
  const db = useDrizzle();
  const body = await readBody(event);
  const { id } = body;

  if (!id) {
    throw createError({ statusCode: 400, message: "ID wajib disertakan" });
  }

  const idStr = String(id);
  const isDoc = idStr.startsWith("doc_");
  const isTagihan = idStr.startsWith("tagihan_");

  // Backward compatibility jika id murni angka
  const realId = isDoc || isTagihan ? Number(idStr.split("_")[1]) : Number(id);

  if (isTagihan) {
    const results = await db
      .select()
      .from(tagihanPencairanTable)
      .where(eq(tagihanPencairanTable.id, realId))
      .limit(1);

    const doc = results[0];
    if (!doc)
      throw createError({ statusCode: 404, message: "Data tidak ditemukan" });

    if (doc.skFileUrl) await unlink(doc.skFileUrl).catch(() => {});
    if (doc.strukFileUrl) await unlink(doc.strukFileUrl).catch(() => {});

    await db
      .delete(tagihanPencairanTable)
      .where(eq(tagihanPencairanTable.id, realId));
  } else {
    const results = await db
      .select()
      .from(dokumentasiKegiatanTable)
      .where(eq(dokumentasiKegiatanTable.id, realId))
      .limit(1);

    const doc = results[0];
    if (!doc)
      throw createError({ statusCode: 404, message: "Data tidak ditemukan" });

    if (doc.fileUrl) {
      const paths = doc.fileUrl
        .split(";")
        .filter((p: string) => p.trim() !== "");
      for (const filePath of paths) {
        await unlink(filePath).catch(() => {});
      }
    }

    await db
      .delete(dokumentasiKegiatanTable)
      .where(eq(dokumentasiKegiatanTable.id, realId));
  }

  return { success: true, message: "Data berhasil dihapus" };
});
