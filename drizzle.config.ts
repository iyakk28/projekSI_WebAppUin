import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./server/db/schema/*.ts",
  dialect: "mysql",
  dbCredentials: {
    host: "localhost",
    port: 3306,
    user: "root",
    password: "Admin1234", // Sudah dikosongkan agar sesuai dengan Laragon/HeidiSQL Anda
    database: "e_administrasi",
  },
});
