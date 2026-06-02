import { useDrizzle } from "~~/server/db";
import { eq, desc, sql } from "drizzle-orm";
import { logDokumentasiTagihanTable } from "~~/server/db/schema/LogDokumentasiTagihanSchema";
import { usersTable } from "~~/server/db/schema/usersSchema";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { id, limit = 5, offset = 0 } = body;

  if (!id) {
    throw createError({ statusCode: 400, message: "ID wajib disertakan" });
  }

  const idStr = String(id);
  const isTagihan = idStr.startsWith("tagihan_");
  const realId = Number(idStr.replace("doc_", "").replace("tagihan_", ""));

  const db = useDrizzle();

  const whereClause = isTagihan
    ? eq(logDokumentasiTagihanTable.tagihanId, realId)
    : eq(logDokumentasiTagihanTable.dokumentasiId, realId);

  // Hitung total log
  const [totalCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(logDokumentasiTagihanTable)
    .where(whereClause);

  const total = Number(totalCount?.count || 0);

  const logs = await db
    .select({
      id: logDokumentasiTagihanTable.id,
      action: logDokumentasiTagihanTable.action,
      komentar: logDokumentasiTagihanTable.komentar,
      createdAt: logDokumentasiTagihanTable.createdAt,
      user: {
        fullname: usersTable.fullName,
        role: usersTable.role,
      },
    })
    .from(logDokumentasiTagihanTable)
    .innerJoin(usersTable, eq(logDokumentasiTagihanTable.userId, usersTable.id))
    .where(whereClause)
    .orderBy(desc(logDokumentasiTagihanTable.createdAt))
    .limit(Number(limit))
    .offset(Number(offset));

  return {
    success: true,
    data: logs,
    total,
    limit: Number(limit),
    offset: Number(offset),
    hasMore: Number(offset) + logs.length < total,
  };
});
