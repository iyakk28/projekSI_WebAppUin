import { and, desc, eq, inArray, or } from "drizzle-orm";
import { useDrizzle } from "~~/server/db";
import {
  auditLogTable,
  dokumentasiKegiatanTable,
  kegiatanTable,
  ormawaTable,
  pengajuanRabTable,
  tagihanPencairanTable,
  usersTable,
} from "~~/server/db/schema";
import { User } from "~~/server/interface/userInterface";

const TIPE_PENCAIRAN = ["BARANG", "JASA"] as const;

const normalizeText = (value?: string | null) => (value ?? "").trim();

const toPublicUploadUrl = (value?: string | null) => {
  if (!value) return null;
  const normalized = value.replace(/\\/g, "/");
  const uploadsIndex = normalized.toLowerCase().lastIndexOf("/uploads/");
  if (uploadsIndex >= 0) return normalized.slice(uploadsIndex);
  if (normalized.startsWith("uploads/")) return `/${normalized}`;
  if (normalized.startsWith("/uploads/")) return normalized;
  return normalized;
};

const makeVirtualId = (dokumentasiId: number) => -Math.abs(dokumentasiId);

const makeGroupId = (kegiatanId: number) => -(1_000_000 + Math.abs(kegiatanId));

const buildDocKey = (row: {
  kegiatanId: number;
  tipeTagihan: string;
  namaPenerima: string;
  rekeningPenerima: string;
}) =>
  [
    row.kegiatanId,
    row.tipeTagihan,
    normalizeText(row.namaPenerima).toLowerCase(),
    normalizeText(row.rekeningPenerima),
  ].join("|");

