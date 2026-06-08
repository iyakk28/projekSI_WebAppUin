import { pengajuanRabTable } from "~~/server/db/schema";
import { useDrizzle } from "~~/server/db";
import { eq, sql } from "drizzle-orm";
import { usersTable } from "~~/server/db/schema";
export default defineEventHandler(async (event) => {
  const { page, row } = await readBody(event);

  // Ambil user dari middleware
  const user = event.context.user;

  if (!user) {
    throw createError({
      statusCode: 401,
      message: "Unauthorized",
    });
  }

  const db = useDrizzle();

  // Hitung offset
  const limit = Number(row) || 10;
  const offset = (Number(page) - 1) * limit;

  // Ambil data sesuai ormawaId user

  const data = await db
    .select({
      pengajuanRabTable,
      username: usersTable.fullName,
    })
    .from(pengajuanRabTable)
    .innerJoin(usersTable, eq(pengajuanRabTable.usersId, usersTable.id))
    .where(eq(pengajuanRabTable.ormawaId, String(user.ormawaId))) // Filter berdasarkan ormawaId
    .limit(limit) // Batas per halaman
    .offset(offset); // Lompatan halaman

  // Hitung total data ormawa
  const total = await db
    .select({ count: sql`COUNT(*)` })
    .from(pengajuanRabTable)
    .where(eq(pengajuanRabTable.ormawaId, String(user.ormawaId)));

  return {
    page,
    row,
    limit,
    offset,
    total: total[0]?.count ?? 0,
    data,
  };
});
