// FILE: server/api/ppk/pengajuan/[id]/full-detail.get.ts
// Mengambil detail lengkap pengajuan untuk PPK (RAB, TOR, Dokumentasi, Tagihan, Pembayaran)

import { eq, and, inArray, sql } from "drizzle-orm";
import { useDrizzle } from "~~/server/db";
import {
  pengajuanRabTable,
  kegiatanTable,
  ormawaTable,
  usersTable,
  dokumentasiKegiatanTable,
  tagihanPencairanTable,
  pembayaranTable,
} from "~~/server/db/schema";
import { showDekripsi } from "~~/server/utils/enkripsiData";

export default defineEventHandler(async (event) => {
  try {
    const db = useDrizzle();
    const { user } = event.context;
    const id = Number(getRouterParam(event, "id"));

    if (!user || user.role !== "ppk") {
      throw createError({
        statusCode: 403,
        statusMessage: "Akses ditolak. Peran PPK diperlukan.",
      });
    }

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: "ID pengajuan tidak valid.",
      });
    }

    // 1. Ambil Data Dasar RAB
    const rab = await db.query.pengajuanRabTable.findFirst({
      where: eq(pengajuanRabTable.id, id),
    });

    if (!rab) {
      throw createError({
        statusCode: 404,
        statusMessage: "Pengajuan tidak ditemukan.",
      });
    }

    // Validasi Fakultas
    if (String(rab.fakultasId) !== String(user.fakultasId)) {
      throw createError({
        statusCode: 403,
        statusMessage: "Akses ditolak. Pengajuan bukan dari fakultas Anda.",
      });
    }

    // 2. Ambil Kegiatan
    const kegiatan = await db.query.kegiatanTable.findFirst({
      where: eq(kegiatanTable.pengajuanRabId, id),
    });

    let dokumentasi: any[] = [];
    let processedTagihan: any[] = [];

    if (kegiatan) {
      // 3. Ambil Dokumentasi Foto Lapangan
      dokumentasi = await db
        .select()
        .from(dokumentasiKegiatanTable)
        .where(eq(dokumentasiKegiatanTable.kegiatanId, kegiatan.id));

      // 4. Ambil Tagihan beserta data Pembayaran dan Nama PPK yang membayar
      const tagihanWithPayment = await db
        .select({
          tagihan: tagihanPencairanTable,
          pembayaran: {
            id: pembayaranTable.id,
            tanggal: pembayaranTable.tanggalPembayaran,
            buktiUrl: pembayaranTable.buktiTransferUrl,
            catatan: pembayaranTable.catatanPembayaran,
            ppkNama: usersTable.fullName, // Nama PPK yang memproses
          },
        })
        .from(tagihanPencairanTable)
        .leftJoin(
          pembayaranTable,
          eq(tagihanPencairanTable.id, pembayaranTable.tagihanId),
        )
        .leftJoin(usersTable, eq(pembayaranTable.ppkId, usersTable.id)) // Join ke users untuk dapat nama PPK
        .where(eq(tagihanPencairanTable.kegiatanId, kegiatan.id));

      // Dekripsi dan Transformasi
      processedTagihan = tagihanWithPayment.map((item) => {
        const t = item.tagihan;
        const p = item.pembayaran;

        return {
          ...t,
          // Dekripsi Data Sensitif
          namaPenerima: showDekripsi(t.namaPenerima),
          rekeningPenerima: showDekripsi(t.rekeningPenerima),
          bankPenerima: showDekripsi(t.bankPenerima),

          skNomor: t.skNomor ? showDekripsi(t.skNomor) : null,
          spmtNomor: t.spmtNomor ? showDekripsi(t.spmtNomor) : null,
          amprahNomor: t.amprahNomor ? showDekripsi(t.amprahNomor) : null,
          npwpNomor: t.npwpNomor ? showDekripsi(t.npwpNomor) : null,
          ktpNomor: t.ktpNomor ? showDekripsi(t.ktpNomor) : null,

          nominal: Number(t.nominal),

          // Info Pembayaran Terintegrasi
          infoPembayaran: p?.id
            ? {
                ...p,
                // Pastikan link bukti bayar aman
                buktiUrl: p.buktiUrl
                  ? `/api/ppk/file/serve?path=${encodeURIComponent(p.buktiUrl)}`
                  : null,
              }
            : null,
        };
      });
    }

    // 5. Ambil info ormawa & pengaju asli
    const requesterInfo = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, Number(rab.usersId)),
    });

    let ormawaInfo = null;
    if (requesterInfo?.ormawaId) {
      ormawaInfo = await db.query.ormawaTable.findFirst({
        where: eq(ormawaTable.id, requesterInfo.ormawaId),
      });
    }

    return {
      success: true,
      data: {
        rab: {
          ...rab,
          totalAnggaran: Number(rab.totalAnggaran),
        },
        kegiatan,
        dokumentasi,
        tagihan: processedTagihan,
        ormawa: ormawaInfo,
        pengaju: {
          nama: requesterInfo?.fullName,
          email: requesterInfo?.email,
        },
      },
    };
  } catch (error: any) {
    console.error(
      `Error GET /api/ppk/pengajuan/${getRouterParam(event, "id")}/full-detail:`,
      error,
    );
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Gagal mengambil detail lengkap pengajuan",
      data: error?.message || error,
    });
  }
});
