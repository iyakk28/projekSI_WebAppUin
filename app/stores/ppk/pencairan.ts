import { defineStore } from "pinia";

export interface PencairanItem {
  id: number;
  urlId: string;
  namaKegiatan: string;
  namaOrmawa: string;
  kodeOrmawa: string;
  tipeTagihan: string;
  namaPenerima: string;
  rekeningPenerima: string;
  totalDana: number;
  tanggalPengajuan: string;
  statusPencairan: string;
  syaratDokumen: { uploaded: boolean; url?: string }[];
  uploadedDocs: number;
  totalDocs: number;
  docPct: number;
}

export const usePpkPencairanStore = defineStore("ppkPencairan", () => {
  const pencairanData = ref<{ data: any[] } | null>(null);

  const searchQuery = ref("");
  const filterStatus = ref("");

  const loading = ref(false);
  const error = ref("");

  const todayStr = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const fetchPencairan = async () => {
    loading.value = true;
    error.value = "";

    try {
      const { data, error: fetchError } = await useFetch<{ data: any[] }>(
        "/api/ppk/pencairan",
      );

      if (fetchError.value) {
        throw fetchError.value;
      }

      pencairanData.value = data.value || { data: [] };
    } catch (err: any) {
      error.value =
        err?.data?.statusMessage ||
        err?.message ||
        "Gagal memuat data pencairan PPK.";
    } finally {
      loading.value = false;
    }
  };

  const encodeUrlId = (id: number): string => {
    if (!Number.isFinite(id) || id === 0) {
      console.warn("⚠️ encodeUrlId: invalid id", id);
      return "0";
    }

    if (id <= -1_000_000) {
      return `g${Math.abs(id) - 1_000_000}`;
    }

    if (id < 0) {
      return `v${Math.abs(id)}`;
    }

    return String(id);
  };

  const normalizeStatusPencairan = (status?: string) => {
    switch (status) {
      case "TERVERIFIKASI":
      case "DOKUMEN_LENGKAP":
        return "dokumen_lengkap";

      case "DIKEMBALIKAN":
        return "dikembalikan";

      case "SELESAI":
      case "COMPLETED":
        return "selesai";

      default:
        return "menunggu_dokumen";
    }
  };

  const pencairanList = computed<PencairanItem[]>(() =>
    (pencairanData.value?.data || [])
      .map((item: any, idx: number) => {
        const docs = item.syaratDokumen || [];

        const uploadedDocs = docs.filter((doc: any) =>
          Boolean(doc.uploaded || doc.url),
        ).length;

        const totalDocs = docs.length || 1;
        const rawId = Number(item.id);

        if (!Number.isFinite(rawId) || rawId === 0 || rawId === undefined) {
          console.warn(
            `⚠️ Item ${idx} memiliki id invalid:`,
            item.id,
            "item:",
            item,
          );
          return null;
        }

        return {
          id: rawId,
          urlId: encodeUrlId(rawId),
          namaKegiatan: item.kegiatan?.judulKegiatan || item.namaKegiatan || "",
          namaOrmawa: item.ormawa?.nama || item.namaOrmawa || "",
          kodeOrmawa: item.ormawa?.kode || item.kodeOrmawa || "",
          tipeTagihan: item.tipeTagihan || "",
          namaPenerima: item.namaPenerima || "",
          rekeningPenerima: item.rekeningPenerima || "",
          totalDana: Number(item.nominal ?? item.totalDana ?? 0),
          tanggalPengajuan: item.createdAt || item.tanggalPengajuan || "",
          statusPencairan: normalizeStatusPencairan(
            item.statusTagihan || item.status,
          ),
          syaratDokumen: docs,
          uploadedDocs,
          totalDocs,
          docPct: Math.round((uploadedDocs / totalDocs) * 100),
        };
      })
      .filter(Boolean) as PencairanItem[],
  );

  const filteredList = computed(() => {
    const q = searchQuery.value.toLowerCase();

    return pencairanList.value.filter((item) => {
      const matchSearch =
        !q ||
        item.namaKegiatan.toLowerCase().includes(q) ||
        item.namaOrmawa.toLowerCase().includes(q) ||
        item.namaPenerima.toLowerCase().includes(q);

      const matchStatus =
        !filterStatus.value || item.statusPencairan === filterStatus.value;

      return matchSearch && matchStatus;
    });
  });

  const stats = computed(() => [
    {
      label: "Total Pengajuan",
      value: pencairanList.value.length,
      caption: "Barang dan jasa",
      icon: "heroicons:document-text",
      iconClass: "bg-[#3b5988]/10 text-[#3b5988]",
      textClass: "text-slate-400",
    },
    {
      label: "Menunggu",
      value: pencairanList.value.filter(
        (item) => item.statusPencairan === "menunggu_dokumen",
      ).length,
      caption: "Perlu ditinjau",
      icon: "heroicons:clock",
      iconClass: "bg-amber-500/10 text-amber-600",
      textClass: "text-amber-600",
    },
    {
      label: "Dokumen Lengkap",
      value: pencairanList.value.filter((item) => item.docPct === 100).length,
      caption: "Siap diproses",
      icon: "heroicons:document-check",
      iconClass: "bg-emerald-500/10 text-emerald-600",
      textClass: "text-emerald-600",
    },
    {
      label: "Perlu Revisi",
      value: pencairanList.value.filter(
        (item) => item.statusPencairan === "dikembalikan",
      ).length,
      caption: "Catatan dikirim",
      icon: "heroicons:arrow-path",
      iconClass: "bg-orange-500/10 text-orange-600",
      textClass: "text-orange-600",
    },
  ]);

  const goDetail = (urlId: string) => {
    return navigateTo(`/dashboard/ppk/detailPencairan/${urlId}`);
  };

  const typeClass = (type: string) => {
    return type === "BARANG"
      ? "bg-blue-50 text-blue-700"
      : "bg-purple-50 text-purple-700";
  };

  const statusClass = (status: string) => {
    const map: Record<string, string> = {
      menunggu_dokumen: "bg-amber-100 text-amber-700",
      dokumen_lengkap: "bg-blue-100 text-blue-700",
      dikembalikan: "bg-orange-100 text-orange-700",
      selesai: "bg-emerald-100 text-emerald-700",
    };

    return map[status] || "bg-slate-100 text-slate-600";
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      menunggu_dokumen: "Menunggu",
      dokumen_lengkap: "Dokumen Lengkap",
      dikembalikan: "Revisi",
      selesai: "Selesai",
    };

    return map[status] || status;
  };

  const formatRp = (value?: number) => {
    return "Rp " + new Intl.NumberFormat("id-ID").format(value || 0);
  };

  const formatDate = (date?: string) => {
    return date
      ? new Date(date).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "-";
  };

  return {
    pencairanData,

    searchQuery,
    filterStatus,

    loading,
    error,

    todayStr,

    fetchPencairan,

    pencairanList,
    filteredList,
    stats,

    encodeUrlId,
    normalizeStatusPencairan,

    goDetail,
    typeClass,
    statusClass,
    statusLabel,
    formatRp,
    formatDate,
  };
});