<template>
  <div class="min-h-screen bg-slate-50 font-sans">
    <!-- Header -->
    <header
      class="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-4"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button
            @click="goBack"
            class="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition font-medium"
          >
            <Icon name="heroicons:arrow-left" class="w-4 h-4" /> Kembali
          </button>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs text-slate-400 font-mono">{{
            rabData?.nomorPengajuan
          }}</span>
          <div
            class="bg-[#d1a82a] text-white text-xs font-bold px-4 py-2 rounded-full"
          >
            {{ todayStr }}
          </div>
        </div>
      </div>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-32">
      <div class="flex flex-col items-center gap-3 text-slate-400">
        <div
          class="w-8 h-8 border-2 border-slate-200 border-t-[#3b5988] rounded-full animate-spin"
        ></div>
        <p class="text-sm">Memuat data pengajuan...</p>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="flex items-center justify-center py-32">
      <div class="text-center text-slate-400">
        <Icon
          name="heroicons:exclamation-circle"
          class="w-12 h-12 mx-auto mb-2 text-red-300"
        />
        <p class="font-medium text-red-500">Gagal memuat data</p>
        <p class="text-sm mt-1">{{ error }}</p>
        <button
          @click="reloadData"
          class="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 text-sm"
        >
          Coba Lagi
        </button>
      </div>
    </div>

    <!-- Content -->
    <main
      v-else-if="rabData"
      class="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6"
    >
      <!-- LEFT: Info + Progress + Dokumen + Riwayat -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Info Kegiatan -->
        <div
          class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div
            class="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-[#3b5988]/5 to-transparent"
          >
            <div
              class="w-9 h-9 rounded-xl bg-[#3b5988] text-white flex items-center justify-center"
            >
              <Icon name="heroicons:document-text" class="w-5 h-5" />
            </div>
            <div>
              <h2 class="font-bold text-slate-800 text-lg">
                {{ rabData.judulKegiatan }}
              </h2>
              <p class="text-xs text-slate-500">
                {{ rabData.ormawa?.nama }} · {{ rabData.ormawa?.kode }}
              </p>
            </div>
            <div class="ml-auto">
              <span
                class="inline-flex text-xs font-semibold px-3 py-1 rounded-full"
                :class="statusClass(rabData.status)"
              >
                {{ formatStatus(rabData.status) }}
              </span>
            </div>
          </div>
          <div class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <p class="text-xs font-semibold uppercase text-slate-400 mb-1">
                Diajukan Oleh
              </p>
              <p class="font-medium text-slate-800">
                {{ rabData.pengaju?.nama || "-" }}
              </p>
              <p class="text-xs text-slate-500">
                {{ rabData.pengaju?.email || "-" }}
              </p>
            </div>
            <div>
              <p class="text-xs font-semibold uppercase text-slate-400 mb-1">
                Organisasi
              </p>
              <p class="font-medium text-slate-800">
                {{ rabData.ormawa?.nama || "-" }}
              </p>
            </div>
            <div>
              <p class="text-xs font-semibold uppercase text-slate-400 mb-1">
                Tanggal Kegiatan
              </p>
              <p class="font-medium text-slate-800">
                {{ formatDate(rabData.tanggalMulai) }}
                <span
                  v-if="
                    rabData.tanggalSelesai &&
                    rabData.tanggalSelesai !== rabData.tanggalMulai
                  "
                >
                  — {{ formatDate(rabData.tanggalSelesai) }}
                </span>
              </p>
            </div>
            <div>
              <p class="text-xs font-semibold uppercase text-slate-400 mb-1">
                Total Anggaran
              </p>
              <p class="font-bold text-[#3b5988] text-lg">
                Rp {{ formatCurrency(rabData.totalAnggaran) }}
              </p>
            </div>
            <div class="sm:col-span-2">
              <p class="text-xs font-semibold uppercase text-slate-400 mb-1">
                Deskripsi
              </p>
              <p class="text-slate-700 text-sm leading-relaxed">
                {{ rabData.deskripsi || "-" }}
              </p>
            </div>
          </div>
        </div>

        <!-- Preview Dokumen -->
        <div
          class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div class="p-4 sm:p-6 border-b border-slate-100">
            <h3
              class="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4"
            >
              <Icon
                name="heroicons:document-text"
                class="w-5 h-5 text-[#d1a82a]"
              />
              Preview Dokumen
            </h3>

            <div class="flex gap-2 p-1 bg-slate-100 rounded-xl inline-flex">
              <button
                @click="activeDocumentTab = 'rab'"
                :class="[
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                  activeDocumentTab === 'rab'
                    ? 'bg-white text-[#3b5988] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900',
                ]"
              >
                <Icon name="heroicons:calculator" class="w-4 h-4" />
                RAB
              </button>
              <button
                @click="activeDocumentTab = 'tor'"
                :class="[
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                  activeDocumentTab === 'tor'
                    ? 'bg-white text-[#3b5988] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900',
                ]"
              >
                <Icon name="heroicons:document-duplicate" class="w-4 h-4" />
                TOR
              </button>
            </div>
          </div>

          <div class="p-6">
            <div v-if="currentFileUrl" class="w-full">
              <iframe
                v-if="isPdf"
                :src="currentFileUrl"
                class="w-full h-[600px] rounded-xl border border-slate-200"
                frameborder="0"
              ></iframe>
              <div v-else class="text-center py-12">
                <Icon
                  name="heroicons:document"
                  class="w-16 h-16 text-slate-400 mx-auto mb-4"
                />
                <p class="text-slate-600 mb-4">
                  Preview tidak tersedia untuk tipe file ini.
                </p>
                <button
                  @click="downloadDocument"
                  class="px-4 py-2 bg-[#3b5988] text-white rounded-lg"
                >
                  Download {{ activeDocumentTab.toUpperCase() }}
                </button>
              </div>
              <div class="flex justify-center gap-3 mt-4">
                <button
                  @click="openDocument"
                  class="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#3b5988] text-white font-medium hover:bg-[#2d4570] transition-all"
                >
                  <Icon name="heroicons:eye" class="w-5 h-5" />
                  Buka {{ activeDocumentTab.toUpperCase() }} di Tab Baru
                </button>
              </div>
            </div>

            <div
              v-else
              class="aspect-[3/4] bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center p-8 text-center"
            >
              <div
                class="w-20 h-20 rounded-2xl bg-[#3b5988]/10 flex items-center justify-center mb-4"
              >
                <Icon
                  name="heroicons:document-text"
                  class="w-10 h-10 text-[#3b5988]"
                />
              </div>
              <h4 class="text-lg font-semibold text-slate-900 mb-2">
                Belum ada file
              </h4>
              <p class="text-sm text-slate-500 mb-4 max-w-sm">
                File {{ activeDocumentTab.toUpperCase() }} tidak tersedia atau
                gagal dimuat.
              </p>
            </div>
          </div>
        </div>

        <!-- Riwayat Persetujuan -->
        <div
          class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div
            class="flex items-center gap-2 px-6 py-4 border-b border-slate-100"
          >
            <Icon name="heroicons:clock" class="w-5 h-5 text-[#d1a82a]" />
            <h3 class="font-bold text-slate-800">
              Riwayat Persetujuan & Revisi
            </h3>
            <span
              v-if="rabData.riwayat?.length"
              class="ml-auto text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-semibold"
            >
              {{ rabData.riwayat.length }} entri
            </span>
          </div>
          <div class="p-6">
            <!-- Riwayat approval -->
            <div v-if="rabData.riwayat?.length" class="space-y-0">
              <div
                v-for="(log, i) in rabData.riwayat"
                :key="log.id"
                class="flex gap-4"
              >
                <div class="flex flex-col items-center">
                  <div
                    class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    :class="logIconClass(log.action)"
                  >
                    <Icon :name="logIcon(log.action)" class="w-4 h-4" />
                  </div>
                  <div
                    v-if="i < rabData.riwayat.length - 1"
                    class="w-0.5 flex-1 bg-slate-200 mt-2"
                  ></div>
                </div>
                <div class="pb-4 flex-1">
                  <div class="flex items-start justify-between gap-2">
                    <p class="text-sm font-semibold text-slate-800">
                      {{ logLabel(log) }}
                    </p>
                    <span class="text-xs text-slate-400 whitespace-nowrap">{{
                      formatDateTime(log.createdAt)
                    }}</span>
                  </div>
                  <p class="text-xs text-slate-500 mt-0.5">
                    oleh {{ log.aktor?.nama }} ({{ log.aktor?.role }})
                  </p>
                  <div
                    v-if="log.catatan"
                    class="mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800"
                  >
                    <span class="font-semibold">Catatan:</span>
                    {{ log.catatan }}
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="text-center py-6 text-slate-400">
              <p class="text-sm">Belum ada riwayat persetujuan</p>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT: Ringkasan + Aksi -->
      <div class="space-y-6">
        <!-- Ringkasan -->
        <div
          class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div class="px-5 py-4 border-b border-slate-100">
            <h3 class="font-bold text-slate-800">Ringkasan</h3>
          </div>
          <div class="p-5 space-y-4">
            <div class="bg-[#3b5988] rounded-xl p-4 text-white">
              <p class="text-xs opacity-70 mb-1">Total Anggaran Diajukan</p>
              <p class="text-xl font-bold">
                Rp {{ formatCurrency(rabData.totalAnggaran) }}
              </p>
            </div>
            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-slate-500">Pengaju</span>
                <span
                  class="font-medium text-slate-800 text-right max-w-[60%]"
                  >{{ rabData.pengaju?.nama || "-" }}</span
                >
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Ormawa</span>
                <span
                  class="font-medium text-slate-800 text-right max-w-[60%]"
                  >{{ rabData.ormawa?.nama || "-" }}</span
                >
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Tanggal Upload</span>
                <span class="font-medium text-slate-800">{{
                  formatDate(rabData.createdAt)
                }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Status Saat Ini</span>
                <span
                  class="inline-flex text-xs font-semibold px-2 py-0.5 rounded-full"
                  :class="statusClass(rabData.status)"
                >
                  {{ formatStatus(rabData.status) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Aksi PPK -->
        <div
          v-if="rabData.status === 'waiting_ppk'"
          class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div class="px-5 py-4 border-b border-slate-100">
            <h3 class="font-bold text-slate-800">Keputusan PPK</h3>
            <p class="text-xs text-slate-500 mt-0.5">
              Tentukan status pengajuan ini
            </p>
          </div>
          <div class="p-5 space-y-4">
            <div>
              <label
                class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2"
              >
                Catatan (Wajib jika revisi)
              </label>
              <textarea
                v-model="catatanKeputusan"
                rows="3"
                class="w-full rounded-xl border-slate-200 text-sm focus:ring-[#3b5988] focus:border-[#3b5988]"
                placeholder="Berikan catatan atau alasan..."
              ></textarea>
            </div>

            <div class="grid grid-cols-1 gap-3">
              <button
                @click="prosesKeputusan('disetujui')"
                :disabled="isSubmitting"
                class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-semibold transition text-sm shadow-md"
              >
                <Icon name="heroicons:check-circle" class="w-5 h-5" />
                Setujui Pengajuan
              </button>

              <button
                @click="prosesKeputusan('revisi')"
                :disabled="isSubmitting || !catatanKeputusan.trim()"
                class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl font-semibold transition text-sm shadow-md"
              >
                <Icon name="heroicons:arrow-path" class="w-5 h-5" />
                Minta Revisi
              </button>
            </div>
          </div>
        </div>

        <div
          v-else
          class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 text-center"
        >
          <div class="flex flex-col items-center gap-2 text-slate-500">
            <Icon
              name="heroicons:information-circle"
              class="w-8 h-8 text-slate-300"
            />
            <p class="text-sm font-medium">Pengajuan ini sudah diproses</p>
            <p class="text-xs">
              Status saat ini: {{ formatStatus(rabData.status) }}
            </p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted, onBeforeUnmount } from "vue";
  import { usePpkRabDetailStore } from "~/stores/ppk/rabDetail";

  const route = useRoute();
  const rabStore = usePpkRabDetailStore();

  // State dari store RAB
  const rabData = computed(() => rabStore.detail);
  const loading = computed(() => rabStore.loading);
  const error = computed(() => rabStore.error);

  // Multi-document State
  const activeDocumentTab = ref("rab");
  const currentFilePath = computed(() =>
    activeDocumentTab.value === "rab"
      ? rabData.value?.fileRabUrl
      : rabData.value?.fileTorUrl,
  );
  const currentFileUrl = computed(() => {
    if (!currentFilePath.value) return "";
    return rabStore.getFileUrl(currentFilePath.value);
  });

  const catatanKeputusan = ref("");
  const isSubmitting = ref(false);

  const todayStr = new Date().toLocaleDateString("id-ID", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (value) => {
    if (!value) return "0";
    return new Intl.NumberFormat("id-ID").format(parseFloat(value));
  };

  const formatStatus = (status) => {
    const map = {
      draft: "Draft",
      waiting_kaprodi: "Menunggu Kaprodi",
      revisi_kaprodi: "Revisi Kaprodi",
      waiting_ppk: "Menunggu PPK",
      revisi_ppk: "Revisi PPK",
      waiting_spi: "Menunggu SPI",
      ditolak_spi: "Ditolak SPI",
      revisi_spi: "Revisi SPI",
      disetujui: "Disetujui",
      lunas_ppk: "Lunas (PPK)",
      selesai_spi: "Selesai (SPI)",
      selesai: "Selesai",
    };
    return map[status] || status || "-";
  };

  const statusClass = (status) => {
    const map = {
      draft: "bg-slate-100 text-slate-600",
      waiting_kaprodi: "bg-amber-100 text-amber-700",
      revisi_kaprodi: "bg-orange-100 text-orange-700",
      waiting_ppk: "bg-blue-100 text-blue-700",
      revisi_ppk: "bg-orange-100 text-orange-700",
      waiting_spi: "bg-blue-100 text-blue-700",
      ditolak_spi: "bg-red-100 text-red-700",
      revisi_spi: "bg-orange-100 text-orange-700",
      disetujui: "bg-emerald-100 text-emerald-700",
      lunas_ppk: "bg-emerald-100 text-emerald-700",
      selesai_spi: "bg-emerald-100 text-emerald-700",
      selesai: "bg-emerald-100 text-emerald-700",
    };
    return map[status] || "bg-slate-100 text-slate-600";
  };

  const isPdf = computed(() => {
    return true; // Asumsi PDF karena backend mengirim PDF
  });

  // Log helpers
  const logIcon = (action) => {
    const map = {
      disetujui: "heroicons:check-circle",
      revisi: "heroicons:arrow-path",
      ditolak: "heroicons:x-circle",
      submit: "heroicons:arrow-up-tray",
    };
    return map[action] || "heroicons:ellipsis-horizontal-circle";
  };

  const logIconClass = (action) => {
    const map = {
      disetujui: "bg-emerald-100 text-emerald-600",
      revisi: "bg-amber-100 text-amber-600",
      ditolak: "bg-red-100 text-red-600",
    };
    return map[action] || "bg-slate-100 text-slate-500";
  };

  const logLabel = (log) => {
    const action = log.action;
    const role = log.aktor?.role?.toUpperCase() || "";
    if (action === "disetujui")
      return `Disetujui oleh ${role} — diteruskan ke tahap berikutnya`;
    if (action === "revisi") return `Diminta revisi oleh ${role}`;
    if (action === "ditolak") return `Ditolak oleh ${role}`;
    return action || "-";
  };

  const goBack = () => navigateTo("/dashboard/ppk");

  const reloadData = async () => {
    const id = route.params.id;
    await rabStore.fetchFullRabData(id);
  };

  const openDocument = () => {
    if (currentFileUrl.value) {
      window.open(currentFileUrl.value, "_blank");
    }
  };

  const downloadDocument = () => {
    if (currentFileUrl.value) {
      const link = document.createElement("a");
      link.href = currentFileUrl.value;
      link.download = `dokumen_${activeDocumentTab.value}.pdf`;
      link.click();
    }
  };

  const prosesKeputusan = async (keputusan) => {
    if (
      (keputusan === "revisi" || keputusan === "tolak") &&
      !catatanKeputusan.value.trim()
    ) {
      alert("Catatan wajib diisi untuk revisi atau penolakan");
      return;
    }

    if (
      !confirm(
        `Apakah Anda yakin ingin memberikan keputusan: ${keputusan.toUpperCase()}?`,
      )
    ) {
      return;
    }

    isSubmitting.value = true;
    try {
      const res = await $fetch(
        `/api/ppk/kegiatan/${route.params.id}/keputusan`,
        {
          method: "POST",
          body: {
            keputusan,
            catatan: catatanKeputusan.value,
          },
        },
      );

      if (res.success) {
        alert(res.message);
        await reloadData();
        catatanKeputusan.value = "";
      }
    } catch (err) {
      console.error(err);
      alert(err.data?.statusMessage || "Gagal memproses keputusan");
    } finally {
      isSubmitting.value = false;
    }
  };

  onMounted(async () => {
    const id = route.params.id;
    if (id) {
      await reloadData();
    }
  });

  onBeforeUnmount(() => {
    // No cleanup needed for server-streamed URLs
  });
</script>

<style scoped>
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  ::-webkit-scrollbar-track {
    background: #f1f5f9;
  }
  ::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
</style>
