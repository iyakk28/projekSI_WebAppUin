// FILE: server/api/ppk/kegiatan/[id]/index.get.ts
// Endpoint untuk mengambil detail pengajuan proposal oleh PPK
// Dioptimalkan dengan join langsung dan validasi fakultasId

import { eq, asc, and, desc } from "drizzle-orm";
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

    // Step 1: Ambil detail RAB, Pengaju, dan Ormawa sekaligus validasi akses fakultas
    const result = await db
      .select({
        rab: pengajuanRabTable,
        pengaju: {
          id: usersTable.id,
          fullName: usersTable.fullName,
          email: usersTable.email,
        },
        ormawa: {
          id: ormawaTable.id,
          nama: ormawaTable.nama,
          kode: ormawaTable.kode,
          totalAnggaran: ormawaTable.totalAnggaran,
        },
      })
      .from(pengajuanRabTable)
      .innerJoin(usersTable, eq(pengajuanRabTable.usersId, usersTable.id))
      .innerJoin(ormawaTable, eq(pengajuanRabTable.ormawaId, ormawaTable.id))
      .where(
        and(
          eq(pengajuanRabTable.id, id),
          eq(pengajuanRabTable.fakultasId, String(fakultasId)),
        ),
      )
      .limit(1);

    const detail = result[0];

    if (!detail) {
      throw createError({
        statusCode: 404,
        statusMessage:
          "Pengajuan tidak ditemukan atau Anda tidak memiliki akses ke fakultas ini",
      });
    }

    const { rab, pengaju, ormawa } = detail;

    // Step 2: Ambil riwayat approval
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
      .orderBy(desc(approvalLogTable.createdAt));

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
          id: pengaju.id,
          nama: pengaju.fullName,
          email: pengaju.email,
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
    console.error("Error GET /api/ppk/kegiatan/[id]:", error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Gagal mengambil detail pengajuan",
      data: error?.message || error,
    });
  }
});
