import { useDrizzle } from "~~/server/db/index"; // Sesuaikan path utils Anda
import { usersTable } from "~~/server/db/schema/usersSchema";
import { eq, and } from "drizzle-orm";
import { User } from "../../interface/userInterface";
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { id_users, password, remember } = body;

    if (!id_users || !password) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        message: "Username dan Password wajib diisi.",
      });
    }

    const user = await useDrizzle().query.usersTable.findFirst({
      where: eq(usersTable.users_id, String(id_users)),
    });

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
        message: "User ID tidak ditemukan. Pastikan NIM/NIP Anda benar.",
      });
    }

    if (user.passwordHash !== password) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
        message: "Password yang Anda masukkan salah.",
      });
    }

    if (!user.isActive) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        message: "Akun Anda telah dinonaktifkan. Silahkan hubungi administrator.",
      });
    }

    const payload: User = {
      id: String(user.id),
      role: user.role,
      username: user.fullName,
      email: user.email,
      fakultas: user.fakultasId || null,
      prodi: user.prodiId || null,
      ormawa: user.ormawaId || null,
      fakultasId: user.fakultasId || null,
      prodiId: user.prodiId || null,
      ormawaId: user.ormawaId || null,
    };
    
    const token = createJwt(payload);

    if (token == null) {
      throw new Error("Gagal membuat sesi login.");
    }

    setCookie(event, "jwt_token", token, {
      httpOnly: true,
      maxAge: remember ? 60 * 60 * 24 * 7 : 60 * 60 * 24, // 7 days if remember me
      path: "/",
    });

    return {
      success: true,
      message: "Login berhasil!",
      data: {
        user: payload,
      },
    };
  } catch (error: any) {
    // If it's already an H3 error (from createError), just rethrow it or return its data
    if (error.statusCode) {
      return {
        success: false,
        message: error.message,
      };
    }
    
    return {
      success: false,
      message: error.message || "Terjadi kesalahan pada server",
    };
  }
});
