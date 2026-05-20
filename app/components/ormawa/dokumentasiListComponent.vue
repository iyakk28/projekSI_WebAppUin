<template>
  <div
    class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
  >
    <!-- Header -->
    <div
      class="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div>
        <h3 class="text-lg font-bold text-slate-900">Daftar Dokumentasi</h3>
        <p class="text-sm text-slate-500">
          Kelola dan monitor dokumentasi kegiatan yang telah diupload
        </p>
      </div>
      <div class="flex items-center gap-3">
        <div class="relative">
          <Icon
            name="heroicons:magnifying-glass"
            class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
          />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari dokumentasi..."
            class="pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b5988]/20 focus:border-[#3b5988] w-full sm:w-64"
          />
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="fetcher.loading"
      class="flex justify-center items-center py-12"
    >
      <div class="flex flex-col items-center gap-3">
        <Icon
          name="heroicons:arrow-path"
          class="w-8 h-8 animate-spin text-[#3b5988]"
        />
        <p class="text-slate-500 text-sm">Memuat data dokumentasi...</p>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="filteredDocumentations.length === 0"
      class="flex justify-center items-center py-12"
    >
      <div class="flex flex-col items-center gap-3 text-center">
        <Icon name="heroicons:document-text" class="w-12 h-12 text-slate-300" />
        <p class="text-slate-500 text-sm">
          Belum ada dokumentasi yang diupload
        </p>
      </div>
    </div>

    <!-- Table -->
    <div v-else class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-slate-50/50 border-b border-slate-200">
          <tr>
            <th
              class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
            >
              No
            </th>
            <th
              class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
            >
              Deskripsi
            </th>
            <th
              class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
            >
              Tipe Dokumen
            </th>
            <th
              class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
            >
              Tanggal Upload
            </th>
            <th
              class="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider"
            >
              Aksi
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr
            v-for="(doc, idx) in filteredDocumentations"
            :key="doc.id || idx"
            class="hover:bg-slate-50/50 transition-colors group"
          >
            <td
              class="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900"
            >
              {{ (fetcher.currentPage - 1) * fetcher.perPage + idx + 1 }}
            </td>
            <td class="px-6 py-4">
              <p class="text-sm text-slate-900 font-medium">
                {{ doc.deskripsi }}
              </p>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                :class="[
                  'px-3 py-1 rounded-full text-xs font-medium border',
                  getTipeDocumenBadgeClass(doc.tipeDokumen),
                ]"
              >
                {{ doc.tipeDokumen }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
              {{ formatDate(doc.createAt) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right">
              <div class="flex items-center justify-end gap-2">
                <button
                  @click="handleView(doc)"
                  class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white transition-all"
                >
                  <Icon name="heroicons:eye" class="w-4 h-4" />
                  <span class="hidden sm:inline">Lihat</span>
                </button>
                <button
                  @click="handleEdit(doc)"
                  class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-amber-600 bg-amber-50 hover:bg-amber-600 hover:text-white transition-all"
                >
                  <Icon name="heroicons:pencil" class="w-4 h-4" />
                  <span class="hidden sm:inline">Edit</span>
                </button>
                <button
                  @click="handleDelete(doc)"
                  class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-600 hover:text-white transition-all"
                >
                  <Icon name="heroicons:trash" class="w-4 h-4" />
                  <span class="hidden sm:inline">Hapus</span>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination Controls -->
    <div
      class="px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div class="text-sm text-slate-500">
        Menampilkan {{ startIndex + 1 }} - {{ endIndex }} dari
        {{ fetcher.totalItems }} dokumentasi
      </div>
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2">
          <span class="text-sm text-slate-500">Tampil</span>
          <select
            :value="fetcher.perPage"
            @change="changePerPage"
            class="px-2 py-1 border border-slate-200 rounded-lg text-sm"
          >
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
          </select>
          <span class="text-sm text-slate-500">data</span>
        </div>
        <div class="flex gap-1">
          <button
            @click="prevPage"
            :disabled="fetcher.currentPage <= 1"
            class="px-3 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon name="heroicons:chevron-left" class="w-4 h-4" />
          </button>
          <span class="px-3 py-1 text-sm">
            Halaman {{ fetcher.currentPage }} dari
            {{ fetcher.totalPages || 1 }}
          </span>
          <button
            @click="nextPage"
            :disabled="fetcher.currentPage >= fetcher.totalPages"
            class="px-3 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon name="heroicons:chevron-right" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Modal View -->
    <div
      v-if="showViewModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="showViewModal = false"
    >
      <div
        class="bg-white rounded-2xl shadow-lg max-w-2xl w-full max-h-screen overflow-y-auto"
      >
        <div
          class="p-6 border-b border-slate-200 flex justify-between items-center"
        >
          <h3 class="text-lg font-bold">Detail Dokumentasi</h3>
          <button
            @click="showViewModal = false"
            class="p-1 rounded-lg hover:bg-slate-100"
          >
            <Icon name="heroicons:x-mark" class="w-6 h-6" />
          </button>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="text-sm font-semibold block mb-1">Deskripsi</label>
            <p>{{ selectedDoc?.deskripsi }}</p>
          </div>
          <div>
            <label class="text-sm font-semibold block mb-1">Tipe Dokumen</label>
            <p>{{ selectedDoc?.tipeDokumen }}</p>
          </div>
          <div>
            <label class="text-sm font-semibold block mb-1"
              >Tanggal Upload</label
            >
            <p>{{ formatDate(selectedDoc?.createAt) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Edit -->
    <div
      v-if="showEditModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="showEditModal = false"
    >
      <div class="bg-white rounded-2xl shadow-lg max-w-2xl w-full">
        <div
          class="p-6 border-b border-slate-200 flex justify-between items-center"
        >
          <h3 class="text-lg font-bold">Edit Dokumentasi</h3>
          <button
            @click="showEditModal = false"
            class="p-1 rounded-lg hover:bg-slate-100"
          >
            <Icon name="heroicons:x-mark" class="w-6 h-6" />
          </button>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1"
              >Deskripsi <span class="text-red-500">*</span></label
            >
            <textarea
              v-model="editForm.deskripsi"
              rows="3"
              class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-[#3b5988] outline-none"
            ></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1"
              >Tipe Dokumen <span class="text-red-500">*</span></label
            >
            <select
              v-model="editForm.tipeDokumen"
              class="w-full px-4 py-2 rounded-lg border border-slate-200"
            >
              <option value="">Pilih</option>
              <option value="foto">Foto</option>
              <option value="video">Video</option>
              <option value="dokumen">Dokumen</option>
              <option value="laporan">Laporan</option>
            </select>
          </div>
          <div class="flex justify-end gap-3 pt-4">
            <button
              @click="showEditModal = false"
              class="px-4 py-2 rounded-lg border"
            >
              Batal
            </button>
            <button
              @click="submitEdit"
              class="px-4 py-2 rounded-lg bg-[#3b5988] text-white"
            >
              Simpan
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Hapus -->
    <div
      v-if="showDeleteConfirm"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="showDeleteConfirm = false"
    >
      <div class="bg-white rounded-2xl shadow-lg max-w-md w-full p-6">
        <div class="flex items-center gap-3 mb-4">
          <div
            class="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center"
          >
            <Icon
              name="heroicons:exclamation-triangle"
              class="w-6 h-6 text-red-600"
            />
          </div>
          <h3 class="text-lg font-bold">Hapus Dokumentasi?</h3>
        </div>
        <p class="text-sm text-slate-600 mb-6">
          Apakah Anda yakin ingin menghapus dokumentasi "{{
            selectedDoc?.deskripsi
          }}"?
        </p>
        <div class="flex gap-3">
          <button
            @click="showDeleteConfirm = false"
            class="flex-1 px-4 py-2 rounded-lg border"
          >
            Batal
          </button>
          <button
            @click="submitDelete"
            class="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white"
          >
            Hapus
          </button>
        </div>
      </div>
    </div>

    <!-- Popup Notifikasi -->
    <Transition name="fade">
      <div
        v-if="showPopup"
        class="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm z-50"
        :class="{
          'border-l-4 border-emerald-500 bg-emerald-50':
            popupType === 'success',
          'border-l-4 border-red-500 bg-red-50': popupType === 'error',
        }"
      >
        <p
          :class="{
            'text-emerald-800': popupType === 'success',
            'text-red-800': popupType === 'error',
          }"
        >
          {{ popupMessage }}
        </p>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, watch } from "vue";
  import { useDokumentasiStore } from "~/stores/ormawa/allDokumen";

  const props = defineProps({
    kegiatanId: { type: Number, required: true },
  });

  const fetcher = useDokumentasiStore();

  // State lokal
  const searchQuery = ref("");
  const showViewModal = ref(false);
  const showEditModal = ref(false);
  const showDeleteConfirm = ref(false);
  const showPopup = ref(false);
  const selectedDoc = ref<any>(null);
  const popupMessage = ref("");
  const popupType = ref<"success" | "error">("success");

  const editForm = ref({
    deskripsi: "",
    tipeDokumen: "",
  });

  // Computed
  const filteredDocumentations = computed(() => {
    let docs = fetcher.dokumentasiList;
    if (searchQuery.value) {
      docs = docs.filter(
        (doc: any) =>
          doc.deskripsi
            .toLowerCase()
            .includes(searchQuery.value.toLowerCase()) ||
          doc.tipeDokumen
            .toLowerCase()
            .includes(searchQuery.value.toLowerCase()),
      );
    }
    return docs;
  });

  const startIndex = computed(
    () => (fetcher.currentPage - 1) * fetcher.perPage,
  );
  const endIndex = computed(
    () => startIndex.value + filteredDocumentations.value.length,
  );

  // Helper formatting
  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTipeDocumenBadgeClass = (tipe: string) => {
    const baseClass = "px-3 py-1 rounded-full text-xs font-medium border";
    if (!tipe) return `${baseClass} bg-slate-50 text-slate-700 border-slate-200`;
    
    switch (tipe.toLowerCase()) {
      case "foto":
        return `${baseClass} bg-blue-50 text-blue-700 border-blue-200`;
      case "video":
        return `${baseClass} bg-purple-50 text-purple-700 border-purple-200`;
      case "dokumen":
        return `${baseClass} bg-amber-50 text-amber-700 border-amber-200`;
      case "laporan":
        return `${baseClass} bg-emerald-50 text-emerald-700 border-emerald-200`;
      default:
        return `${baseClass} bg-slate-50 text-slate-700 border-slate-200`;
    }
  };

  // Pagination handlers
  const changePerPage = async (event: Event) => {
    const target = event.target as HTMLSelectElement;
    const newLimit = parseInt(target.value, 10);
    await fetcher.changePerPage(props.kegiatanId, newLimit);
  };

  const prevPage = async () => {
    if (fetcher.currentPage > 1) {
      await fetcher.changePage(props.kegiatanId, fetcher.currentPage - 1);
    }
  };

  const nextPage = async () => {
    if (fetcher.currentPage < fetcher.totalPages) {
      await fetcher.changePage(props.kegiatanId, fetcher.currentPage + 1);
    }
  };

  // CRUD
  const handleView = (doc: any) => {
    selectedDoc.value = doc;
    showViewModal.value = true;
  };

  const handleEdit = (doc: any) => {
    selectedDoc.value = doc;
    editForm.value = {
      deskripsi: doc.deskripsi,
      tipeDokumen: doc.tipeDokumen,
    };
    showEditModal.value = true;
  };

  const submitEdit = async () => {
    if (!editForm.value.deskripsi || !editForm.value.tipeDokumen) {
      showPopupNotification("Semua field harus diisi", "error");
      return;
    }
    try {
      await $fetch(`/api/ormawa/dokumentasi/dokumentasi`, {
        method: "PATCH",
        body: {
          id: selectedDoc.value.id,
          deskripsi: editForm.value.deskripsi,
          tipeDokumen: editForm.value.tipeDokumen,
        },
      });
      showPopupNotification("Dokumentasi berhasil diperbarui", "success");
      showEditModal.value = false;
      await fetcher.refreshDokumentasi(
        props.kegiatanId,
        fetcher.currentPage,
        fetcher.perPage,
      );
    } catch (error) {
      showPopupNotification("Gagal memperbarui dokumentasi", "error");
    }
  };

  const handleDelete = (doc: any) => {
    selectedDoc.value = doc;
    showDeleteConfirm.value = true;
  };

  const submitDelete = async () => {
    try {
      await $fetch(`/api/ormawa/dokumentasi/dokumentasi`, {
        method: "DELETE",
        body: { id: selectedDoc.value.id }
      });
      showPopupNotification("Dokumentasi berhasil dihapus", "success");
      showDeleteConfirm.value = false;
      await fetcher.refreshDokumentasi(
        props.kegiatanId,
        fetcher.currentPage,
        fetcher.perPage,
      );
    } catch (error) {
      showPopupNotification("Gagal menghapus dokumentasi", "error");
    }
  };

  const showPopupNotification = (
    message: string,
    type: "success" | "error",
  ) => {
    popupMessage.value = message;
    popupType.value = type;
    showPopup.value = true;
    setTimeout(() => {
      showPopup.value = false;
    }, 3000);
  };

  // Lifecycle
  onMounted(async () => {
    if (props.kegiatanId) {
      await fetcher.fetchDokumentasi(
        props.kegiatanId,
        fetcher.currentPage,
        fetcher.perPage,
      );
    }
  });

  watch(
    () => props.kegiatanId,
    async (newId, oldId) => {
      if (newId !== oldId && newId) {
        await fetcher.refreshDokumentasi(newId, 1, fetcher.perPage);
      }
    },
  );
</script>

<style scoped>
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
</style>
