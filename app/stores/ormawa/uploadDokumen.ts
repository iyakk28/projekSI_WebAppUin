// stores/kegiatan.ts
import { defineStore } from "pinia";

export const useKegiatanStore = defineStore("kegiatan", {
  state: () => ({
    dokumentasiList: [] as any[],
    barangList: [] as any[],
    jasaList: [] as any[],
    loading: false,
    popupMessage: "",
    popupVisible: false,
  }),

  actions: {
    async fetchDokumentasi(kegiatanId: number) {
      this.loading = true;
      try {
        const data = await $fetch(`/api/ormawa/dokumentasi/${kegiatanId}`);
        this.dokumentasiList = data;
      } catch (err) {
        alert("Gagal fetch dokumentasi");
      } finally {
        this.loading = false;
      }
    },

    async fetchBarang(kegiatanId: number) {
      this.loading = true;
      try {
        const data = await $fetch(`/api/ormawa/barang/${kegiatanId}`);
        this.barangList = data;
      } catch (err) {
        alert("Gagal fetch barang");
      } finally {
        this.loading = false;
      }
    },

    async fetchJasa(kegiatanId: number) {
      this.loading = true;
      try {
        const data = await $fetch(`/api/ormawa/jasa/${kegiatanId}`);
        this.jasaList = data;
      } catch (err) {
        alert("Gagal fetch jasa");
      } finally {
        this.loading = false;
      }
    },

    async submitDokumentasi(fd: FormData) {
      try {
        await $fetch("/api/ormawa/dokumentasi/dokumentasiKegiatan", {
          method: "POST",
          body: fd,
        });
        this.popupMessage = "Berhasil mengupload dokumentasi kegiatan";
        this.popupVisible = true;
      } catch {
        alert("Gagal upload dokumentasi");
      }
    },

    async submitBarang(fd: FormData) {
      try {
        await $fetch("/api/ormawa/dokumentasi/dokumentasiBarang", {
          method: "POST",
          body: fd,
        });
        this.popupMessage = "Berhasil mengupload barang";
        this.popupVisible = true;
      } catch {
        alert("Gagal upload barang");
      }
    },

    async submitJasa(fd: FormData) {
      try {
        await $fetch("/api/ormawa/dokumentasi/dokumentasiJasa", {
          method: "POST",
          body: fd,
        });
        this.popupMessage = "Berhasil mengupload jasa";
        this.popupVisible = true;
      } catch {
        alert("Gagal upload jasa");
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
      } catch {
        alert("Gagal hapus");
      }
    },

    closePopup() {
      this.popupVisible = false;
    },
  },
});
