// FILE: server/api/kaprodi/kegiatan/index.get.ts
// Endpoint untuk mengambil seluruh daftar pengajuan proposal milik Ormawa binaan Kaprodi
// Dioptimalkan dengan filter ormawaId langsung dan Join satu kali jalan

import { eq, desc, and, ne } from "drizzle-orm";
import { useDrizzle } from "~~/server/db";
import {
  pengajuanRabTable,
  usersTable,
  ormawaTable,
} from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
  try {
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
      return {
        success: true,
        summary: {
          totalMasuk: 0,
          totalWaitingKaprodi: 0,
          totalRevisiKaprodi: 0,
        },
        data: [],
      };
    }

    // Step 1: Ambil data pengajuan proposal (selain draft) joined dengan Info Pengaju & Ormawa
    const rows = await db
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
        },
      })
      .from(pengajuanRabTable)
      .innerJoin(usersTable, eq(pengajuanRabTable.usersId, usersTable.id))
      .innerJoin(ormawaTable, eq(pengajuanRabTable.ormawaId, ormawaTable.id))
      .where(
        and(
          ne(pengajuanRabTable.status, "draft"),
          eq(ormawaTable.prodiId, Number(prodiId))
        )
      )
      .orderBy(desc(pengajuanRabTable.createdAt));

    // Hitung summary dari data yang didapat
    const totalMasuk = rows.length;
    const totalWaitingKaprodi = rows.filter(
      (r) => r.rab.status === "waiting_kaprodi",
    ).length;
    const totalRevisiKaprodi = rows.filter(
      (r) => r.rab.status === "revisi_kaprodi",
    ).length;

    // Transform data untuk response
    const transformedData = rows.map((row) => ({
      id: row.rab.id,
      nomorPengajuan: row.rab.nomorPengajuan,
      judulKegiatan: row.rab.judulKegiatan,
      deskripsi: row.rab.deskripsi,
      totalAnggaran: row.rab.totalAnggaran,
      tanggalMulai: row.rab.tanggalMulai,
      tanggalSelesai: row.rab.tanggalSelesai,
      status: row.rab.status,
      fileRabUrl: row.rab.fileRabUrl,
      fileTorUrl: row.rab.fileTorUrl,
      createdAt: row.rab.createdAt,
      updatedAt: row.rab.updatedAt,
      pengaju: {
        id: row.pengaju.id,
        nama: row.pengaju.fullName,
        email: row.pengaju.email,
      },
      ormawa: {
        id: row.ormawa.id,
        nama: row.ormawa.nama,
        kode: row.ormawa.kode,
      },
    }));

    return {
      success: true,
      summary: {
        totalMasuk,
        totalWaitingKaprodi,
        totalRevisiKaprodi,
      },
      data: transformedData,
    };
  } catch (error: any) {
    console.error("Error GET /api/kaprodi/kegiatan:", error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Gagal mengambil data pengajuan kegiatan",
      data: error,
    });
  }
});
