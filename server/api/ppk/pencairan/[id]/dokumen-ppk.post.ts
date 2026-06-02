import { mkdir, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { cwd } from "node:process";
import { eq } from "drizzle-orm";
import { useDrizzle } from "~~/server/db";
import { tagihanPencairanTable, usersTable } from "~~/server/db/schema";
import {
  decodeUrlId,
  mysqlTimestamp,
  readPencairanMeta,
  resolveTagihanId,
  writePencairanMeta,
} from "~~/server/utils/pencairanHelpers";

const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];

export default defineEventHandler(async (event) => {
  try {
    const routeId = decodeUrlId(getRouterParam(event, "id"));
    if (Number.isNaN(routeId) || routeId === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "ID pencairan tidak valid",
      });
    }

    const user = event.context.user;
    if (!user || user.role !== "ppk") {
      throw createError({
        statusCode: 403,
        statusMessage: "Hanya PPK yang dapat mengunggah dokumen SPB/kwitansi untuk pencairan",
      });
    }
    const db = useDrizzle();

    const [ppkData] = await db
      .select({ fakultasId: usersTable.fakultasId })
      .from(usersTable)
      .where(eq(usersTable.id, Number(user.id)));

    if (!ppkData?.fakultasId) {
      throw createError({
        statusCode: 403,
        statusMessage: "PPK tidak memiliki data fakultas",
      });
    }

    const tagihanId = await resolveTagihanId(
      db,
      routeId,
      Number(user.id),
      ppkData.fakultasId,
    );

    if (!tagihanId) {
      throw createError({
        statusCode: 404,
        statusMessage: "Data pencairan tidak ditemukan",
      });
    }

    const [tagihan] = await db
      .select({
        id: tagihanPencairanTable.id,
        statusTagihan: tagihanPencairanTable.statusTagihan,
      })
      .from(tagihanPencairanTable)
      .where(eq(tagihanPencairanTable.id, tagihanId));

    if (!tagihan) {
      throw createError({
        statusCode: 404,
        statusMessage: "Tagihan pencairan tidak ditemukan",
      });
    }

    if (!["DOKUMEN_LENGKAP", "TERVERIFIKASI"].includes(tagihan.statusTagihan ?? "")) {
      throw createError({
        statusCode: 422,
        statusMessage:
          "Unggah SPB dan kwitansi setelah dokumen ormawa ditandai lengkap",
      });
    }

    const formData = await readMultipartFormData(event);
    if (!formData?.length) {
      throw createError({
        statusCode: 400,
        statusMessage: "Tidak ada file yang dikirim",
      });
    }

    const getFile = (name: string) => formData.find((field) => field.name === name);

    const saveFile = async (fieldName: string, prefix: string) => {
      const file = getFile(fieldName);
      if (!file?.data?.length) return null;

      if (!allowedTypes.includes(file.type ?? "")) {
        throw createError({
          statusCode: 400,
          statusMessage: "Format file tidak valid. Gunakan PDF, JPG, atau PNG",
        });
      }

      if (file.data.length > 5 * 1024 * 1024) {
        throw createError({
          statusCode: 400,
          statusMessage: "Ukuran file maksimal 5MB",
        });
      }

      const uploadDir = join(cwd(), "uploads", "ppk", prefix, String(tagihanId));
      await mkdir(uploadDir, { recursive: true });
      const safeName = (file.filename || fieldName).replace(/[^a-zA-Z0-9.\-]/g, "_");
      const uniqueFilename = `${Date.now()}_${safeName}`;
      const absolutePath = join(uploadDir, uniqueFilename);
      await writeFile(absolutePath, file.data);
      return relative(cwd(), absolutePath).replace(/\\/g, "/");
    };

    const spbPath = await saveFile("surat_perintah_bayar", "spb");
    const kwitansiPath = await saveFile("kwitansi", "kwitansi");

    if (!spbPath && !kwitansiPath) {
      throw createError({
        statusCode: 400,
        statusMessage: "Unggah minimal satu file: Surat Perintah Bayar atau Kwitansi",
      });
    }

    const current = await readPencairanMeta(tagihanId);
    const nextSpb = spbPath ?? current.spbFileUrl ?? null;
    const nextKwitansi = kwitansiPath ?? current.kwitansiFileUrl ?? null;

    const statusBaru =
      nextSpb && nextKwitansi ? "TERVERIFIKASI" : "DOKUMEN_LENGKAP";

    await writePencairanMeta(tagihanId, {
      spbFileUrl: nextSpb,
      kwitansiFileUrl: nextKwitansi,
    });

    await db
      .update(tagihanPencairanTable)
      .set({
        statusTagihan: statusBaru,
        updatedAt: mysqlTimestamp(),
      })
      .where(eq(tagihanPencairanTable.id, tagihanId));

    return {
      success: true,
      message:
        statusBaru === "TERVERIFIKASI"
          ? "SPB dan kwitansi lengkap. Siap melakukan pencairan dana."
          : "File tersimpan. Lengkapi SPB dan kwitansi untuk melanjutkan.",
      data: {
        tagihanId,
        statusTagihan: statusBaru,
        spbUploaded: Boolean(nextSpb),
        kwitansiUploaded: Boolean(nextKwitansi),
      },
    };
  } catch (error: any) {
    console.error("Error POST /api/ppk/pencairan/[id]/dokumen-ppk:", error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Gagal menyimpan dokumen PPK",
      data: error,
    });
  }
});
