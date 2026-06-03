import { defineStore } from "pinia";

interface RabItem {
  id: number;
  nama: string;
  qty: number;
  harga: number;
}

interface DokumenItem {
  id: number;
  nama: string;
  tipe: string;
  ukuran: string;
  url: string;
}

interface RiwayatKeputusan {
  id: number;
  status: string;
  keterangan: string;
  oleh: string;
  tanggal: string;
}

export type KegiatanStatus =
  | "waiting_ppk"
  | "revisi_ppk"
  | "waiting_spi"
  | "ditolak_spi"
  | "disetujui"
  | "menunggu"
  | "revisi"
  | "ditolak"
  | "dikirim_spi"
  | "draft";

export interface KegiatanItem {
  id: number;
  namaKegiatan: string;
  jenisKegiatan?: string;
  tanggalKegiatan?: string;
  totalDana: number;
  deskripsi?: string;
  pengaju: string;
  tanggalPengajuan: string;
  status: KegiatanStatus;
  namaOrmawa: string;
  kodeOrmawa: string;
  rabItems: RabItem[];
  dokumen: DokumenItem[];
  riwayat: RiwayatKeputusan[];
  color?: string;
}

export const usePpkPengajuanStore = defineStore("ppkPengajuan", () => {
  const kegiatanData = ref<{
    data: Record<string, any>[];
  } | null>(null);

  const searchQuery = ref("");
  const filterStatus = ref("");

  const showModal = ref(false);
  const selected = ref<KegiatanItem | null>(null);
  const activeTab = ref<"info" | "dokumen" | "keputusan">("info");

  const catatanPPK = ref("");
  const loadingAction = ref(false);

  const loading = ref(false);
  const error = ref("");

  const tabs = [
    {
      key: "info" as const,
      label: "Info Kegiatan",
      icon: "heroicons:information-circle",
    },
    {
      key: "dokumen" as const,
      label: "Dokumen",
      icon: "heroicons:document-text",
    },
    {
      key: "keputusan" as const,
      label: "Keputusan",
      icon: "heroicons:scale",
    },
  ];

  const todayStr = new Date().toLocaleDateString("id-ID", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const fetchKegiatan = async () => {
    loading.value = true;
    error.value = "";

    try {
      const { data, error: fetchError } = await useFetch<{
        data: Record<string, any>[];
      }>("/api/ppk/kegiatan");

      if (fetchError.value) {
        throw fetchError.value;
      }

      kegiatanData.value = data.value || { data: [] };
    } catch (err: any) {
      error.value =
        err?.data?.statusMessage ||
        err?.message ||
        "Gagal memuat data pengajuan PPK.";
    } finally {
      loading.value = false;
    }
  };

  const refreshKegiatan = async () => {
    await fetchKegiatan();
  };

  const normalizeStatus = (status?: string): KegiatanStatus => {
    switch (status) {
      case "waiting_ppk":
      case "menunggu":
        return "menunggu";

      case "revisi_ppk":
      case "revisi":
        return "revisi";

      case "waiting_spi":
      case "dikirim_spi":
        return "dikirim_spi";

      case "ditolak_spi":
      case "ditolak":
      case "tolak":
        return "ditolak";

      case "disetujui":
        return "disetujui";

      default:
        return "menunggu";
    }
  };

  const kegiatanList = computed<KegiatanItem[]>(() =>
    (kegiatanData.value?.data || []).map((item) => ({
      id: item.id,
      namaKegiatan: item.judulKegiatan || item.namaKegiatan || "",
      jenisKegiatan: item.jenisKegiatan || "",
      tanggalKegiatan: item.tanggalKegiatan || item.tanggalMulai || "",
      totalDana: Number(item.totalDana ?? item.totalAnggaran ?? 0),
      deskripsi: item.deskripsi || item.catatan || "",
      pengaju:
        item.pengaju?.nama ||
        item.pengaju?.fullName ||
        item.pengaju?.email ||
        "",
      tanggalPengajuan:
        item.tanggalPengajuan || item.tanggalMulai || item.createdAt || "",
      status: normalizeStatus(item.status),
      namaOrmawa: item.namaOrmawa || item.ormawa?.nama || "",
      kodeOrmawa: item.kodeOrmawa || item.ormawa?.kode || "",
      rabItems: item.rabItems || [],
      dokumen: item.dokumen?.length
        ? item.dokumen
        : [
            ...(item.fileRabUrl
              ? [
                  {
                    id: 1,
                    nama: "File RAB",
                    tipe: "PDF",
                    ukuran: "",
                    url: `/${item.fileRabUrl}`,
                  },
                ]
              : []),
            ...(item.fileTorUrl
              ? [
                  {
                    id: 2,
                    nama: "File TOR",
                    tipe: "PDF",
                    ukuran: "",
                    url: `/${item.fileTorUrl}`,
                  },
                ]
              : []),
          ],
      riwayat: item.riwayat || [],
      color: item.color,
    })),
  );

  const totalKegiatan = computed(() => kegiatanList.value.length);

  const countByStatus = (status: string) => {
    return kegiatanList.value.filter((item) => item.status === status).length;
  };

  const filteredList = computed(() => {
    return kegiatanList.value.filter((item) => {
      const q = searchQuery.value.toLowerCase();

      const matchSearch =
        !q ||
        item.namaKegiatan.toLowerCase().includes(q) ||
        item.namaOrmawa.toLowerCase().includes(q);

      const matchStatus =
        !filterStatus.value || item.status === filterStatus.value;

      return matchSearch && matchStatus;
    });
  });

  const openDetail = (item: KegiatanItem) => {
    selected.value = item;
    activeTab.value = "info";
    catatanPPK.value = "";
    showModal.value = true;
  };

  const closeModal = () => {
    showModal.value = false;
    selected.value = null;
  };

  const handleDecision = async (keputusan: string) => {
    if (!selected.value) return;

    loadingAction.value = true;

    try {
      await $fetch(`/api/ppk/kegiatan/${selected.value.id}/keputusan`, {
        method: "POST",
        body: {
          keputusan,
          catatan: catatanPPK.value,
        },
      });

      selected.value.status = normalizeStatus(keputusan);

      if (keputusan === "disetujui") {
        activeTab.value = "keputusan";
      }

      await refreshKegiatan();
    } catch (err) {
      console.error("Gagal memproses keputusan PPK:", err);
    } finally {
      loadingAction.value = false;
    }
  };

  const statusColor = (status?: string) => {
    const map: Record<string, string> = {
      menunggu: "yellow",
      disetujui: "mint",
      revisi: "orange",
      ditolak: "coral",
      dikirim_spi: "blue",
    };

    return map[normalizeStatus(status) || "menunggu"] || "blue";
  };

  const statusLabel = (status?: string) => {
    const map: Record<string, string> = {
      menunggu: "Menunggu",
      disetujui: "Disetujui",
      revisi: "Revisi",
      ditolak: "Ditolak",
      dikirim_spi: "Dikirim ke SPI",
    };

    return map[normalizeStatus(status) || "menunggu"] || "-";
  };

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

    showModal,
    selected,
    activeTab,
    catatanPPK,
    loadingAction,

    loading,
    error,

    tabs,
    todayStr,

    fetchKegiatan,
    refreshKegiatan,

    normalizeStatus,
    kegiatanList,
    totalKegiatan,
    countByStatus,
    filteredList,

    openDetail,
    closeModal,
    handleDecision,

    statusColor,
    statusLabel,
    formatRp,
    formatDate,
  };
});