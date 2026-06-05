// FILE: server/api/ppk/dashboard/index.get.ts

import { eq, sql, ne, and, inArray } from "drizzle-orm";
import {
  pengajuanRabTable,
  usersTable,
  ormawaTable,
} from "~~/server/db/schema";
import { useDrizzle } from "~~/server/db";

export default defineEventHandler(async (event) => {
  try {
    const db = useDrizzle();
    const { user } = event.context;

    // Ambil fakultas_id PPK dari context — sama seperti ormawa ambil user.id langsung
    const fakultasId = user.fakultasId;

    if (!fakultasId) {
      return { total: 0, menunggu: 0, disetujui: 0, revisi: 0, ditolak: 0 };
    }

    // Step 1: Cari semua ormawa_id yang prodi_id-nya dimiliki kaprodi se-fakultas PPK
    // Pola sama seperti ormawa: query bertahap, tidak join untuk filter
    const kaprodiList = await db
      .select({ prodiId: usersTable.prodiId })
      .from(usersTable)
      .where(
        and(
          eq(usersTable.role, "kaprodi"),
          eq(usersTable.fakultasId, fakultasId),
        ),
      );
    console.log(kaprodiList);
    const prodiIds = kaprodiList
      .map((k) => k.prodiId)
      .filter((id): id is number => id !== null);

    if (prodiIds.length === 0) {
      return { total: 0, menunggu: 0, disetujui: 0, revisi: 0, ditolak: 0 };
    }

    // Step 2: Cari ormawa yang prodi_id-nya masuk list
    const ormawaList = await db
      .select({ id: ormawaTable.id })
      .from(ormawaTable)
      .where(inArray(ormawaTable.prodiId, prodiIds));

    const ormawaIds = ormawaList.map((o) => o.id);

    if (ormawaIds.length === 0) {
      return { total: 0, menunggu: 0, disetujui: 0, revisi: 0, ditolak: 0 };
    }

    // Step 3: Cari users_id (varchar) dari user ormawa — sama seperti ormawa pakai user.id
    const ormawaUsers = await db
      .select({ usersId: usersTable.users_id })
      .from(usersTable)
      .where(inArray(usersTable.ormawaId, ormawaIds));

    const ormawaUserIds = ormawaUsers.map((u) => u.usersId);

    if (ormawaUserIds.length === 0) {
      return { total: 0, menunggu: 0, disetujui: 0, revisi: 0, ditolak: 0 };
    }

    // Step 4: Hitung pengajuan — pola sama seperti ormawa pakai eq(usersId, user.id)
    // tapi untuk PPK pakai inArray(usersId, ormawaUserIds)
    const [total, menunggu, disetujui, revisi, ditolak] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(pengajuanRabTable)
        .where(
          and(
            ne(pengajuanRabTable.status, "draft"),
            inArray(pengajuanRabTable.usersId, ormawaUserIds),
          ),
        ),
      db
        .select({ count: sql<number>`count(*)` })
        .from(pengajuanRabTable)
        .where(
          and(
            eq(pengajuanRabTable.status, "waiting_ppk"),
            inArray(pengajuanRabTable.usersId, ormawaUserIds),
          ),
        ),
      db
        .select({ count: sql<number>`count(*)` })
        .from(pengajuanRabTable)
        .where(
          and(
            inArray(pengajuanRabTable.status, [
              "waiting_spi",
              "disetujui",
              "selesai_spi",
            ]),
            inArray(pengajuanRabTable.usersId, ormawaUserIds),
          ),
        ),
      db
        .select({ count: sql<number>`count(*)` })
        .from(pengajuanRabTable)
        .where(
          and(
            eq(pengajuanRabTable.status, "revisi_ppk"),
            inArray(pengajuanRabTable.usersId, ormawaUserIds),
          ),
        ),
      db
        .select({ count: sql<number>`count(*)` })
        .from(pengajuanRabTable)
        .where(
          and(
            eq(pengajuanRabTable.status, "ditolak_spi"),
            inArray(pengajuanRabTable.usersId, ormawaUserIds),
          ),
        ),
    ]);

    return {
      total: Number(total[0]?.count ?? 0),
      menunggu: Number(menunggu[0]?.count ?? 0),
      disetujui: Number(disetujui[0]?.count ?? 0),
      revisi: Number(revisi[0]?.count ?? 0),
      ditolak: Number(ditolak[0]?.count ?? 0),
    };
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Gagal mengambil data dashboard",
      data: error,
    });
  }
});
