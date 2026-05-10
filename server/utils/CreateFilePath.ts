import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { cwd } from "node:process";

export type process = "file" | "dokumentasi";
export type Category = "Lpg" | "Rab" | "Tor" | "barang" | "jasa" | "kegiatan";
export type Status =
  | "DiTolak"
  | "Selesai"
  | "SedangBerlangsung"
  | "sedangDiAjukan"
  | "draft"
  | "";

const rootPath = join(cwd(), "uploads");
export async function createFilePath(
  process: process,
  category: Category,
  status: Status,
): Promise<string> {
  try {
    const targetPath = join(rootPath, process, category, status);
    await mkdir(targetPath, { recursive: true });
    return targetPath;
  } catch (error) {
    console.error("gagal bikin folder!", error);
    throw error;
  }
}
