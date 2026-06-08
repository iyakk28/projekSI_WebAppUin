import { defineStore } from "pinia";

interface DetailRab {
  id: number;
  nomorPengajuan: string;
  judulKegiatan: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  deskripsi: string | null;
  fileRabUrl: string;
  fileTorUrl: string;
  totalAnggaran: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  pengaju: {
    nama: string;
    email: string;
  };
  ormawa: {
    nama: string;
    kode: string;
  };
  riwayat: any[];
}

export const usePpkRabDetailStore = defineStore("ppkRabDetailStore", {
  state: () => ({
    detail: null as DetailRab | null,
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchFullRabData(rabId: number | string) {
      this.loading = true;
      this.error = null;

      try {
        const detailRes = await $fetch<{ success: boolean; data: DetailRab }>(
          `/api/ppk/kegiatan/${rabId}`,
          {
            method: "GET",
          },
        );

        if (!detailRes.success) throw new Error("Gagal mengambil detail RAB");
        this.detail = detailRes.data;
      } catch (err: any) {
        this.error =
          err.data?.statusMessage ||
          err.message ||
          "Terjadi kesalahan saat memuat data";
        console.error("Error fetching RAB/TOR data for PPK:", err);
      } finally {
        this.loading = false;
      }
    },

    getFileUrl(path: string) {
      if (!path || !this.detail?.id) return "";
      return `/api/ppk/pengajuan/${this.detail.id}/file?path=${encodeURIComponent(path)}`;
    }
  },
});
