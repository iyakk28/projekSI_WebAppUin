<template>
  <div
    class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
  >
    <div
      class="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div>
        <h3 class="text-lg font-bold text-slate-900">Daftar Antrean LPG</h3>
        <p class="text-sm text-slate-500">
          Monitor dan verifikasi Laporan Pertanggungjawaban
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
            placeholder="Cari LPG..."
            class="pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 w-full sm:w-64"
          />
        </div>
      </div>
    </div>

    <div v-if="lpgStore.loading" class="flex justify-center items-center py-12">
      <div class="flex flex-col items-center gap-3">
        <Icon
          name="heroicons:arrow-path"
          class="w-8 h-8 animate-spin text-emerald-600"
        />
        <p class="text-slate-500 text-sm">Memuat data LPG...</p>
      </div>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-slate-50/50 border-b border-slate-200">
          <tr>
            <th
              class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
            >
              Nomor Pengajuan
            </th>
            <th
              class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
            >
              Nama Kegiatan
            </th>
            <th
              class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
            >
              Ormawa
            </th>
            <th
              class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
            >
              Anggaran
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
            v-for="lpg in filteredLpgList"
            :key="lpg.rabId"
            class="hover:bg-slate-50/50 transition-colors group"
          >
            <td
              class="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900"
            >
              {{ lpg.nomorPengajuan }}
            </td>
            <td class="px-6 py-4">
              <p class="text-sm font-semibold text-slate-900">
                {{ lpg.judulKegiatan }}
              </p>
              <p class="text-xs text-slate-500">
                Dikirim: {{ formatDate(lpg.submittedAt) }}
              </p>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
              {{ lpg.ormawaLabel || lpg.ormawaName }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="text-sm font-semibold text-slate-900"
                >Rp
                {{ Number(lpg.totalAnggaran).toLocaleString("id-ID") }}</span
              >
            </td>

            <td class="px-6 py-4 whitespace-nowrap text-right">
              <NuxtLink
                :to="`/dashboard/spi/lpg/${lpg.lpgId}`"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 transition-all"
              >
                <span>Review</span>
                <Icon name="heroicons:eye" class="w-4 h-4" />
              </NuxtLink>
            </td>
          </tr>
          <tr v-if="filteredLpgList.length === 0">
            <td colspan="5" class="px-6 py-12 text-center text-slate-500">
              Tidak ada antrean LPG yang ditemukan
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div
      v-if="lpgStore.total > 0"
      class="px-6 py-4 border-t border-slate-200 flex items-center justify-between"
    >
      <p class="text-sm text-slate-500">
        Menampilkan {{ (lpgStore.page - 1) * lpgStore.limit + 1 }} -
        {{ Math.min(lpgStore.page * lpgStore.limit, lpgStore.total) }}
        dari {{ lpgStore.total }} data
      </p>

      <div class="flex items-center gap-2">
        <button
          @click="lpgStore.changePage(lpgStore.page - 1)"
          :disabled="lpgStore.page === 1 || lpgStore.loading"
          class="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Icon name="heroicons:chevron-left" class="w-5 h-5" />
        </button>

        <span
          class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium shadow-sm shadow-emerald-600/20"
        >
          {{ lpgStore.page }}
        </span>

        <button
          @click="lpgStore.changePage(lpgStore.page + 1)"
          :disabled="
            lpgStore.page * lpgStore.limit >= lpgStore.total || lpgStore.loading
          "
          class="p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Icon name="heroicons:chevron-right" class="w-5 h-5" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from "vue";
  import { useSpiAllLpgStore } from "~/stores/spi/allLpg";

  const lpgStore = useSpiAllLpgStore();
  const searchQuery = ref("");

  const filteredLpgList = computed(() => {
    if (!searchQuery.value) return lpgStore.lpgList;
    const query = searchQuery.value.toLowerCase();
    return lpgStore.lpgList.filter(
      (lpg) =>
        lpg.nomorPengajuan?.toLowerCase().includes(query) ||
        lpg.judulKegiatan?.toLowerCase().includes(query) ||
        lpg.ormawaName?.toLowerCase().includes(query) ||
        lpg.ormawaLabel?.toLowerCase().includes(query),
    );
  });

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  onMounted(async () => {
    lpgStore.resetFilters();
    lpgStore.filters.status = "WAITING_SPI";
    await lpgStore.fetchLpgList();
  });
</script>
