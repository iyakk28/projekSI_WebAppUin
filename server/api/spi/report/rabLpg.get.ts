import { useDrizzle } from "~~/server/db/index";
import { pengajuanRabTable } from "~~/server/db/schema/pengajuanRabSchema";
import { lpgTable } from "~~/server/db/schema/lpgSchema";
import { kegiatanTable } from "~~/server/db/schema/KegiatanSchema";
import { approvalLogTable } from "~~/server/db/schema/approvalLogSchema";
import { usersTable } from "~~/server/db/schema/usersSchema";
import { ormawaTable } from "~~/server/db/schema/ormawaSchema";
import { fakultasTable } from "~~/server/db/schema/fakultasSchema";
import { programStudiTable } from "~~/server/db/schema/programStudiSchema";
import { eq, and, sql, between, gte, lte, count, like } from "drizzle-orm";

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

    // Base conditions for RAB
    const rabConditions = [];
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
    } else if (startDate) {
      rabConditions.push(gte(pengajuanRabTable.createdAt, new Date(startDate)));
    } else if (endDate) {
      rabConditions.push(lte(pengajuanRabTable.createdAt, new Date(endDate)));
    }

    if (ormawaId) {
      // Need to join with users to filter by ormawa
      rabConditions.push(eq(usersTable.ormawaId, ormawaId));
    }

    const rabWhere =
      rabConditions.length > 0 ? and(...rabConditions) : undefined;

    // Summary RAB by status
    const rabSummary = await db
      .select({
        status: pengajuanRabTable.status,
        count: sql<number>`count(*)`,
      })
      .from(pengajuanRabTable)
      .leftJoin(usersTable, eq(pengajuanRabTable.usersId, usersTable.users_id))
      .where(rabWhere)
      .groupBy(pengajuanRabTable.status);

    // Total Revisions
    const revisionCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(approvalLogTable)
      .innerJoin(
        pengajuanRabTable,
        eq(approvalLogTable.pengajuanRabId, pengajuanRabTable.id),
      )
      .leftJoin(usersTable, eq(pengajuanRabTable.usersId, usersTable.users_id))
      .where(and(rabWhere, like(approvalLogTable.action, "%revisi%")));

    // Summary LPG by status
    const lpgConditions = [];
    if (fakultasId) lpgConditions.push(eq(ormawaTable.fakultasId, fakultasId));
    if (prodiId) lpgConditions.push(eq(ormawaTable.prodiId, prodiId));
    if (ormawaId) lpgConditions.push(eq(ormawaTable.id, ormawaId));
    if (startDate && endDate) {
      lpgConditions.push(between(lpgTable.createdAt, startDate, endDate));
    }

    const lpgWhere =
      lpgConditions.length > 0 ? and(...lpgConditions) : undefined;

    const lpgSummary = await db
      .select({
        status: lpgTable.statusLpg,
        count: sql<number>`count(*)`,
      })
      .from(lpgTable)
      .innerJoin(kegiatanTable, eq(lpgTable.kegiatanId, kegiatanTable.id))
      .innerJoin(
        pengajuanRabTable,
        eq(kegiatanTable.pengajuanRabId, pengajuanRabTable.id),
      )
      .innerJoin(usersTable, eq(pengajuanRabTable.usersId, usersTable.users_id))
      .innerJoin(ormawaTable, eq(usersTable.ormawaId, ormawaTable.id))
      .where(lpgWhere)
      .groupBy(lpgTable.statusLpg);

    // Performance per unit (revisions vs approvals)
    const unitPerformance = await db
      .select({
        ormawaId: ormawaTable.id,
        ormawaName: ormawaTable.nama,
        totalRab: sql<number>`count(distinct ${pengajuanRabTable.id})`,
        approvedRab: sql<number>`count(distinct case when ${pengajuanRabTable.status} = 'disetujui' then ${pengajuanRabTable.id} end)`,
        rejectedRab: sql<number>`count(distinct case when ${pengajuanRabTable.status} = 'ditolak_spi' then ${pengajuanRabTable.id} end)`,
        revisions: sql<number>`count(${approvalLogTable.id})`,
      })
      .from(ormawaTable)
      .leftJoin(usersTable, eq(ormawaTable.id, usersTable.ormawaId))
      .leftJoin(
        pengajuanRabTable,
        eq(usersTable.users_id, pengajuanRabTable.usersId),
      )
      .leftJoin(
        approvalLogTable,
        and(
          eq(pengajuanRabTable.id, approvalLogTable.pengajuanRabId),
          like(approvalLogTable.action, "%revisi%"),
        ),
      )
      .where(lpgWhere)
      .groupBy(ormawaTable.id, ormawaTable.nama)
      .limit(20);

    return {
      success: true,
      data: {
        rabSummary: {
          waiting: rabSummary
            .filter((s) => s.status?.includes("waiting"))
            .reduce((a, b) => a + b.count, 0),
          approved: rabSummary
            .filter(
              (s) => s.status === "disetujui" || s.status === "selesai_spi",
            )
            .reduce((a, b) => a + b.count, 0),
          rejected: rabSummary
            .filter((s) => s.status === "ditolak_spi")
            .reduce((a, b) => a + b.count, 0),
          revision: rabSummary
            .filter((s) => s.status?.includes("revisi"))
            .reduce((a, b) => a + b.count, 0),
          totalRevisions: revisionCountResult[0]?.count || 0,
        },
        lpgSummary: {
          waiting: lpgSummary
            .filter((s) => s.status === "WAITING_SPI")
            .reduce((a, b) => a + b.count, 0),
          approved: lpgSummary
            .filter((s) => s.status === "DISETUJUI")
            .reduce((a, b) => a + b.count, 0),
          revision: lpgSummary
            .filter((s) => s.status === "REVISI_SPI")
            .reduce((a, b) => a + b.count, 0),
        },
        unitPerformance,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Gagal mengambil laporan RAB & LPG",
    };
  }
});
