import jwt from "jsonwebtoken";
import { usersTable } from "../db/schema";
import { useDrizzle } from "../db";
import { eq } from "drizzle-orm";
import { User } from "../interface/userInterface";

export default defineEventHandler(async (event) => {
  const token = getCookie(event, "jwt_token");

  if (!token) return;
  try {
    const config = useRuntimeConfig(event);
    const decoded = jwt.verify(token, config.SecretJwtKey) as User;

    const db = useDrizzle();
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, Number(decoded.id)),
    });

    if (!user) {
      console.warn("User tidak ditemukan di database");
    }

    const transformedUser = {
      ...decoded,
      id: user?.id ?? decoded.id,
      role: user?.role ?? decoded.role,
      email: user?.email ?? decoded.email,
      username: user?.userName ?? decoded.username,
      fullName: user?.fullName ?? decoded.fullName,
      fakultasId: user?.fakultasId ?? decoded.fakultasId ?? decoded.fakultas,
      prodiId: user?.prodiId ?? decoded.prodiId ?? decoded.prodi,
      ormawaId: user?.ormawaId ?? decoded.ormawaId ?? decoded.ormawa,
    };

    event.context.user = transformedUser;
  } catch (err) {
    console.warn("Token invalid atau expired");
  }
});
