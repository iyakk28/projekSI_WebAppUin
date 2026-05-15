// stores/ormawa/uploadDokumen.ts
import { defineStore } from "pinia";

export const useKegiatanStore = defineStore("kegiatan", {
  state: () => ({
    kegiatan: null as any, // info kegiatan
    dokumentasiList: [] as any[],
    barangList: [] as any[],
    jasaList: [] as any[],
    loading: false,
    dokumentasiUploading: false,
    barangUploading: false,
    jasaUploading: false,
    popupMessage: "",
    popupVisible: false,
  }),

  actions: {
    async fetchAllUploads(kegiatanId: number) {
      this.loading = true;
      try {
        const response = await $fetch(
          `/api/ormawa/dokumentasi/getAllDokumentasi`,
          {
            body: { kegiatanId },
            method: "post",
          },
        );
        console.log(response);
        this.kegiatan = response;
      } catch (err) {
        console.error(err);
        alert("Gagal memuat data kegiatan");
      } finally {
        this.loading = false;
      }
    },

    async submitDokumentasi(fd: FormData) {
      this.dokumentasiUploading = true;
      try {
        await $fetch("/api/ormawa/dokumentasi/dokumentasiKegiatan", {
          method: "POST",
          body: fd,
        });
        this.popupMessage = "Berhasil mengupload dokumentasi kegiatan";
        this.popupVisible = true;
        // Refresh data setelah sukses
        const kegiatanId = fd.get("kegiatanId") as string;
        if (kegiatanId) await this.fetchAllUploads(parseInt(kegiatanId));
      } catch {
        alert("Gagal upload dokumentasi");
      } finally {
        this.dokumentasiUploading = false;
      }
    },

    async submitBarang(fd: FormData) {
      this.barangUploading = true;
      try {
        await $fetch("/api/ormawa/dokumentasi/dokumentasiBarang", {
          method: "POST",
          body: fd,
        });
        this.popupMessage = "Berhasil mengupload barang";
        this.popupVisible = true;
        const kegiatanId = fd.get("kegiatanId") as string;
        if (kegiatanId) await this.fetchAllUploads(parseInt(kegiatanId));
      } catch {
        alert("Gagal upload barang");
      } finally {
        this.barangUploading = false;
      }
    },

    async submitJasa(fd: FormData) {
      this.jasaUploading = true;
      try {
        await $fetch("/api/ormawa/dokumentasi/dokumentasiJasa", {
          method: "POST",
          body: fd,
        });
        this.popupMessage = "Berhasil mengupload jasa";
        this.popupVisible = true;
        const kegiatanId = fd.get("kegiatanId") as string;
        if (kegiatanId) await this.fetchAllUploads(parseInt(kegiatanId));
      } catch {
        alert("Gagal upload jasa");
      } finally {
        this.jasaUploading = false;
      }
    },

    async deleteUpload(item: any) {
      try {
        if (item.jenis === "dokumentasi")
          await $fetch(`/api/dokumentasi/${item.id}`, { method: "DELETE" });
        else if (item.jenis === "barang")
          await $fetch(`/api/barang/${item.id}`, { method: "DELETE" });
        else if (item.jenis === "jasa")
          await $fetch(`/api/jasa/${item.id}`, { method: "DELETE" });

        this.popupMessage = `Berhasil hapus ${item.jenisLabel}`;
        this.popupVisible = true;
        // Refresh data setelah hapus
        if (this.kegiatan?.id) await this.fetchAllUploads(this.kegiatan.id);
      } catch {
        alert("Gagal hapus");
      }
    },

    closePopup() {
      this.popupVisible = false;
    },
  },
});
