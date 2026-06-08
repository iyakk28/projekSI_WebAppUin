import { mysqlTable, bigint, text, timestamp } from "drizzle-orm/mysql-core";
import { tagihanPencairanTable } from "./TagihanPencairanSchema";
import { usersTable } from "./usersSchema";
import { fakultasTable } from "./fakultasSchema";

export const pembayaranTable = mysqlTable("pembayaran", {
  id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
  tagihanId: bigint("tagihan_id", { mode: "number" })
    .notNull()
    .references(() => tagihanPencairanTable.id, { onDelete: "cascade" }),
  ppkId: bigint("ppk_id", { mode: "number" })
    .notNull()
    .references(() => usersTable.id, { onDelete: "restrict" }),
  fakultasId: bigint("fakultas_id", { mode: "number" })
    .notNull()
    .references(() => fakultasTable.id, { onDelete: "set null" }),
  buktiTransferUrl: text("bukti_transfer_url").notNull(),
  tanggalPembayaran: timestamp("tanggal_pembayaran", { mode: "string" })
    .defaultNow()
    .notNull(),
  catatanPembayaran: text("catatan_pembayaran"),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
});
