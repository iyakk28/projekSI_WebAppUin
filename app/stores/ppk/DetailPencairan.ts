import { defineStore } from "pinia";

const GROUP_OFFSET = 1_000_000;

export const usePpkDetailPencairanStore = defineStore(
  "ppkDetailPencairan",
  () => {
    const data = ref<{ data: any } | null>(null);
    const pending = ref(false);
    const fetchError = ref<any>(null);

    const rawParam = ref("");
    const id = ref<number | null>(null);
    const apiPathId = ref("");

    const catatan = ref("");
    const catatanPembayaran = ref("");

    const buktiTransferFile = ref<File | null>(null);
    const spbFile = ref<File | null>(null);
    const kwitansiFile = ref<File | null>(null);

    const loadingAction = ref(false);
    const successMsg = ref("");
    const errorMsg = ref("");

    const todayStr = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const decodeUrlId = (param: string): number => {
      if (param.startsWith("g")) return -(GROUP_OFFSET + Number(param.slice(1)));
      if (param.startsWith("v")) return -Number(param.slice(1));
      return Number(param);
    };

    const encodeUrlId = (numId: number): string => {
      if (numId <= -GROUP_OFFSET) return `g${Math.abs(numId) - GROUP_OFFSET}`;
      if (numId < 0) return `v${Math.abs(numId)}`;
      return String(numId);
    };

    const setRouteId = (param: string) => {
      rawParam.value = param;
      id.value = decodeUrlId(param);
      apiPathId.value = param;
    };

    const detail = computed(() => data.value?.data || null);

    const isGroupView = computed(() => {
      return (id.value || 0) <= -GROUP_OFFSET;
    });

    const loadError = computed(() => {
      return (
        fetchError.value?.data?.statusMessage ||
        fetchError.value?.message ||
        null
      );
    });

    const totalDocs = computed(() => {
      return detail.value?.dokumenUpload?.length || 0;
    });

    const uploadedDocs = computed(() => {
      return (detail.value?.dokumenUpload || []).filter(
        (doc: any) => doc.uploaded,
      ).length;
    });

    const allDocsUploaded = computed(() => {
      return (
        detail.value?.allDocsUploaded ??
        (totalDocs.value > 0 && uploadedDocs.value === totalDocs.value)
      );
    });

    const spbKwitansiLengkap = computed(() => {
      return (
        detail.value?.dokumenPpk?.spb?.uploaded &&
        detail.value?.dokumenPpk?.kwitansi?.uploaded
      );
    });

    const fetchDetail = async () => {
      if (!apiPathId.value) return;

      pending.value = true;
      fetchError.value = null;

      try {
        data.value = await $fetch<{ data: any }>(
          `/api/ppk/pencairan/${apiPathId.value}`,
        );
      } catch (error: any) {
        fetchError.value = error;
        data.value = null;
      } finally {
        pending.value = false;
      }
    };

    const refresh = async () => {
      await fetchDetail();
    };

    const clearMessages = () => {
      successMsg.value = "";
      errorMsg.value = "";
    };

    const goItemDetail = (dokumentasiId: number) => {
      const apiId = -Math.abs(dokumentasiId);
      const urlId = encodeUrlId(apiId);

      return navigateTo(`/dashboard/ppk/detailPencairan/${urlId}`);
    };

    const submitRevisi = async () => {
      if (!catatan.value.trim()) return;

      loadingAction.value = true;
      clearMessages();

      try {
        await $fetch(`/api/ppk/pencairan/${apiPathId.value}/kembalikan`, {
          method: "POST",
          body: {
            catatan: catatan.value,
          },
        });

        successMsg.value = "Catatan revisi berhasil dikirim ke ormawa.";
        catatan.value = "";

        await refresh();
      } catch (error: any) {
        errorMsg.value =
          error?.data?.statusMessage || "Gagal mengirim catatan revisi.";
      } finally {
        loadingAction.value = false;
      }
    };

    const submitVerifikasi = async () => {
      if (!allDocsUploaded.value) return;

      loadingAction.value = true;
      clearMessages();

      try {
        await $fetch(`/api/ppk/pencairan/${apiPathId.value}/verifikasi`, {
          method: "POST",
          body: {
            keputusan: "terverifikasi",
          },
        });

        successMsg.value =
          "Dokumen ormawa lengkap. Unggah SPB dan kwitansi.";

        await refresh();
      } catch (error: any) {
        errorMsg.value =
          error?.data?.statusMessage || "Gagal memverifikasi dokumen.";
      } finally {
        loadingAction.value = false;
      }
    };

    const onSpbChange = (event: Event) => {
      const input = event.target as HTMLInputElement;
      spbFile.value = input.files?.[0] || null;
    };

    const onKwitansiChange = (event: Event) => {
      const input = event.target as HTMLInputElement;
      kwitansiFile.value = input.files?.[0] || null;
    };

    const submitDokumenPpk = async () => {
      if (!spbFile.value && !kwitansiFile.value) return;

      loadingAction.value = true;
      clearMessages();

      try {
        const formData = new FormData();

        if (spbFile.value) {
          formData.append("surat_perintah_bayar", spbFile.value);
        }

        if (kwitansiFile.value) {
          formData.append("kwitansi", kwitansiFile.value);
        }

        await $fetch(`/api/ppk/pencairan/${apiPathId.value}/dokumen-ppk`, {
          method: "POST",
          body: formData,
        });

        successMsg.value = "SPB dan kwitansi berhasil disimpan.";
        spbFile.value = null;
        kwitansiFile.value = null;

        await refresh();
      } catch (error: any) {
        errorMsg.value =
          error?.data?.statusMessage || "Gagal menyimpan dokumen PPK.";
      } finally {
        loadingAction.value = false;
      }
    };

    const handleBuktiTransferChange = (event: Event) => {
      const input = event.target as HTMLInputElement;
      buktiTransferFile.value = input.files?.[0] || null;
    };

    const submitTransfer = async () => {
      loadingAction.value = true;
      clearMessages();

      try {
        await $fetch(`/api/ppk/pencairan/${apiPathId.value}/transfer`, {
          method: "POST",
        });

        successMsg.value =
          "Transfer dicatat. Unggah bukti pembayaran untuk ormawa.";

        await refresh();
      } catch (error: any) {
        errorMsg.value =
          error?.data?.statusMessage || "Gagal mencatat transfer.";
      } finally {
        loadingAction.value = false;
      }
    };

    const submitPembayaran = async () => {
      if (!buktiTransferFile.value) return;

      loadingAction.value = true;
      clearMessages();

      try {
        const formData = new FormData();

        formData.append("bukti_transfer", buktiTransferFile.value);
        formData.append("catatan", catatanPembayaran.value);

        await $fetch(`/api/ppk/pencairan/${apiPathId.value}/bayar`, {
          method: "POST",
          body: formData,
        });

        successMsg.value =
          "Bukti pembayaran berhasil dikirim ke ormawa. Pencairan selesai.";

        buktiTransferFile.value = null;
        catatanPembayaran.value = "";

        await refresh();
      } catch (error: any) {
        errorMsg.value =
          error?.data?.statusMessage || "Gagal menyimpan bukti transfer.";
      } finally {
        loadingAction.value = false;
      }
    };

    const isImage = (url?: string) => {
      return /\.(png|jpe?g|gif|webp)$/i.test(url || "");
    };

    const typeClass = (type: string) => {
      return type === "BARANG"
        ? "bg-blue-50 text-blue-700"
        : "bg-purple-50 text-purple-700";
    };

    const statusClass = (status?: string) => {
      const map: Record<string, string> = {
        WAITING_PEMBAYARAN: "bg-amber-100 text-amber-700",
        DOKUMEN_LENGKAP: "bg-sky-100 text-sky-700",
        TERVERIFIKASI: "bg-blue-100 text-blue-700",
        TRANSFER_DILAKUKAN: "bg-indigo-100 text-indigo-700",
        DIKEMBALIKAN: "bg-orange-100 text-orange-700",
        SELESAI: "bg-emerald-100 text-emerald-700",
      };

      return map[status || ""] || "bg-slate-100 text-slate-600";
    };

    const statusLabel = (status?: string) => {
      const map: Record<string, string> = {
        WAITING_PEMBAYARAN: "Menunggu Verifikasi",
        DOKUMEN_LENGKAP: "Menunggu SPB & Kwitansi",
        TERVERIFIKASI: "Siap Transfer",
        TRANSFER_DILAKUKAN: "Menunggu Bukti",
        DIKEMBALIKAN: "Perlu Revisi",
        SELESAI: "Selesai",
      };

      return map[status || ""] || status || "-";
    };

    const formatDateTime = (date?: string) => {
      return date
        ? new Date(date).toLocaleString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "-";
    };

    return {
      GROUP_OFFSET,

      data,
      pending,
      fetchError,

      rawParam,
      id,
      apiPathId,

      detail,
      isGroupView,
      loadError,

      catatan,
      catatanPembayaran,
      buktiTransferFile,
      spbFile,
      kwitansiFile,

      loadingAction,
      successMsg,
      errorMsg,

      todayStr,

      totalDocs,
      uploadedDocs,
      allDocsUploaded,
      spbKwitansiLengkap,

      decodeUrlId,
      encodeUrlId,
      setRouteId,

      fetchDetail,
      refresh,
      clearMessages,

      goItemDetail,
      submitRevisi,
      submitVerifikasi,
      submitDokumenPpk,
      submitTransfer,
      submitPembayaran,

      onSpbChange,
      onKwitansiChange,
      handleBuktiTransferChange,

      isImage,
      typeClass,
      statusClass,
      statusLabel,
      formatDateTime,
    };
  },
);