import { defineStore } from "pinia";

export type KegiatanStatus =
  | "waiting_kaprodi"
  | "revisi_kaprodi"
  | "waiting_ppk"
  | "revisi_ppk"
  | "waiting_spi"
  | "ditolak_spi"
  | "disetujui"
  | "selesai_spi"
  | "menunggu"
  | "revisi"
  | "ditolak"
  | "draft";

export interface KegiatanItem {
  id: number;
  nomorPengajuan: string;
  namaKegiatan: string;
  totalDana: number;
  deskripsi?: string;
  pengaju: string;
  tanggalPengajuan: string;
  status: KegiatanStatus;
  namaOrmawa: string;
  kodeOrmawa: string;
}

export const useKaprodiPengajuanStore = defineStore("kaprodiPengajuan", () => {
  const kegiatanData = ref<Record<string, any>[]>([]);

  const searchQuery = ref("");
  const filterStatus = ref("");

  const todayStr = new Date().toLocaleDateString("id-ID", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const fetchKegiatan = async () => {
    const { data, error } = await useFetch<{
      data: Record<string, any>[];
    }>("/api/kaprodi/kegiatan");

    if (error.value) {
      console.error("Gagal mengambil data kegiatan:", error.value);
      return;
    }

    kegiatanData.value = data.value?.data || [];
  };

  const normalizeStatus = (
    status?: string,
  ): "menunggu" | "revisi" | "disetujui" | "ditolak" => {
    switch (status) {
      case "waiting_kaprodi":
        return "menunggu";

      case "revisi_kaprodi":
        return "revisi";

      case "waiting_ppk":
      case "revisi_ppk":
      case "waiting_spi":
      case "disetujui":
      case "selesai_spi":
        return "disetujui";

      case "ditolak_spi":
        return "ditolak";

      default:
        return "menunggu";
    }
  };

  const statusLabel = (status?: string) => {
    switch (status) {
      case "waiting_kaprodi":
        return "Menunggu Review Anda";

      case "revisi_kaprodi":
        return "Direvisi (Kaprodi)";

      case "waiting_ppk":
        return "Menunggu PPK";

      case "revisi_ppk":
        return "Direvisi (PPK)";

      case "waiting_spi":
        return "Dikirim ke SPI";

      case "ditolak_spi":
        return "Ditolak SPI";

      case "disetujui":
      case "selesai_spi":
        return "Selesai / Disetujui";

      default:
        return "Menunggu";
    }
  };

  const statusColor = (status?: string) => {
    switch (status) {
      case "waiting_kaprodi":
        return "yellow";

      case "revisi_kaprodi":
        return "orange";

      case "waiting_ppk":
      case "waiting_spi":
        return "blue";

      case "revisi_ppk":
        return "orange";

      case "ditolak_spi":
        return "coral";

      case "disetujui":
      case "selesai_spi":
        return "mint";

      default:
        return "blue";
    }
  };

  const kegiatanList = computed<KegiatanItem[]>(() =>
    kegiatanData.value.map((item) => ({
      id: item.id,
      nomorPengajuan: item.nomorPengajuan || "",
      namaKegiatan: item.judulKegiatan || item.namaKegiatan || "",
      totalDana: Number(item.totalDana ?? item.totalAnggaran ?? 0),
      deskripsi: item.deskripsi || "",
      pengaju: item.pengaju?.nama || "",
      tanggalPengajuan: item.createdAt || "",
      status: item.status,
      namaOrmawa: item.ormawa?.nama || "",
      kodeOrmawa: item.ormawa?.kode || "",
    })),
  );

  const totalKegiatan = computed(() => kegiatanList.value.length);

  const countByStatus = (
    status: "menunggu" | "revisi" | "disetujui" | "ditolak",
  ) => {
    return kegiatanList.value.filter(
      (item) => normalizeStatus(item.status) === status,
    ).length;
  };

  const filteredList = computed(() => {
    return kegiatanList.value.filter((item) => {
      const q = searchQuery.value.toLowerCase();

      const matchSearch =
        !q ||
        item.namaKegiatan.toLowerCase().includes(q) ||
        item.namaOrmawa.toLowerCase().includes(q) ||
        item.nomorPengajuan.toLowerCase().includes(q);

      const matchStatus =
        !filterStatus.value ||
        normalizeStatus(item.status) === filterStatus.value;

      return matchSearch && matchStatus;
    });
  });

  const formatRp = (n?: number) => {
    return "Rp " + new Intl.NumberFormat("id-ID").format(n || 0);
  };

  const formatDate = (d?: string) => {
    return d
      ? new Date(d).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "-";
  };

  return {
    kegiatanData,
    searchQuery,
    filterStatus,
    todayStr,

    fetchKegiatan,

    kegiatanList,
    filteredList,
    totalKegiatan,

    normalizeStatus,
    statusLabel,
    statusColor,
    countByStatus,
    formatRp,
    formatDate,
  };
});