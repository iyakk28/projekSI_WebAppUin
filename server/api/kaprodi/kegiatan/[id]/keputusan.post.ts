// FILE: server/api/kaprodi/kegiatan/[id]/keputusan.post.ts
// Endpoint untuk memproses keputusan review (Setuju / Revisi) oleh Kaprodi
// Dioptimalkan dengan filter ormawaId langsung dan Join satu kali jalan

import { eq, and } from "drizzle-orm";
import { useDrizzle } from "~~/server/db";
import {
  pengajuanRabTable,
  approvalLogTable,
  ormawaTable,
} from "~~/server/db/schema";

const KEPUTUSAN_MAP = {
  disetujui: { statusBaru: "waiting_ppk" as const, action: "disetujui" },
  revisi:    { statusBaru: "revisi_kaprodi" as const, action: "revisi" },
  tolak:     { statusBaru: "revisi_kaprodi" as const, action: "ditolak" },
} as const;

type Keputusan = keyof typeof KEPUTUSAN_MAP;

export default defineEventHandler(async (event) => {
  try {
    const id = Number(getRouterParam(event, "id"));
    if (isNaN(id) || id <= 0) {
      throw createError({ statusCode: 400, statusMessage: "ID pengajuan tidak valid" });
    }

    const body = await readBody(event);
    const { keputusan, catatan } = body ?? {};

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
    const { user } = event.context;

    // Pastikan user terautentikasi dan memiliki prodiId
    if (!user || user.role !== "kaprodi") {
      throw createError({
        statusCode: 403,
        statusMessage: "Akses ditolak. Peran Kaprodi diperlukan.",
      });
    }

    const prodiId = user.prodiId;

    if (!prodiId) {
      throw createError({
        statusCode: 403,
        statusMessage: "Anda tidak memiliki program studi yang valid",
      });
    }

    // Step 1: Cari pengajuan sekaligus validasi akses prodi Kaprodi via ormawaId
    const result = await db
      .select({
        id: pengajuanRabTable.id,
        status: pengajuanRabTable.status,
      })
      .from(pengajuanRabTable)
      .innerJoin(ormawaTable, eq(pengajuanRabTable.ormawaId, ormawaTable.id))
      .where(
        and(
          eq(pengajuanRabTable.id, id),
          eq(ormawaTable.prodiId, Number(prodiId))
        )
      )
      .limit(1);

    const rab = result[0];

    if (!rab) {
      throw createError({
        statusCode: 404,
        statusMessage: "Pengajuan tidak ditemukan atau Anda tidak memiliki akses ke pengajuan ini",
      });
    }

    // Kaprodi hanya bisa meninjau pengajuan yang berstatus "waiting_kaprodi"
    if (rab.status !== "waiting_kaprodi") {
      throw createError({
        statusCode: 422,
        statusMessage: `Pengajuan tidak bisa diproses. Status saat ini: ${rab.status}`,
      });
    }

    const { statusBaru, action } = KEPUTUSAN_MAP[keputusan as Keputusan];

    // Step 2: Jalankan update status & catat log persetujuan dalam satu transaksi database
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
          ? "Pengajuan berhasil disetujui dan diteruskan ke PPK"
          : action === "revisi"
          ? "Pengajuan dikembalikan ke Ormawa untuk revisi"
          : "Pengajuan ditolak",
      data: { pengajuanId: id, keputusan: action, statusBaru },
    };
  } catch (error: any) {
    console.error("Error POST /api/kaprodi/kegiatan/[id]/keputusan:", error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Gagal memproses keputusan",
      data: error,
    });
  }
});
