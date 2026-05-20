// stores/ormawa/uploadDokumen.ts
import { defineStore } from "pinia";
import { useDokumentasiStore } from "./allDokumen";

export const useKegiatanStore = defineStore("kegiatan", {
  state: () => ({
    // State untuk indikator loading saat upload
    dokumentasiUploading: false,
    barangUploading: false,
    jasaUploading: false,
    // State untuk notifikasi popup
    popupMessage: "",
    popupVisible: false,

    // Data kegiatan (jika diperlukan oleh parent)
    loading: false,
    kegiatan: null as any,
    dokumentasiList: [] as any[],
    barangList: [] as any[],
    jasaList: [] as any[],
  }),

  actions: {
    async submitDokumentasi(fd: FormData) {
      const dokumentasiStore = useDokumentasiStore();
      this.dokumentasiUploading = true;
      try {
        await $fetch("/api/ormawa/dokumentasi/dokumentasiKegiatan", {
          method: "POST",
          body: fd,
        });
        this.popupMessage = "Berhasil mengupload dokumentasi kegiatan";
        this.popupVisible = true;
        
        // Refresh list dokumentasi
        const kegiatanId = Number(fd.get("kegiatanId"));
        if (kegiatanId) {
          await dokumentasiStore.refreshDokumentasi(kegiatanId);
        }
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
      } catch {
        alert("Gagal upload jasa");
      } finally {
        this.jasaUploading = false;
      }
    },

    async deleteUpload(item: any) {
      const dokumentasiStore = useDokumentasiStore();
      try {
        if (item.jenis === "dokumentasi") {
          await $fetch(`/api/ormawa/dokumentasi/dokumentasi`, { 
            method: "DELETE",
            body: { id: item.id }
          });
          if (item.kegiatanId) {
            await dokumentasiStore.refreshDokumentasi(item.kegiatanId);
          }
        }
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

    // Method dummy untuk fetch data kegiatan jika diperlukan (untuk detail page)
    async fetchKegiatan(id: number) {
      this.loading = true;
      try {
        // Implementasi fetch kegiatan jika ada API-nya
      } finally {
        this.loading = false;
      }
    }
  },
});

