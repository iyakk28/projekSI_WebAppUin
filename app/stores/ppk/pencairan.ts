import { defineStore } from "pinia";

export interface PencairanActivity {
  id: number;
  judulKegiatan: string;
  ormawaName: string;
  ormawaKode: string;
  pengajuNama: string;
  statusKegiatan: string;
  createdAt: string;
  latestUpload: string;
  docCounts: {
    foto: number;
    tagihan: number;
  };
  docDescription: string;
}

export const usePpkPencairanStore = defineStore("ppkPencairan", () => {
  const activities = ref<PencairanActivity[]>([]);
  const loading = ref(false);
  const error = ref("");
  const filterStatus = ref("ALL");
  const searchQuery = ref("");

  const fetchActivities = async () => {
    loading.value = true;
    error.value = "";
    try {
      const response = await $fetch<any>("/api/ppk/pencairan/list", {
        method: "POST",
        body: { status: filterStatus.value }
      });
      activities.value = response.data || [];
    } catch (err: any) {
      error.value = err.message || "Gagal memuat data pencairan";
    } finally {
      loading.value = false;
    }
  };

  const filteredActivities = computed(() => {
    const q = searchQuery.value.toLowerCase();
    return activities.value.filter(
      (a) =>
        a.judulKegiatan.toLowerCase().includes(q) ||
        a.ormawaName.toLowerCase().includes(q) ||
        a.pengajuNama.toLowerCase().includes(q)
    );
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return {
    activities,
    loading,
    error,
    filterStatus,
    searchQuery,
    fetchActivities,
    filteredActivities,
    formatDate,
  };
});
