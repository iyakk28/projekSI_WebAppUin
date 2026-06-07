import { defineStore } from "pinia";

interface OrmawaAnggaran {
  id: number;
  kode: string;
  nama: string;
  anggaran?: {
    total: number;
    terpakai: number;
    sisa: number;
  };
  totalKegiatan?: number;
  stats?: {
    menunggu: number;
    revisi: number;
    disetujui: number;
    ditolak: number;
  };
}

interface FakultasApiResponse {
  fakultas: {
    id: number;
    nama: string;
  };
  ormawa: OrmawaAnggaran[];
}

interface FakultasData {
  id: number;
  nama: string;
  ormawa: OrmawaAnggaran[];
}

interface DashboardData {
  total: number;
  disetujui: number;
  menunggu: number;
  revisi: number;
  ditolak: number;
}

interface SummaryData {
  totalAnggaranKeseluruhan: number;
  totalTerpakaiKeseluruhan: number;
  totalSisaKeseluruhan: number;
}

interface PpkActivity {
  id: number;
  nomorPengajuan: string;
  judulKegiatan: string;
  status: string;
  statusKegiatan: string | null;
  ormawa: {
    id: number | null;
    nama: string;
    kode: string;
  };
  totalAnggaran: number;
  tanggalMulai: string | null;
  tanggalSelesai: string | null;
  pencairan: {
    totalTagihan: number;
    selesaiTagihan: number;
    nominalSelesai: number;
    statuses: string[];
  };
}

