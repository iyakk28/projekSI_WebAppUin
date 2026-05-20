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
  const namaPenyedia = getField("namaPenyedia");
  const nomorRekening = getField("nomorRekening");
  const namaPemilikRekening = getField("namaPemilikRekening");
  const status = getField("status") || "draft";

  const skField = formData.find((f) => f.name === "sk");
  const spmtField = formData.find((f) => f.name === "spmt");
  const amprahField = formData.find((f) => f.name === "amprah");
  const npwpField = formData.find((f) => f.name === "npwp");
  const ktpField = formData.find((f) => f.name === "ktp");

  if (!skField || !spmtField || !amprahField || !npwpField || !ktpField) {
    throw createError({
      statusCode: 400,
      message: "Semua file jasa wajib diupload",
    });
  }

  const skDir = await createFilePath("dokumentasi", "jasa", "");
  const spmtDir = await createFilePath("dokumentasi", "jasa", "");
  const amprahDir = await createFilePath("dokumentasi", "jasa", "");
  const npwpDir = await createFilePath("dokumentasi", "jasa", "");
  const ktpDir = await createFilePath("dokumentasi", "jasa", "");

  const skName = Date.now() + "_sk_" + skField.filename;
  const skPath = join(skDir, skName);
  await writeFile(skPath, skField.data);

  const spmtName = Date.now() + "_spmt_" + spmtField.filename;
  const spmtPath = join(spmtDir, spmtName);
  await writeFile(spmtPath, spmtField.data);

  // simpan file Amprah
  const amprahName = Date.now() + "_amprah_" + amprahField.filename;
  const amprahPath = join(amprahDir, amprahName);
  await writeFile(amprahPath, amprahField.data);

  const npwpName = Date.now() + "_npwp_" + npwpField.filename;
  const npwpPath = join(npwpDir, npwpName);
  await writeFile(npwpPath, npwpField.data);

  const ktpName = Date.now() + "_ktp_" + ktpField.filename;
  const ktpPath = join(ktpDir, ktpName);
  await writeFile(ktpPath, ktpField.data);

  const { user } = event.context;
  if (!user) {
    throw createError({
      statusCode: 401,
      message: "User tidak terautentikasi",
    });
  }

  const [hasil] = await db.insert(dokumentasiKegiatanTable).values({
    kegiatanId: Number(kegiatanId),
    deskripsi,
    tipeDokumen: "JASA",
    fileUrl: `${skPath};${spmtPath};${amprahPath};${npwpPath};${ktpPath}`,
    uploadedBy: user.id,
    namaPenyediaJasa: namaPenyedia,
    nomorRekeningJasa: nomorRekening,
    namaPemilikRekeningJasa: namaPemilikRekening,
    skUrl: skPath,
    spmtUrl: spmtPath,
    amprahUrl: amprahPath,
    npwpUrl: npwpPath,
    ktpUrl: ktpPath,
  });

  return {
    success: true,
    message: "Jasa berhasil diupload",
    data: hasil.insertId,
  };
});
