import { useDrizzle } from "~~/server/db/index";
import {
  usersTable,
  ormawaTable,
  programStudiTable,
} from "~~/server/db/schema/index";
import { eq, or } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  try {
    const db = useDrizzle();
    const body = await readBody(event);
    let {
      email,
      userName,
      password,
      fullName,
      role,
      prodiId,
      ormawaId,
      fakultasId,
    } = body;

    if (
      !email?.trim() ||
      !userName?.trim() ||
      !password ||
      !fullName?.trim() ||
      !role
    ) {
      throw createError({
        statusCode: 400,
        statusMessage: "Semua field wajib diisi",
      });
    }

    email = email.trim().toLowerCase();
    userName = userName.trim();

    // 1. Check similarity for security
    const emailPrefix = email.split("@")[0].toLowerCase();
    const userNameLower = userName.toLowerCase();

    if (
      emailPrefix === userNameLower ||
      email.includes(userNameLower) ||
      userNameLower.includes(emailPrefix)
    ) {
      throw createError({
        statusCode: 400,
        statusMessage:
          "Email dan User ID terlalu mirip. Silahkan gunakan kombinasi yang berbeda untuk alasan keamanan.",
      });
    }

    // 2. Check for duplicates
    const existingUser = await db
      .select()
      .from(usersTable)
      .where(or(eq(usersTable.email, email), eq(usersTable.userName, userName)))
      .limit(1);

    if (existingUser.length > 0) {
      const isEmailDup = existingUser[0].email === email;
      throw createError({
        statusCode: 400,
        statusMessage: isEmailDup
          ? "Email sudah digunakan oleh user lain"
          : "User ID sudah digunakan oleh user lain",
      });
    }

    // 3. Resolve IDs based on role
    if (role === "ormawa" && ormawaId) {
      const ormawa = await db
        .select()
        .from(ormawaTable)
        .where(eq(ormawaTable.id, Number(ormawaId)))
        .limit(1);

      if (ormawa.length > 0) {
        prodiId = ormawa[0].prodiId;
        const prodi = await db
          .select()
          .from(programStudiTable)
          .where(eq(programStudiTable.id, Number(prodiId)))
          .limit(1);
        if (prodi.length > 0) {
          fakultasId = prodi[0].fakultasId;
        }
      }
    } else if (role === "kaprodi" && prodiId) {
      const prodi = await db
        .select()
        .from(programStudiTable)
        .where(eq(programStudiTable.id, Number(prodiId)))
        .limit(1);
      if (prodi.length > 0) {
        fakultasId = prodi[0].fakultasId;
      }
    }

    await db.insert(usersTable).values({
      email,
      userName,
      passwordHash: password, // Note: Assuming password is pre-hashed or will be handled by a hook
      fullName: fullName.trim(),
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
    console.error("Error creating user:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message || "Gagal menambahkan user",
    });
  }
});
