import { defineStore } from "pinia";

export const usePpkDetailPencairanStore = defineStore("ppkDetailPencairan", () => {
  const data = ref<any>(null);
  const loading = ref(false);
  const error = ref("");

  const fetchDetail = async (id: number) => {
    loading.value = true;
    error.value = "";
    try {
      const response = await $fetch<any>(`/api/ppk/pencairan/detail`, {
        method: "POST",
        body: { id }
      });
      data.value = response.data;
    } catch (err: any) {
      error.value = err.message || "Gagal memuat detail pencairan";
    } finally {
      loading.value = false;
    }
  };

  const confirmLunas = async (id: number) => {
    loading.value = true;
    try {
      await $fetch(`/api/ppk/pencairan/lunas`, { 
        method: "POST",
        body: { id }
      });
      await fetchDetail(id);
    } catch (err: any) {
      error.value = err.message || "Gagal mengonfirmasi lunas";
    } finally {
      loading.value = false;
    }
  };

  return {
    data,
    loading,
    error,
    fetchDetail,
    confirmLunas,
  };
});
