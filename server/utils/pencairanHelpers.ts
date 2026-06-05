import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { cwd } from "node:process";
import { and, eq, inArray, sql } from "drizzle-orm";
import type { useDrizzle } from "~~/server/db";
import {
  dokumentasiKegiatanTable,
  kegiatanTable,
  pengajuanRabTable,
  tagihanPencairanTable,
  usersTable,
} from "~~/server/db/schema";
import { showDekripsi } from "./enkripsiData";

export const GROUP_ID_OFFSET = 1_000_000;

type PencairanMeta = {
  spbFileUrl?: string | null;
  kwitansiFileUrl?: string | null;
  dokumentasiId?: number | null;
};

const pencairanMetaPath = (tagihanId: number) =>
  join(cwd(), "uploads", "ppk", "meta", `${tagihanId}.json`);

export async function readPencairanMeta(tagihanId: number): Promise<PencairanMeta> {
  try {
    const raw = await readFile(pencairanMetaPath(tagihanId), "utf-8");
    return JSON.parse(raw) as PencairanMeta;
  } catch {
    return {};
  }
}

export async function writePencairanMeta(
  tagihanId: number,
  patch: Partial<PencairanMeta>,
): Promise<PencairanMeta> {
  await mkdir(join(cwd(), "uploads", "ppk", "meta"), { recursive: true });
  const current = await readPencairanMeta(tagihanId);
  const next = { ...current, ...patch };
  await writeFile(pencairanMetaPath(tagihanId), JSON.stringify(next, null, 2), "utf-8");
  return next;
}

export async function getDokumenPpkFromMeta(tagihanId: number) {
  const meta = await readPencairanMeta(tagihanId);
  return {
    spbFileUrl: meta.spbFileUrl ?? null,
    kwitansiFileUrl: meta.kwitansiFileUrl ?? null,
  };
}

export const normalizeText = (value?: string | null) => (value ?? "").trim();

export const makeVirtualId = (dokumentasiId: number) => -Math.abs(dokumentasiId);

export const makeGroupId = (kegiatanId: number) =>
  -(GROUP_ID_OFFSET + Math.abs(kegiatanId));

export const isGroupId = (id: number) => id <= -GROUP_ID_OFFSET;

export const groupIdToKegiatanId = (id: number) => Math.abs(id) - GROUP_ID_OFFSET;

export const routeIdToDokumentasiId = (id: number) =>
  id < 0 && !isGroupId(id) ? Math.abs(id) : null;

export const decodeUrlId = (urlId: any): number => {
  const str = String(urlId || "");

  if (str.startsWith("g")) {
    const kegiatanId = Number(str.slice(1));
    return Number.isNaN(kegiatanId) ? 0 : -(GROUP_ID_OFFSET + kegiatanId);
  }

  if (str.startsWith("v")) {
    const dokumentasiId = Number(str.slice(1));
    return Number.isNaN(dokumentasiId) ? 0 : -dokumentasiId;
  }

  const num = Number(str);
  return Number.isNaN(num) ? 0 : num;
};

export const mysqlTimestamp = () =>
  new Date().toISOString().slice(0, 19).replace("T", " ");

export const toPublicUploadUrl = (value?: string | null) => {
  if (!value) return null;

  let normalized = value.replace(/\\/g, "/").trim();
  const lower = normalized.toLowerCase();
  const uploadsIdx = lower.indexOf("uploads/");

  if (uploadsIdx >= 0) {
    normalized = normalized.slice(uploadsIdx);
  } else if (!normalized.includes("/")) {
    normalized = `uploads/dokumentasi/jasa/${normalized}`;
  } else if (!lower.startsWith("uploads/")) {
    normalized = `uploads/${normalized.replace(/^\/+/, "")}`;
  }

  const withSlash = normalized.startsWith("/") ? normalized : `/${normalized}`;
  return withSlash
    .split("/")
    .map((segment, index) => (index === 0 ? segment : encodeURIComponent(segment)))
    .join("/");
};

