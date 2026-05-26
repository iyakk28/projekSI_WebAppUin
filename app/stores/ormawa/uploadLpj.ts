import { defineStore } from "pinia";

export const useUploadLpjStore = defineStore("uploadLpj", {
  state: () => ({
    loading: false,
    error: null as string | null,
    successMessage: null as string | null,
  }),

  actions: {
    async uploadLpj(rabId: number, file: File, ormawaNotes: string) {
      this.loading = true;
      this.error = null;
      this.successMessage = null;

      try {
        const formData = new FormData();
        formData.append("rabId", rabId.toString());
        formData.append("fileLpj", file);
        if (ormawaNotes) {
          formData.append("ormawaNotes", ormawaNotes);
        }

        const response = await $fetch("/api/ormawa/Lpg/uploadLpj", {
          method: "POST",
          body: formData,
        });

        this.successMessage = "Berhasil mengupload LPJ";
        return response;
      } catch (err: any) {
        this.error = err.data?.message || err.message || "Gagal mengupload LPJ";
        throw err;
      } finally {
        this.loading = false;
      }
    },
  },
});
