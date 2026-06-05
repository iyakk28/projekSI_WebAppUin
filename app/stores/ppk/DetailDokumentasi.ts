import { defineStore } from "pinia";

export const usePpkDetailDokumentasiStore = defineStore("ppkDetailDokumentasi", () => {
  const data = ref<any>(null);
  const loading = ref(false);
  const error = ref("");

  const fetchDetail = async (docId: number, type: 'foto' | 'tagihan') => {
    loading.value = true;
    error.value = "";
    try {
      const response = await $fetch<any>(`/api/ppk/pencairan/dokumentasi-detail`, {
        method: "POST",
        body: { id: docId, type }
      });
      data.value = response.data;
    } catch (err: any) {
      error.value = err.message || "Gagal memuat detail dokumentasi";
    } finally {
      loading.value = false;
    }
  };

  const verifikasi = async (docId: number, type: 'foto' | 'tagihan') => {
    loading.value = true;
    try {
      await $fetch(`/api/ppk/pencairan/verifikasi`, {
        method: "POST",
        body: { id: docId, type }
      });
      await fetchDetail(docId, type);
    } catch (err: any) {
      error.value = err.message || "Gagal memverifikasi";
    } finally {
      loading.value = false;
    }
  };

  return {
    data,
    loading,
    error,
    fetchDetail,
    verifikasi,
  };
});
