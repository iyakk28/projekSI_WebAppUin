// FILE: server/api/kaprodi/kegiatan/[id]/keputusan.post.ts
// Endpoint untuk memproses keputusan review (Setuju / Revisi) oleh Kaprodi
// Mengikuti pola server/api/ppk/kegiatan/[id]/keputusan.post.ts secara persis

import { eq, inArray, and } from "drizzle-orm";
import { useDrizzle } from "~~/server/db";
import {
  pengajuanRabTable,
  approvalLogTable,
  usersTable,
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
    // field: "keputusan" — value: "disetujui" | "revisi" | "tolak"
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

    // Step 1: Cari Ormawa yang terikat pada prodiId Kaprodi
    const ormawaRows = await db
      .select({ id: ormawaTable.id })
      .from(ormawaTable)
      .where(eq(ormawaTable.prodiId, prodiId));

    const ormawaIds = ormawaRows.map((o) => o.id);

    if (ormawaIds.length === 0) {
      throw createError({
        statusCode: 403,
        statusMessage: "Tidak ada ormawa binaan yang terdaftar untuk prodi Anda",
      });
    }

    // Step 2: Cari all users dari Ormawa tersebut
    const ormawaUsers = await db
      .select({ usersId: usersTable.users_id })
      .from(usersTable)
      .where(inArray(usersTable.ormawaId, ormawaIds));

    const ormawaUserIds = ormawaUsers.map((u) => u.usersId);

    if (ormawaUserIds.length === 0) {
      throw createError({
        statusCode: 403,
        statusMessage: "Tidak ada user ormawa terdaftar",
      });
    }

    // Step 3: Cari pengajuan dan validasi akses
    const rab = await db.query.pengajuanRabTable.findFirst({
      where: and(
        eq(pengajuanRabTable.id, id),
        inArray(pengajuanRabTable.usersId, ormawaUserIds)
      ),
    });

    if (!rab) {
      throw createError({
        statusCode: 404,
        statusMessage: "Pengajuan tidak ditemukan atau Anda tidak memiliki akses",
      });
    }

    // Kaprodi hanya bisa meninjau pengajuan yang berstatus "waiting_kaprodi" atau "revisi_kaprodi" (jika ormawa re-upload)
    if (rab.status !== "waiting_kaprodi") {
      throw createError({
        statusCode: 422,
        statusMessage: `Pengajuan tidak bisa diproses. Status saat ini: ${rab.status}`,
      });
    }

    const { statusBaru, action } = KEPUTUSAN_MAP[keputusan as Keputusan];

    // Step 4: Jalankan update status & catat log persetujuan dalam satu transaksi database
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
