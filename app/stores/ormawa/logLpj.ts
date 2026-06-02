import { defineStore } from "pinia";
import { ref } from "vue";

interface Actor {
  fullname: string;
  role: string;
}

interface LpgLog {
  id: number;
  catatanRevisi: string;
  createdAt: string;
  actor: Actor;
}

interface LpgLogResponse {
  success: boolean;
  data: LpgLog[];
  total: number;
  hasMore: boolean;
}

export const useLogLpjStore = defineStore("logLpj", () => {
  const logs = ref<LpgLog[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const total = ref(0);
  const hasMore = ref(false);

  const fetchLogs = async (rabId: number | string, isLoadMore = false) => {
    loading.value = true;
    error.value = null;

    if (!isLoadMore) {
      logs.value = [];
    }

    const offset = isLoadMore ? logs.value.length : 0;

    try {
      const response = await $fetch<LpgLogResponse>(
        "/api/ormawa/Lpg/getLogs",
        {
          method: "POST",
          body: { rabId, limit: 5, offset },
        }
      );
      if (response.success) {
        if (isLoadMore) {
          logs.value = [...logs.value, ...response.data];
        } else {
          logs.value = response.data;
        }
        total.value = response.total;
        hasMore.value = response.hasMore;
      }
    } catch (err: any) {
      error.value = err.message || "Gagal mengambil log LPJ";
      console.error("Fetch LPG logs error:", err);
    } finally {
      loading.value = false;
    }
  };

  const clearLogs = () => {
    logs.value = [];
    total.value = 0;
    hasMore.value = false;
  };

  return {
    logs,
    loading,
    error,
    total,
    hasMore,
    fetchLogs,
    clearLogs,
  };
});
