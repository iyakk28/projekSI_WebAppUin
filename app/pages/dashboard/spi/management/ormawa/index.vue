<template>
  <div class="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto space-y-6">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-slate-900 tracking-tight">Manajemen Ormawa</h1>
          <p class="text-slate-500 mt-1 text-sm font-medium">
            Kelola data Organisasi Mahasiswa, atur anggaran tahunan, dan mapping fakultas/prodi.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <NuxtLink
            to="/dashboard/spi/management/ormawa/tambah"
            class="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-200"
          >
            <Icon name="heroicons:plus" class="w-4 h-4" />
            Tambah Ormawa
          </NuxtLink>
          <NuxtLink
            to="/dashboard/spi"
            class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
          >
            <Icon name="heroicons:arrow-left" class="w-4 h-4" />
            Kembali
          </NuxtLink>
        </div>
      </div>

      <!-- Filters Section -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
        <div class="flex items-center gap-2 text-slate-800 font-bold mb-2">
          <Icon name="heroicons:funnel" class="w-5 h-5 text-emerald-600" />
          Filter Data Ormawa
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Search -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Cari Nama / Kode</label>
            <div class="relative">
              <Icon name="heroicons:magnifying-glass" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                v-model="filters.search"
                type="text"
                placeholder="Cari..."
                class="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all"
                @input="debouncedSearch"
              />
            </div>
          </div>

          <!-- Fakultas Filter -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Fakultas</label>
            <select
              v-model="filters.fakultasId"
              class="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all appearance-none cursor-pointer"
              @change="onFakultasChange"
            >
              <option value="">Semua Fakultas</option>
              <option v-for="f in fakultasStore.fakultas" :key="f.id" :value="f.id">{{ f.nama }}</option>
            </select>
          </div>

          <!-- Prodi Filter -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Program Studi</label>
            <select
              v-model="filters.prodiId"
              class="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all appearance-none cursor-pointer"
              @change="ormawaManagementStore.fetchOrmawa()"
            >
              <option value="">Semua Prodi</option>
              <option v-for="p in filteredProdi" :key="p.id" :value="p.id">{{ p.nama }}</option>
            </select>
          </div>

          <!-- Reset -->
          <div class="flex items-end pb-0.5">
            <button
              @click="ormawaManagementStore.resetFilters()"
              class="w-full px-4 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 border border-rose-100 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Icon name="heroicons:trash" class="w-4 h-4" />
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      <!-- Table Section -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200">
                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Kode</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Ormawa</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Unit / Fakultas</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Anggaran Tahunan</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-if="ormawaManagementStore.loading" v-for="i in 5" :key="i" class="animate-pulse">
                <td colspan="5" class="px-6 py-4">
                  <div class="h-4 bg-slate-100 rounded w-full"></div>
                </td>
              </tr>
              <tr v-else-if="ormawaManagementStore.ormawa.length === 0">
                <td colspan="5" class="px-6 py-12 text-center">
                  <div class="flex flex-col items-center gap-3">
                    <div class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                      <Icon name="heroicons:user-group" class="w-8 h-8 text-slate-300" />
                    </div>
                    <p class="text-slate-500 font-medium">Tidak ada data ormawa yang ditemukan.</p>
                  </div>
                </td>
              </tr>
              <tr v-else v-for="item in ormawaManagementStore.ormawa" :key="item.id" class="hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 py-1 bg-slate-100 rounded text-xs font-mono font-bold text-slate-700 uppercase">{{ item.kode }}</span>
                </td>
                <td class="px-6 py-4">
                  <p class="text-sm font-bold text-slate-900">{{ item.nama }}</p>
                </td>
                <td class="px-6 py-4">
                  <div class="flex flex-col">
                    <span class="text-sm font-bold text-slate-700">{{ item.namaProdi || 'Tingkat Fakultas' }}</span>
                    <span class="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{{ item.namaFakultas }}</span>
                  </div>
                </td>
                <td class="px-6 py-4 text-right whitespace-nowrap">
                  <span class="text-sm font-mono font-bold text-slate-900">
                    {{ formatRupiah(item.totalAnggaran) }}
                  </span>
                </td>
                <td class="px-6 py-4 text-center whitespace-nowrap">
                  <span class="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700">
                    Aktif
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="ormawaManagementStore.total > 0" class="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div class="text-sm text-slate-500 font-medium">
            Menampilkan
            <span class="font-bold text-slate-900">{{ (ormawaManagementStore.page - 1) * ormawaManagementStore.limit + 1 }}</span>
            -
            <span class="font-bold text-slate-900">{{ Math.min(ormawaManagementStore.page * ormawaManagementStore.limit, ormawaManagementStore.total) }}</span>
            dari
            <span class="font-bold text-slate-900">{{ ormawaManagementStore.total }}</span>
            data
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="ormawaManagementStore.changePage(ormawaManagementStore.page - 1)"
              :disabled="ormawaManagementStore.page === 1"
              class="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"
            >
              <Icon name="heroicons:chevron-left" class="w-5 h-5" />
            </button>
            <div class="flex items-center gap-1">
              <button
                v-for="p in totalPages"
                :key="p"
                @click="ormawaManagementStore.changePage(p)"
                :class="[
                  'w-9 h-9 rounded-lg text-sm font-bold transition-all',
                  ormawaManagementStore.page === p
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                    : 'text-slate-600 hover:bg-slate-100',
                ]"
              >
                {{ p }}
              </button>
            </div>
            <button
              @click="ormawaManagementStore.changePage(ormawaManagementStore.page + 1)"
              :disabled="ormawaManagementStore.page === totalPages"
              class="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"
            >
              <Icon name="heroicons:chevron-right" class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSpiOrmawaManagementStore } from '~/stores/spi/ormawaManagement';
import { useSpiFakultasStore } from "~/stores/spi/fakultas";
import { useSpiProdiStore } from "~/stores/spi/prodi";
import { ref, computed, onMounted } from "vue";
import { storeToRefs } from "pinia";

const ormawaManagementStore = useSpiOrmawaManagementStore();
const fakultasStore = useSpiFakultasStore();
const prodiStore = useSpiProdiStore();

const { filters } = storeToRefs(ormawaManagementStore);

const totalPages = computed(() => Math.ceil(ormawaManagementStore.total / ormawaManagementStore.limit));

const filteredProdi = computed(() => {
  if (!filters.value.fakultasId) return prodiStore.prodi;
  return prodiStore.prodi.filter(
    (p) => p.fakultasId === parseInt(filters.value.fakultasId),
  );
});

const onFakultasChange = () => {
  filters.value.prodiId = "";
  ormawaManagementStore.fetchOrmawa();
};

let searchTimeout: any = null;
const debouncedSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    ormawaManagementStore.fetchOrmawa();
  }, 500);
};

onMounted(async () => {
  await Promise.all([
    ormawaManagementStore.fetchOrmawa(),
    fakultasStore.fetchFakultas(),
    prodiStore.fetchProdi(),
  ]);
});

const formatRupiah = (amount: string | number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(Number(amount));
};
</script>
