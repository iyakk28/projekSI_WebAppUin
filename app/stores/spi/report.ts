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

export interface ReportDocumentItem {
  nomorPengajuan: string;
  judulKegiatan: string;
  ormawa: string;
  fakultas: string;
  totalAnggaran: string;
  statusRab: string;
  statusLpg: string | null;
  tanggalPengajuan: string;
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

  const detailedDocuments = ref<ReportDocumentItem[]>([]);

  const filters = ref({
    fakultasId: "",
    prodiId: "",
    ormawaId: "",
    startDate: "",
    endDate: "",
    status: "all",
    reportCategory: "overview", // overview, rab_list, lpg_list
    financialCategory: "ormawa", // ormawa, fakultas
  });

  const fetchRabLpgReport = async () => {
    loading.value = true;
    error.value = null;
    try {
      const query = { ...filters.value };
      const response = await $fetch<any>("/api/spi/report/rabLpg", { query });
      if (response.success) {
        rabLpgData.value = response.data;
      } else {
        error.value = response.message;
      }
    } catch (err: any) {
      error.value = err.data?.message || err.message || "Gagal mengambil laporan RAB & LPG";
    } finally {
      loading.value = false;
    }
  };

  const fetchFinancialReport = async () => {
    loading.value = true;
    error.value = null;
    try {
      const query = { ...filters.value };
      const response = await $fetch<any>("/api/spi/report/financial", { query });
      if (response.success) {
        financialData.value = response.data;
      } else {
        error.value = response.message;
      }
    } catch (err: any) {
      error.value = err.data?.message || err.message || "Gagal mengambil laporan keuangan";
    } finally {
      loading.value = false;
    }
  };

  const fetchDetailedDocuments = async () => {
    loading.value = true;
    error.value = null;
    try {
      const query = { 
        ...filters.value,
        type: filters.value.reportCategory === 'rab_list' ? 'rab' : 'lpg'
      };
      const response = await $fetch<any>("/api/spi/report/rawExport", { query });
      if (response.success) {
        let data = response.data;
        // Client side status filtering if needed, or backend handles it
        if (filters.value.status !== 'all') {
          if (filters.value.reportCategory === 'rab_list') {
            data = data.filter((d: any) => d.statusRab === filters.value.status);
          } else {
            data = data.filter((d: any) => d.statusLpg === filters.value.status);
          }
        }
        detailedDocuments.value = data;
      } else {
        error.value = response.message;
      }
    } catch (err: any) {
      error.value = err.data?.message || err.message || "Gagal mengambil detail dokumen";
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
      status: "all",
      reportCategory: "overview",
      financialCategory: "ormawa",
    };
  };

  return {
    loading,
    error,
    rabLpgData,
    financialData,
    detailedDocuments,
    filters,
    fetchRabLpgReport,
    fetchFinancialReport,
    fetchDetailedDocuments,
    resetFilters,
  };
});
