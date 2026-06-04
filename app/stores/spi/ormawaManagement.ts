import { defineStore } from "pinia";
import { ref } from "vue";

export interface OrmawaListItem {
  id: number;
  nama: string;
  kode: string;
  totalAnggaran: number;
  fakultasId: number;
  prodiId: number | null;
  namaFakultas: string | null;
  namaProdi: string | null;
}

export const useSpiOrmawaManagementStore = defineStore("spi-ormawa-management", () => {
  const ormawa = ref<OrmawaListItem[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Filter state
  const filters = ref({
    fakultasId: "",
    prodiId: "",
    search: "",
  });

  // Pagination state
  const page = ref(1);
  const limit = ref(10);
  const total = ref(0);

  const fetchOrmawa = async () => {
    loading.value = true;
    error.value = null;

    try {
      const query: any = {
        page: page.value,
        limit: limit.value,
        fakultasId: filters.value.fakultasId || undefined,
        prodiId: filters.value.prodiId || undefined,
        search: filters.value.search || undefined,
      };

      const response = await $fetch<any>("/api/spi/management/ormawa", { query });
      if (response.success) {
        ormawa.value = response.data;
        total.value = response.meta.total;
      } else {
        error.value = response.message;
      }
    } catch (err: any) {
      error.value = err.data?.message || err.message || "Gagal mengambil data ormawa";
    } finally {
      loading.value = false;
    }
  };

  const resetFilters = () => {
    filters.value = {
      fakultasId: "",
      prodiId: "",
      search: "",
    };
    page.value = 1;
    fetchOrmawa();
  };

  const changePage = (newPage: number) => {
    page.value = newPage;
    fetchOrmawa();
  };

  return {
    ormawa,
    loading,
    error,
    filters,
    page,
    limit,
    total,
    fetchOrmawa,
    resetFilters,
    changePage,
  };
});