export const usePpkDashboardStore = defineStore("ppkDashboard", () => {
  const dashData = ref<DashboardData | null>(null);

  const ormawaData = ref<{
    data: FakultasApiResponse[];
    summary: SummaryData;
  } | null>(null);

  const kegiatanData = ref<{
    success: boolean;
    summary: {
      totalMasuk: number;
      totalWaitingPPK: number;
      totalRevisiPPK: number;
      totalWaitingSPI: number;
      totalSelesaiSPI: number;
    };
    data: PpkActivity[];
  } | null>(null);

  const selectedOrmawaId = ref<string>("");
  const selectedOrmawa = ref<OrmawaAnggaran | null>(null);

  const loading = ref(false);
  const error = ref("");

  const fetchDashboard = async () => {
    const { data, error } = await useFetch<DashboardData>("/api/ppk/dashboard");

    if (error.value) {
      console.error("Gagal mengambil dashboard PPK:", error.value);
      throw error.value;
    }

    dashData.value = data.value || null;
  };

  const fetchOrmawaAnggaran = async () => {
    const { data, error } = await useFetch<{
      data: FakultasApiResponse[];
      summary: SummaryData;
    }>("/api/ppk/dashboard/ormawa-anggaran"); // Update URL to match optimized API

    if (error.value) {
      console.error("Gagal mengambil anggaran Ormawa:", error.value);
      throw error.value;
    }

    ormawaData.value = data.value || null;
  };

  const fetchKegiatan = async () => {
    const { data, error } = await useFetch<{
      success: boolean;
      summary: {
        totalMasuk: number;
        totalWaitingPPK: number;
        totalRevisiPPK: number;
        totalWaitingSPI: number;
        totalSelesaiSPI: number;
      };
      data: PpkActivity[];
    }>("/api/ppk/kegiatan");

    if (error.value) {
      console.error("Gagal mengambil kegiatan PPK:", error.value);
      throw error.value;
    }

    kegiatanData.value = data.value || null;
  };

  const fetchAll = async () => {
    loading.value = true;
    error.value = "";

    try {
      await Promise.all([
        fetchDashboard(),
        fetchOrmawaAnggaran(),
        fetchKegiatan(),
      ]);
    } catch (err: any) {
      error.value =
        err?.data?.statusMessage ||
        err?.message ||
        "Gagal memuat data dashboard PPK.";
    } finally {
      loading.value = false;
    }
  };

  const todayStr = computed(() =>
    new Date().toLocaleDateString("id-ID", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  );

  const ormawaList = computed<FakultasData[]>(() => {
    return (
      ormawaData.value?.data?.map((fak) => ({
        id: fak.fakultas.id,
        nama: fak.fakultas.nama,
        ormawa: fak.ormawa,
      })) || []
    );
  });

  const allOrmawa = computed<OrmawaAnggaran[]>(() => {
    return ormawaList.value.flatMap((f) => f.ormawa);
  });

  const onOrmawaChange = () => {
    if (!selectedOrmawaId.value) {
      selectedOrmawa.value = null;
      return;
    }

    selectedOrmawa.value =
      allOrmawa.value.find(
        (ormawa) => ormawa.id === Number(selectedOrmawaId.value),
      ) || null;
  };

  const currentData = computed(() => {
    const summary = ormawaData.value?.summary;

    if (!selectedOrmawa.value) {
      return {
        totalAnggaran: summary?.totalAnggaranKeseluruhan || 0,
        terpakai: summary?.totalTerpakaiKeseluruhan || 0,
        sisa: summary?.totalSisaKeseluruhan || 0,
        totalKegiatan: dashData.value?.total || 0,
      };
    }

    const ormawa = selectedOrmawa.value;

    return {
      totalAnggaran: ormawa.anggaran?.total || 0,
      terpakai: ormawa.anggaran?.terpakai || 0,
      sisa: ormawa.anggaran?.sisa || 0,
      totalKegiatan: ormawa.totalKegiatan || 0,
    };
  });

  const usedPct = computed(() => {
    const total = currentData.value.totalAnggaran;

    return total
      ? Math.min(Math.round((currentData.value.terpakai / total) * 100), 100)
      : 0;
  });

  const barData = computed(() => {
    const maxAnggaran = Math.max(
      ...allOrmawa.value.map((ormawa) => ormawa.anggaran?.total || 0),
      1,
    );

    return allOrmawa.value.map((ormawa) => ({
      kode: ormawa.kode,
      anggaran: ormawa.anggaran?.total || 0,
      terpakai: ormawa.anggaran?.terpakai || 0,
      totalPct: Math.round(((ormawa.anggaran?.total || 0) / maxAnggaran) * 100),
      usedPct: Math.round(
        ((ormawa.anggaran?.terpakai || 0) / maxAnggaran) * 100,
      ),
    }));
  });

  const statusData = computed(() => {
    // If an ormawa is selected, use its specific stats
    if (selectedOrmawa.value?.stats) {
      const stats = selectedOrmawa.value.stats;
      const total = (selectedOrmawa.value.totalKegiatan || 0) || 1;
      
      return [
        {
          label: "Disetujui",
          count: stats.disetujui,
          color: "#4ade80",
          pct: Math.round((stats.disetujui / total) * 100),
        },
        {
          label: "Menunggu",
          count: stats.menunggu,
          color: "#93c5fd",
          pct: Math.round((stats.menunggu / total) * 100),
        },
        {
          label: "Revisi",
          count: stats.revisi,
          color: "#f5c518",
          pct: Math.round((stats.revisi / total) * 100),
        },
        {
          label: "Ditolak",
          count: stats.ditolak,
          color: "#f87171",
          pct: Math.round((stats.ditolak / total) * 100),
        },
      ];
    }

    // Default to overall dashboard stats
    const data = dashData.value || {
      total: 0,
      disetujui: 0,
      menunggu: 0,
      revisi: 0,
      ditolak: 0,
    };

    const total = data.total || 1;

    return [
      {
        label: "Disetujui",
        count: data.disetujui || 0,
        color: "#4ade80",
        pct: Math.round(((data.disetujui || 0) / total) * 100),
      },
      {
        label: "Menunggu",
        count: data.menunggu || 0,
        color: "#93c5fd",
        pct: Math.round(((data.menunggu || 0) / total) * 100),
      },
      {
        label: "Revisi",
        count: data.revisi || 0,
        color: "#f5c518",
        pct: Math.round(((data.revisi || 0) / total) * 100),
      },
      {
        label: "Ditolak",
        count: data.ditolak || 0,
        color: "#f87171",
        pct: Math.round(((data.ditolak || 0) / total) * 100),
      },
    ];
  });

  const ormawaRows = computed(() => {
    return allOrmawa.value.map((ormawa) => ({
      id: ormawa.id,
      nama: ormawa.nama,
      kegiatan: ormawa.totalKegiatan || 0,
      disetujui: ormawa.stats?.disetujui || 0, // Using stats.disetujui from new API
      progPct: ormawa.totalKegiatan
        ? Math.round(
            ((ormawa.stats?.disetujui || 0) / ormawa.totalKegiatan) * 100,
          )
        : 0,
    }));
  });

  const activityRows = computed(() => {
    let list = kegiatanData.value?.data || [];
    
    // Filter by selected Ormawa if applicable
    if (selectedOrmawaId.value) {
      list = list.filter(item => item.ormawa.id === Number(selectedOrmawaId.value));
    }

    return list.map((item) => ({
      ...item,
      lpjStatus:
        item.status === "selesai_spi"
          ? "LPJ Selesai"
          : item.status === "waiting_spi"
            ? "Menunggu SPI"
            : item.status === "ditolak_spi"
              ? "Ditolak SPI"
              : "Belum sampai SPI",
      pencairanLabel: item.pencairan.selesaiTagihan
        ? `${item.pencairan.selesaiTagihan} / ${item.pencairan.totalTagihan}`
        : "Belum cair",
      pencairanNominal: item.pencairan.nominalSelesai || 0,
    }));
  });

  const formatRp = (n: number) => {
    return "Rp " + new Intl.NumberFormat("id-ID").format(n || 0);
  };

  const formatRpShort = (n: number) => {
    if (n >= 1_000_000) {
      return "Rp " + (n / 1_000_000).toFixed(1) + "jt";
    }

    if (n >= 1_000) {
      return "Rp " + (n / 1_000).toFixed(0) + "rb";
    }

    return "Rp " + n;
  };

  return {
    dashData,
    ormawaData,
    kegiatanData,

    selectedOrmawaId,
    selectedOrmawa,

    loading,
    error,

    fetchDashboard,
    fetchOrmawaAnggaran,
    fetchKegiatan,
    fetchAll,

    todayStr,
    ormawaList,
    allOrmawa,
    currentData,
    usedPct,
    barData,
    statusData,
    ormawaRows,
    activityRows,

    onOrmawaChange,
    formatRp,
    formatRpShort,
  };
});
