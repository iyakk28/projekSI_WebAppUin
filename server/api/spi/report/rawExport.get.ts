import { useDrizzle } from "~~/server/db/index";
import { pengajuanRabTable } from "~~/server/db/schema/pengajuanRabSchema";
import { lpgTable } from "~~/server/db/schema/lpgSchema";
import { kegiatanTable } from "~~/server/db/schema/KegiatanSchema";
import { usersTable } from "~~/server/db/schema/usersSchema";
import { ormawaTable } from "~~/server/db/schema/ormawaSchema";
import { fakultasTable } from "~~/server/db/schema/fakultasSchema";
import { eq, and, sql, between, gte, lte } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const fakultasId = query.fakultasId ? parseInt(query.fakultasId as string) : null;
    const startDate = query.startDate as string;
    const endDate = query.endDate as string;

    const db = useDrizzle();

    const conditions = [];
    if (fakultasId) conditions.push(eq(pengajuanRabTable.fakultasId, fakultasId.toString()));
    if (startDate && endDate) {
      conditions.push(between(pengajuanRabTable.createdAt, new Date(startDate), new Date(endDate)));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db
      .select({
        nomorPengajuan: pengajuanRabTable.nomorPengajuan,
        judulKegiatan: pengajuanRabTable.judulKegiatan,
        ormawa: ormawaTable.nama,
        fakultas: fakultasTable.nama,
        totalAnggaran: pengajuanRabTable.totalAnggaran,
        statusRab: pengajuanRabTable.status,
        statusLpg: lpgTable.statusLpg,
        tanggalPengajuan: pengajuanRabTable.createdAt
      })
      .from(pengajuanRabTable)
      .leftJoin(usersTable, eq(sql`CAST(${pengajuanRabTable.usersId} AS UNSIGNED)`, usersTable.id))
      .leftJoin(ormawaTable, eq(usersTable.ormawaId, ormawaTable.id))
      .leftJoin(fakultasTable, eq(pengajuanRabTable.fakultasId, fakultasTable.id))
      .leftJoin(kegiatanTable, eq(pengajuanRabTable.id, kegiatanTable.pengajuanRabId))
      .leftJoin(lpgTable, eq(kegiatanTable.id, lpgTable.kegiatanId))
      .where(where)
      .orderBy(pengajuanRabTable.createdAt);

    return {
      success: true,
      data
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Gagal mengambil data export",
    };
  }
});
