// stores/ormawa/uploadDokumen.ts
import { defineStore } from "pinia";

export const useKegiatanStore = defineStore("kegiatan", {
  state: () => ({
    dokumentasiList: [] as any[],
    loading: false,
    dokumentasiUploading: false,
    barangUploading: false,
    jasaUploading: false,
    popupMessage: "",
    popupVisible: false,

    // Pagination state
    currentPage: 1,
    perPage: 5,
    totalItems: 0,
    totalPages: 0,
  }),

  actions: {
    async fetchAllUploads(kegiatanId: number, page?: number, limit?: number) {
      this.loading = true;
      const reqPage = page ?? this.currentPage;
      const reqLimit = limit ?? this.perPage;

      try {
        const response = await $fetch(
          `/api/ormawa/dokumentasi/getAllDokumentasi`,
          {
            method: "POST",
            body: {
              kegiatanId,
              page: reqPage,
              row: reqLimit,
            },
          },
        );

        this.dokumentasiList = response.data;
        this.totalItems = response.total;
        this.currentPage = response.page;
        this.perPage = response.row;
        this.totalPages =
          response.totalPages ?? Math.ceil(response.total / response.row);
      } catch (err) {
        console.error(err);
        alert("Gagal memuat data kegiatan");
      } finally {
        this.loading = false;
      }
    },

    async changePage(kegiatanId: number, page: number) {
      if (page < 1 || page > this.totalPages) return;
      await this.fetchAllUploads(kegiatanId, page, this.perPage);
    },

    async changePerPage(kegiatanId: number, limit: number) {
      this.perPage = limit;
      await this.fetchAllUploads(kegiatanId, 1, limit);
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
        const kegiatanId = fd.get("kegiatanId") as string;
        if (kegiatanId) {
          // Refresh halaman yang sedang aktif
          await this.fetchAllUploads(
            parseInt(kegiatanId),
            this.currentPage,
            this.perPage,
          );
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
        const kegiatanId = fd.get("kegiatanId") as string;
        if (kegiatanId) {
          await this.fetchAllUploads(
            parseInt(kegiatanId),
            this.currentPage,
            this.perPage,
          );
        }
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
        if (kegiatanId) {
          await this.fetchAllUploads(
            parseInt(kegiatanId),
            this.currentPage,
            this.perPage,
          );
        }
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

        // Refresh halaman yang sedang aktif
        const kegiatanId = item.kegiatanId; // pastikan item memiliki kegiatanId
        if (kegiatanId) {
          await this.fetchAllUploads(
            kegiatanId,
            this.currentPage,
            this.perPage,
          );
        }
      } catch {
        alert("Gagal hapus");
      }
    },

    closePopup() {
      this.popupVisible = false;
    },
  },
});
