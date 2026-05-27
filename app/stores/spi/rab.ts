import { defineStore } from "pinia";
import { ref } from "vue";

export const useSpiRabStore = defineStore("spi-rab", () => {
  const rabList = ref<any[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const currentStatus = ref('all');
  
  // Pagination state
  const page = ref(1);
  const limit = ref(10);
  const total = ref(0);

  const fetchRabList = async (status?: string, newPage?: number) => {
    loading.value = true;
    error.value = null;
    
    if (status) {
      currentStatus.value = status;
      page.value = 1; // Reset to first page on status change
    }
    
    if (newPage) {
      page.value = newPage;
    }
    
    try {
      const response = await $fetch<any>("/api/spi/rab", {
        query: { 
          status: currentStatus.value === 'all' ? undefined : currentStatus.value,
          page: page.value,
          limit: limit.value
        }
      });
      if (response.success) {
        rabList.value = response.data;
        total.value = response.total;
      } else {
        error.value = response.message;
      }
    } catch (err: any) {
      error.value = err.message || "Gagal mengambil data RAB";
    } finally {
      loading.value = false;
    }
  };

  const changePage = (newPage: number) => {
    fetchRabList(undefined, newPage);
  };

  return {
    rabList,
    loading,
    error,
    currentStatus,
    page,
    limit,
    total,
    fetchRabList,
    changePage
  };
});
