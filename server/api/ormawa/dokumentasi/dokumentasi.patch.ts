import { useDrizzle } from "~~/server/db";
import { eq } from "drizzle-orm";
import { dokumentasiKegiatanTable } from "~~/server/db/schema";
import { createFilePath } from "~~/server/utils/CreateFilePath";
import { writeFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import fs from "node:fs";

export default defineEventHandler(async (event) => {
  const db = useDrizzle();
  const formData = await readMultipartFormData(event);
  
  if (!formData) {
    throw createError({ statusCode: 400, message: "Tidak ada data yang dikirim" });
  }

  const getField = (name: string): string => {
    const field = formData.find((f) => f.name === name);
    return field && field.data ? Buffer.from(field.data).toString("utf-8") : "";
  };

  const id = getField("id");
  if (!id) {
    throw createError({ statusCode: 400, message: "ID wajib disertakan" });
  }

  // 1. Ambil data lama untuk pembersihan file jika diupdate
  const results = await db
    .select()
    .from(dokumentasiKegiatanTable)
    .where(eq(dokumentasiKegiatanTable.id, Number(id)))
    .limit(1);
    
  const oldDoc = results[0];
  if (!oldDoc) {
    throw createError({ statusCode: 404, message: "Dokumentasi tidak ditemukan" });
  }

  const updateData: any = {
    deskripsi: getField("deskripsi"),
    tipeDokumen: getField("tipeDokumen"),
    namaToko: getField("namaToko"),
    nomorRekeningToko: getField("nomorRekeningToko"),
    namaPemilikRekeningToko: getField("namaPemilikRekeningToko"),
    namaPenyediaJasa: getField("namaPenyediaJasa"),
    nomorRekeningJasa: getField("nomorRekeningJasa"),
    namaPemilikRekeningJasa: getField("namaPemilikRekeningJasa"),
  };

  // 2. Handle File Updates
  const fileFields = [
    { name: "fotoBarang", dbField: "fotoBarangUrl", category: "barang" as const },
    { name: "strukBelanja", dbField: "strukBelanjaUrl", category: "barang" as const },
    { name: "sk", dbField: "skUrl", category: "jasa" as const },
    { name: "spmt", dbField: "spmtUrl", category: "jasa" as const },
    { name: "amprah", dbField: "amprahUrl", category: "jasa" as const },
    { name: "npwp", dbField: "npwpUrl", category: "jasa" as const },
    { name: "ktp", dbField: "ktpUrl", category: "jasa" as const },
    { name: "file", dbField: "fileUrl", category: "kegiatan" as const },
  ];

  for (const f of fileFields) {
    const fileData = formData.find((formField) => formField.name === f.name);
    if (fileData && fileData.data && fileData.filename) {
      // Hapus file lama jika ada
      const oldPath = (oldDoc as any)[f.dbField];
      if (oldPath && fs.existsSync(oldPath)) {
        await unlink(oldPath).catch(console.error);
      }

      // Simpan file baru
      const targetDir = await createFilePath("dokumentasi", f.category, "");
      const newFileName = `${Date.now()}_${f.name}_${fileData.filename}`;
      const newPath = join(targetDir, newFileName);
      await writeFile(newPath, fileData.data);
      updateData[f.dbField] = newPath;

      // Update fileUrl gabungan jika perlu
      if (f.name === "file") {
        updateData.fileUrl = newPath;
      }
    }
  }

  await db
    .update(dokumentasiKegiatanTable)
    .set(updateData)
    .where(eq(dokumentasiKegiatanTable.id, Number(id)));

  return {
    success: true,
    message: "Dokumentasi berhasil diperbarui",
  };
});
