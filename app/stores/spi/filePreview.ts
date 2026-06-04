import { defineStore } from "pinia";

export interface LpgFile {
  label: string;
  url: string;
  type: string;
  name: string;
}

export const useSpiLpgFileStore = defineStore("spiLpgFile", {
  state: () => ({
    files: [] as LpgFile[],
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchLpgFiles(lpgId: number) {
      this.loading = true;
      this.error = null;
      try {
        const res = await $fetch<{ success: boolean; data: LpgFile[] }>("/api/spi/lpg/getFile", {
          method: "POST",
          body: { lpgId },
        });
        if (res.success) {
          this.files = res.data;
        }
      } catch (err: any) {
        this.error = err.data?.message || "Gagal mengambil file LPG";
      } finally {
        this.loading = false;
      }
    },

    clearFiles() {
      this.files = [];
    }
  },
});
