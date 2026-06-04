import { useDrizzle } from "~~/server/db/index";
import { usersTable } from "~~/server/db/schema/usersSchema";
import { fakultasTable } from "~~/server/db/schema/fakultasSchema";
import { programStudiTable } from "~~/server/db/schema/programStudiSchema";
import { ormawaTable } from "~~/server/db/schema/ormawaSchema";
import { eq, and, like, or, sql, desc } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const search = (query.search as string) || "";
    const role = (query.role as string) || "";
    const fakultasId = query.fakultasId ? parseInt(query.fakultasId as string) : null;
    const prodiId = query.prodiId ? parseInt(query.prodiId as string) : null;
    const ormawaId = query.ormawaId ? parseInt(query.ormawaId as string) : null;

    const db = useDrizzle();

    const whereConditions = [];

    if (search) {
      whereConditions.push(
        or(
          like(usersTable.fullName, `%${search}%`),
          like(usersTable.email, `%${search}%`),
          like(usersTable.users_id, `%${search}%`)
        )
      );
    }

    if (role && role !== "all") {
      whereConditions.push(eq(usersTable.role, role as any));
    }

    if (fakultasId) {
      whereConditions.push(eq(usersTable.fakultasId, fakultasId));
    }

    if (prodiId) {
      whereConditions.push(eq(usersTable.prodiId, prodiId));
    }

    if (ormawaId) {
      whereConditions.push(eq(usersTable.ormawaId, ormawaId));
    }

    const where = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(usersTable)
      .where(where);
    
    const total = totalResult[0]?.count || 0;

    // Get users
    const users = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        users_id: usersTable.users_id,
        fullName: usersTable.fullName,
        role: usersTable.role,
        isActive: usersTable.isActive,
        createdAt: usersTable.createdAt,
        fakultasName: fakultasTable.nama,
        prodiName: programStudiTable.nama,
        ormawaName: ormawaTable.nama,
      })
      .from(usersTable)
      .leftJoin(fakultasTable, eq(usersTable.fakultasId, fakultasTable.id))
      .leftJoin(programStudiTable, eq(usersTable.prodiId, programStudiTable.id))
      .leftJoin(ormawaTable, eq(usersTable.ormawaId, ormawaTable.id))
      .where(where)
      .orderBy(desc(usersTable.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      success: true,
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Gagal mengambil data user",
    };
  }
});
