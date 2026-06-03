import { defineStore } from "pinia";

interface OrmawaData {
  id: number;
  kode: string;
  nama: string;
  anggaran?: {
    total: number;
    terpakai: number;
    sisa: number;
  };
  totalKegiatan?: number;
  disetujuiCount?: number;
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

interface KaprodiActivity {
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

interface ProdiData {
  id: number;
  nama: string;
  fakultasId: number;
  ormawa: OrmawaData[];
}

export const useKaprodiDashboardStore = defineStore(
  "kaprodiDashboard",
  () => {
    const dashboardData = ref<{
      data: DashboardData;
      activities: KaprodiActivity[];
    } | null>(null);

    const ormawaDataResponse = ref<{
      data: OrmawaData[];
      summary: SummaryData;
      prodi: ProdiData;
    } | null>(null);

    const fetchDashboard = async () => {
      const { data, error } = await useFetch<{
        data: DashboardData;
        activities: KaprodiActivity[];
      }>("/api/kaprodi/dashboard");

      if (error.value) {
        console.error("Gagal mengambil data dashboard kaprodi:", error.value);
        return;
      }

      dashboardData.value = data.value || null;
    };

    const fetchOrmawaAnggaran = async () => {
      const { data, error } = await useFetch<{
        data: OrmawaData[];
        summary: SummaryData;
        prodi: ProdiData;
      }>("/api/kaprodi/ormawa-anggaran");

      if (error.value) {
        console.error("Gagal mengambil data ormawa anggaran:", error.value);
        return;
      }

      ormawaDataResponse.value = data.value || null;
    };

    const fetchAll = async () => {
      await Promise.all([fetchDashboard(), fetchOrmawaAnggaran()]);
    };

    const currentProdi = computed(() => {
      return ormawaDataResponse.value?.prodi || null;
    });

    const todayStr = computed(() =>
      new Date().toLocaleDateString("id-ID", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    );

    const ormawaList = computed<OrmawaData[]>(() => {
      return ormawaDataResponse.value?.data || [];
    });

    const summaryData = computed(() => ({
      totalAnggaran:
        ormawaDataResponse.value?.summary?.totalAnggaranKeseluruhan || 0,
      totalTerpakai:
        ormawaDataResponse.value?.summary?.totalTerpakaiKeseluruhan || 0,
      totalSisa:
        ormawaDataResponse.value?.summary?.totalSisaKeseluruhan || 0,
    }));

    const totalOrmawa = computed(() => {
      return ormawaList.value.length;
    });

    const budgetUsedPct = computed(() => {
      const total = summaryData.value.totalAnggaran;

      return total
        ? Math.min(
            Math.round((summaryData.value.totalTerpakai / total) * 100),
            100,
          )
        : 0;
    });

    const budgetBars = computed(() => {
      const maxAnggaran = Math.max(
        ...ormawaList.value.map((o) => o.anggaran?.total || 0),
        1,
      );

      return ormawaList.value.map((o) => ({
        kode: o.kode,
        anggaran: o.anggaran?.total || 0,
        terpakai: o.anggaran?.terpakai || 0,
        totalPct: Math.round(((o.anggaran?.total || 0) / maxAnggaran) * 100),
        usedPct: Math.round(
          ((o.anggaran?.terpakai || 0) / maxAnggaran) * 100,
        ),
      }));
    });

    const statusList = computed(() => {
      const d = dashboardData.value?.data || {
        total: 0,
        disetujui: 0,
        menunggu: 0,
        revisi: 0,
        ditolak: 0,
      };

      const total = d.total || 1;

      return [
        {
          label: "Disetujui",
          count: d.disetujui || 0,
          color: "#4ade80",
          pct: Math.round(((d.disetujui || 0) / total) * 100),
        },
        {
          label: "Menunggu",
          count: d.menunggu || 0,
          color: "#93c5fd",
          pct: Math.round(((d.menunggu || 0) / total) * 100),
        },
        {
          label: "Revisi",
          count: d.revisi || 0,
          color: "#f5c518",
          pct: Math.round(((d.revisi || 0) / total) * 100),
        },
        {
          label: "Ditolak",
          count: d.ditolak || 0,
          color: "#f87171",
          pct: Math.round(((d.ditolak || 0) / total) * 100),
        },
      ];
    });

    const ormawaProgressRows = computed(() =>
      ormawaList.value.map((o) => ({
        id: o.id,
        kode: o.kode,
        kegiatan: o.totalKegiatan || 0,
        disetujui: o.disetujuiCount || 0,
        progPct: o.totalKegiatan
          ? Math.round(((o.disetujuiCount || 0) / o.totalKegiatan) * 100)
          : 0,
      })),
    );

    const activityRows = computed(() => {
      return dashboardData.value?.activities || [];
    });

    const getLpjStatus = (status: string) => {
      switch (status) {
        case "waiting_spi":
          return "Menunggu SPI";

        case "selesai_spi":
          return "LPJ Selesai";

        case "disetujui":
          return "Disetujui PPK";

        case "waiting_ppk":
          return "Menunggu PPK";

        case "revisi_ppk":
          return "Revisi PPK";

        case "waiting_kaprodi":
          return "Menunggu Kaprodi";

        case "revisi_kaprodi":
          return "Revisi Kaprodi";

        case "ditolak_spi":
          return "Ditolak SPI";

        default:
          return status.replaceAll("_", " ");
      }
    };

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
      dashboardData,
      ormawaDataResponse,

      fetchDashboard,
      fetchOrmawaAnggaran,
      fetchAll,

      currentProdi,
      todayStr,
      ormawaList,
      summaryData,
      totalOrmawa,
      budgetUsedPct,
      budgetBars,
      statusList,
      ormawaProgressRows,
      activityRows,

      getLpjStatus,
      formatRp,
      formatRpShort,
    };
  },
);