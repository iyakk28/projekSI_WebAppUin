// FILE: server/api/ppk/kegiatan/index.get.ts
// Endpoint untuk mengambil daftar pengajuan proposal di fakultas PPK
// Dioptimalkan dengan join langsung dan filter fakultasId

import { eq, desc, and, inArray, sql } from "drizzle-orm";
import { useDrizzle } from "~~/server/db";
import {
  pengajuanRabTable,
  usersTable,
  ormawaTable,
  kegiatanTable,
  tagihanPencairanTable,
} from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
  try {
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
      return {
        success: true,
        summary: {
          totalMasuk: 0,
          totalWaitingPPK: 0,
          totalRevisiPPK: 0,
          totalWaitingSPI: 0,
          totalSelesaiSPI: 0,
        },
        data: [],
      };
    }

    // Step 1: Ambil data pengajuan proposal joined dengan Info Pengaju & Ormawa
    // Filter berdasarkan fakultasId yang ada di tabel pengajuan_rab
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
        kegiatan: {
          id: kegiatanTable.id,
          statusKegiatan: kegiatanTable.statusKegiatan,
        },
      })
      .from(pengajuanRabTable)
      .innerJoin(usersTable, eq(pengajuanRabTable.usersId, usersTable.id))
      .innerJoin(ormawaTable, eq(pengajuanRabTable.ormawaId, ormawaTable.id))
      .leftJoin(
        kegiatanTable,
        eq(pengajuanRabTable.id, kegiatanTable.pengajuanRabId),
      )
      .where(
        and(
          eq(pengajuanRabTable.status, "waiting_ppk"),
          eq(pengajuanRabTable.fakultasId, String(fakultasId)),
        ),
      )
      .orderBy(desc(pengajuanRabTable.createdAt));

    if (rows.length === 0) {
      return {
        success: true,
        summary: {
          totalMasuk: 0,
          totalWaitingPPK: 0,
          totalRevisiPPK: 0,
          totalWaitingSPI: 0,
          totalSelesaiSPI: 0,
        },
        data: [],
      };
    }

    // Step 2: Ambil data tagihan pencairan untuk kegiatan yang ada
    const kegiatanIds = rows
      .map((r) => r.kegiatan?.id)
      .filter((id): id is number => id !== null);

    const tagihanRows = kegiatanIds.length
      ? await db
          .select({
            kegiatanId: tagihanPencairanTable.kegiatanId,
            statusTagihan: tagihanPencairanTable.statusTagihan,
            nominal: tagihanPencairanTable.nominal,
          })
          .from(tagihanPencairanTable)
          .where(inArray(tagihanPencairanTable.kegiatanId, kegiatanIds))
      : [];

    const tagihanMap = new Map<
      number,
      {
        total: number;
        selesai: number;
        nominalSelesai: number;
        statuses: Set<string>;
      }
    >();
    tagihanRows.forEach((t) => {
      const current = tagihanMap.get(t.kegiatanId) ?? {
        total: 0,
        selesai: 0,
        nominalSelesai: 0,
        statuses: new Set<string>(),
      };
      current.total++;
      if (t.statusTagihan) current.statuses.add(t.statusTagihan);
      if (t.statusTagihan === "SELESAI") {
        current.selesai++;
        current.nominalSelesai += Number(t.nominal ?? 0);
      }
      tagihanMap.set(t.kegiatanId, current);
    });

    // Step 3: Mapping hasil akhir dan hitung summary
    let totalWaitingPPK = 0;
    let totalRevisiPPK = 0;
    let totalWaitingSPI = 0;
    let totalSelesaiSPI = 0;

    const activityData = rows.map((row) => {
      const status = row.rab.status;
      if (status === "waiting_ppk") totalWaitingPPK++;
      if (status === "revisi_ppk") totalRevisiPPK++;
      if (status === "waiting_spi") totalWaitingSPI++;
      if (status === "selesai_spi") totalSelesaiSPI++;

      const tagihanInfo = row.kegiatan?.id
        ? tagihanMap.get(row.kegiatan.id)
        : null;

      return {
        id: row.rab.id,
        nomorPengajuan: row.rab.nomorPengajuan,
        judulKegiatan: row.rab.judulKegiatan,
        deskripsi: row.rab.deskripsi,
        totalAnggaran: Number(row.rab.totalAnggaran ?? 0),
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
        statusKegiatan: row.kegiatan?.statusKegiatan ?? null,
        pencairan: {
          totalTagihan: tagihanInfo?.total ?? 0,
          selesaiTagihan: tagihanInfo?.selesai ?? 0,
          nominalSelesai: tagihanInfo?.nominalSelesai ?? 0,
          statuses: Array.from(tagihanInfo?.statuses ?? []),
        },
      };
    });

    return {
      success: true,
      summary: {
        totalMasuk: activityData.length,
        totalWaitingPPK,
        totalRevisiPPK,
        totalWaitingSPI,
        totalSelesaiSPI,
      },
      data: activityData,
    };
  } catch (error: any) {
    console.error("Error GET /api/ppk/kegiatan:", error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Gagal mengambil data pengajuan kegiatan",
      data: error?.message || error,
    });
  }
});
