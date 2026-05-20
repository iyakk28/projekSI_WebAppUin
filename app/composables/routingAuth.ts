import { navigateTo } from "#app";

export default function routingAuth(
  role: string,
  pathTujuan: string,
  pathSekarang: string,
  aksesPath: string | string[],
) {
  const router = useRouter();
  const defaultPath = `/dashboard/${role}`;

  const allowedPaths = Array.isArray(aksesPath) ? aksesPath : [aksesPath];
  if (allowedPaths.includes(pathTujuan)) {
    return;
  }
  if (pathSekarang.toString().trim() === defaultPath.toString().trim()) {
    return;
  } else {
    return defaultPath;
  }
}
