import { defineEventHandler, readBody, createError } from "h3";
import { useDrizzle } from "../../../db/index";
import { eq, desc } from "drizzle-orm";
import { showDekripsi } from "../../../utils/enkripsiData";
import {
  pengajuanRabTable,
  kegiatanTable,
  lpgTable,
  dokumentasiKegiatanTable,
  tagihanPencairanTable,
  pembayaranTable,
  approvalLogTable,
  revisiLpgLogTable,
  usersTable,
} from "../../../db/schema/index";

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user || user.role !== "spi") {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const body = await readBody(event);
  const { rabId } = body;

  if (!rabId) {
    throw createError({ statusCode: 400, message: "RAB ID wajib diisi" });
  }

  const db = useDrizzle();

  try {
    // 1. Fetch RAB Detail
    const rab = await db.query.pengajuanRabTable.findFirst({
      where: eq(pengajuanRabTable.id, Number(rabId)),
    });

    if (!rab) {
      throw createError({ statusCode: 404, message: "RAB tidak ditemukan" });
    }

    // 2. Fetch linked kegiatan
    const kegiatan = await db.query.kegiatanTable.findFirst({
      where: eq(kegiatanTable.pengajuanRabId, Number(rabId)),
    });

    let lpg = null;
    let documentationList: any[] = [];
    let paymentProofs: any[] = [];
    let lpgLogs: any[] = [];

    if (kegiatan) {
      // 3. Fetch LPG
      lpg = await db.query.lpgTable.findFirst({
        where: eq(lpgTable.kegiatanId, kegiatan.id),
      });

      if (lpg) {
        // Fetch LPG logs
        lpgLogs = await db
          .select({
            id: revisiLpgLogTable.id,
            catatanRevisi: revisiLpgLogTable.catatanRevisi,
            createdAt: revisiLpgLogTable.createdAt,
            actor: {
              fullName: usersTable.fullName,
              role: usersTable.role,
            },
          })
          .from(revisiLpgLogTable)
          .innerJoin(usersTable, eq(revisiLpgLogTable.requesterId, usersTable.id))
          .where(eq(revisiLpgLogTable.lpgId, lpg.id))
          .orderBy(desc(revisiLpgLogTable.createdAt));
      }

      // 4. Fetch General Documentation
      const docs = await db.query.dokumentasiKegiatanTable.findMany({
        where: eq(dokumentasiKegiatanTable.kegiatanId, kegiatan.id),
        orderBy: [desc(dokumentasiKegiatanTable.createdAt)],
      });

      // 5. Fetch Tagihan Documentation
      let tagihan = await db.query.tagihanPencairanTable.findMany({
        where: eq(tagihanPencairanTable.kegiatanId, kegiatan.id),
        orderBy: [desc(tagihanPencairanTable.createdAt)],
      });

      // Decrypt sensitive fields for Tagihan
      tagihan = tagihan.map((t) => ({
        ...t,
        skNomor: t.skNomor ? showDekripsi(t.skNomor) : t.skNomor,
        spmtNomor: t.spmtNomor ? showDekripsi(t.spmtNomor) : t.spmtNomor,
        amprahNomor: t.amprahNomor ? showDekripsi(t.amprahNomor) : t.amprahNomor,
        npwpNomor: t.npwpNomor ? showDekripsi(t.npwpNomor) : t.npwpNomor,
        ktpNomor: t.ktpNomor ? showDekripsi(t.ktpNomor) : t.ktpNomor,
        namaPenerima: t.namaPenerima ? showDekripsi(t.namaPenerima) : t.namaPenerima,
        bankPenerima: t.bankPenerima ? showDekripsi(t.bankPenerima) : t.bankPenerima,
        rekeningPenerima: t.rekeningPenerima ? showDekripsi(t.rekeningPenerima) : t.rekeningPenerima,
      }));

      // 6. Fetch Payments for these Tagihan
      const tagihanIds = tagihan.map((t) => t.id);
      if (tagihanIds.length > 0) {
        paymentProofs = await db.query.pembayaranTable.findMany({
          where: (p, { inArray }) => inArray(p.tagihanId, tagihanIds),
        });
      }

      // Merge and normalize documentation list
      documentationList = [
        ...docs.map((d) => ({
          ...d,
          tipeData: "DOKUMENTASI",
          realId: d.id,
        })),
        ...tagihan.map((t) => ({
          ...t,
          tipeData: "TAGIHAN",
          realId: t.id,
          status: t.statusTagihan, // Normalize status field
          tipeDokumen: t.tipeTagihan, // Normalize tipe field
        })),
      ];
    }

    // 7. Fetch RAB Approval Logs
    const rabLogs = await db
      .select({
        id: approvalLogTable.id,
        action: approvalLogTable.action,
        catatanRevisi: approvalLogTable.catatanRevisi,
        createdAt: approvalLogTable.createdAt,
        actor: {
          fullName: usersTable.fullName,
          role: usersTable.role,
        },
      })
      .from(approvalLogTable)
      .innerJoin(usersTable, eq(approvalLogTable.actorId, usersTable.id))
      .where(eq(approvalLogTable.pengajuanRabId, Number(rabId)))
      .orderBy(desc(approvalLogTable.createdAt));

    return {
      success: true,
      data: {
        rab,
        kegiatan,
        lpg,
        rabLogs,
        lpgLogs,
        documentationList,
        paymentProofs,
      },
    };
  } catch (error: any) {
    console.error("Error fetching Komprehensif Report detail:", error);
    throw createError({
      statusCode: 500,
      message: "Terjadi kesalahan server saat mengambil detail laporan: " + error.message,
    });
  }
});
