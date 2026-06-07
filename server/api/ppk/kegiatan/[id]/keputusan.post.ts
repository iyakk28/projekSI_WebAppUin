// FILE: server/api/ppk/kegiatan/[id]/keputusan.post.ts
// Endpoint sederhana untuk memproses keputusan PPK (Setuju/Revisi/Tolak)
// Validasi akses langsung menggunakan fakultasId dari pengajuan_rab

import { eq, and } from "drizzle-orm";
import { useDrizzle } from "~~/server/db";
import { pengajuanRabTable, approvalLogTable } from "~~/server/db/schema";

const KEPUTUSAN_MAP = {
  disetujui: { statusBaru: "waiting_spi" as const, action: "disetujui" },
  revisi: { statusBaru: "revisi_ppk" as const, action: "revisi" },
  tolak: { statusBaru: "revisi_ppk" as const, action: "ditolak" },
} as const;

type Keputusan = keyof typeof KEPUTUSAN_MAP;

export default defineEventHandler(async (event) => {
  try {
    const { user } = event.context;

    // 1. Validasi Role PPK
    if (!user || user.role !== "ppk") {
      throw createError({
        statusCode: 403,
        statusMessage: "Akses ditolak. Peran PPK diperlukan.",
      });
    }

    const id = Number(getRouterParam(event, "id"));
    const body = await readBody(event);
    const { keputusan, catatan } = body ?? {};

    if (isNaN(id)) {
      throw createError({
        statusCode: 400,
        statusMessage: "ID pengajuan tidak valid",
      });
    }

    if (!keputusan || !Object.keys(KEPUTUSAN_MAP).includes(keputusan)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Keputusan tidak valid. Pilihan: ${Object.keys(KEPUTUSAN_MAP).join(", ")}`,
      });
    }

    if ((keputusan === "revisi" || keputusan === "tolak") && !catatan?.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: "Catatan wajib diisi untuk keputusan revisi atau tolak",
      });
    }

    const db = useDrizzle();

    // 2. Cari RAB dan Validasi Akses Fakultas sekaligus
    const rab = await db.query.pengajuanRabTable.findFirst({
      where: and(
        eq(pengajuanRabTable.id, id),
        eq(pengajuanRabTable.fakultasId, String(user.fakultasId)),
      ),
    });

    if (!rab) {
      throw createError({
        statusCode: 403,
        statusMessage:
          "Pengajuan tidak ditemukan atau Anda tidak memiliki akses ke fakultas ini",
      });
    }

    if (rab.status !== "waiting_ppk") {
      throw createError({
        statusCode: 422,
        statusMessage: `Pengajuan tidak bisa diproses. Status saat ini: ${rab.status}`,
      });
    }

    const { statusBaru, action } = KEPUTUSAN_MAP[keputusan as Keputusan];

    // 3. Proses Transaksi: Update Status & Simpan Log
    await db.transaction(async (tx) => {
      await tx
        .update(pengajuanRabTable)
        .set({ status: statusBaru, updatedAt: new Date() })
        .where(eq(pengajuanRabTable.id, id));

      await tx.insert(approvalLogTable).values({
        pengajuanRabId: id,
        actorId: user.id,
        action,
        catatanRevisi: catatan?.trim() ?? "",
      });
    });

    return {
      success: true,
      message:
        action === "disetujui"
          ? "Pengajuan berhasil disetujui dan diteruskan ke SPI"
          : "Keputusan berhasil disimpan",
      data: { pengajuanId: id, keputusan: action, statusBaru },
    };
  } catch (error: any) {
    console.error("Error processing PPK decision:", error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Gagal memproses keputusan PPK",
      data: error,
    });
  }
});
