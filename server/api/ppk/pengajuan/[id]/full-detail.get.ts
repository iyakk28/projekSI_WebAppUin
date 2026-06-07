// FILE: server/api/ppk/pengajuan/[id]/full-detail.get.ts
// Mengambil detail lengkap pengajuan untuk PPK (RAB, TOR, Dokumentasi, Tagihan)

import { eq, and, inArray } from "drizzle-orm";
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
    let pembayaran: any[] = [];

    if (kegiatan) {
      // 3. Ambil Dokumentasi
      dokumentasi = await db.select().from(dokumentasiKegiatanTable).where(eq(dokumentasiKegiatanTable.kegiatanId, kegiatan.id));

      // 4. Ambil Tagihan
      const tagihan = await db.select().from(tagihanPencairanTable).where(eq(tagihanPencairanTable.kegiatanId, kegiatan.id));

      if (tagihan.length > 0) {
        const tagihanIds = tagihan.map(t => t.id);
        
        // 5. Ambil Pembayaran
        pembayaran = await db.select().from(pembayaranTable).where(inArray(pembayaranTable.tagihanId, tagihanIds));

        // Dekripsi data sensitif di tagihan (Berdasarkan dokumentasiBarang & dokumentasiJasa)
        processedTagihan = tagihan.map(t => ({
          ...t,
          // Fields yang dienkripsi di kedua tipe
          namaPenerima: showDekripsi(t.namaPenerima),
          rekeningPenerima: showDekripsi(t.rekeningPenerima),
          bankPenerima: showDekripsi(t.bankPenerima),
          
          // Fields tambahan yang hanya ada/dienkripsi di tipe JASA
          skNomor: t.skNomor ? showDekripsi(t.skNomor) : null,
          spmtNomor: t.spmtNomor ? showDekripsi(t.spmtNomor) : null,
          amprahNomor: t.amprahNomor ? showDekripsi(t.amprahNomor) : null,
          npwpNomor: t.npwpNomor ? showDekripsi(t.npwpNomor) : null,
          ktpNomor: t.ktpNomor ? showDekripsi(t.ktpNomor) : null,
          
          nominal: Number(t.nominal)
        }));
      }
    }

    // 6. Ambil info ormawa & pengaju
    const userInfo = await db.query.usersTable.findFirst({
      where: eq(usersTable.users_id, rab.usersId),
    });

    let ormawaInfo = null;
    if (userInfo?.ormawaId) {
      ormawaInfo = await db.query.ormawaTable.findFirst({
        where: eq(ormawaTable.id, userInfo.ormawaId),
      });
    }

    return {
      success: true,
      data: {
        rab: {
          ...rab,
          totalAnggaran: Number(rab.totalAnggaran)
        },
        kegiatan,
        dokumentasi,
        tagihan: processedTagihan,
        pembayaran,
        ormawa: ormawaInfo,
        pengaju: {
          nama: userInfo?.fullName,
          email: userInfo?.email
        }
      }
    };
  } catch (error: any) {
    console.error(`Error GET /api/ppk/pengajuan/${getRouterParam(event, "id")}/full-detail:`, error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Gagal mengambil detail lengkap pengajuan",
    });
  }
});
