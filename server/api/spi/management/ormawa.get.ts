import { useDrizzle } from "~~/server/db/index";
import { ormawaTable } from "~~/server/db/schema/ormawaSchema";
import { fakultasTable } from "~~/server/db/schema/fakultasSchema";
import { programStudiTable } from "~~/server/db/schema/programStudiSchema";
import { eq, and, like, or, sql, desc, count } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const search = (query.search as string) || "";
    const fakultasId = query.fakultasId ? Number(query.fakultasId) : null;
    const prodiId = query.prodiId ? Number(query.prodiId) : null;

    const db = useDrizzle();

    const whereConditions = [];

    if (search) {
      whereConditions.push(
        or(
          like(ormawaTable.nama, `%${search}%`),
          like(ormawaTable.kode, `%${search}%`)
        )
      );
    }

    if (fakultasId) {
      whereConditions.push(eq(ormawaTable.fakultasId, fakultasId));
    }

    if (prodiId) {
      whereConditions.push(eq(ormawaTable.prodiId, prodiId));
    }

    const where = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get total count
    const [totalResult] = await db
      .select({ value: count() })
      .from(ormawaTable)
      .where(where);
    
    const total = totalResult?.value || 0;

    // Get ormawa
    const ormawa = await db
      .select({
        id: ormawaTable.id,
        nama: ormawaTable.nama,
        kode: ormawaTable.kode,
        totalAnggaran: ormawaTable.totalAnggaran,
        fakultasId: ormawaTable.fakultasId,
        prodiId: ormawaTable.prodiId,
        namaFakultas: fakultasTable.nama,
        namaProdi: programStudiTable.nama,
      })
      .from(ormawaTable)
      .leftJoin(fakultasTable, eq(ormawaTable.fakultasId, fakultasTable.id))
      .leftJoin(programStudiTable, eq(ormawaTable.prodiId, programStudiTable.id))
      .where(where)
      .orderBy(desc(ormawaTable.id))
      .limit(limit)
      .offset(offset);

    return {
      success: true,
      data: ormawa,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error: any) {
    console.error("Error fetching ormawa:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Gagal mengambil data ormawa",
    });
  }
});
