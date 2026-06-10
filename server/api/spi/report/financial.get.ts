import { useDrizzle } from "~~/server/db/index";
import { pengajuanRabTable } from "~~/server/db/schema/pengajuanRabSchema";
import { tagihanPencairanTable } from "~~/server/db/schema/TagihanPencairanSchema";
import { ormawaTable } from "~~/server/db/schema/ormawaSchema";
import { fakultasTable } from "~~/server/db/schema/fakultasSchema";
import { usersTable } from "~~/server/db/schema/usersSchema";
import { eq, and, sql, between, gte, lte } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const fakultasId = query.fakultasId
      ? parseInt(query.fakultasId as string)
      : null;
    const prodiId = query.prodiId ? parseInt(query.prodiId as string) : null;
    const ormawaId = query.ormawaId ? parseInt(query.ormawaId as string) : null;
    const startDate = query.startDate as string;
    const endDate = query.endDate as string;

    const db = useDrizzle();

    // Condition for Ormawa (Quota)
    const ormawaConditions = [];
    if (fakultasId)
      ormawaConditions.push(eq(ormawaTable.fakultasId, fakultasId));
    if (prodiId) ormawaConditions.push(eq(ormawaTable.prodiId, prodiId));
    if (ormawaId) ormawaConditions.push(eq(ormawaTable.id, ormawaId));
    const ormawaWhere =
      ormawaConditions.length > 0 ? and(...ormawaConditions) : undefined;

    // Total Quota
    const quotaResult = await db
      .select({ totalQuota: sql<number>`sum(${ormawaTable.totalAnggaran})` })
      .from(ormawaTable)
      .where(ormawaWhere);

    const totalQuota = quotaResult[0]?.totalQuota || 0;

    // Condition for RAB (Proposed)
    const rabConditions = [
      sql`${pengajuanRabTable.status} IN ('disetujui', 'lunas_ppk', 'selesai_spi')`,
    ];
    if (fakultasId)
      rabConditions.push(
        eq(pengajuanRabTable.fakultasId, fakultasId.toString()),
      );
    if (prodiId)
      rabConditions.push(eq(pengajuanRabTable.prodiId, prodiId.toString()));
    if (startDate && endDate) {
      rabConditions.push(
        between(
          pengajuanRabTable.createdAt,
          new Date(startDate),
          new Date(endDate),
        ),
      );
    }
    if (ormawaId) {
      rabConditions.push(eq(usersTable.ormawaId, ormawaId));
    }

    const rabWhere = and(...rabConditions);

    const proposedResult = await db
      .select({
        totalProposed: sql<number>`sum(${pengajuanRabTable.totalAnggaran})`,
      })
      .from(pengajuanRabTable)
      .leftJoin(usersTable, eq(pengajuanRabTable.usersId, usersTable.id))
      .where(rabWhere);

    const totalProposed = proposedResult[0]?.totalProposed || 0;

    // Condition for Realized (Disbursed)
    const realizedConditions = [
      eq(tagihanPencairanTable.statusTagihan, "SELESAI"),
    ];
    if (fakultasId)
      realizedConditions.push(
        eq(tagihanPencairanTable.fakultasId, fakultasId.toString()),
      );
    if (prodiId)
      realizedConditions.push(
        eq(tagihanPencairanTable.prodiId, prodiId.toString()),
      );
    if (startDate && endDate) {
      realizedConditions.push(
        between(tagihanPencairanTable.createdAt, startDate, endDate),
      );
    }

    const realizedWhere = and(...realizedConditions);

    const realizedResult = await db
      .select({
        totalRealized: sql<number>`sum(${tagihanPencairanTable.nominal})`,
      })
      .from(tagihanPencairanTable)
      .where(realizedWhere);

    const totalRealized = realizedResult[0]?.totalRealized || 0;

    // Breakdown per Ormawa
    const ormawaBreakdown = await db
      .select({
        ormawaId: ormawaTable.id,
        ormawaName: ormawaTable.nama,
        quota: ormawaTable.totalAnggaran,
        proposed: sql<number>`(
          select sum(r.total_anggaran) from pengajuan_rab r 
          join users u on r.users_id = u.id 
          where u.ormawa_id = ormawa.id 
          and r.status IN ('disetujui', 'lunas_ppk', 'selesai_spi')
        )`,
        realized: sql<number>`(
          select sum(t.nominal) from tagihan_pencairan t
          join kegiatan k on t.kegiatan_id = k.id
          join pengajuan_rab r on k.pengajuan_rab_id = r.id
          join users u on r.users_id = u.id
          where u.ormawa_id = ormawa.id
          and t.status_tagihan = 'SELESAI'
        )`,
      })
      .from(ormawaTable)
      .where(ormawaWhere)
      .limit(50);

    // Breakdown per Fakultas
    const fakultasBreakdown = await db
      .select({
        fakultasId: fakultasTable.id,
        fakultasName: fakultasTable.nama,
        quota: sql<number>`sum(${ormawaTable.totalAnggaran})`,
        proposed: sql<number>`(
          select sum(r.total_anggaran) from pengajuan_rab r 
          where r.fakultas_Id = fakultas.id 
          and r.status IN ('disetujui', 'lunas_ppk', 'selesai_spi')
        )`,
        realized: sql<number>`(
          select sum(t.nominal) from tagihan_pencairan t
          where t.fakultas_Id = fakultas.id
          and t.status_tagihan = 'SELESAI'
        )`,
      })
      .from(fakultasTable)
      .leftJoin(ormawaTable, eq(fakultasTable.id, ormawaTable.fakultasId))
      .groupBy(fakultasTable.id);

    return {
      success: true,
      data: {
        summary: {
          totalQuota,
          totalProposed,
          totalRealized,
          remaining: totalQuota - totalRealized,
        },
        ormawaBreakdown,
        fakultasBreakdown,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Gagal mengambil laporan keuangan",
    };
  }
});
