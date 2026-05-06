import { eq } from "drizzle-orm";
import { useDrizzle } from "~~/server/db";
import {
  pengajuanRabTable,
  approvalLogTable,
  usersTable,
  ormawaTable,
  programStudiTable,
  fakultasTable,
} from "~~/server/db/schema";

// Mapping keputusan PPK ke statusEnum dan action approval_log
const KEPUTUSAN_MAP = {
  disetujui: {
    statusBaru: "waiting_spi" as const,
    action: "disetujui",
  },
  revisi: {
    statusBaru: "revisi_ppk" as const,
    action: "revisi",
  },
  tolak: {
    statusBaru: "revisi_ppk" as const,
    action: "ditolak",
  },
} as const;

type Keputusan = keyof typeof KEPUTUSAN_MAP;

export default defineEventHandler(async (event) => {
  try {
    const id = Number(getRouterParam(event, "id"));
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "ID pengajuan tidak valid",
      });
    }

    const body = await readBody(event);
    const { keputusan, catatan } = body ?? {};

    // Validasi keputusan
    if (!keputusan || !Object.keys(KEPUTUSAN_MAP).includes(keputusan)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Keputusan tidak valid. Pilihan: ${Object.keys(KEPUTUSAN_MAP).join(", ")}`,
      });
    }

    // Catatan wajib jika revisi atau tolak
    if ((keputusan === "revisi" || keputusan === "tolak") && !catatan?.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: "Catatan wajib diisi untuk keputusan revisi atau tolak",
      });
    }

    const db = useDrizzle();

    // Ambil user PPK yang sedang login beserta fakultasnya
    const user = event.context.user;
    const fakultasId = user.fakultasId;

    // Pastikan pengajuan ada, statusnya waiting_ppk,
    // dan berasal dari ormawa se-fakultas PPK
    const [pengajuan] = await db
      .select({
        id: pengajuanRabTable.id,
        status: pengajuanRabTable.status,
        judulKegiatan: pengajuanRabTable.judulKegiatan,
        pengajuanFakultasId: fakultasTable.id,
      })
      .from(pengajuanRabTable)
      .innerJoin(usersTable, eq(pengajuanRabTable.usersId, usersTable.users_id))
      .leftJoin(ormawaTable, eq(usersTable.ormawaId, ormawaTable.id))
      .leftJoin(programStudiTable, eq(ormawaTable.prodiId, programStudiTable.id))
      .leftJoin(fakultasTable, eq(programStudiTable.fakultasId, fakultasTable.id))
      .where(eq(pengajuanRabTable.id, id));

    if (!pengajuan) {
      throw createError({
        statusCode: 404,
        statusMessage: "Pengajuan tidak ditemukan",
      });
    }

    // Validasi: PPK hanya boleh memproses pengajuan dari fakultasnya sendiri
    if (pengajuan.pengajuanFakultasId !== fakultasId) {
      throw createError({
        statusCode: 403,
        statusMessage: "Anda tidak memiliki akses untuk memproses pengajuan ini",
      });
    }

    if (pengajuan.status !== "waiting_ppk") {
      throw createError({
        statusCode: 422,
        statusMessage: `Pengajuan tidak bisa diproses. Status saat ini: ${pengajuan.status}`,
      });
    }

    const { statusBaru, action } = KEPUTUSAN_MAP[keputusan as Keputusan];

    // Jalankan update status + insert approval_log dalam satu transaksi
    await db.transaction(async (tx) => {
      await tx
        .update(pengajuanRabTable)
        .set({
          status: statusBaru,
          updatedAt: new Date().toISOString(),
        })
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
      message: `Pengajuan berhasil ${action === "disetujui" ? "disetujui dan diteruskan ke SPI" : action === "revisi" ? "dikembalikan untuk revisi" : "ditolak"}`,
      data: {
        pengajuanId: id,
        keputusan: action,
        statusBaru,
      },
    };
  } catch (error: any) {
    console.error("Error POST /api/ppk/kegiatan/[id]/keputusan:", error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Gagal memproses keputusan",
      data: error,
    });
  }
});