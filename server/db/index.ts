import * as schema from "./schema/index";
import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import { createPool } from "mysql2";

const pool = createPool(process.env.DATABASE_URL!);

const db = drizzle(pool.promise(), {
  schema,
  mode: "default",
});

export function useDrizzle() {
  return db;
}