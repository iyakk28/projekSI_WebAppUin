import {
  mysqlTable,
  bigint,
  varchar,
  text,
  timestamp,
  tinyint,
} from "drizzle-orm/mysql-core";
import { kegiatanTable } from "./KegiatanSchema";
import { usersTable } from "./usersSchema";
import { programStudiTable } from "./programStudiSchema";
import { fakultasTable } from "./fakultasSchema";

export const dokumentasiKegiatanTable = mysqlTable("dokumentasi_kegiatan", {
  id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
  kegiatanId: bigint("kegiatan_id", { mode: "number" })
    .notNull()
    .references(() => kegiatanTable.id, { onDelete: "cascade" }),
  tipeDokumen: varchar("tipe_dokumen", { length: 50 }).notNull(),
  deskripsi: text("deskripsi"),
  fakultasId: varchar("fakultas_Id", { length: 50 })
    .notNull()
    .references(() => fakultasTable.id),
  prodiId: varchar("prodi_id", { length: 50 }).references(
    () => programStudiTable.id,
  ),
  status: tinyint("status").default(0).notNull(),
  fileUrl: text("file_url").notNull(),
  uploadedBy: bigint("uploaded_by", { mode: "number" })
    .notNull()
    .references(() => usersTable.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
});
