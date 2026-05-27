import { useDrizzle } from "~~/server/db/index";
import { ormawaTable } from "~~/server/db/schema/ormawaSchema";

export default defineEventHandler(async (event) => {
  try {
    const db = useDrizzle();
    const data = await db.select().from(ormawaTable);
    return {
      success: true,
      data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Gagal mengambil data ormawa",
    };
  }
});
