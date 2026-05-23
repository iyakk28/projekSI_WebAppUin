import { useDrizzle } from "~~/server/db";
import { tagihanPencairanTable } from "~~/server/db/schema/TagihanPencairanSchema";
import { createFilePath } from "#imports";
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
  const namaPenerima = getField("namaPenerima");
  const rekeningPenerima = getField("rekeningPenerima");
  const bankPenerima = getField("bankPenerima");
  const nominalStr = getField("nominal");
  const nominal = nominalStr ? parseFloat(nominalStr) : 0;
  const skNomor = getField("skNomor");

  const skField = formData.find((f) => f.name === "skFile");

  if (!skField) {
    throw createError({
      statusCode: 400,
      message: "File SK wajib diupload",
    });
  }

  const skDir = await createFilePath("dokumentasi", "jasa", "");
  const skName = Date.now() + "_sk_" + skField.filename;
  const skPath = join(skDir, skName);
  await writeFile(skPath, skField.data);

  const { user } = event.context;
  if (!user) {
    throw createError({
      statusCode: 401,
      message: "User tidak terautentikasi",
    });
  }

  const [hasil] = await db.insert(tagihanPencairanTable).values({
    kegiatanId: Number(kegiatanId),
    tipeTagihan: "JASA",
    namaPenerima,
    rekeningPenerima,
    bankPenerima,
    nominal: nominal.toString(),
    skNomor,
    skFileUrl: skPath,
    createdBy: user.id,
  });

  return {
    success: true,
    message: "Jasa berhasil diupload",
    data: hasil.insertId,
  };
});
