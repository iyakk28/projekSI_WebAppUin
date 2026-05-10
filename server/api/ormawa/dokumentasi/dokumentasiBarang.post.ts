import { useDrizzle } from "~~/server/db";
import { dokumentasiKegiatanTable } from "~~/server/db/schema";
import { createFilePath } from "#imports"; // util nuxt js
import { writeFile } from "node:fs/promises";
import { join } from "node:path";

export default defineEventHandler(async (event) => {
  const db = useDrizzle();
  const formData = await readMultipartFormData(event);
  if (!formData || formData.length === 0) {
    throw createError({
      statusCode: 400,
      message: "Tidak ada data yang dikirim",
    });
  }

  const getField = (name: string): string => {
    const field = formData.find((f) => f.name === name);
    return field && field.data ? Buffer.from(field.data).toString("utf-8") : "";
  };

  const kegiatanId = getField("kegiatanId");
  const deskripsi = getField("deskripsi");
  const namaToko = getField("namaToko");
  const nomorRekeningToko = getField("nomorRekeningToko");
  const namaPemilikRekening = getField("namaPemilikRekening");
  const status = getField("status") || "draft";

  // ambil file barang
  const fotoBarangField = formData.find((f) => f.name === "fotoBarang");
  const strukBelanjaField = formData.find((f) => f.name === "fotoStruk");
  if (!fotoBarangField || !strukBelanjaField) {
    throw createError({
      statusCode: 400,
      message: "Foto barang dan struk wajib diupload",
    });
  }

  const targetPath = await createFilePath("dokumentasi", "barang", "");

  // simpan file barang
  const fotoBarangName = Date.now() + "_barang_" + fotoBarangField.filename;
  const fotoBarangPath = join(targetPath, fotoBarangName);
  await writeFile(fotoBarangPath, fotoBarangField.data);

  // simpan file struk
  const strukName = Date.now() + "_struk_" + strukBelanjaField.filename;
  const strukPath = join(targetPath, strukName);
  await writeFile(strukPath, strukBelanjaField.data);

  const { user } = event.context;
  if (!user) {
    throw createError({
      statusCode: 401,
      message: "User tidak terautentikasi",
    });
  }

  // insert ke database
  const [hasil] = await db.insert(dokumentasiKegiatanTable).values({
    kegiatanId: Number(kegiatanId),
    deskripsi,
    tipeDokumen: "BARANG",
    fileUrl: "",
    uploadedBy: user.id,
    namaToko,
    nomorRekeningToko,
    namaPemilikRekeningToko: namaPemilikRekening,
    fotoBarangUrl: fotoBarangPath,
    strukBelanjaUrl: strukPath,
  });
  console.log("anjay", hasil);
  return {
    success: true,
    message: "Barang berhasil diupload",
    data: hasil.insertId,
  };
});
