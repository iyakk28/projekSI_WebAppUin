import { useDrizzle } from "~~/server/db/index";
import { usersTable } from "~~/server/db/schema/usersSchema";

export default defineEventHandler(async (event) => {
  try {
    const db = useDrizzle();
    const body = await readBody(event);
    const {
      email,
      users_id,
      password,
      fullName,
      role,
      prodiId,
      ormawaId,
      fakultasId,
    } = body;

    if (!email || !users_id || !password || !fullName || !role) {
      throw createError({
        statusCode: 400,
        statusMessage: "Semua field wajib diisi",
      });
    }

    await db.insert(usersTable).values({
      email,
      users_id,
      passwordHash: password, // Sesuai pattern yang ada, tidak dihash/AES di backend
      fullName,
      role,
      prodiId: prodiId ? Number(prodiId) : null,
      ormawaId: ormawaId ? Number(ormawaId) : null,
      fakultasId: fakultasId ? Number(fakultasId) : null,
      isActive: true,
    });

    return {
      success: true,
      message: "User berhasil ditambahkan",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Gagal menambahkan user",
    };
  }
});
