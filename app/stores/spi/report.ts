import { defineStore } from "pinia";
import { ref } from "vue";

export interface RabLpgSummary {
  waiting: number;
  approved: number;
  rejected: number;
  revision: number;
  totalRevisions: number;
}

export interface LpgSummary {
  waiting: number;
  approved: number;
  revision: number;
}

export interface UnitPerformance {
  ormawaId: number;
  ormawaName: string;
  totalRab: number;
  approvedRab: number;
  rejectedRab: number;
  revisions: number;
}

export interface FinancialSummary {
  totalQuota: number;
  totalProposed: number;
  totalRealized: number;
  remaining: number;
}

export interface OrmawaFinancialBreakdown {
  ormawaId: number;
  ormawaName: string;
  quota: number;
  proposed: number | null;
  realized: number | null;
}

export interface FakultasFinancialBreakdown {
  fakultasId: number;
  fakultasName: string;
  quota: number;
  proposed: number | null;
  realized: number | null;
}

export const useSpiReportStore = defineStore("spi-report", () => {
  const loading = ref(false);
  const error = ref<string | null>(null);

  const rabLpgData = ref<{
    rabSummary: RabLpgSummary;
    lpgSummary: LpgSummary;
    unitPerformance: UnitPerformance[];
  } | null>(null);

  const financialData = ref<{
    summary: FinancialSummary;
    ormawaBreakdown: OrmawaFinancialBreakdown[];
    fakultasBreakdown: FakultasFinancialBreakdown[];
  } | null>(null);

  const filters = ref({
    fakultasId: "",
    prodiId: "",
    ormawaId: "",
    startDate: "",
    endDate: "",
  });

  const fetchRabLpgReport = async () => {
    loading.value = true;
    error.value = null;
    try {
      const query = { ...filters.value };
      const response = await $fetch<any>("/api/spi/report/rabLpg", { query });
      console.log(response);
      if (response.success) {
        rabLpgData.value = response.data;
      } else {
        error.value = response.message;
      }
    } catch (err: any) {
      error.value =
        err.data?.message || err.message || "Gagal mengambil laporan RAB & LPG";
    } finally {
      loading.value = false;
    }
  };

  const fetchFinancialReport = async () => {
    loading.value = true;
    error.value = null;
    try {
      const query = { ...filters.value };
      const response = await $fetch<any>("/api/spi/report/financial", {
        query,
      });
      console.log(response);
      if (response.success) {
        financialData.value = response.data;
      } else {
        error.value = response.message;
      }
    } catch (err: any) {
      error.value =
        err.data?.message || err.message || "Gagal mengambil laporan keuangan";
    } finally {
      loading.value = false;
    }
  };

  const resetFilters = () => {
    filters.value = {
      fakultasId: "",
      prodiId: "",
      ormawaId: "",
      startDate: "",
      endDate: "",
    };
  };

  return {
    loading,
    error,
    rabLpgData,
    financialData,
    filters,
    fetchRabLpgReport,
    fetchFinancialReport,
    resetFilters,
  };
});
