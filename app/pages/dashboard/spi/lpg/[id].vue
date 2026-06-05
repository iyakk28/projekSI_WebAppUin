<template>
  <div class="min-h-screen bg-slate-50 font-sans">
    <!-- Header -->
    <header
      class="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-4"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <NuxtLink
            to="/dashboard/spi/lpg"
            class="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition font-medium"
          >
            <Icon name="heroicons:arrow-left" class="w-4 h-4" /> Kembali
          </NuxtLink>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs text-slate-400 font-mono">{{
            spiLpgStore.detail?.rab?.nomorPengajuan
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
    <div
      v-if="spiLpgStore.loading && !spiLpgStore.detail"
      class="flex items-center justify-center py-32"
    >
      <div class="flex flex-col items-center gap-3 text-slate-400">
        <div
          class="w-8 h-8 border-2 border-slate-200 border-t-[#3b5988] rounded-full animate-spin"
        ></div>
        <p class="text-sm">Memuat detail Laporan Pertanggungjawaban...</p>
      </div>
    </div>

    <!-- Content -->
    <main
      v-else-if="spiLpgStore.detail"
      class="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6"
    >
      <!-- LEFT COLUMN: Info Kegiatan + Preview LPG + Riwayat -->
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
              <Icon name="heroicons:clipboard-document-list" class="w-5 h-5" />
            </div>
            <div>
              <h2 class="font-bold text-slate-800 text-lg">
                {{ spiLpgStore.detail.rab?.judulKegiatan }}
              </h2>
              <p class="text-xs text-slate-500">
                {{ spiLpgStore.detail.ormawa?.fullName }} · Laporan
                Pertanggungjawaban
              </p>
            </div>
            <div class="ml-auto">
              <span
                class="inline-flex text-xs font-semibold px-3 py-1 rounded-full"
                :class="getStatusBadgeClass(spiLpgStore.detail.lpg?.statusLpg)"
              >
                {{ formatStatusLpg(spiLpgStore.detail.lpg?.statusLpg) }}
              </span>
            </div>
          </div>
          <div class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <p class="text-xs font-semibold uppercase text-slate-400 mb-1">
                Diajukan Oleh
              </p>
              <p class="font-medium text-slate-800">
                {{ spiLpgStore.detail.ormawa?.fullName || "-" }}
              </p>
              <p class="text-xs text-slate-500">
                {{ spiLpgStore.detail.ormawa?.email || "-" }}
              </p>
            </div>
            <div>
              <p class="text-xs font-semibold uppercase text-slate-400 mb-1">
                Organisasi
              </p>
              <p class="font-medium text-slate-800">
                {{ spiLpgStore.detail.rab?.ormawa?.nama || "-" }}
              </p>
            </div>
            <div>
              <p class="text-xs font-semibold uppercase text-slate-400 mb-1">
                Tanggal Kegiatan
              </p>
              <p class="font-medium text-slate-800">
                {{ formatDate(spiLpgStore.detail.rab?.tanggalMulai) }}
                <span
                  v-if="
                    spiLpgStore.detail.rab?.tanggalSelesai &&
                    spiLpgStore.detail.rab?.tanggalSelesai !==
                      spiLpgStore.detail.rab?.tanggalMulai
                  "
                >
                  — {{ formatDate(spiLpgStore.detail.rab?.tanggalSelesai) }}
                </span>
              </p>
            </div>
            <div>
              <p class="text-xs font-semibold uppercase text-slate-400 mb-1">
                Total Anggaran
              </p>
              <p class="font-bold text-[#3b5988] text-lg">
                {{ formatRupiah(spiLpgStore.detail.rab?.totalAnggaran) }}
              </p>
            </div>
            <div class="sm:col-span-2">
              <p class="text-xs font-semibold uppercase text-slate-400 mb-1">
                Deskripsi Kegiatan
              </p>
              <p class="text-slate-700 text-sm leading-relaxed">
                {{ spiLpgStore.detail.rab?.deskripsi || "-" }}
              </p>
            </div>
          </div>
        </div>

        <!-- Catatan Pengaju -->
        <div
          v-if="spiLpgStore.detail.lpg?.ormawaNotes"
          class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div
            class="flex items-center gap-2 px-6 py-4 border-b border-slate-100"
          >
            <Icon
              name="heroicons:chat-bubble-left-right"
              class="w-5 h-5 text-[#d1a82a]"
            />
            <h3 class="font-bold text-slate-800">Catatan Pengaju</h3>
          </div>
          <div class="p-6">
            <div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p class="text-sm text-blue-800 leading-relaxed italic">
                "{{ spiLpgStore.detail.lpg.ormawaNotes }}"
              </p>
            </div>
          </div>
        </div>

        <!-- Preview Dokumen LPG -->
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
              Preview Dokumen LPG
            </h3>

            <div class="flex flex-wrap gap-2 items-center justify-between">
              <div class="flex gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  v-for="file in spiLpgFileStore.files"
                  :key="file.name"
                  @click="selectedFile = file.url"
                  :class="[
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                    selectedFile === file.url
                      ? 'bg-white text-[#3b5988] shadow-sm'
                      : 'text-slate-600 hover:text-slate-900',
                  ]"
                >
                  <Icon name="heroicons:document" class="w-4 h-4" />
                  {{
                    file.name.length > 20
                      ? file.name.substring(0, 20) + "..."
                      : file.name
                  }}
                </button>
              </div>
              <button
                v-if="selectedFile"
                @click="openDocument"
                class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#3b5988]/10 text-[#3b5988] hover:bg-[#3b5988] hover:text-white transition-all text-sm"
              >
                <Icon name="heroicons:arrows-pointing-out" class="w-4 h-4" />
                Buka Baru
              </button>
            </div>
          </div>

          <div class="p-6">
            <div
              v-if="spiLpgFileStore.loading"
              class="flex items-center justify-center py-32"
            >
              <div class="flex flex-col items-center gap-3 text-slate-400">
                <div
                  class="w-8 h-8 border-2 border-slate-200 border-t-[#3b5988] rounded-full animate-spin"
                ></div>
                <p class="text-sm">Memuat dokumen...</p>
              </div>
            </div>

            <div
              v-else-if="spiLpgFileStore.error"
              class="aspect-[3/4] bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center p-8 text-center"
            >
              <div
                class="w-20 h-20 rounded-2xl bg-red-100 flex items-center justify-center mb-4"
              >
                <Icon
                  name="heroicons:exclamation-triangle"
                  class="w-10 h-10 text-red-500"
                />
              </div>
              <h4 class="text-lg font-semibold text-slate-900 mb-2">
                Gagal Memuat Dokumen
              </h4>
              <p class="text-sm text-slate-500">{{ spiLpgFileStore.error }}</p>
            </div>

            <div
              v-else-if="!selectedFile"
              class="aspect-[3/4] bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center p-8 text-center"
            >
              <div
                class="w-20 h-20 rounded-2xl bg-[#3b5988]/10 flex items-center justify-center mb-4"
              >
                <Icon
                  name="heroicons:document-minus"
                  class="w-10 h-10 text-[#3b5988]"
                />
              </div>
              <h4 class="text-lg font-semibold text-slate-900 mb-2">
                Tidak Ada Dokumen
              </h4>
              <p class="text-sm text-slate-500">
                Tidak ada dokumen LPG yang tersedia untuk ditampilkan.
              </p>
            </div>

            <div v-else class="w-full">
              <iframe
                :src="selectedFile"
                class="w-full h-[600px] rounded-xl border border-slate-200"
                frameborder="0"
              ></iframe>
            </div>
          </div>
        </div>

        <!-- Riwayat Pemeriksaan -->
        <div
          class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div
            class="flex items-center gap-2 px-6 py-4 border-b border-slate-100"
          >
            <Icon name="heroicons:clock" class="w-5 h-5 text-[#d1a82a]" />
            <h3 class="font-bold text-slate-800">Riwayat Pemeriksaan</h3>
            <span
              v-if="spiLpgStore.detail.logs?.length"
              class="ml-auto text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-semibold"
            >
              {{ spiLpgStore.detail.logs.length }} entri
            </span>
          </div>
          <div class="p-6">
            <!-- Upload pertama -->
            <div class="flex gap-4 mb-4">
              <div class="flex flex-col items-center">
                <div
                  class="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0"
                >
                  <Icon name="heroicons:arrow-up-tray" class="w-4 h-4" />
                </div>
                <div
                  v-if="spiLpgStore.detail.logs?.length"
                  class="w-0.5 flex-1 bg-slate-200 mt-2"
                ></div>
              </div>
              <div class="pb-4">
                <p class="text-sm font-semibold text-slate-800">LPG diunggah</p>
                <p class="text-xs text-slate-500 mt-0.5">
                  oleh {{ spiLpgStore.detail.ormawa?.fullName }} ·
                  {{ formatDateTime(spiLpgStore.detail.lpg?.createdAt) }}
                </p>
              </div>
            </div>

            <!-- Riwayat review -->
            <div v-if="spiLpgStore.detail.logs?.length" class="space-y-0">
              <div
                v-for="(log, i) in spiLpgStore.detail.logs"
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
                    v-if="i < spiLpgStore.detail.logs.length - 1"
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
                    oleh {{ log.actor?.fullName }} ({{ log.actor?.role }})
                  </p>
                  <div
                    v-if="log.catatanRevisi"
                    class="mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800"
                  >
                    <span class="font-semibold">Catatan:</span>
                    {{ log.catatanRevisi }}
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="text-center py-6 text-slate-400">
              <p class="text-sm">Belum ada riwayat pemeriksaan</p>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT COLUMN: Ringkasan + Aksi SPI -->
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
              <p class="text-xs opacity-70 mb-1">Total Anggaran</p>
              <p class="text-xl font-bold">
                {{ formatRupiah(spiLpgStore.detail.rab?.totalAnggaran) }}
              </p>
            </div>
            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-slate-500">Pengaju</span>
                <span
                  class="font-medium text-slate-800 text-right max-w-[60%]"
                  >{{ spiLpgStore.detail.ormawa?.fullName || "-" }}</span
                >
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Periode Kegiatan</span>
                <span class="font-medium text-slate-800 text-right">
                  {{ formatDate(spiLpgStore.detail.rab?.tanggalMulai) }}
                  <span v-if="spiLpgStore.detail.rab?.tanggalSelesai"
                    ><br />—
                    {{
                      formatDate(spiLpgStore.detail.rab?.tanggalSelesai)
                    }}</span
                  >
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Tanggal Upload LPG</span>
                <span class="font-medium text-slate-800">{{
                  formatDate(spiLpgStore.detail.lpg?.createdAt)
                }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Status Saat Ini</span>
                <span
                  class="inline-flex text-xs font-semibold px-2 py-0.5 rounded-full"
                  :class="
                    getStatusBadgeClass(spiLpgStore.detail.lpg?.statusLpg)
                  "
                >
                  {{ formatStatusLpg(spiLpgStore.detail.lpg?.statusLpg) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Aksi SPI (hanya untuk WAITING_SPI) -->
        <div
          v-if="spiLpgStore.detail.lpg?.statusLpg === 'WAITING_SPI'"
          class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div class="px-5 py-4 border-b border-slate-100">
            <h3 class="font-bold text-slate-800">Keputusan SPI</h3>
            <p class="text-xs text-slate-500 mt-0.5">
              Review Laporan Pertanggungjawaban
            </p>
          </div>
          <div class="p-5 space-y-4">
            <!-- Panduan Verifikasi -->
            <div class="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
              <div class="flex items-center gap-2 mb-2">
                <Icon
                  name="heroicons:information-circle"
                  class="w-4 h-4 text-emerald-600"
                />
                <h4 class="font-bold text-emerald-800 text-xs uppercase">
                  Panduan Verifikasi
                </h4>
              </div>
              <ul
                class="text-xs text-emerald-700 space-y-1 list-disc list-inside"
              >
                <li>Pastikan semua nota valid dan sesuai</li>
                <li>Periksa kesesuaian dengan RAB awal</li>
                <li>Verifikasi dokumentasi kegiatan</li>
                <li>Pastikan laporan memuat semua bukti transaksi</li>
              </ul>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <button
                @click="reviewAction = 'approve'"
                :class="[
                  'px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2',
                  reviewAction === 'approve'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'border border-slate-200 text-slate-600 hover:bg-slate-50',
                ]"
              >
                <Icon name="heroicons:check-circle" class="w-4 h-4" />
                Setujui
              </button>
              <button
                @click="reviewAction = 'revision'"
                :class="[
                  'px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2',
                  reviewAction === 'revision'
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'border border-slate-200 text-slate-600 hover:bg-slate-50',
                ]"
              >
                <Icon name="heroicons:arrow-path" class="w-4 h-4" />
                Revisi
              </button>
            </div>

            <div>
              <label class="text-sm font-semibold text-slate-700 block mb-1.5">
                Catatan / Alasan
                <span
                  v-if="reviewAction === 'revision'"
                  class="font-normal text-red-500"
                  >* (wajib)</span
                >
                <span v-else class="font-normal text-slate-400"
                  >(opsional)</span
                >
              </label>
              <textarea
                v-model="notes"
                rows="4"
                class="w-full border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b5988]/30 focus:border-[#3b5988] resize-none"
                :placeholder="
                  reviewAction === 'approve'
                    ? 'Tambahkan catatan persetujuan (opsional)...'
                    : 'Jelaskan detail poin yang harus diperbaiki...'
                "
              ></textarea>
            </div>

            <button
              @click="submitReview"
              :disabled="spiLpgStore.loading"
              class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#3b5988] hover:bg-[#2d4570] disabled:opacity-50 text-white rounded-xl font-semibold transition text-sm shadow-md"
            >
              <Icon
                v-if="spiLpgStore.loading"
                name="heroicons:arrow-path"
                class="w-4 h-4 animate-spin"
              />
              <Icon v-else name="heroicons:paper-airplane" class="w-4 h-4" />
              {{ spiLpgStore.loading ? "Memproses..." : "Kirim Keputusan" }}
            </button>
          </div>
        </div>

        <!-- Status sudah direview -->
        <div
          v-else
          class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center"
              :class="
                spiLpgStore.detail.lpg?.statusLpg === 'DISETUJUI'
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-amber-100 text-amber-600'
              "
            >
              <Icon
                :name="
                  spiLpgStore.detail.lpg?.statusLpg === 'DISETUJUI'
                    ? 'heroicons:check-circle'
                    : 'heroicons:exclamation-triangle'
                "
                class="w-5 h-5"
              />
            </div>
            <div>
              <p class="text-sm font-semibold text-slate-800">
                Pemeriksaan Selesai
              </p>
              <p class="text-xs text-slate-500">
                LPG telah diproses dengan status akhir
              </p>
            </div>
          </div>
          <div
            v-if="spiLpgStore.detail.lpg?.spiNotes"
            class="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100"
          >
            <p
              class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1"
            >
              Catatan SPI
            </p>
            <p class="text-sm text-slate-700">
              {{ spiLpgStore.detail.lpg.spiNotes }}
            </p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
  import { useSpiLpgStore } from "~/stores/spi/lpg";
  import { useSpiLpgFileStore } from "~/stores/spi/filePreview";
  import { ref, onMounted } from "vue";

  const route = useRoute();
  const router = useRouter();
  const spiLpgStore = useSpiLpgStore();
  const spiLpgFileStore = useSpiLpgFileStore();

  const lpgId = Number(route.params.id);

  const notes = ref("");
  const reviewAction = ref<"approve" | "revision">("approve");
  const selectedFile = ref<string | null>(null);

  const todayStr = new Date().toLocaleDateString("id-ID", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  onMounted(async () => {
    await Promise.all([
      spiLpgStore.fetchLpgDetail(lpgId),
      spiLpgFileStore.fetchLpgFiles(lpgId),
    ]);

    if (spiLpgFileStore.files.length > 0) {
      selectedFile.value = spiLpgFileStore.files[0].url;
    }
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatRupiah = (amount: string | number) => {
    if (!amount) return "Rp 0";
    return "Rp " + new Intl.NumberFormat("id-ID").format(Number(amount));
  };

  const formatStatusLpg = (status: string) => {
    const map: Record<string, string> = {
      WAITING_SPI: "Menunggu SPI",
      DISETUJUI: "Disetujui",
      REVISI_SPI: "Revisi SPI",
      DRAFT: "Draft",
    };
    return map[status] || status || "-";
  };

  const getStatusBadgeClass = (status: string) => {
    const map: Record<string, string> = {
      WAITING_SPI: "bg-amber-100 text-amber-700",
      DISETUJUI: "bg-emerald-100 text-emerald-700",
      REVISI_SPI: "bg-orange-100 text-orange-700",
      DRAFT: "bg-slate-100 text-slate-600",
    };
    return map[status] || "bg-slate-100 text-slate-600";
  };

  // Log helpers
  const logIcon = (action?: string) => {
    const map: Record<string, string> = {
      approve: "heroicons:check-circle",
      disetujui: "heroicons:check-circle",
      revision: "heroicons:arrow-path",
      revisi: "heroicons:arrow-path",
      reject: "heroicons:x-circle",
    };
    return map[action || ""] || "heroicons:ellipsis-horizontal-circle";
  };

  const logIconClass = (action?: string) => {
    const map: Record<string, string> = {
      approve: "bg-emerald-100 text-emerald-600",
      disetujui: "bg-emerald-100 text-emerald-600",
      revision: "bg-amber-100 text-amber-600",
      revisi: "bg-amber-100 text-amber-600",
      reject: "bg-red-100 text-red-600",
    };
    return map[action || ""] || "bg-slate-100 text-slate-500";
  };

  const logLabel = (log: any) => {
    const action = log.action;
    const role = log.actor?.role?.toUpperCase() || "";
    if (action === "approve" || action === "disetujui")
      return `Disetujui oleh ${role}`;
    if (action === "revision" || action === "revisi")
      return `Diminta revisi oleh ${role}`;
    return action || "-";
  };

  const openDocument = () => {
    if (selectedFile.value) {
      window.open(selectedFile.value, "_blank");
    }
  };

  const submitReview = async () => {
    if (reviewAction.value === "revision" && !notes.value.trim()) {
      alert("Catatan revisi wajib diisi jika ingin melakukan revisi");
      return;
    }

    try {
      await spiLpgStore.reviewLpg(lpgId, reviewAction.value, notes.value);
      alert(
        reviewAction.value === "approve"
          ? "LPG Berhasil Disetujui"
          : "Revisi Berhasil Dikirim",
      );
      router.push("/dashboard/spi/lpg");
    } catch (error: any) {
      alert(error.message || "Gagal memproses review");
    }
  };
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
