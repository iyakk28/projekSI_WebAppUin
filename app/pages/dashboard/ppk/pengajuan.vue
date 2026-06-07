<!-- FILE: app/pages/dashboard/ppk/pengajuan.vue -->
<template>
  <div class="min-h-screen bg-slate-50 font-sans">
    <header class="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-4">
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 class="text-xl font-bold text-slate-900">
            Daftar <span class="text-[#d1a82a]">Lunas Kegiatan</span>
          </h2>
          <p class="text-sm text-slate-500">Monitoring pengajuan yang telah selesai pencairan</p>
        </div>
      </div>
    </header>

    <main class="p-4 sm:p-6 lg:p-8 space-y-6">
      <!-- Filter Card -->
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-bold text-slate-800 flex items-center gap-2">
            <Icon name="heroicons:funnel" class="w-5 h-5 text-[#d1a82a]" />
            Filter Pencarian
          </h3>
          <button @click="resetFilters" class="text-xs font-bold text-red-500 hover:underline uppercase tracking-widest">Reset Filter</button>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Search -->
          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-500 uppercase">Cari Kegiatan</label>
            <div class="flex items-center gap-2 bg-slate-50 rounded-xl border border-slate-200 px-3 py-2">
              <Icon name="heroicons:magnifying-glass" class="w-4 h-4 text-slate-400" />
              <input v-model="searchQuery" type="text" placeholder="Judul kegiatan..." class="bg-transparent border-none text-sm w-full focus:outline-none" @keyup.enter="applyFilters" />
            </div>
          </div>

          <!-- Ormawa -->
          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-500 uppercase">Ormawa</label>
            <select v-model="selectedOrmawaId" class="w-full bg-slate-50 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none">
              <option value="">Semua Ormawa</option>
              <option v-for="o in filterOptions.ormawa" :key="o.id" :value="o.id">{{ o.nama }}</option>
            </select>
          </div>

          <!-- Prodi -->
          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-500 uppercase">Prodi</label>
            <select v-model="selectedProdiId" class="w-full bg-slate-50 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none">
              <option value="">Semua Prodi</option>
              <option v-for="p in filterOptions.prodi" :key="p.id" :value="p.id">{{ p.nama }}</option>
            </select>
          </div>

          <!-- Kaprodi -->
          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-500 uppercase">Kaprodi</label>
            <select v-model="selectedKaprodiId" class="w-full bg-slate-50 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none">
              <option value="">Semua Kaprodi</option>
              <option v-for="k in filterOptions.kaprodi" :key="k.id" :value="k.id">{{ k.fullName }}</option>
            </select>
          </div>

          <!-- Date Range -->
          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-500 uppercase">Dari Tanggal</label>
            <input v-model="startDate" type="date" class="w-full bg-slate-50 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none" />
          </div>
          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-500 uppercase">Sampai Tanggal</label>
            <input v-model="endDate" type="date" class="w-full bg-slate-50 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none" />
          </div>

          <div class="flex items-end gap-2 lg:col-span-2">
            <button @click="applyFilters" class="flex-1 bg-[#3b5988] text-white py-2 px-4 rounded-xl font-bold hover:bg-[#2d4570] transition flex items-center justify-center gap-2">
              <Icon name="heroicons:magnifying-glass" class="w-5 h-5" />
              Terapkan Filter
            </button>
          </div>
        </div>
      </div>

      <!-- List Table -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="p-5 border-b border-slate-200 flex justify-between items-center">
           <h3 class="text-lg font-bold text-slate-900">Hasil Pengajuan</h3>
           <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Total: {{ totalData }}</span>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-slate-50 text-slate-500">
              <tr>
                <th class="text-left py-3 px-6 font-semibold">Nomor / Kegiatan</th>
                <th class="text-left py-3 px-6 font-semibold">Ormawa / Prodi</th>
                <th class="text-left py-3 px-6 font-semibold">Tanggal</th>
                <th class="text-right py-3 px-6 font-semibold">Total Dana</th>
                <th class="text-center py-3 px-6 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody v-if="!loading">
              <tr v-for="item in lunasData" :key="item.id" class="border-b border-slate-100 hover:bg-slate-50 transition">
                <td class="py-4 px-6">
                  <p class="font-bold text-[#3b5988]">{{ item.nomorPengajuan }}</p>
                  <p class="text-slate-800">{{ item.judulKegiatan }}</p>
                </td>
                <td class="py-4 px-6">
                   <p class="font-medium text-slate-800">{{ item.ormawaNama }}</p>
                   <p class="text-xs text-slate-500">{{ item.prodiNama }}</p>
                </td>
                <td class="py-4 px-6 text-slate-600">
                  {{ formatDate(item.createdAt) }}
                </td>
                <td class="py-4 px-6 text-right font-bold text-[#d1a82a]">
                  {{ formatRp(item.totalAnggaran) }}
                </td>
                <td class="py-4 px-6 text-center">
                  <button @click="navigateTo(`/dashboard/ppk/detailPengajuan/${item.id}`)" class="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition font-bold text-xs uppercase tracking-wider">
                    <Icon name="heroicons:eye" class="w-4 h-4" />
                    Detail
                  </button>
                </td>
              </tr>
              <tr v-if="lunasData.length === 0">
                <td colspan="5" class="py-12 text-center text-slate-400 font-medium">
                  <Icon name="heroicons:document-magnifying-glass" class="w-12 h-12 mx-auto mb-2 opacity-20" />
                  Belum ada data pengajuan lunas yang ditemukan.
                </td>
              </tr>
            </tbody>
            <tbody v-else>
               <tr>
                <td colspan="5" class="py-12 text-center">
                  <div class="inline-block w-8 h-8 border-4 border-slate-200 border-t-[#d1a82a] rounded-full animate-spin"></div>
                  <p class="mt-2 text-slate-500">Memuat data...</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
           <p class="text-xs text-slate-500 font-medium">Halaman {{ currentPage }} dari {{ totalPages }}</p>
           <div class="flex items-center gap-1">
              <button 
                @click="changePage(currentPage - 1)" 
                :disabled="currentPage === 1"
                class="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition"
              >
                <Icon name="heroicons:chevron-left" class="w-4 h-4" />
              </button>
              
              <div class="flex items-center gap-1 mx-2">
                 <button 
                    v-for="p in totalPages" 
                    :key="p" 
                    @click="changePage(p)"
                    :class="['w-8 h-8 rounded-lg text-xs font-bold transition-all', 
                    currentPage === p ? 'bg-[#3b5988] text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50']"
                 >
                    {{ p }}
                 </button>
              </div>

              <button 
                @click="changePage(currentPage + 1)" 
                :disabled="currentPage === totalPages"
                class="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition"
              >
                <Icon name="heroicons:chevron-right" class="w-4 h-4" />
              </button>
           </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { usePpkPengajuanStore } from "~/stores/ppk/pengajuan";

const store = usePpkPengajuanStore();
const { 
    lunasData, totalData, filterOptions, loading, 
    searchQuery, selectedOrmawaId, selectedProdiId, selectedKaprodiId,
    startDate, endDate, currentPage, totalPages
} = storeToRefs(store);

const { fetchLunas, fetchFilterOptions, applyFilters, resetFilters, changePage, formatRp, formatDate } = store;

// Initial Fetch saat dokumen di-reload/load pertama kali
onMounted(async () => {
    // 1. Ambil opsi filter dulu agar select option langsung terisi
    await fetchFilterOptions();
    
    // 2. Fetch data awal tanpa filter (default page 1)
    await fetchLunas();
});
</script>
