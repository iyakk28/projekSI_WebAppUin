// FILE: server/api/kaprodi/kegiatan/[id]/index.get.ts
// Endpoint untuk mengambil detail pengajuan proposal berdasarkan ID tertentu oleh Kaprodi
// Dioptimalkan dengan validasi akses ormawaId dan pengambilan pengaju yang tepat dari RAB

import { eq, asc, and } from "drizzle-orm";
import { useDrizzle } from "~~/server/db";
import {
  pengajuanRabTable,
  usersTable,
  ormawaTable,
  approvalLogTable,
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

    // Step 1: Ambil detail RAB dan Ormawa sekaligus validasi akses prodi
    const result = await db
      .select({
        rab: pengajuanRabTable,
        ormawa: ormawaTable,
      })
      .from(pengajuanRabTable)
      .innerJoin(ormawaTable, eq(pengajuanRabTable.ormawaId, ormawaTable.id))
      .where(
        and(
          eq(pengajuanRabTable.id, id),
          eq(ormawaTable.prodiId, Number(prodiId)),
        ),
      )
      .limit(1);

    const detail = result[0];

    if (!detail) {
      throw createError({
        statusCode: 404,
        statusMessage:
          "Pengajuan tidak ditemukan atau Anda tidak memiliki akses ke pengajuan ini",
      });
    }

    const { rab, ormawa } = detail;

    // Step 2: Ambil info pengaju asli (berdasarkan users_id yang ada di record RAB)
    const pengajuInfo = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, Number(rab.usersId)),
    });

    // Step 3: Ambil riwayat approval log
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
          id: ormawa.id,
          nama: ormawa.nama,
          kode: ormawa.kode,
          totalAnggaran: ormawa.totalAnggaran,
        },
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
    console.error("Error GET /api/kaprodi/kegiatan/[id]:", error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Gagal mengambil detail pengajuan",
      data: error,
    });
  }
});
