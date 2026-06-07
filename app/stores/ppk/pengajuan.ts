import { defineStore } from "pinia";

export interface LunasItem {
  id: number;
  nomorPengajuan: string;
  judulKegiatan: string;
  totalAnggaran: string;
  status: string;
  createdAt: string;
  ormawaNama: string;
  ormawaKode: string;
  prodiNama: string;
  statusKegiatan: string;
  pengajuNama: string;
}

interface FilterOptions {
  prodi: any[];
  ormawa: any[];
  kaprodi: any[];
}

export const usePpkPengajuanStore = defineStore("ppkPengajuan", () => {
  const lunasData = ref<LunasItem[]>([]);
  const totalData = ref(0);
  const filterOptions = ref<FilterOptions>({
    prodi: [],
    ormawa: [],
    kaprodi: [],
  });

  const searchQuery = ref("");
  const selectedOrmawaId = ref("");
  const selectedProdiId = ref("");
  const selectedKaprodiId = ref("");
  const startDate = ref("");
  const endDate = ref("");

  const currentPage = ref(1);
  const pageSize = ref(10);

  const loading = ref(false);
  const error = ref("");

  const fetchLunas = async () => {
    loading.value = true;
    error.value = "";

    try {
      const { data, error: fetchError } = await useFetch<{
        success: boolean;
        data: LunasItem[];
        total: number;
      }>("/api/ppk/pengajuan/lunas", {
        params: {
          ormawaId: selectedOrmawaId.value,
          prodiId: selectedProdiId.value,
          kaprodiId: selectedKaprodiId.value,
          search: searchQuery.value,
          startDate: startDate.value,
          endDate: endDate.value,
          page: currentPage.value,
          limit: pageSize.value,
        },
      });

      if (fetchError.value) throw fetchError.value;

      lunasData.value = data.value?.data || [];
      totalData.value = data.value?.total || 0;
    } catch (err: any) {
      error.value =
        err?.data?.statusMessage ||
        err?.message ||
        "Gagal memuat data pengajuan lunas.";
    } finally {
      loading.value = false;
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const { data } = await useFetch<{
        success: boolean;
        data: FilterOptions;
      }>("/api/ppk/options/filter-options");
      if (data.value?.success) {
        filterOptions.value = data.value.data;
      }
    } catch (err) {
      console.error("Gagal memuat opsi filter:", err);
    }
  };

  const formatRp = (n?: string | number) => {
    return "Rp " + new Intl.NumberFormat("id-ID").format(Number(n) || 0);
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

  const totalPages = computed(() =>
    Math.ceil(totalData.value / pageSize.value),
  );

  const changePage = (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page;
      fetchLunas();
    }
  };

  const applyFilters = () => {
    currentPage.value = 1;
    fetchLunas();
  };

  const resetFilters = () => {
    searchQuery.value = "";
    selectedOrmawaId.value = "";
    selectedProdiId.value = "";
    selectedKaprodiId.value = "";
    startDate.value = "";
    endDate.value = "";
    currentPage.value = 1;
    fetchLunas();
  };

  return {
    lunasData,
    totalData,
    filterOptions,
    searchQuery,
    selectedOrmawaId,
    selectedProdiId,
    selectedKaprodiId,
    startDate,
    endDate,
    currentPage,
    pageSize,
    loading,
    error,
    totalPages,
    fetchLunas,
    fetchFilterOptions,
    changePage,
    applyFilters,
    resetFilters,
    formatRp,
    formatDate,
  };
});
