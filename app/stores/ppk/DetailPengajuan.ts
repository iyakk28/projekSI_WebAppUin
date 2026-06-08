import { defineStore } from "pinia";

interface DetailFull {
  rab: {
    id: number;
    nomorPengajuan: string;
    judulKegiatan: string;
    deskripsi: string;
    totalAnggaran: number;
    tanggalMulai: string;
    tanggalSelesai: string;
    status: string;
    fileRabUrl: string;
    fileTorUrl: string;
    createdAt: string;
    updatedAt: string;
  };
  kegiatan: any;
  dokumentasi: any[];
  tagihan: any[];
  ormawa: any;
  pengaju: {
    nama: string;
    email: string;
  };
}

export const usePpkDetailStore = defineStore("ppkDetailStore", {
  state: () => ({
    detail: null as DetailFull | null,
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchFullData(id: number | string) {
      this.loading = true;
      this.error = null;

      try {
        const res = await $fetch<{ success: boolean; data: DetailFull }>(`/api/ppk/pengajuan/${id}/full-detail`);
        if (res.success) {
          this.detail = res.data;
        }
      } catch (err: any) {
        this.error = err.data?.statusMessage || err.message || "Gagal memuat detail pengajuan";
      } finally {
        this.loading = false;
      }
    },

    // Method baru untuk mendapatkan URL file yang aman dan spesifik per ID Pengajuan
    getFileUrl(path: string) {
        if (!path || !this.detail?.rab.id) return "";
        
        // Gunakan API baru yang memvalidasi path berdasarkan ID Pengajuan
        return `/api/ppk/pengajuan/${this.detail.rab.id}/file?path=${encodeURIComponent(path)}`;
    }
  },
});
