// stores/approveLog.ts
import { defineStore } from "pinia";

interface Actor {
  fullname: string;
  role: string;
}

interface ApprovalLogData {
  id: number;
  pengajuanRabId: number;
  actorId: number;
  action: "setuju" | "tolak" | "revisi";
  catatanRevisi?: string | null;
  createdAt: string;
}

interface ApprovalLog {
  approvalLog: ApprovalLogData;
  actor: Actor;
}

interface ApprovalLogResponse {
  success: boolean;
  data: ApprovalLog[];
  total: number;
  hasMore: boolean;
}

export const useApproveLog = defineStore("approveLog", () => {
  const logs = ref<ApprovalLog[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const total = ref(0);
  const hasMore = ref(false);

  const hasLogs = computed(() => logs.value.length > 0);
  const latestLog = computed(() => logs.value[0]); // Karena diurutkan desc

  // Contoh getter untuk memfilter berdasarkan action
  const approvedLogs = computed(() =>
    logs.value.filter((log) => log.approvalLog.action === "setuju"),
  );
  const rejectedLogs = computed(() =>
    logs.value.filter((log) => log.approvalLog.action === "tolak"),
  );
  const revisionLogs = computed(() =>
    logs.value.filter((log) => log.approvalLog.action === "revisi"),
  );

  async function fetchApprovalLogs(rabId: number | string, isLoadMore = false) {
    loading.value = true;
    error.value = null;

    const offset = isLoadMore ? logs.value.length : 0;

    try {
      const response = await $fetch<ApprovalLogResponse>(
        "/api/ormawa/Rab/approvalLog",
        {
          method: "POST",
          body: { rabId, limit: 5, offset },
        },
      );

      if (response.success) {
        if (isLoadMore) {
          logs.value = [...logs.value, ...response.data];
        } else {
          logs.value = response.data;
        }
        total.value = response.total;
        hasMore.value = response.hasMore;
      } else {
        throw new Error("Failed to fetch approval logs");
      }
    } catch (err: any) {
      error.value = err.message || "An error occurred";
      console.error("Fetch approval logs error:", err);
    } finally {
      loading.value = false;
    }
  }

  function clearLogs() {
    logs.value = [];
    error.value = null;
    total.value = 0;
    hasMore.value = false;
  }

  function addLog(log: ApprovalLog) {
    logs.value.unshift(log); // Tambahkan di awal karena desc
  }

  return {
    logs,
    loading,
    error,
    total,
    hasMore,
    hasLogs,
    latestLog,
    approvedLogs,
    rejectedLogs,
    revisionLogs,
    fetchApprovalLogs,
    clearLogs,
    addLog,
  };
});
