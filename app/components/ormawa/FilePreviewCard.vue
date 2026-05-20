<template>
  <div
    class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all group"
  >
    <div
      class="aspect-video bg-slate-100 relative overflow-hidden flex items-center justify-center"
    >
      <!-- Loading State -->
      <div
        v-if="loading"
        class="absolute inset-0 flex items-center justify-center bg-slate-50"
      >
        <Icon
          name="heroicons:arrow-path"
          class="w-8 h-8 animate-spin text-slate-300"
        />
      </div>

      <!-- Preview Image -->
      <img
        v-if="!loading && isImage && imageUrl"
        :src="imageUrl"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        @error="handleError"
      />

      <!-- PDF Icon -->
      <div
        v-else-if="!loading && isPdf"
        class="flex flex-col items-center gap-2"
      >
        <Icon name="heroicons:document-text" class="w-12 h-12 text-red-500" />
        <span class="text-xs font-bold text-slate-400 uppercase"
          >PDF Document</span
        >
      </div>

      <!-- Error State -->
      <div
        v-else-if="!loading && error"
        class="flex flex-col items-center gap-2"
      >
        <Icon
          name="heroicons:exclamation-circle"
          class="w-10 h-10 text-slate-300"
        />
        <span class="text-xs text-slate-400">Gagal memuat file</span>
      </div>

      <!-- Action Overlay -->
      <div
        class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3"
      >
        <button
          @click="openFullPreview"
          class="p-2 bg-white rounded-lg text-slate-900 hover:bg-[#3b5988] hover:text-white transition-colors shadow-lg"
          title="Lihat Full"
        >
          <Icon name="heroicons:eye" class="w-5 h-5" />
        </button>
        <button
          @click="downloadFile"
          class="p-2 bg-white rounded-lg text-slate-900 hover:bg-[#3b5988] hover:text-white transition-colors shadow-lg"
          title="Download"
        >
          <Icon name="heroicons:arrow-down-tray" class="w-5 h-5" />
        </button>
      </div>
    </div>
    <div class="p-3 border-t border-slate-100">
      <p
        class="text-xs font-bold text-slate-500 uppercase tracking-wider truncate"
      >
        {{ label }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, computed } from "vue";

  const props = defineProps({
    label: { type: String, required: true },
    docId: { type: Number, required: true },
    field: { type: String, required: true },
  });

  const imageUrl = ref<string | null>(null);
  const loading = ref(true);
  const error = ref(false);
  const contentType = ref("");

  const isImage = computed(() => contentType.value.startsWith("image/"));
  const isPdf = computed(() => contentType.value === "application/pdf");

  const fetchFile = async () => {
    loading.value = true;
    error.value = false;
    try {
      const response = await $fetch("/api/ormawa/dokumentasi/fileView", {
        method: "POST",
        body: { id: props.docId, field: props.field },
        responseType: "blob",
      });

      const blob = response as Blob;
      contentType.value = blob.type;
      imageUrl.value = URL.createObjectURL(blob);
    } catch (err) {
      console.error("Failed to fetch file:", err);
      error.value = true;
    } finally {
      loading.value = false;
    }
  };

  const openFullPreview = () => {
    if (imageUrl.value) {
      window.open(imageUrl.value, "_blank");
    }
  };

  const downloadFile = () => {
    if (!imageUrl.value) return;
    const link = document.createElement("a");
    link.href = imageUrl.value;
    link.download = `${props.label}-${props.docId}.${contentType.value.split("/")[1]}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleError = () => {
    error.value = true;
    imageUrl.value = null;
  };

  onMounted(fetchFile);
</script>
