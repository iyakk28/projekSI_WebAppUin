<template>
  <div class="min-h-screen bg-slate-50 font-sans">
    <!-- Main Content -->
    <div class="transition-all duration-300">
      <!-- Header -->
      <header class="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 class="text-xl font-bold text-slate-900">Manajemen Pelaksanaan Kegiatan</h2>
            <p class="text-sm text-slate-500">Berdasarkan data Pengajuan RAB yang telah disetujui</p>
          </div>
          <div class="flex items-center gap-3">
            <button 
              @click="refreshData"
              class="flex items-center gap-2 px-4 py-2 bg-[#3b5988] text-white rounded-xl hover:bg-[#2d4570] transition-all shadow-sm disabled:opacity-50"
              :disabled="loading"
            >
              <Icon :name="loading ? 'heroicons:arrow-path' : 'heroicons:arrow-path'" :class="{'animate-spin': loading}" class="w-5 h-5" />
              <span class="text-sm font-semibold">Refresh Data</span>
            </button>
          </div>
        </div>
      </header>

      <main class="p-4 sm:p-6 lg:p-8 space-y-8">
        <!-- Error State -->
        <div v-if="error" class="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-3">
          <Icon name="heroicons:exclamation-triangle" class="w-6 h-6" />
          <p class="font-medium">{{ error }}</p>
        </div>

        <!-- Section: Kegiatan Yang Akan/Sedang Berlangsung -->
        <section class="space-y-4" v-if="featuredActivities.length > 0">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-2 h-8 bg-[#d1a82a] rounded-full"></div>
              <h3 class="text-lg font-bold text-slate-900">Kegiatan Berlangsung & Mendatang</h3>
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div 
              v-for="item in featuredActivities" 
              :key="item.kegiatan.id"
              class="relative bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-500 group overflow-hidden"
            >
              <!-- Status Ribbon -->
              <div class="absolute top-4 right-4 z-10">
                <span :class="[
                  'px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm',
                  item.kegiatan.statusKegiatan === 'SEDANG_DILAKSANAKAN' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                ]">
                  {{ formatStatus(item.kegiatan.statusKegiatan) }}
                </span>
              </div>

              <div class="p-6 space-y-4">
                <div class="space-y-2">
                  <p class="text-[10px] font-mono text-slate-400">{{ item.pengajuan.nomorPengajuan }}</p>
                  <h4 class="text-lg font-bold text-slate-900 line-clamp-2 group-hover:text-[#3b5988] transition-colors">
                    {{ item.pengajuan.judulKegiatan }}
                  </h4>
                </div>

                <div class="flex items-center gap-4 py-3 border-y border-slate-50">
                  <div class="flex flex-col">
                    <span class="text-[10px] text-slate-400 uppercase font-bold">Mulai</span>
                    <span class="text-sm font-semibold text-slate-700">{{ formatDate(item.pengajuan.tanggalMulai) }}</span>
                  </div>
                  <div class="w-px h-8 bg-slate-100"></div>
                  <div class="flex flex-col">
                    <span class="text-[10px] text-slate-400 uppercase font-bold">Selesai</span>
                    <span class="text-sm font-semibold text-slate-700">{{ formatDate(item.pengajuan.tanggalSelesai) }}</span>
                  </div>
                </div>

                <div class="flex items-center justify-between">
                  <div class="space-y-1">
                    <p class="text-[10px] text-slate-400 uppercase font-bold">Anggaran</p>
                    <p class="text-sm font-bold text-[#3b5988]">{{ formatCurrency(item.pengajuan.totalAnggaran) }}</p>
                  </div>
                  <button class="p-2 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-[#3b5988] group-hover:text-white transition-all">
                    <Icon name="heroicons:arrow-right" class="w-5 h-5" />
                  </button>
                </div>
              </div>

              <!-- Decorative element -->
              <div class="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#3b5988] via-[#d1a82a] to-[#3b5988] opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
          </div>
        </section>

        <!-- Section: Semua List Kegiatan -->
        <section class="space-y-4">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex items-center gap-2">
              <div class="w-2 h-8 bg-slate-300 rounded-full"></div>
              <h3 class="text-lg font-bold text-slate-900">Seluruh Riwayat Kegiatan</h3>
            </div>
            
            <div class="flex gap-2">
              <div class="relative">
                <Icon name="heroicons:magnifying-glass" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Cari kegiatan..." 
                  class="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#3b5988]/10 transition-all outline-none"
                />
              </div>
            </div>
          </div>

          <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div v-if="loading" class="p-8 text-center text-slate-500">
              <Icon name="heroicons:arrow-path" class="w-8 h-8 animate-spin mx-auto mb-2 text-[#3b5988]" />
              <p>Memuat data kegiatan...</p>
            </div>
            
            <div v-else-if="allActivities.length === 0" class="p-12 text-center">
              <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="heroicons:clipboard-document-list" class="w-8 h-8 text-slate-300" />
              </div>
              <h3 class="text-base font-bold text-slate-900">Belum Ada Kegiatan</h3>
              <p class="text-sm text-slate-500 mt-1">Kegiatan akan muncul di sini setelah pengajuan RAB disetujui.</p>
            </div>

            <div v-else class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-slate-50/50 border-b border-slate-100">
                    <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Informasi Kegiatan</th>
                    <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Waktu Pelaksanaan</th>
                    <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Anggaran</th>
                    <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">
                  <tr v-for="item in allActivities" :key="item.kegiatan.id" class="hover:bg-slate-50/50 transition-colors group">
                    <td class="px-6 py-4">
                      <div class="space-y-1">
                        <p class="text-sm font-bold text-slate-900 group-hover:text-[#3b5988] transition-colors">{{ item.pengajuan.judulKegiatan }}</p>
                        <p class="text-[10px] font-mono text-slate-400 uppercase">{{ item.pengajuan.nomorPengajuan }}</p>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-2 text-xs text-slate-600">
                        <Icon name="heroicons:calendar" class="w-4 h-4 text-slate-300" />
                        <span>{{ formatDate(item.pengajuan.tanggalMulai) }} - {{ formatDate(item.pengajuan.tanggalSelesai) }}</span>
                      </div>
                    </td>
                    <td class="px-6 py-4 text-sm font-bold text-slate-700">
                      {{ formatCurrency(item.pengajuan.totalAnggaran) }}
                    </td>
                    <td class="px-6 py-4">
                      <span :class="[
                        'px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight',
                        getStatusClass(item.kegiatan.statusKegiatan)
                      ]">
                        {{ formatStatus(item.kegiatan.statusKegiatan) }}
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex justify-center gap-2">
                        <button class="p-2 rounded-lg hover:bg-white hover:shadow-md text-slate-400 hover:text-[#3b5988] transition-all border border-transparent hover:border-slate-100">
                          <Icon name="heroicons:eye" class="w-5 h-5" />
                        </button>
                        <button class="p-2 rounded-lg hover:bg-white hover:shadow-md text-slate-400 hover:text-emerald-600 transition-all border border-transparent hover:border-slate-100">
                          <Icon name="heroicons:cloud-arrow-up" class="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useKegiatanListStore } from '~/stores/ormawa/kegiatanList';

const kegiatanStore = useKegiatanListStore();

onMounted(async () => {
  await kegiatanStore.fetchActivities();
});

const refreshData = async () => {
  await kegiatanStore.fetchActivities();
};

const featuredActivities = computed(() => kegiatanStore.featuredActivities);
const allActivities = computed(() => kegiatanStore.allActivities);
const loading = computed(() => kegiatanStore.loading);
const error = computed(() => kegiatanStore.error);

const formatCurrency = (val: string | number) => {
  if (!val) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(Number(val));
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const formatStatus = (status: string) => {
  if (!status) return '-';
  return status.replace(/_/g, ' ');
};

const getStatusClass = (status: string) => {
  switch (status) {
    case 'SEDANG_DILAKSANAKAN': return 'bg-amber-50 text-amber-600 border border-amber-100';
    case 'SELESAI': return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
    case 'BELUM_DILAKSANAKAN': return 'bg-slate-50 text-slate-600 border border-slate-100';
    default: return 'bg-slate-50 text-slate-400';
  }
};
</script>

<style scoped>
/* Custom scrollbar for better UX */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Animations */
@keyframes slideIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

main > section {
  animation: slideIn 0.5s ease-out forwards;
}
</style>