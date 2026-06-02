// FILE: server/api/ppk/kegiatan/[id]/index.get.ts
//
// Pola mengikuti detailRab.post.ts milik ormawa:
// - Cari RAB by id
// - Validasi kepemilikan: ormawa pakai eq(usersId, user.id)
//   PPK validasi: cek apakah usersId pengajuan masuk daftar ormawaUserIds se-fakultas

import { eq, asc, inArray, and } from "drizzle-orm";
import { useDrizzle } from "~~/server/db";
import {
  pengajuanRabTable,
  usersTable,
  ormawaTable,
  approvalLogTable,
} from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
  try {
    const id = Number(getRouterParam(event, "id"));
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "ID pengajuan tidak valid",
      });
    }

    const db = useDrizzle();
    const { user } = event.context;

    const fakultasId = user.fakultasId;

    if (!fakultasId) {
      throw createError({
        statusCode: 403,
        statusMessage: "PPK tidak memiliki fakultas yang valid",
      });
    }

    // Query bertahap — pola sama seperti ormawa, tidak pakai join untuk filter
    // Step 1-3: dapat ormawaUserIds (sama seperti di index.get.ts)
    const kaprodiList = await db
      .select({ prodiId: usersTable.prodiId })
      .from(usersTable)
      .where(
        and(
          eq(usersTable.role, "kaprodi"),
          eq(usersTable.fakultasId, fakultasId),
        ),
      );

    const prodiIds = kaprodiList
      .map((k) => k.prodiId)
      .filter((id): id is number => id !== null);

    if (prodiIds.length > 0) {
      const ormawaRows = await db
        .select({ id: ormawaTable.id })
        .from(ormawaTable)
        .where(inArray(ormawaTable.prodiId, prodiIds));

      const ormawaIds = ormawaRows.map((o) => o.id);

      if (ormawaIds.length > 0) {
        const ormawaUsers = await db
          .select({ usersId: usersTable.users_id })
          .from(usersTable)
          .where(inArray(usersTable.ormawaId, ormawaIds));

        const ormawaUserIds = ormawaUsers.map((u) => u.usersId);

        // Cek akses sebelum ambil detail — persis seperti detailRab.post.ts ormawa
        // yang cek eq(usersId, user.id), PPK cek apakah ada di list
        const aksesValid = await db.query.pengajuanRabTable.findFirst({
          where: and(
            eq(pengajuanRabTable.id, id),
            inArray(pengajuanRabTable.usersId, ormawaUserIds),
          ),
        });

        if (!aksesValid) {
          throw createError({
            statusCode: 403,
            statusMessage: "Anda tidak memiliki akses ke pengajuan ini",
          });
        }
      }
    }

    // Ambil detail RAB — sama seperti detailRab.post.ts ormawa
    const rab = await db.query.pengajuanRabTable.findFirst({
      where: eq(pengajuanRabTable.id, id),
    });

    if (!rab) {
      throw createError({
        statusCode: 404,
        statusMessage: "Pengajuan tidak ditemukan",
      });
    }

    // Ambil info pengaju dan ormawa
    const pengajuInfo = await db.query.usersTable.findFirst({
      where: eq(usersTable.users_id, rab.usersId),
    });

    const ormawaInfo = pengajuInfo?.ormawaId
      ? await db.query.ormawaTable.findFirst({
          where: eq(ormawaTable.id, pengajuInfo.ormawaId),
        })
      : null;

    // Ambil riwayat approval — sama seperti approvalLog.post.ts ormawa
    const riwayat = await db
      .select({
        approvalLog: approvalLogTable,
        actor: {
          fullname: usersTable.fullName,
          role: usersTable.role,
        },
      })
      .from(approvalLogTable)
      .innerJoin(usersTable, eq(usersTable.id, approvalLogTable.actorId))
      .where(eq(approvalLogTable.pengajuanRabId, id))
      .orderBy(asc(approvalLogTable.createdAt));

    return {
      success: true,
      data: {
        id: rab.id,
        nomorPengajuan: rab.nomorPengajuan,
        judulKegiatan: rab.judulKegiatan,
        deskripsi: rab.deskripsi,
        totalAnggaran: rab.totalAnggaran,
        tanggalMulai: rab.tanggalMulai,
        tanggalSelesai: rab.tanggalSelesai,
        status: rab.status,
        fileRabUrl: rab.fileRabUrl,
        fileTorUrl: rab.fileTorUrl,
        createdAt: rab.createdAt,
        updatedAt: rab.updatedAt,
        pengaju: {
          id: pengajuInfo?.id ?? null,
          nama: pengajuInfo?.fullName ?? "",
          email: pengajuInfo?.email ?? "",
        },
        ormawa: {
          id: ormawaInfo?.id ?? null,
          nama: ormawaInfo?.nama ?? "",
          kode: ormawaInfo?.kode ?? "",
          totalAnggaran: ormawaInfo?.totalAnggaran ?? 0,
        },
        // Struktur riwayat sama persis dengan approvalLog.post.ts ormawa
        riwayat: riwayat.map((r) => ({
          id: r.approvalLog.id,
          action: r.approvalLog.action,
          catatan: r.approvalLog.catatanRevisi,
          createdAt: r.approvalLog.createdAt,
          aktor: {
            nama: r.actor.fullname,
            role: r.actor.role,
          },
        })),
      },
    };
  } catch (error: any) {
    console.error("Error GET /api/ppk/kegiatan/[id]:", error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Gagal mengambil detail pengajuan",
      data: error,
    });
  }
});