export const buildDocKey = (row: {
  kegiatanId: number;
  tipeTagihan: string;
  namaPenerima: string;
  rekeningPenerima: string;
}) =>
  [
    row.kegiatanId,
    row.tipeTagihan,
    normalizeText(row.namaPenerima).toLowerCase(),
    normalizeText(row.rekeningPenerima),
  ].join("|");

export const buildDokumenUploadFromTagihan = (row: any) => {
  const isBarang = row.tipeTagihan === "BARANG";
  const rekeningPenerima = showDekripsi(row.rekeningPenerima);

  if (isBarang) {
    return [
      {
        id: "foto_barang",
        nama: "Foto Barang",
        url: toPublicUploadUrl(row.fotoBarangUrl),
        uploaded: Boolean(row.fotoBarangUrl),
      },
      {
        id: "struk_belanja",
        nama: "Foto Bon / Struk",
        url: toPublicUploadUrl(row.strukFileUrl),
        uploaded: Boolean(row.strukFileUrl),
      },
      {
        id: "nama_toko",
        nama: "Nama Toko",
        url: null,
        uploaded: Boolean(row.tokoNama),
      },
      {
        id: "rekening_toko",
        nama: "No. Rekening Toko",
        url: null,
        uploaded: Boolean(rekeningPenerima),
      },
    ];
  }

  return [
    { id: "sk", nama: "SK", url: toPublicUploadUrl(row.skFileUrl), uploaded: Boolean(row.skFileUrl) },
    { id: "spmt", nama: "SPMT", url: toPublicUploadUrl(row.spmtFileUrl), uploaded: Boolean(row.spmtFileUrl) },
    { id: "amprah", nama: "Amprah", url: toPublicUploadUrl(row.amprahFileUrl), uploaded: Boolean(row.amprahFileUrl) },
    { id: "npwp", nama: "NPWP", url: toPublicUploadUrl(row.npwpFileUrl), uploaded: Boolean(row.npwpFileUrl) },
    { id: "ktp", nama: "Foto KTP", url: toPublicUploadUrl(row.ktpFileUrl), uploaded: Boolean(row.ktpFileUrl) },
    { id: "rekening_penerima", nama: "No. Rekening Penerima", url: null, uploaded: Boolean(rekeningPenerima) },
  ];
};

export const isAllDocsUploaded = (docs: { uploaded: boolean }[]) =>
  docs.length > 0 && docs.every((doc) => doc.uploaded);

export async function resolveTagihanIds(
  db: ReturnType<typeof useDrizzle>,
  routeId: number,
  fakultasId: string,
): Promise<number[]> {
  if (routeId > 0) return [routeId];

  if (isGroupId(routeId)) {
    const kegiatanId = groupIdToKegiatanId(routeId);
    const rows = await db
      .select({ id: tagihanPencairanTable.id })
      .from(tagihanPencairanTable)
      .where(
        and(
          eq(tagihanPencairanTable.kegiatanId, kegiatanId),
          eq(tagihanPencairanTable.fakultasId, fakultasId)
        )
      );
    return rows.map(r => r.id);
  }

  // Virtual ID case (legacy or dokumentasi fallback)
  const dokumentasiId = routeIdToDokumentasiId(routeId);
  if (!dokumentasiId) return [];

  // Cari tagihan yang berkaitan dengan dokumentasi ini (lewat meta)
  // Ini mungkin lambat tapi ini fallback
  const allTagihans = await db
    .select({ id: tagihanPencairanTable.id })
    .from(tagihanPencairanTable)
    .where(eq(tagihanPencairanTable.fakultasId, fakultasId));
  
  for (const t of allTagihans) {
    const meta = await readPencairanMeta(t.id);
    if (meta.dokumentasiId === dokumentasiId) return [t.id];
  }

  return [];
}
