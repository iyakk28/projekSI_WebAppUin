import { defineStore } from "pinia";

export const usePpkActivityDetailStore = defineStore("ppkActivityDetail", () => {
  const data = ref<any>(null);
  const loading = ref(false);
  const error = ref("");
  const filterDocStatus = ref("ALL");

  const fetchDetail = async (id: number) => {
    loading.value = true;
    error.value = "";
    try {
      const response = await $fetch<any>("/api/ppk/pencairan/activity-detail", {
        method: "POST",
        body: { id }
      });
      data.value = response.data;
    } catch (err: any) {
      error.value = err.message || "Gagal memuat detail kegiatan";
    } finally {
      loading.value = false;
    }
  };

  const filteredDocs = computed(() => {
    if (!data.value?.dokumentasi) return [];
    if (filterDocStatus.value === "ALL") return data.value.dokumentasi;
    
    return data.value.dokumentasi.filter((doc: any) => {
      if (filterDocStatus.value === "REVISI") return doc.status === "REVISI" || doc.status === "DIKEMBALIKAN";
      if (filterDocStatus.value === "TERVERIFIKASI") return doc.status === "DITERIMA" || doc.status === "TERVERIFIKASI";
      if (filterDocStatus.value === "LUNAS") return doc.status === "SELESAI";
      return true;
    });
  });

  return {
    data,
    loading,
    error,
    filterDocStatus,
    fetchDetail,
    filteredDocs,
  };
});
