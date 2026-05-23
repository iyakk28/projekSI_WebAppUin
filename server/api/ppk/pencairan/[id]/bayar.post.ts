import { defineEventHandler, readMultipartFormData, createError } from "h3";
import { writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { eq, and } from "drizzle-orm";
import { useDrizzle } from "~~/server/db";
import {
  tagihanPencairanTable,
  pembayaranTable,
  kegiatanTable,
  pengajuanRabTable,
  usersTable,
  ormawaTable,
} from "~~/server/db/schema";
import { createFilePath } from "#imports";

export default defineEventHandler(async (event) => {
  try {
    const id = Number(getRouterParam(event, "id"));
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "ID tagihan tidak valid",
      });
    }

    const user = event.context.user;
    const db = useDrizzle();

    // ✅ Ambil fakultasId PPK yang sedang login
    const [ppkData] = await db
      .select({ fakultasId: usersTable.fakultasId })
      .from(usersTable)
      .where(eq(usersTable.users_id, user.id));

    if (!ppkData?.fakultasId) {
      throw createError({
        statusCode: 403,
        statusMessage: "PPK tidak memiliki data fakultas",
      });
    }

    // ✅ Ambil tagihan sekaligus validasi kepemilikan fakultas via join
    const [tagihan] = await db
      .select({
        id: tagihanPencairanTable.id,
        statusTagihan: tagihanPencairanTable.statusTagihan,
        nominal: tagihanPencairanTable.nominal,
        namaPenerima: tagihanPencairanTable.namaPenerima,
        ormawaFakultasId: ormawaTable.fakultasId, // untuk validasi
      })
      .from(tagihanPencairanTable)
      .innerJoin(
        kegiatanTable,
        eq(tagihanPencairanTable.kegiatanId, kegiatanTable.id),
      )
      .innerJoin(
        pengajuanRabTable,
        eq(kegiatanTable.pengajuanRabId, pengajuanRabTable.id),
      )
      .innerJoin(
        usersTable,
        eq(pengajuanRabTable.usersId, usersTable.users_id),
      )
      .leftJoin(ormawaTable, eq(usersTable.ormawaId, ormawaTable.id))
      .where(eq(tagihanPencairanTable.id, id));

    if (!tagihan) {
      throw createError({
        statusCode: 404,
        statusMessage: "Tagihan pencairan tidak ditemukan",
      });
    }

    // ✅ Validasi: tagihan harus dari ormawa se-fakultas dengan PPK
    if (tagihan.ormawaFakultasId !== ppkData.fakultasId) {
      throw createError({
        statusCode: 403,
        statusMessage: "Anda tidak memiliki akses untuk membayar tagihan ini",
      });
    }

    if (tagihan.statusTagihan !== "TERVERIFIKASI") {
      throw createError({
        statusCode: 422,
        statusMessage: `Tagihan belum terverifikasi. Status saat ini: ${tagihan.statusTagihan}`,
      });
    }

    // Baca multipart form data
    const formData = await readMultipartFormData(event);
    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "Tidak ada data yang dikirim",
      });
    }

    const getField = (name: string): string => {
      const field = formData.find((f) => f.name === name);
      return field?.data ? Buffer.from(field.data).toString("utf-8") : "";
    };

    const catatan = getField("catatan");

    // Validasi file bukti transfer
    const buktiField = formData.find((f) => f.name === "bukti_transfer");
    if (!buktiField || !buktiField.data || buktiField.data.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "File bukti transfer wajib diupload",
      });
    }

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(buktiField.type ?? "")) {
      throw createError({
        statusCode: 400,
        statusMessage: "Format file tidak valid. Gunakan PDF, JPG, atau PNG",
      });
    }

    if (buktiField.data.length > 5 * 1024 * 1024) {
      throw createError({
        statusCode: 400,
        statusMessage: "Ukuran file maksimal 5MB",
      });
    }

    // Simpan file bukti transfer
    const uploadDir = await createFilePath("BuktiTransfer", String(id));
    const timestamp = Date.now();
    const originalName = buktiField.filename || "bukti_transfer";
    const safeName = originalName.replace(/[^a-zA-Z0-9.\-]/g, "_");
    const uniqueFilename = `${timestamp}_${safeName}`;
    const absolutePath = join(uploadDir, uniqueFilename);
    await writeFile(absolutePath, buktiField.data);
    const relativePath = relative(process.cwd(), absolutePath).replace(
      /\\/g,
      "/",
    );

    // Insert pembayaran + update status tagihan dalam satu transaksi
    await db.transaction(async (tx) => {
      await tx.insert(pembayaranTable).values({
        tagihanId: id,
        ppkId: user.id,
        buktiTransferUrl: relativePath,
        tanggalPembayaran: new Date().toISOString(),
        catatanPembayaran: catatan?.trim() || null,
      });

      await tx
        .update(tagihanPencairanTable)
        .set({
          statusTagihan: "SELESAI",
          updatedAt: new Date().toISOString(),
        })
        .where(eq(tagihanPencairanTable.id, id));
    });

    return {
      success: true,
      message: "Pembayaran berhasil dicatat. Bukti transfer telah disimpan.",
      data: {
        tagihanId: id,
        namaPenerima: tagihan.namaPenerima,
        nominal: tagihan.nominal,
        statusTagihan: "SELESAI",
        buktiTransfer: uniqueFilename,
      },
    };
  } catch (error: any) {
    console.error("Error POST /api/ppk/pencairan/[id]/bayar:", error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Gagal memproses pembayaran",
      data: error,
    });
  }
});