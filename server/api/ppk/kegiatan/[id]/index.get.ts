import { eq, asc, and } from "drizzle-orm";
import { useDrizzle } from "~~/server/db";
import {
  pengajuanRabTable,
  usersTable,
  ormawaTable,
  approvalLogTable,
  programStudiTable,
} from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
  try {
    const id = Number(getRouterParam(event, "id"));
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "ID pengajuan tidak valid",
      });
    }

    const db = useDrizzle();
    const { user } = event.context;

    // Validasi user
    if (!user || user.role !== "ppk") {
      throw createError({
        statusCode: 403,
        statusMessage: "Akses ditolak. Peran PPK diperlukan.",
      });
    }

    const fakultasId = user.fakultasId;

    if (!fakultasId) {
      throw createError({
        statusCode: 403,
        statusMessage: "PPK tidak memiliki fakultas yang valid",
      });
    }

    // Ambil detail RAB
    const rab = await db.query.pengajuanRabTable.findFirst({
      where: eq(pengajuanRabTable.id, id),
    });

    if (!rab) {
      throw createError({
        statusCode: 404,
        statusMessage: "Pengajuan tidak ditemukan",
      });
    }

    // Validasi Akses: PPK hanya boleh akses RAB dari fakultas yang sama
    // rab.fakultasId adalah varchar, user.fakultasId adalah number
    if (String(rab.fakultasId) !== String(fakultasId)) {
      throw createError({
        statusCode: 403,
        statusMessage: "Anda tidak memiliki akses ke pengajuan dari fakultas lain",
      });
    }

    // Ambil daftar Program Studi di fakultas yang sama
    const prodiList = await db
      .select({
        id: programStudiTable.id,
        nama: programStudiTable.nama,
        kode: programStudiTable.kode,
      })
      .from(programStudiTable)
      .where(eq(programStudiTable.fakultasId, Number(fakultasId)));

    // Ambil info pengaju (ORMawa User)
    const pengajuInfo = await db.query.usersTable.findFirst({
      where: eq(usersTable.users_id, rab.usersId),
    });

    // Ambil info Ormawa
    const ormawaInfo = pengajuInfo?.ormawaId
      ? await db.query.ormawaTable.findFirst({
          where: eq(ormawaTable.id, pengajuInfo.ormawaId),
        })
      : null;

    // Ambil riwayat approval
    const riwayat = await db
      .select({
        approvalLog: approvalLogTable,
        actor: {
          fullname: usersTable.fullName,
          role: usersTable.role,
        },
      })
      .from(approvalLogTable)
      .innerJoin(usersTable, eq(usersTable.id, approvalLogTable.actorId))
      .where(eq(approvalLogTable.pengajuanRabId, id))
      .orderBy(asc(approvalLogTable.createdAt));

    return {
      success: true,
      data: {
        id: rab.id,
        nomorPengajuan: rab.nomorPengajuan,
        judulKegiatan: rab.judulKegiatan,
        deskripsi: rab.deskripsi,
        totalAnggaran: rab.totalAnggaran,
        tanggalMulai: rab.tanggalMulai,
        tanggalSelesai: rab.tanggalSelesai,
        status: rab.status,
        fileRabUrl: rab.fileRabUrl,
        fileTorUrl: rab.fileTorUrl,
        createdAt: rab.createdAt,
        updatedAt: rab.updatedAt,
        pengaju: {
          id: pengajuInfo?.id ?? null,
          nama: pengajuInfo?.fullName ?? "",
          email: pengajuInfo?.email ?? "",
        },
        ormawa: {
          id: ormawaInfo?.id ?? null,
          nama: ormawaInfo?.nama ?? "",
          kode: ormawaInfo?.kode ?? "",
          totalAnggaran: ormawaInfo?.totalAnggaran ?? 0,
        },
        prodiList,
        riwayat: riwayat.map((r) => ({
          id: r.approvalLog.id,
          action: r.approvalLog.action,
          catatan: r.approvalLog.catatanRevisi,
          createdAt: r.approvalLog.createdAt,
          aktor: {
            nama: r.actor.fullname,
            role: r.actor.role,
          },
        })),
      },
    };
  } catch (error: any) {
    console.error("Error GET /api/ppk/kegiatan/[id]:", error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Gagal mengambil detail pengajuan",
      data: error?.message || error,
    });
  }
});