export default defineEventHandler(async (event) => {
  try {
    const db = useDrizzle();
    const user = event.context.user as User;

    const [ppkData] = await db
      .select({ fakultasId: usersTable.fakultasId })
      .from(usersTable)
      .where(eq(usersTable.id, Number(user.id)));

    if (!ppkData?.fakultasId) {
      throw createError({
        statusCode: 403,
        statusMessage: "PPK tidak memiliki data fakultas",
      });
    }

    const dokumentasiRows = await db
      .select({
        dokumentasiId: dokumentasiKegiatanTable.id,
        kegiatanId: dokumentasiKegiatanTable.kegiatanId,
        tipeDokumen: dokumentasiKegiatanTable.tipeDokumen,
        deskripsi: dokumentasiKegiatanTable.deskripsi,
        createdAt: dokumentasiKegiatanTable.createdAt,
        uploadedBy: dokumentasiKegiatanTable.uploadedBy,
        namaToko: dokumentasiKegiatanTable.namaToko,
        nomorRekeningToko: dokumentasiKegiatanTable.nomorRekeningToko,
        namaPemilikRekeningToko:
          dokumentasiKegiatanTable.namaPemilikRekeningToko,
        fotoBarangUrl: dokumentasiKegiatanTable.fotoBarangUrl,
        strukBelanjaUrl: dokumentasiKegiatanTable.strukBelanjaUrl,
        namaPenyediaJasa: dokumentasiKegiatanTable.namaPenyediaJasa,
        nomorRekeningJasa: dokumentasiKegiatanTable.nomorRekeningJasa,
        namaPemilikRekeningJasa:
          dokumentasiKegiatanTable.namaPemilikRekeningJasa,
        skUrl: dokumentasiKegiatanTable.skUrl,
        spmtUrl: dokumentasiKegiatanTable.spmtUrl,
        amprahUrl: dokumentasiKegiatanTable.amprahUrl,
        npwpUrl: dokumentasiKegiatanTable.npwpUrl,
        ktpUrl: dokumentasiKegiatanTable.ktpUrl,
        pengajuUsersId: usersTable.users_id,
        pengajuFakultasId: usersTable.fakultasId,
        ormawaId: ormawaTable.id,
        ormawaName: ormawaTable.nama,
        ormawaKode: ormawaTable.kode,
      })
      .from(dokumentasiKegiatanTable)
      .innerJoin(usersTable, eq(dokumentasiKegiatanTable.uploadedBy, usersTable.id))
      .leftJoin(ormawaTable, eq(usersTable.ormawaId, ormawaTable.id))
      .where(
        and(
          eq(usersTable.fakultasId, ppkData.fakultasId),
          or(
            eq(dokumentasiKegiatanTable.tipeDokumen, "BARANG"),
            eq(dokumentasiKegiatanTable.tipeDokumen, "JASA"),
          ),
        ),
      )
      .orderBy(desc(dokumentasiKegiatanTable.createdAt));

    if (dokumentasiRows.length === 0) {
      return {
        success: true,
        summary: {
          totalTagihan: 0,
          totalMenunggu: 0,
          totalTerverifikasi: 0,
          totalSelesai: 0,
          totalDikembalikan: 0,
        },
        data: [],
      };
    }

    const kegiatanIds = [...new Set(dokumentasiRows.map((row) => row.kegiatanId))];
    const dokumentasiIds = dokumentasiRows.map((row) => row.dokumentasiId);
    const pengajuIds = [
      ...new Set(dokumentasiRows.map((row) => row.pengajuUsersId)),
    ];

    const kegiatanRows = kegiatanIds.length
      ? await db
          .select({
            id: kegiatanTable.id,
            pengajuanRabId: kegiatanTable.pengajuanRabId,
            statusKegiatan: kegiatanTable.statusKegiatan,
          })
          .from(kegiatanTable)
          .where(inArray(kegiatanTable.id, kegiatanIds))
      : [];

    const kegiatanMap = new Map(kegiatanRows.map((row) => [row.id, row]));
    const pengajuanIds = kegiatanRows.map((row) => row.pengajuanRabId);

    const pengajuanRows = await db
      .select({
        id: pengajuanRabTable.id,
        usersId: pengajuanRabTable.usersId,
        judulKegiatan: pengajuanRabTable.judulKegiatan,
        totalAnggaran: pengajuanRabTable.totalAnggaran,
        tanggalMulai: pengajuanRabTable.tanggalMulai,
        tanggalSelesai: pengajuanRabTable.tanggalSelesai,
        status: pengajuanRabTable.status,
        createdAt: pengajuanRabTable.createdAt,
      })
      .from(pengajuanRabTable)
      .where(
        pengajuanIds.length
          ? or(
              inArray(pengajuanRabTable.id, pengajuanIds),
              inArray(pengajuanRabTable.usersId, pengajuIds),
            )
          : inArray(pengajuanRabTable.usersId, pengajuIds),
      )
      .orderBy(desc(pengajuanRabTable.createdAt));

    const pengajuanById = new Map(pengajuanRows.map((row) => [row.id, row]));
    const fallbackPengajuanByUser = new Map<string, (typeof pengajuanRows)[number]>();
    for (const row of pengajuanRows) {
      if (!fallbackPengajuanByUser.has(row.usersId)) {
        fallbackPengajuanByUser.set(row.usersId, row);
      }
    }

    const tagihanRows = kegiatanIds.length
      ? await db
          .select({
            tagihanId: tagihanPencairanTable.id,
            kegiatanId: tagihanPencairanTable.kegiatanId,
            tipeTagihan: tagihanPencairanTable.tipeTagihan,
            namaPenerima: tagihanPencairanTable.namaPenerima,
            rekeningPenerima: tagihanPencairanTable.rekeningPenerima,
            bankPenerima: tagihanPencairanTable.bankPenerima,
            nominal: tagihanPencairanTable.nominal,
            statusTagihan: tagihanPencairanTable.statusTagihan,
            createdAt: tagihanPencairanTable.createdAt,
            tokoNama: tagihanPencairanTable.tokoNama,
            strukFileUrl: tagihanPencairanTable.strukFileUrl,
            skNomor: tagihanPencairanTable.skNomor,
            skFileUrl: tagihanPencairanTable.skFileUrl,
          })
          .from(tagihanPencairanTable)
          .where(inArray(tagihanPencairanTable.kegiatanId, kegiatanIds))
      : [];

    const tagihanMap = new Map<string, (typeof tagihanRows)[number]>();
    for (const row of tagihanRows) {
      tagihanMap.set(
        buildDocKey({
          kegiatanId: row.kegiatanId,
          tipeTagihan: row.tipeTagihan,
          namaPenerima: row.namaPenerima,
          rekeningPenerima: row.rekeningPenerima,
        }),
        row,
      );
    }

    const revisiRows = dokumentasiIds.length
      ? await db
          .select({
            recordId: auditLogTable.recordId,
            createdAt: auditLogTable.createdAt,
          })
          .from(auditLogTable)
          .where(
            and(
              eq(auditLogTable.tableName, "dokumentasi_kegiatan"),
              eq(auditLogTable.action, "REVISI_PENCAIRAN"),
              inArray(auditLogTable.recordId, dokumentasiIds),
            ),
          )
          .orderBy(desc(auditLogTable.createdAt))
      : [];

    const revisiMap = new Map<number, (typeof revisiRows)[number]>();
    for (const row of revisiRows) {
      if (!revisiMap.has(row.recordId)) {
        revisiMap.set(row.recordId, row);
      }
    }

    const data = dokumentasiRows
      .filter((row) =>
        (TIPE_PENCAIRAN as readonly string[]).includes(row.tipeDokumen),
      )
      .map((row) => {
        const tipeTagihan = row.tipeDokumen;
        const namaPenerima =
          tipeTagihan === "BARANG"
            ? normalizeText(row.namaPemilikRekeningToko || row.namaToko)
            : normalizeText(row.namaPemilikRekeningJasa || row.namaPenyediaJasa);
        const rekeningPenerima =
          tipeTagihan === "BARANG"
            ? normalizeText(row.nomorRekeningToko)
            : normalizeText(row.nomorRekeningJasa);
        const tagihan = tagihanMap.get(
          buildDocKey({
            kegiatanId: row.kegiatanId,
            tipeTagihan,
            namaPenerima,
            rekeningPenerima,
          }),
        );
        const kegiatan = kegiatanMap.get(row.kegiatanId);
        const pengajuan =
          (kegiatan ? pengajuanById.get(kegiatan.pengajuanRabId) : null) ??
          fallbackPengajuanByUser.get(row.pengajuUsersId);

        return {
          id: tagihan?.tagihanId ?? makeVirtualId(row.dokumentasiId),
          dokumentasiId: row.dokumentasiId,
          source: tagihan ? "TAGIHAN" : "DOKUMENTASI",
          tipeTagihan,
          namaPenerima,
          nominal: tagihan?.nominal ?? pengajuan?.totalAnggaran ?? 0,
          statusTagihan:
            tagihan?.statusTagihan ??
            (revisiMap.has(row.dokumentasiId)
              ? "DIKEMBALIKAN"
              : "WAITING_PEMBAYARAN"),
          rekeningPenerima,
          bankPenerima: tagihan?.bankPenerima ?? null,
          createdAt: tagihan?.createdAt ?? row.createdAt,
          ...(tipeTagihan === "BARANG"
            ? {
                tokoNama: row.namaToko,
                strukFileUrl: row.strukBelanjaUrl,
              }
            : {
                skNomor: tagihan?.skNomor ?? null,
                skFileUrl: row.skUrl,
              }),
          syaratDokumen:
            tipeTagihan === "BARANG"
              ? [
                  {
                    id: "foto_barang",
                    nama: "Foto Barang",
                    uploaded: Boolean(row.fotoBarangUrl),
                    url: toPublicUploadUrl(row.fotoBarangUrl),
                  },
                  {
                    id: "struk_belanja",
                    nama: "Bon pembelian (struk)",
                    uploaded: Boolean(row.strukBelanjaUrl),
                    url: toPublicUploadUrl(row.strukBelanjaUrl),
                  },
                  {
                    id: "nama_toko",
                    nama: "Nama Toko",
                    uploaded: Boolean(row.namaToko),
                    url: null,
                  },
                  {
                    id: "rekening_toko",
                    nama: "No. Rekening Toko",
                    uploaded: Boolean(row.nomorRekeningToko),
                    url: null,
                  },
                ]
              : [
                  {
                    id: "sk",
                    nama: "SK (Surat Keputusan)",
                    uploaded: Boolean(row.skUrl),
                    url: toPublicUploadUrl(row.skUrl),
                  },
                  {
                    id: "spmt",
                    nama: "SPMT",
                    uploaded: Boolean(row.spmtUrl),
                    url: toPublicUploadUrl(row.spmtUrl),
                  },
                  {
                    id: "amprah",
                    nama: "Amprah",
                    uploaded: Boolean(row.amprahUrl),
                    url: toPublicUploadUrl(row.amprahUrl),
                  },
                  {
                    id: "npwp",
                    nama: "NPWP (jika PNS)",
                    uploaded: Boolean(row.npwpUrl),
                    url: toPublicUploadUrl(row.npwpUrl),
                  },
                  {
                    id: "ktp",
                    nama: "Foto KTP / tanda pengenal",
                    uploaded: Boolean(row.ktpUrl),
                    url: toPublicUploadUrl(row.ktpUrl),
                  },
                  {
                    id: "rekening_penerima",
                    nama: "No. Rekening Penerima",
                    uploaded: Boolean(row.nomorRekeningJasa),
                    url: null,
                  },
                ],
          dokumenUpload:
            tipeTagihan === "BARANG"
              ? [
                  {
                    id: "foto_barang",
                    nama: "Foto Barang",
                    url: toPublicUploadUrl(row.fotoBarangUrl),
                    uploaded: Boolean(row.fotoBarangUrl),
                  },
                  {
                    id: "struk_belanja",
                    nama: "Foto Bon / Struk",
                    url: toPublicUploadUrl(row.strukBelanjaUrl),
                    uploaded: Boolean(row.strukBelanjaUrl),
                  },
                ]
              : [
                  {
                    id: "sk",
                    nama: "SK",
                    url: toPublicUploadUrl(row.skUrl),
                    uploaded: Boolean(row.skUrl),
                  },
                  {
                    id: "spmt",
                    nama: "SPMT",
                    url: toPublicUploadUrl(row.spmtUrl),
                    uploaded: Boolean(row.spmtUrl),
                  },
                  {
                    id: "amprah",
                    nama: "Amprah",
                    url: toPublicUploadUrl(row.amprahUrl),
                    uploaded: Boolean(row.amprahUrl),
                  },
                  {
                    id: "npwp",
                    nama: "NPWP",
                    url: toPublicUploadUrl(row.npwpUrl),
                    uploaded: Boolean(row.npwpUrl),
                  },
                  {
                    id: "ktp",
                    nama: "Foto KTP",
                    url: toPublicUploadUrl(row.ktpUrl),
                    uploaded: Boolean(row.ktpUrl),
                  },
                ],
          detailPenerima:
            tipeTagihan === "BARANG"
              ? {
                  namaItem: row.namaToko,
                  namaToko: row.namaToko,
                  nomorRekening: row.nomorRekeningToko,
                  namaPemilikRekening: row.namaPemilikRekeningToko,
                }
              : {
                  namaItem: row.namaPenyediaJasa,
                  namaPenyediaJasa: row.namaPenyediaJasa,
                  nomorRekening: row.nomorRekeningJasa,
                  namaPemilikRekening: row.namaPemilikRekeningJasa,
                },
          kegiatan: {
            id: row.kegiatanId,
            judulKegiatan: pengajuan?.judulKegiatan ?? row.deskripsi,
            statusKegiatan: kegiatan?.statusKegiatan ?? "SELESAI",
            tanggalMulai: pengajuan?.tanggalMulai ?? null,
            tanggalSelesai: pengajuan?.tanggalSelesai ?? null,
            totalAnggaranRab: pengajuan?.totalAnggaran ?? 0,
          },
          ormawa: {
            id: row.ormawaId,
            nama: row.ormawaName,
            kode: row.ormawaKode,
          },
        };
      });

    const groupedData = new Map<number, (typeof data)[number] & {
      tipeTagihanList: string[];
      uploadLogs: Array<{
        dokumentasiId: number;
        tipeDokumen: string;
        createdAt: string;
      }>;
    }>();

    for (const item of data) {
      const kegiatanId = item.kegiatan.id;
      const current = groupedData.get(kegiatanId);
      if (!current) {
        groupedData.set(kegiatanId, {
          ...item,
          id: makeGroupId(kegiatanId),
          tipeTagihan: item.tipeTagihan,
          tipeTagihanList: [item.tipeTagihan],
          dokumenUpload: [...item.dokumenUpload],
          syaratDokumen: [...item.syaratDokumen],
          uploadLogs: [
            {
              dokumentasiId: item.dokumentasiId,
              tipeDokumen: item.tipeTagihan,
              createdAt: item.createdAt,
            },
          ],
        });
        continue;
      }

      current.tipeTagihanList = Array.from(
        new Set([...current.tipeTagihanList, item.tipeTagihan]),
      );
      current.tipeTagihan = current.tipeTagihanList.join(", ");
      current.dokumenUpload.push(...item.dokumenUpload);
      current.syaratDokumen.push(...item.syaratDokumen);
      current.uploadLogs.push({
        dokumentasiId: item.dokumentasiId,
        tipeDokumen: item.tipeTagihan,
        createdAt: item.createdAt,
      });

      if (item.statusTagihan === "DIKEMBALIKAN") {
        current.statusTagihan = "DIKEMBALIKAN";
      }
    }

    const grouped = Array.from(groupedData.values())
      .map((row) => ({
        ...row,
        kegiatanId: row.kegiatan.id,
        jumlahUpload: row.uploadLogs?.length ?? 1,
        namaKegiatan: row.kegiatan.judulKegiatan,
        namaOrmawa: row.ormawa?.nama,
        kodeOrmawa: row.ormawa?.kode,
      }))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

    return {
      success: true,
      summary: {
        totalTagihan: grouped.length,
        totalMenunggu: grouped.filter((row) =>
          ["WAITING_PEMBAYARAN", "DIKEMBALIKAN"].includes(row.statusTagihan),
        ).length,
        totalTerverifikasi: grouped.filter((row) =>
          ["DOKUMEN_LENGKAP", "TERVERIFIKASI"].includes(row.statusTagihan),
        ).length,
        totalSelesai: grouped.filter((row) => row.statusTagihan === "SELESAI").length,
        totalDikembalikan: grouped.filter((row) => row.statusTagihan === "DIKEMBALIKAN").length,
      },
      data: grouped,
    };
  } catch (error: any) {
    console.error("Error GET /api/ppk/pencairan:", error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Gagal mengambil data pencairan",
      data: error,
    });
  }
});
