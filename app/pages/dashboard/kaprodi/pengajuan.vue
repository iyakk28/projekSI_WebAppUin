<!-- FILE: app/pages/dashboard/kaprodi/pengajuan.vue -->
<template>
  <div class="min-h-screen bg-slate-50 font-sans">
    <!-- Main Content -->
    <div class="transition-all duration-300">
      <!-- Header -->
      <header
        class="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-4"
      >
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div class="flex items-center gap-4">
            <div>
              <h2 class="text-xl font-bold text-slate-900">
                Verifikasi <span class="text-[#d1a82a]">Proposal</span>
              </h2>
              <p class="text-sm text-slate-500">
                Persetujuan & review pengajuan kegiatan Ormawa binaan Anda
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <!-- Search -->
            <div
              class="flex items-center gap-2 bg-white rounded-full border border-slate-200 px-4 py-2 shadow-sm"
            >
              <Icon
                name="heroicons:magnifying-glass"
                class="w-4 h-4 text-slate-400"
              />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Cari kegiatan..."
                class="bg-transparent border-none text-sm text-slate-700 focus:outline-none w-40 sm:w-56"
              />
            </div>

            <!-- Filter -->
            <div
              class="flex items-center gap-2 bg-white rounded-full border border-slate-200 px-4 py-2 shadow-sm"
            >
              <Icon name="heroicons:funnel" class="w-4 h-4 text-[#d1a82a]" />
              <select
                v-model="filterStatus"
                class="bg-transparent border-none text-sm text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="">Semua Status</option>
                <option value="menunggu">Menunggu Review</option>
                <option value="revisi">Direvisi Kaprodi</option>
                <option value="disetujui">Disetujui Kaprodi</option>
                <option value="ditolak">Ditolak SPI</option>
              </select>
            </div>

            <div
              class="bg-[#d1a82a] text-white text-xs font-bold px-4 py-2 rounded-full shadow-md"
            >
              {{ todayStr }}
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="p-4 sm:p-6 lg:p-8 space-y-6">
        <!-- Stats Cards -->
        <div
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6"
        >
          <!-- Total Kegiatan -->
          <div
            class="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-slate-200 p-6 group hover:shadow-lg transition-all duration-300"
          >
            <div
              class="absolute top-0 right-0 w-32 h-32 bg-[#3b5988]/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"
            ></div>

            <div class="relative">
              <div class="flex items-center justify-between mb-4">
                <div class="p-3 rounded-xl bg-[#3b5988]/10 text-[#3b5988]">
                  <Icon name="heroicons:document-text" class="w-6 h-6" />
                </div>
              </div>

              <h3 class="text-2xl font-bold text-slate-900 mb-1">
                {{ totalKegiatan }}
              </h3>
              <p class="text-sm text-slate-500">Total Kegiatan</p>
              <span class="inline-block mt-1 text-xs text-slate-400">
                Binaan prodi
              </span>
            </div>
          </div>

          <!-- Menunggu Review -->
          <div
            class="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-slate-200 p-6 group hover:shadow-lg transition-all duration-300"
          >
            <div
              class="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"
            ></div>

            <div class="relative">
              <div class="flex items-center justify-between mb-4">
                <div class="p-3 rounded-xl bg-amber-500/10 text-amber-600">
                  <Icon name="heroicons:clock" class="w-6 h-6" />
                </div>
              </div>

              <h3 class="text-2xl font-bold text-slate-900 mb-1">
                {{ countByStatus("menunggu") }}
              </h3>
              <p class="text-sm text-slate-500">Menunggu Review</p>
              <span
                class="inline-block mt-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full"
              >
                Perlu keputusan
              </span>
            </div>
          </div>

          <!-- Disetujui -->
          <div
            class="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-slate-200 p-6 group hover:shadow-lg transition-all duration-300"
          >
            <div
              class="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"
            ></div>

            <div class="relative">
              <div class="flex items-center justify-between mb-4">
                <div class="p-3 rounded-xl bg-emerald-500/10 text-emerald-600">
                  <Icon name="heroicons:check-circle" class="w-6 h-6" />
                </div>
              </div>

              <h3 class="text-2xl font-bold text-slate-900 mb-1">
                {{ countByStatus("disetujui") }}
              </h3>
              <p class="text-sm text-slate-500">Telah Disetujui</p>
              <span
                class="inline-block mt-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full"
              >
                Diteruskan ke PPK
              </span>
            </div>
          </div>

          <!-- Minta Revisi -->
          <div
            class="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-slate-200 p-6 group hover:shadow-lg transition-all duration-300"
          >
            <div
              class="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"
            ></div>

            <div class="relative">
              <div class="flex items-center justify-between mb-4">
                <div class="p-3 rounded-xl bg-orange-500/10 text-orange-600">
                  <Icon name="heroicons:arrow-path" class="w-6 h-6" />
                </div>
              </div>

              <h3 class="text-2xl font-bold text-slate-900 mb-1">
                {{ countByStatus("revisi") }}
              </h3>
              <p class="text-sm text-slate-500">Minta Revisi</p>
              <span
                class="inline-block mt-1 text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full"
              >
                Menunggu perbaikan
              </span>
            </div>
          </div>
        </div>

        <!-- Table Panel -->
        <div
          class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
        >
          <div
            class="flex justify-between items-center p-5 border-b border-slate-200"
          >
            <div>
              <h3 class="text-lg font-bold text-slate-900">Daftar Pengajuan</h3>
              <p class="text-sm text-slate-500">
                {{ filteredList.length }} pengajuan ditampilkan
              </p>
            </div>

            <span
              class="px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-600 rounded-full"
            >
              {{ totalKegiatan }} total
            </span>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead class="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th class="text-left py-3 px-4 font-semibold text-slate-500">
                    Kegiatan / Proposal
                  </th>
                  <th class="text-left py-3 px-4 font-semibold text-slate-500">
                    Ormawa Pengaju
                  </th>
                  <th class="text-left py-3 px-4 font-semibold text-slate-500">
                    Tanggal Diajukan
                  </th>
                  <th class="text-right py-3 px-4 font-semibold text-slate-500">
                    Anggaran Biaya
                  </th>
                  <th class="text-center py-3 px-4 font-semibold text-slate-500">
                    Status Verifikasi
                  </th>
                  <th class="text-center py-3 px-4 font-semibold text-slate-500">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="item in filteredList"
                  :key="item.id"
                  class="border-b border-slate-100 hover:bg-slate-50 transition"
                >
                  <td class="py-3 px-4">
                    <p class="font-semibold text-slate-800">
                      {{ item.namaKegiatan }}
                    </p>
                    <p class="text-xs text-slate-500">
                      No: {{ item.nomorPengajuan }}
                    </p>
                  </td>

                  <td class="py-3 px-4">
                    <div class="flex items-center gap-2">
                      <div
                        class="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold bg-[#3b5988]"
                      >
                        {{ item.kodeOrmawa?.charAt(0) }}
                      </div>

                      <div>
                        <p class="font-medium text-slate-800">
                          {{ item.namaOrmawa }}
                        </p>
                        <p class="text-xs text-slate-500">
                          {{ item.kodeOrmawa }}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td class="py-3 px-4 text-slate-600">
                    {{ formatDate(item.tanggalPengajuan) }}
                  </td>

                  <td class="py-3 px-4 text-right font-semibold text-[#d1a82a]">
                    {{ formatRp(item.totalDana) }}
                  </td>

                  <td class="py-3 px-4 text-center">
                    <span
                      class="inline-flex text-xs font-semibold px-2 py-1 rounded-full"
                      :class="{
                        'bg-amber-100 text-amber-700':
                          statusColor(item.status) === 'yellow',
                        'bg-emerald-100 text-emerald-700':
                          statusColor(item.status) === 'mint',
                        'bg-orange-100 text-orange-700':
                          statusColor(item.status) === 'orange',
                        'bg-red-100 text-red-700':
                          statusColor(item.status) === 'coral',
                        'bg-blue-100 text-blue-700':
                          statusColor(item.status) === 'blue',
                      }"
                    >
                      {{ statusLabel(item.status) }}
                    </span>
                  </td>

                  <td class="py-3 px-4 text-center">
                    <button
                      @click="
                        () =>
                          navigateTo(
                            `/dashboard/kaprodi/detailPengajuan/${item.id}`,
                          )
                      "
                      class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#d1a82a]/10 text-[#d1a82a] hover:bg-[#d1a82a]/20 transition font-medium text-sm"
                    >
                      <Icon
                        name="heroicons:magnifying-glass-circle-solid"
                        class="w-4 h-4"
                      />
                      Tinjau
                    </button>
                  </td>
                </tr>

                <tr v-if="filteredList.length === 0">
                  <td colspan="6" class="py-12 text-center text-slate-400">
                    <Icon
                      name="heroicons:document-magnifying-glass"
                      class="w-12 h-12 mx-auto mb-2 text-slate-300"
                    />
                    <p>Tidak ada data pengajuan</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useKaprodiPengajuanStore } from "~/stores/kaprodi/pengajuan";

const pengajuanStore = useKaprodiPengajuanStore();

const { searchQuery, filterStatus, todayStr, filteredList, totalKegiatan } =
  storeToRefs(pengajuanStore);

const {
  fetchKegiatan,
  countByStatus,
  statusLabel,
  statusColor,
  formatRp,
  formatDate,
} = pengajuanStore;

await fetchKegiatan();
</script>

<style scoped>
/* Custom scrollbar */
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