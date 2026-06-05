import { defineStore } from "pinia";

export const usePpkDocDetailStore = defineStore("ppkDocDetail", () => {
  const doc = ref<any>(null);
  const loading = ref(false);
  const error = ref("");
  const successMsg = ref("");
  
  // Cache for file URLs (Blobs)
  const fileUrls = ref<Record<string, string>>({});

  const fetchDocDetail = async (id: number, type: 'foto' | 'tagihan') => {
    loading.value = true;
    error.value = "";
    try {
      const response = await $fetch<any>("/api/ppk/pencairan/doc-detail", {
        method: "POST",
        body: { id, type }
      });
      doc.value = response.data;
      
      // Clear old blobs when switching docs
      Object.values(fileUrls.value).forEach(url => URL.revokeObjectURL(url));
      fileUrls.value = {};
    } catch (err: any) {
      error.value = err.message || "Gagal memuat detail dokumentasi";
    } finally {
      loading.value = false;
    }
  };

  const getFileBlob = async (id: number, type: string, field: string) => {
    const cacheKey = `${type}_${id}_${field}`;
    if (fileUrls.value[cacheKey]) return fileUrls.value[cacheKey];

    try {
      const blob = await $fetch<Blob>("/api/ppk/pencairan/file-view", {
        method: "POST",
        body: { id, type, field },
        responseType: "blob"
      });
      const url = URL.createObjectURL(blob);
      fileUrls.value[cacheKey] = url;
      return url;
    } catch (err) {
      console.error("Gagal mengambil file blob:", err);
      return "";
    }
  };

  const performAction = async (payload: { id: number, type: string, action: string, komentar?: string, fotoBukti?: File }) => {
    loading.value = true;
    error.value = "";
    successMsg.value = "";
    try {
      const formData = new FormData();
      formData.append("id", payload.id.toString());
      formData.append("type", payload.type);
      formData.append("action", payload.action);
      if (payload.komentar) formData.append("komentar", payload.komentar);
      if (payload.fotoBukti) formData.append("fotoBukti", payload.fotoBukti);

      const response = await $fetch<any>("/api/ppk/pencairan/doc-action", {
        method: "POST",
        body: formData
      });

      if (response.success) {
        successMsg.value = response.message;
        await fetchDocDetail(payload.id, payload.type as any);
      }
    } catch (err: any) {
      error.value = err.data?.statusMessage || err.message || "Gagal melakukan aksi";
    } finally {
      loading.value = false;
    }
  };

  return {
    doc,
    loading,
    error,
    successMsg,
    fileUrls,
    fetchDocDetail,
    getFileBlob,
    performAction,
  };
});
