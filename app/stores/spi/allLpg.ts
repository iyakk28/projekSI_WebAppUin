import { defineStore } from "pinia";
import { ref } from "vue";

export interface SpiLpgListItem {
  rabId: number;
  nomorPengajuan: string;
  judulKegiatan: string;
  totalAnggaran: string;
  rabStatus: string;
  ormawaName: string;
  ormawaLabel: string;
  fakultasName: string;
  prodiName: string;
  lpgId: number | null;
  statusLpg: string | null;
  submittedAt: string | null;
  createdAt: string | null;
}

export const useSpiAllLpgStore = defineStore("spi-all-lpg", () => {
  const lpgList = ref<SpiLpgListItem[]>([]);
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

  const fetchLpgList = async () => {
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

      const response = await $fetch<any>("/api/spi/lpg/allLpg", { query });
      if (response.success) {
        lpgList.value = response.data;
        total.value = response.total;
      } else {
        error.value = response.message;
      }
    } catch (err: any) {
      error.value = err.data?.message || err.message || "Gagal mengambil data LPG";
    } finally {
      loading.value = false;
    }
  };

  const setFilter = (key: keyof typeof filters.value, value: string) => {
    (filters.value as any)[key] = value;
    page.value = 1; // Reset to first page on filter change
    fetchLpgList();
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
    fetchLpgList();
  };

  const changePage = (newPage: number) => {
    page.value = newPage;
    fetchLpgList();
  };

  return {
    lpgList,
    loading,
    error,
    filters,
    page,
    limit,
    total,
    fetchLpgList,
    setFilter,
    resetFilters,
    changePage,
  };
});
