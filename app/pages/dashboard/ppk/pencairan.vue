<!-- FILE: app/pages/dashboard/ppk/pencairan.vue -->
<template>
  <div class="min-h-screen bg-slate-50 font-sans">
    <header
      class="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-4"
    >
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 class="text-xl font-bold text-slate-900">
            Pengajuan <span class="text-[#d1a82a]">Pencairan</span>
          </h2>
          <p class="text-sm text-slate-500">
            Tinjau dokumen barang dan jasa yang diajukan ormawa
          </p>
        </div>

        <div class="flex items-center gap-3">
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
              placeholder="Cari ormawa / kegiatan..."
              class="bg-transparent border-none text-sm text-slate-700 focus:outline-none w-44 sm:w-64"
            />
          </div>

          <div
            class="flex items-center gap-2 bg-white rounded-full border border-slate-200 px-4 py-2 shadow-sm"
          >
            <Icon name="heroicons:funnel" class="w-4 h-4 text-[#d1a82a]" />
            <select
              v-model="filterStatus"
              class="bg-transparent border-none text-sm text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="">Semua Status</option>
              <option value="menunggu_dokumen">Menunggu Dokumen</option>
              <option value="dokumen_lengkap">Dokumen Lengkap</option>
              <option value="dikembalikan">Revisi</option>
              <option value="selesai">Selesai</option>
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

    <main class="p-4 sm:p-6 lg:p-8 space-y-6">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-slate-200 p-6"
        >
          <div class="flex items-center justify-between mb-4">
            <div class="p-3 rounded-xl" :class="stat.iconClass">
              <Icon :name="stat.icon" class="w-6 h-6" />
            </div>
          </div>

          <h3 class="text-2xl font-bold text-slate-900 mb-1">
            {{ stat.value }}
          </h3>
          <p class="text-sm text-slate-500">
            {{ stat.label }}
          </p>
          <span class="inline-block mt-1 text-xs" :class="stat.textClass">
            {{ stat.caption }}
          </span>
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
            <h3 class="text-lg font-bold text-slate-900">
              Daftar Pengajuan Pencairan
            </h3>
            <p class="text-sm text-slate-500">
              {{ filteredList.length }} pengajuan ditampilkan
            </p>
          </div>

          <span
            class="px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-600 rounded-full"
          >
            {{ pencairanList.length }} total
          </span>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-slate-50 border-b border-slate-200">
              <tr>
                <th class="text-left py-3 px-4 font-semibold text-slate-500">
                  Kegiatan
                </th>
                <th class="text-left py-3 px-4 font-semibold text-slate-500">
                  Ormawa
                </th>
                <th class="text-left py-3 px-4 font-semibold text-slate-500">
                  Jenis
                </th>
                <th class="text-left py-3 px-4 font-semibold text-slate-500">
                  Penerima
                </th>
                <th class="text-right py-3 px-4 font-semibold text-slate-500">
                  Nominal
                </th>
                <th class="text-center py-3 px-4 font-semibold text-slate-500">
                  Dokumen
                </th>
                <th class="text-center py-3 px-4 font-semibold text-slate-500">
                  Status
                </th>
                <th class="text-center py-3 px-4 font-semibold text-slate-500">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="item in filteredList"
                :key="item.urlId"
                class="border-b border-slate-100 hover:bg-slate-50 transition"
              >
                <td class="py-3 px-4 min-w-64">
                  <p class="font-semibold text-slate-800">
                    {{ item.namaKegiatan }}
                  </p>
                  <p class="text-xs text-slate-500">
                    Diajukan {{ formatDate(item.tanggalPengajuan) }}
                  </p>
                </td>

                <td class="py-3 px-4">
                  <div class="flex items-center gap-2">
                    <div
                      class="w-8 h-8 rounded-lg bg-[#3b5988] text-white text-xs font-bold flex items-center justify-center"
                    >
                      {{ item.kodeOrmawa?.charAt(0) || "O" }}
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

                <td class="py-3 px-4">
                  <span
                    class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold"
                    :class="typeClass(item.tipeTagihan)"
                  >
                    <Icon
                      :name="
                        item.tipeTagihan === 'BARANG'
                          ? 'heroicons:shopping-bag'
                          : 'heroicons:user-group'
                      "
                      class="w-3.5 h-3.5"
                    />
                    {{ item.tipeTagihan }}
                  </span>
                </td>

                <td class="py-3 px-4">
                  <p class="font-medium text-slate-800">
                    {{ item.namaPenerima || "-" }}
                  </p>
                  <p class="text-xs text-slate-500">
                    {{ item.rekeningPenerima || "Rekening belum ada" }}
                  </p>
                </td>

                <td class="py-3 px-4 text-right font-semibold text-[#d1a82a]">
                  {{ formatRp(item.totalDana) }}
                </td>

                <td class="py-3 px-4 text-center">
                  <span
                    class="text-xs font-semibold"
                    :class="
                      item.docPct === 100
                        ? 'text-emerald-600'
                        : 'text-amber-600'
                    "
                  >
                    {{ item.uploadedDocs }}/{{ item.totalDocs }}
                  </span>

                  <div
                    class="mt-1 h-1.5 w-20 bg-slate-100 rounded-full overflow-hidden mx-auto"
                  >
                    <div
                      class="h-full rounded-full"
                      :class="
                        item.docPct === 100
                          ? 'bg-emerald-500'
                          : 'bg-amber-500'
                      "
                      :style="{ width: item.docPct + '%' }"
                    ></div>
                  </div>
                </td>

                <td class="py-3 px-4 text-center">
                  <span
                    class="inline-flex text-xs font-semibold px-2 py-1 rounded-full"
                    :class="statusClass(item.statusPencairan)"
                  >
                    {{ statusLabel(item.statusPencairan) }}
                  </span>
                </td>

                <td class="py-3 px-4 text-center">
                  <button
                    @click="goDetail(item.urlId)"
                    class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#d1a82a]/10 text-[#a78317] hover:bg-[#d1a82a]/20 transition font-medium text-sm"
                  >
                    <Icon name="heroicons:eye" class="w-4 h-4" />
                    Detail
                  </button>
                </td>
              </tr>

              <tr v-if="filteredList.length === 0">
                <td colspan="8" class="py-12 text-center text-slate-400">
                  <Icon
                    name="heroicons:document-magnifying-glass"
                    class="w-12 h-12 mx-auto mb-2 text-slate-300"
                  />
                  <p>Tidak ada data pencairan</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { usePpkPencairanStore } from "~/stores/ppk/pencairan";

const pencairanStore = usePpkPencairanStore();

const {
  searchQuery,
  filterStatus,
  todayStr,
  pencairanList,
  filteredList,
  stats,
} = storeToRefs(pencairanStore);

const {
  fetchPencairan,
  goDetail,
  typeClass,
  statusClass,
  statusLabel,
  formatRp,
  formatDate,
} = pencairanStore;

await fetchPencairan();
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