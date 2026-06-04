import { defineStore } from "pinia";
import { ref } from "vue";

export interface KomprehensifReportItem {
  id: number;
  nomorPengajuan: string;
  judulKegiatan: string;
  totalAnggaran: string;
  status: string;
  createdAt: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  ormawa: string;
  fakultas: string;
  prodi: string;
}

export const useSpiKomprehensifReportStore = defineStore("spi-komprehensif-report", () => {
  const reportList = ref<KomprehensifReportItem[]>([]);
  const detail = ref<any>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Filter state
  const filters = ref({
    status: "all",
    fakultasId: "",
    prodiId: "",
    ormawaId: "",
    startDate: "",
    endDate: "",
    search: "",
  });

  // Pagination state
  const page = ref(1);
  const limit = ref(10);
  const total = ref(0);

  const fetchReportList = async () => {
    loading.value = true;
    error.value = null;

    try {
      const query: any = {
        page: page.value,
        limit: limit.value,
        status: filters.value.status === "all" ? undefined : filters.value.status,
        fakultasId: filters.value.fakultasId || undefined,
        prodiId: filters.value.prodiId || undefined,
        ormawaId: filters.value.ormawaId || undefined,
        startDate: filters.value.startDate || undefined,
        endDate: filters.value.endDate || undefined,
        search: filters.value.search || undefined,
      };

      const response = await $fetch<any>("/api/spi/komprehensif-report/list", { query });
      if (response.success) {
        reportList.value = response.data;
        total.value = response.total;
      } else {
        error.value = response.message;
      }
    } catch (err: any) {
      error.value = err.data?.message || err.message || "Gagal mengambil data laporan";
    } finally {
      loading.value = false;
    }
  };

  const fetchReportDetail = async (rabId: number) => {
    loading.value = true;
    error.value = null;
    detail.value = null;

    try {
      const response = await $fetch<any>("/api/spi/komprehensif-report/detail", {
        method: "POST",
        body: { rabId },
      });
      if (response.success) {
        detail.value = response.data;
      } else {
        error.value = response.message;
      }
    } catch (err: any) {
      error.value = err.data?.message || err.message || "Gagal mengambil detail laporan";
    } finally {
      loading.value = false;
    }
  };

  const setFilter = (key: keyof typeof filters.value, value: string) => {
    (filters.value as any)[key] = value;
    page.value = 1;
    fetchReportList();
  };

  const resetFilters = () => {
    filters.value = {
      status: "all",
      fakultasId: "",
      prodiId: "",
      ormawaId: "",
      startDate: "",
      endDate: "",
      search: "",
    };
    page.value = 1;
    fetchReportList();
  };

  const changePage = (newPage: number) => {
    page.value = newPage;
    fetchReportList();
  };

  return {
    reportList,
    detail,
    loading,
    error,
    filters,
    page,
    limit,
    total,
    fetchReportList,
    fetchReportDetail,
    setFilter,
    resetFilters,
    changePage,
  };
});
