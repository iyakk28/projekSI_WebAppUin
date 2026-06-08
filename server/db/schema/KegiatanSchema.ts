import {
  mysqlTable,
  bigint,
  int,
  varchar,
  date,
  timestamp,
  mysqlEnum,
  text,
} from "drizzle-orm/mysql-core";
import { pengajuanRabTable } from "./pengajuanRabSchema";
import { ormawaTable } from "./ormawaSchema";

export const kegiatanTable = mysqlTable("kegiatan", {
  id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
  pengajuanRabId: int("pengajuan_rab_id")
    .notNull()
    .references(() => pengajuanRabTable.id, { onDelete: "cascade" }),
  ormawaId: int("ormawa_id")
    .notNull()
    .references(() => ormawaTable.id, { onDelete: "set null" }),
  statusKegiatan: mysqlEnum("status_kegiatan", [
    "BELUM_DILAKSANAKAN",
    "SEDANG_DILAKSANAKAN",
    "SELESAI",
    "LUNAS",
  ])
    .notNull()
    .default("BELUM_DILAKSANAKAN"),
  isiCatatan: text("isi_catatan"),
  tipe: mysqlEnum("tipe", ["kelengkapan", "revisi", "informasi"]).default(
    "informasi",
  ),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
});
