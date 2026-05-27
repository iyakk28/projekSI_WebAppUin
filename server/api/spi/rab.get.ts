import { useDrizzle } from "~~/server/db/index";
import { pengajuanRabTable, usersTable } from "~~/server/db/schema/index";
import { eq, or, and, sql } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  try {
    const db = useDrizzle();
    const query = getQuery(event);
    const status = query.status as string;
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const offset = (page - 1) * limit;

    let whereClause;
    if (status === 'waiting_spi') {
      whereClause = eq(pengajuanRabTable.status, 'waiting_spi');
    } else if (status === 'disetujui') {
      whereClause = eq(pengajuanRabTable.status, 'disetujui');
    } else {
      whereClause = or(
        eq(pengajuanRabTable.status, 'waiting_spi'),
        eq(pengajuanRabTable.status, 'disetujui')
      );
    }

    // Get total count
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(pengajuanRabTable)
      .where(whereClause);
    
    const total = totalCountResult[0].count;

    const data = await db
      .select({
        id: pengajuanRabTable.id,
        nomorPengajuan: pengajuanRabTable.nomorPengajuan,
        judulKegiatan: pengajuanRabTable.judulKegiatan,
        totalAnggaran: pengajuanRabTable.totalAnggaran,
        status: pengajuanRabTable.status,
        createdAt: pengajuanRabTable.createdAt,
        pengaju: usersTable.fullName,
      })
      .from(pengajuanRabTable)
      .leftJoin(usersTable, eq(pengajuanRabTable.usersId, usersTable.users_id))
      .where(whereClause)
      .limit(limit)
      .offset(offset);

    return {
      success: true,
      data,
      total,
      page,
      limit,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Gagal mengambil data RAB",
    };
  }
});
