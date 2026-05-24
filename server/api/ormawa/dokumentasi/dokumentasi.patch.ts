import { useDrizzle } from "~~/server/db";
import { eq } from "drizzle-orm";
import { dokumentasiKegiatanTable } from "~~/server/db/schema/dokumentasiSchema";
import { tagihanPencairanTable } from "~~/server/db/schema/TagihanPencairanSchema";
import { createFilePath } from "~~/server/utils/CreateFilePath";
import { writeFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import fs from "node:fs";
import { createEnkripsi } from "~~/server/utils/enkripsiData";

export default defineEventHandler(async (event) => {
  const db = useDrizzle();
  const formData = await readMultipartFormData(event);

  if (!formData) {
    throw createError({
      statusCode: 400,
      message: "Tidak ada data yang dikirim",
    });
  }

  const getField = (name: string): string | undefined => {
    const field = formData.find((f) => f.name === name);
    return field && field.data ? Buffer.from(field.data).toString("utf-8") : undefined;
  };

  const id = getField("id");
  if (!id) {
    throw createError({ statusCode: 400, message: "ID wajib disertakan" });
  }

  const idStr = String(id);
  const isTagihan = idStr.startsWith("tagihan_");
  const realId = Number(idStr.replace("doc_", "").replace("tagihan_", ""));

  if (isTagihan) {
    const results = await db
      .select()
      .from(tagihanPencairanTable)
      .where(eq(tagihanPencairanTable.id, realId))
      .limit(1);

    const oldDoc = results[0];
    if (!oldDoc)
      throw createError({
        statusCode: 404,
        message: "Tagihan tidak ditemukan",
      });

    const updateData: any = {};
    const textFields = [
      { name: "namaPenerima", encrypt: true },
      { name: "rekeningPenerima", encrypt: true },
      { name: "bankPenerima", encrypt: false },
      { name: "tokoNama", encrypt: false },
      { name: "tokoAlamat", encrypt: false },
      { name: "skNomor", encrypt: true },
      { name: "spmtNomor", encrypt: true },
      { name: "amprahNomor", encrypt: true },
      { name: "npwpNomor", encrypt: true },
      { name: "ktpNomor", encrypt: true },
    ];

    for (const tf of textFields) {
      const val = getField(tf.name);
      if (val !== undefined) {
        updateData[tf.name] = tf.encrypt ? createEnkripsi(val) : val;
      }
    }

    const nominal = getField("nominal");
    if (nominal !== undefined) updateData.nominal = nominal;

    const fileFields = [
      { name: "fotoStruk", dbField: "strukFileUrl", category: "barang" as const },
      { name: "fotoBarang", dbField: "fotoBarangUrl", category: "barang" as const },
      { name: "skFile", dbField: "skFileUrl", category: "jasa" as const },
      { name: "spmtFile", dbField: "spmtFileUrl", category: "jasa" as const },
      { name: "amprahFile", dbField: "amprahFileUrl", category: "jasa" as const },
      { name: "npwpFile", dbField: "npwpFileUrl", category: "jasa" as const },
      { name: "ktpFile", dbField: "ktpFileUrl", category: "jasa" as const },
      { name: "bukuRekeningFile", dbField: "bukuRekeningFileUrl", category: "jasa" as const },
    ];

    for (const f of fileFields) {
      const fileData = formData.find((formField) => formField.name === f.name);
      if (fileData && fileData.data && fileData.filename) {
        const oldPath = (oldDoc as any)[f.dbField];
        if (oldPath && fs.existsSync(oldPath)) {
          await unlink(oldPath).catch(() => {});
        }
        const targetDir = await createFilePath("dokumentasi", f.category, "");
        const newFileName = `${Date.now()}_${f.name}_${fileData.filename}`;
        const newPath = join(targetDir, newFileName);
        await writeFile(newPath, fileData.data);
        updateData[f.dbField] = newPath;
      }
    }

    await db
      .update(tagihanPencairanTable)
      .set(updateData)
      .where(eq(tagihanPencairanTable.id, realId));
  } else {
    // ... logic for dokumentasiKegiatanTable ...
    const results = await db
      .select()
      .from(dokumentasiKegiatanTable)
      .where(eq(dokumentasiKegiatanTable.id, realId))
      .limit(1);

    const oldDoc = results[0];
    if (!oldDoc)
      throw createError({
        statusCode: 404,
        message: "Dokumentasi tidak ditemukan",
      });

    const updateData: any = {};
    const deskripsi = getField("deskripsi");
    if (deskripsi !== undefined) updateData.deskripsi = deskripsi;

    const fileData = formData.find((f) => f.name === "file");
    if (fileData && fileData.data && fileData.filename) {
      const oldPath = oldDoc.fileUrl;
      if (oldPath && fs.existsSync(oldPath)) {
        await unlink(oldPath).catch(() => {});
      }
      const targetDir = await createFilePath("dokumentasi", "kegiatan", "");
      const newFileName = `${Date.now()}_file_${fileData.filename}`;
      const newPath = join(targetDir, newFileName);
      await writeFile(newPath, fileData.data);
      updateData.fileUrl = newPath;
    }

    if (Object.keys(updateData).length > 0) {
      await db
        .update(dokumentasiKegiatanTable)
        .set(updateData)
        .where(eq(dokumentasiKegiatanTable.id, realId));
    }
  }

  return {
    success: true,
    message: "Data berhasil diperbarui",
  };
});
