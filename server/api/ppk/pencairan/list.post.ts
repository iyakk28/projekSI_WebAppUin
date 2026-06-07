import { and, desc, eq, or, sql, max } from "drizzle-orm";
import { useDrizzle } from "~~/server/db";
import {
  dokumentasiKegiatanTable,
  kegiatanTable,
  ormawaTable,
  pengajuanRabTable,
  tagihanPencairanTable,
  usersTable,
} from "~~/server/db/schema";
import { User } from "~~/server/interface/userInterface";

export default defineEventHandler(async (event) => {
  try {
    const db = useDrizzle();
    const user = event.context.user as User;
    const body = await readBody(event);
    const filterStatus = body.status || "ALL";

    // Ambil data fakultas PPK
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

    // Build condition for status
    let statusCondition = or(
      eq(kegiatanTable.statusKegiatan, "SELESAI"),
      eq(kegiatanTable.statusKegiatan, "LUNAS"),
    );

    if (filterStatus === "SELESAI") {
      statusCondition = eq(kegiatanTable.statusKegiatan, "SELESAI");
    } else if (filterStatus === "LUNAS") {
      statusCondition = eq(kegiatanTable.statusKegiatan, "LUNAS");
    }

    // Ambil kegiatan
    const activities = await db
      .select({
        id: kegiatanTable.id,
        statusKegiatan: kegiatanTable.statusKegiatan,
        judulKegiatan: pengajuanRabTable.judulKegiatan,
        ormawaName: ormawaTable.nama,
        ormawaKode: ormawaTable.kode,
        pengajuNama: usersTable.fullName,
        createdAt: kegiatanTable.createdAt,
      })
      .from(kegiatanTable)
      .innerJoin(
        pengajuanRabTable,
        eq(kegiatanTable.pengajuanRabId, pengajuanRabTable.id),
      )
      .innerJoin(usersTable, eq(pengajuanRabTable.usersId, usersTable.id))
      .innerJoin(ormawaTable, eq(usersTable.ormawaId, ormawaTable.id))
      .where(
        and(eq(usersTable.fakultasId, ppkData.fakultasId), statusCondition),
      )
      .orderBy(desc(kegiatanTable.createdAt));

    // Get document counts and latest upload date for each activity
    const result = await Promise.all(
      activities.map(async (act) => {
        const tagihans = await db
          .select({
            id: tagihanPencairanTable.id,
            createdAt: tagihanPencairanTable.createdAt,
          })
          .from(tagihanPencairanTable)
          .where(eq(tagihanPencairanTable.kegiatanId, act.id));

        const docs = await db
          .select({
            id: dokumentasiKegiatanTable.id,
            createdAt: dokumentasiKegiatanTable.createdAt,
          })
          .from(dokumentasiKegiatanTable)
          .where(eq(dokumentasiKegiatanTable.kegiatanId, act.id));

        // Calculate latest upload date
        const allDates = [
          ...tagihans.map((t) => t.createdAt),
          ...docs.map((d) => d.createdAt),
        ];
        const latestUpload =
          allDates.length > 0
            ? new Date(
                Math.max(...allDates.map((d) => new Date(d).getTime())),
              ).toISOString()
            : act.createdAt;

        return {
          ...act,
          latestUpload,
          docCounts: {
            foto: docs.length,
            tagihan: tagihans.length,
          },
          docDescription: `${docs.length} dokumentasi foto dan ${tagihans.length} tagihan`,
        };
      }),
    );
    console.log(result);
    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    console.error("Error POST /api/ppk/pencairan/list:", error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Gagal mengambil data pencairan",
    });
  }
});
